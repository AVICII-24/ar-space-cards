// App shell: home, card deck, missions, teacher area, and routing into the player.
import { CARDS, LEVELS, cardById } from '../content/cards.js';
import { MISSIONS, LABS, labById, OPTION_ORDER } from '../content/missions.js';
import { GUIDE } from '../content/guide.js';
import { store } from './store.js';
import { tr, ui, L, lang } from './i18n.js';
import { loadLand } from './gfx.js';
import { Player } from './player.js';

const app = document.getElementById('app'), view = document.getElementById('view');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
let player = null, lastScreen = '', check = null, endAsk = false, savedNote = '';

const go = path => { if (location.hash === '#/' + path) render(); else location.hash = '#/' + path; };
function playGo(path) {                                             // "mission/seasons", "lab/kepler", "card/earth"
  let [kind, id] = path.split('/');
  if (kind === 'lab' && labById[id].card) {                         // Kepler's laws lives on the solar system card
    if (store.settings.level === 'explorer') store.set('level', 'scientist');
    kind = 'card'; id = labById[id].card;
  }
  go(`play/${kind}/${id}/${player && player.running && player.mode !== 'none' ? player.mode : store.settings.mode}`);
}

// ------------------------------------------------------------------ screens
const top = (title, sub) => `<header class="nav"><button class="icon" data-go="">‹</button><div class="tt"><b>${esc(title)}</b><span>${esc(sub || '')}</span></div></header>`;
const orb = c => `<span class="orb" style="--c:${c.color}">${pad2(c.n)}</span>`;

function home() {
  const s = store.session, lv = store.settings.level;
  return `<main class="home">
    <header class="brandbar"><div class="logo"><b>SPACE<br>/STORE</b><span>India</span></div></header>
    <section class="hero"><div class="kicker">${ui('brand')}</div><h1>${ui('hero')}</h1><p>${ui('heroSub')}</p></section>
    <section><h3>${ui('pickLevel')}</h3><div class="levels">${LEVELS.map(l => `
      <button class="level" data-level="${l.id}" aria-pressed="${l.id === lv}"><span class="em">${l.icon}</span><b>${esc(tr(l.name))}</b><small>${esc(tr(l.grades))}</small><em>${esc(tr(l.blurb))}</em></button>`).join('')}</div></section>
    <section class="actions">
      <button class="act a1" data-go="play/scan/any/ar"><span class="em">📷</span><b>${ui('scan')}</b><small>${ui('scanSub')}</small></button>
      <button class="act a2" data-go="cards"><span class="em">🪐</span><b>${ui('explore')}</b><small>${ui('exploreSub')}</small></button>
      <button class="act a3" data-go="missions"><span class="em">🎯</span><b>${ui('missions')}</b><small>${ui('missionsSub')}</small></button>
      <button class="act a4" data-go="teacher"><span class="em">🧑‍🏫</span><b>${ui('teacher')}</b><small>${ui('teacherSub')}</small></button>
    </section>
    <section class="badges"><h3>${ui('badges')}</h3><div>${MISSIONS.map(m => `<button class="badgeDot ${store.badges.includes(m.id) ? 'on' : ''}" data-go="play/mission/${m.id}/${store.settings.mode}" title="${esc(tr(m.title))}">${m.icon}<small>${esc(tr(m.title))}</small></button>`).join('')}</div></section>
    ${s ? `<button class="pill" data-go="teacher">● ${ui('running')} · ${Math.max(1, Math.round((Date.now() - s.start) / 60e3))} ${ui('min')}</button>` : ''}
    <footer>🔒 ${ui('privacy')}</footer></main>`;
}

function cards() {
  return `${top(ui('cards'), ui('cardsSub'))}<main class="grid">${CARDS.map(c => `
    <article class="tile" style="--c:${c.color}">
      <button class="tileMain" data-go="play/card/${c.id}/3d">${orb(c)}<b>${esc(tr(c.title))}</b><small>${esc(tr(c.tagline))}</small></button>
      <div class="tileRow"><button class="mini" data-go="play/card/${c.id}/3d">🧊 3D</button><button class="mini" data-go="play/card/${c.id}/ar">📷 ${ui('modeAr')}</button><button class="mini" data-go="play/card/${c.id}/demo">🎬 ${ui('modeDemo')}</button></div>
    </article>`).join('')}</main>`;
}

