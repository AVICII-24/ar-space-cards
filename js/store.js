// Local, anonymous storage. Nothing here ever leaves the device unless a teacher
// taps "Export". There are no names: a learner is an optional code the teacher makes up.
const KEY = 'ssi-ar-cards-v1';
const defaults = () => ({
  settings: { lang: 'en', level: 'explorer', labels: true, calm: false, mode: '3d' },
  badges: [], session: null, sessions: [], checks: [],
});
let data = defaults();
try { const raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw) data = { ...defaults(), ...raw, settings: { ...defaults().settings, ...raw.settings } }; } catch { /* private mode: run without saving */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ } };
const listeners = new Set();
const changed = () => { save(); listeners.forEach(f => f()); };

export const store = {
  get settings() { return data.settings; },
  set(k, v) { data.settings[k] = v; changed(); },
  onChange(f) { listeners.add(f); },
  get badges() { return data.badges; },
  get session() { return data.session; },
  get sessions() { return data.sessions; },
  get checks() { return data.checks; },

  startSession({ ward = '', learner = '', group = 1 } = {}) {
    if (data.session) this.endSession(null);
    data.session = { id: Date.now().toString(36), start: Date.now(), last: Date.now(), ward, learner, group, level: data.settings.level, lang: data.settings.lang, cards: [], modes: {}, missions: [] };
    data.badges = []; changed();
  },
  /** Called whenever the child opens a card or mission. Starts an untagged session if none is running. */
  touch(kind, id, mode) {
    if (data.session && Date.now() - data.session.last > 45 * 60e3) this.endSession(null);   // left running: close it
    if (!data.session) this.startSession();
    const s = data.session; s.last = Date.now(); s.level = data.settings.level; s.lang = data.settings.lang;
    if (kind === 'card' && id && !s.cards.includes(id)) s.cards.push(id);
    s.modes[mode] = (s.modes[mode] || 0) + 1; save();
  },
  logMission(id, pick, done) {
    if (!data.session) this.startSession();
    const s = data.session, m = s.missions.find(x => x.id === id);
    if (m) { m.done = m.done || done; } else s.missions.push({ id, pick, done });   // keep the first prediction
    if (done && !data.badges.includes(id)) data.badges.push(id);
    s.last = Date.now(); changed();
  },
  endSession(mood) {
    const s = data.session; if (!s) return;
    s.end = mood === null ? s.last : Date.now(); s.minutes = Math.max(1, Math.round((s.end - s.start) / 60e3)); s.mood = mood || '';
    delete s.last; data.sessions.push(s); data.session = null; changed();
  },
  saveCheck(check) { data.checks.push({ ...check, t: Date.now() }); changed(); },
  clearAll() { const settings = data.settings; data = defaults(); data.settings = settings; changed(); },

  csv() {
    const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`, day = t => new Date(t).toISOString().slice(0, 16).replace('T', ' ');
    const rows = [['type', 'start', 'minutes', 'ward', 'learner_code', 'group_size', 'level', 'language', 'cards_opened', 'missions_done', 'first_predictions_correct', 'predictions_made', 'mood', 'check_phase', 'check_score_of_5']];
    for (const s of data.sessions) rows.push(['session', day(s.start), s.minutes, s.ward, s.learner, s.group, s.level, s.lang, s.cards.length, s.missions.filter(m => m.done).length, s.missions.filter(m => m.pick === 'correct').length, s.missions.length, s.mood, '', '']);
    for (const c of data.checks) rows.push(['concept_check', day(c.t), '', c.ward, c.learner, '', c.level, c.lang, '', '', '', '', '', c.phase, c.score]);
    return rows.map(r => r.map(q).join(',')).join('\n');
  },
};