function missions() {
  const mode = store.settings.mode;
  return `${top(ui('missions'), ui('missionsSub'))}<main class="list">
    ${MISSIONS.map((m, i) => `<button class="rowCard" style="--c:${m.color}" data-go="play/mission/${m.id}/${mode}">
      <span class="em">${m.icon}</span><div><small>${ui('missions')} ${i + 1}${store.badges.includes(m.id) ? ' · ⭐' : ''}</small><b>${esc(tr(m.title))}</b><p>${esc(tr(m.question))}</p>
      <em>${m.cards.map(id => `${pad2(cardById[id].n)} ${esc(tr(cardById[id].title))}`).join(' + ')}</em></div></button>`).join('')}
    <h3>${ui('labs')} <small>${ui('labsSub')}</small></h3>
    ${LABS.map(l => `<button class="rowCard" style="--c:${l.color}" data-play="lab/${l.id}"><span class="em">${l.icon}</span><div><b>${esc(tr(l.title))}</b><p>${esc(tr(l.blurb))}</p></div></button>`).join('')}
  </main>`;
}

// ------------------------------------------------------------------ teacher area
const TABS = [['session', 'tSession'], ['results', 'tDash'], ['check', 'tCheck'], ['guide', 'tGuide'], ['setup', 'tSetup']];
function teacher(tab = 'session') {
  const body = { session: tSession, results: tResults, check: tCheck, guide: tGuide, setup: tSetup }[tab] || tSession;
  return `${top(ui('teacher'), ui('teacherSub'))}<nav class="tabs">${TABS.map(([id, k]) => `<button data-go="teacher/${id}" aria-pressed="${id === tab}">${ui(k)}</button>`).join('')}</nav><main class="teacher">${body()}</main>`;
}
function tSession() {
  const s = store.session;
  if (endAsk) return `<section class="panel center"><h2>${ui('mood')}</h2><div class="faces">
      <button data-mood="happy">😀</button><button data-mood="okay">😐</button><button data-mood="unhappy">🙁</button></div>
      <button class="link" data-mood="">${L('Skip')}</button></section>`;
  if (s) return `<section class="panel"><h2>● ${ui('running')}</h2>
      <p>${Math.max(1, Math.round((Date.now() - s.start) / 60e3))} ${ui('min')} · ${ui('ward')}: <b>${esc(s.ward || '–')}</b> · ${ui('learner')}: <b>${esc(s.learner || '–')}</b></p>
      <p class="muted">${L('Cards opened')}: ${s.cards.length} · ${L('Missions finished')}: ${s.missions.filter(m => m.done).length}</p>
      <div class="row"><button class="btn primary" data-act="endSession">${ui('end')}</button><button class="btn" data-go="">${ui('home')}</button></div></section>`;
  return `<section class="panel">${savedNote ? `<p class="ok">✓ ${savedNote}</p>` : ''}<h2>${ui('start')}</h2><p class="muted">${ui('noSession')} ${L('Starting one lets you record the ward, time and the child’s feedback. Never type a name.')}</p>
    <label>${ui('ward')}<input id="fWard" maxlength="40" autocomplete="off"></label>
    <label>${ui('learner')}<input id="fLearner" maxlength="12" autocomplete="off" placeholder="A-07"></label>
    <label>${ui('group')}<input id="fGroup" type="number" min="1" max="30" value="1"></label>
    <div class="row"><button class="btn primary" data-act="startSession">${ui('start')}</button></div></section>`;
}
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
const bar = (label, value, max, note) => `<div class="stat"><span>${esc(label)}</span><div class="bar"><i style="width:${pct(value, max)}%"></i></div><b>${note ?? value}</b></div>`;
function tResults() {
  const S = store.sessions, C = store.checks;
  if (!S.length && !C.length) return `<section class="panel"><p class="muted">${ui('noData')}</p></section>`;
  const mins = S.reduce((a, s) => a + s.minutes, 0), codes = new Set(S.map(s => s.learner).filter(Boolean));
  const moods = { happy: 0, okay: 0, unhappy: 0 }; S.forEach(s => { if (moods[s.mood] !== undefined) moods[s.mood]++; });
  const rated = moods.happy + moods.okay + moods.unhappy;
  const picks = S.flatMap(s => s.missions), right = picks.filter(p => p.pick === 'correct').length;
  const avg = arr => (arr.length ? arr.reduce((a, c) => a + c.score, 0) / arr.length : 0);
  const pre = C.filter(c => c.phase === 'pre'), post = C.filter(c => c.phase === 'post');
  const pairs = [...new Set(pre.map(c => c.learner).filter(Boolean))].map(code => [pre.find(c => c.learner === code), post.find(c => c.learner === code)]).filter(p => p[1]);
  return `<section class="tiles">
      <div><b>${S.length}</b><span>${ui('sessions')}</span></div><div><b>${mins}</b><span>${ui('minutes')}</span></div>
      <div><b>${S.reduce((a, s) => a + (+s.group || 1), 0)}</b><span>${L('Child-sessions')}</span></div><div><b>${codes.size}</b><span>${ui('learners')}</span></div>
      <div><b>${S.length ? Math.round(mins / S.length) : 0} ${ui('min')}</b><span>${ui('avg')}</span></div></section>
    <section class="panel"><h3>${ui('moods')}</h3>${bar('😀', moods.happy, rated, `${moods.happy}`)}${bar('😐', moods.okay, rated, `${moods.okay}`)}${bar('🙁', moods.unhappy, rated, `${moods.unhappy}`)}</section>
    <section class="panel"><h3>${ui('byLevel')}</h3>${LEVELS.map(l => bar(`${l.icon} ${tr(l.name)}`, S.filter(s => s.level === l.id).length, S.length)).join('')}</section>
    <section class="panel"><h3>${ui('preds')}</h3><p class="muted">${L('A low number here is expected: it shows the misconception was there to be corrected.')}</p>
      ${bar(L('All missions'), right, picks.length, `${right}/${picks.length}`)}
      ${MISSIONS.map(m => { const p = picks.filter(x => x.id === m.id); return bar(`${m.icon} ${tr(m.title)}`, p.filter(x => x.pick === 'correct').length, p.length, `${p.filter(x => x.pick === 'correct').length}/${p.length} · ${L('finished')} ${p.filter(x => x.done).length}`); }).join('')}</section>
    <section class="panel"><h3>${ui('prepost')}</h3>
      ${bar(`${ui('before')} (n=${pre.length})`, avg(pre), 5, avg(pre).toFixed(1) + ' / 5')}${bar(`${ui('after')} (n=${post.length})`, avg(post), 5, avg(post).toFixed(1) + ' / 5')}
      <p class="muted">${L('Learners with both checks')}: ${pairs.length}${pairs.length ? ` · ${L('average gain')}: ${(pairs.reduce((a, [x, y]) => a + y.score - x.score, 0) / pairs.length).toFixed(1)}` : ''}</p></section>
    <div class="row"><button class="btn primary" data-act="export">⬇ ${ui('export')}</button></div>`;
}
function tCheck() {
  if (check && check.i < MISSIONS.length) {
    const m = MISSIONS[check.i];
    return `<section class="panel"><div class="kicker">${check.i + 1} / ${MISSIONS.length}</div><h2>${esc(tr(m.question))}</h2>
      <div class="opts">${OPTION_ORDER[m.id].map((oi, i) => `<button class="opt" data-answer="${oi}"><b>${'ABC'[i]}</b>${esc(tr(m.options[oi].text))}</button>`).join('')}</div></section>`;
  }
  return `<section class="panel">${savedNote ? `<p class="ok">✓ ${savedNote}</p>` : ''}<h2>${ui('tCheck')}</h2><p class="muted">${ui('checkIntro')}</p>
    <label>${ui('learner')}<input id="cLearner" maxlength="12" autocomplete="off" placeholder="A-07" value="${esc(store.session ? store.session.learner : '')}"></label>
    <label>${ui('ward')}<input id="cWard" maxlength="40" autocomplete="off" value="${esc(store.session ? store.session.ward : '')}"></label>
    <div class="seg wide"><button data-phase="pre" aria-pressed="true">${ui('before')}</button><button data-phase="post" aria-pressed="false">${ui('after')}</button></div>
    <div class="row"><button class="btn primary" data-act="beginCheck">${ui('beginCheck')}</button></div></section>`;
}
function tGuide() {
  return GUIDE.map(g => `<section class="panel"><h3>${esc(tr(g.title))}</h3><${g.ordered ? 'ol' : 'ul'}>${g.items.map(i => `<li>${esc(tr(i))}</li>`).join('')}</${g.ordered ? 'ol' : 'ul'}></section>`).join('');
}
function tSetup() {
  const s = store.settings;
  return `<section class="panel"><h3>${ui('tSetup')}</h3>
      <button class="btn toggle wideBtn" data-toggle="calm" aria-pressed="${s.calm}">${ui('calm')}</button>
      <button class="btn toggle wideBtn" data-toggle="labels" aria-pressed="${s.labels}">${ui('labels')}</button></section>
    <section class="panel"><h3>${ui('print')}</h3><p class="muted">${L('Print on A4 card stock, cut and laminate. Matte lamination tracks better than glossy under ward lights.')}</p>
      <div class="row"><a class="btn primary" href="./print.html">🖨 ${ui('print')}</a></div></section>
    <section class="panel"><h3>${L('Data on this device')}</h3><p class="muted">🔒 ${ui('privacy')}</p>
      <p class="muted" id="offline">${'serviceWorker' in navigator && navigator.serviceWorker.controller ? '✓ ' + ui('offline') : ''}</p>
      <div class="row"><button class="btn" data-act="export">⬇ ${ui('export')}</button><button class="btn danger" data-act="clear">${ui('clear')}</button></div></section>`;
}

// ------------------------------------------------------------------ routing
function render() {
  const [a, b, c, d] = location.hash.replace(/^#\/?/, '').split('/');
  document.documentElement.lang = lang();
  if (a === 'play' && (b === 'scan' || (b === 'card' && cardById[c]) || (b === 'mission' && MISSIONS.some(m => m.id === c)) || (b === 'lab' && labById[c] && labById[c].scene))) {
    app.hidden = true;
    player = player || new Player(view, { onExit: () => go(lastScreen), onGo: playGo });
    window.__player = player;                                       // handle for debugging and tracking self-tests
    player.open({ kind: b, id: c, mode: ['ar', '3d', 'demo'].includes(d) ? d : null });
    return;
  }
  if (player && player.running) player.close();
  app.hidden = false; lastScreen = [a, b].filter(Boolean).join('/');
  if (a !== 'teacher') { endAsk = false; check = null; savedNote = ''; }
  app.innerHTML = a === 'cards' ? cards() : a === 'missions' ? missions() : a === 'teacher' ? teacher(b) : home();
  window.scrollTo(0, 0);
}

app.addEventListener('click', e => {
  const t = e.target.closest('button, a'); if (!t || t.tagName === 'A') return;
  const d = t.dataset;
  if (d.go !== undefined) return go(d.go);
  if (d.play) return playGo(d.play);
  if (d.level) { store.set('level', d.level); return render(); }
  if (d.toggle) { store.set(d.toggle, !store.settings[d.toggle]); return render(); }
  if (d.phase) { t.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === t)); return; }
  if (d.mood !== undefined) { store.endSession(d.mood); endAsk = false; savedNote = ui('saved'); return render(); }
  if (d.answer !== undefined) {
    const m = MISSIONS[check.i]; check.answers[m.id] = m.options[+d.answer].k; check.i++;
    if (check.i >= MISSIONS.length) {
      const score = Object.values(check.answers).filter(k => k === 'correct').length;
      store.saveCheck({ learner: check.learner, ward: check.ward, phase: check.phase, level: store.settings.level, lang: lang(), answers: check.answers, score });
      check = null; savedNote = ui('saved');
    }
    return render();
  }
  const val = id => (document.getElementById(id) || {}).value || '';
  switch (d.act) {
    case 'startSession': store.startSession({ ward: val('fWard').trim(), learner: val('fLearner').trim(), group: Math.max(1, +val('fGroup') || 1) }); savedNote = ''; return go('');
    case 'endSession': endAsk = true; return render();
    case 'beginCheck': check = { i: 0, answers: {}, learner: val('cLearner').trim(), ward: val('cWard').trim(), phase: app.querySelector('[data-phase][aria-pressed=true]').dataset.phase }; savedNote = ''; return render();
    case 'export': {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([store.csv()], { type: 'text/csv' }));
      a.download = `ar-cards-results-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); return;
    }
    case 'clear': if (confirm(ui('clearAsk'))) { store.clearAll(); render(); } return;
  }
});

window.addEventListener('hashchange', render);
await loadLand();
render();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname)) && !new URLSearchParams(location.search).has('nosw'))
  navigator.serviceWorker.register('./sw.js').catch(() => {});
