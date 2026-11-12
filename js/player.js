// The player: one full-screen stage that shows a card, mission or lab in three ways.
//   ar   - live camera, 3D scene pinned to the printed card
//   demo - the same pipeline fed by a virtual camera (no card or webcam needed)
//   3d   - no camera at all, for children who cannot hold a card or sit up
import * as THREE from 'three';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { Tracker, openCamera } from './tracker.js';
import { SimSource } from './sim.js';
import { starfield } from './gfx.js';
import { CARDS, cardById, cardByMarker, LEVELS } from '../content/cards.js';
import { MISSIONS, missionById, labById, OPTION_ORDER } from '../content/missions.js';
import { earthScene, moonScene, sunScene, marsScene, jupiterScene, saturnScene } from './scenes/bodies.js';
import { solarSystemScene, seasonsScene, phasesScene, scaleScene, orbitScene, marsPlannerScene, gravityScene } from './scenes/systems.js';
import { issScene, rocketScene, chandrayaanScene } from './scenes/craft.js';
import { store } from './store.js';
import { tr, ui, L, lang, speak, hush } from './i18n.js';

const LIFT = 1.25;                     // how far above the card a scene floats, in marker widths
const names = () => Object.fromEntries(Object.entries(cardById['solar-system'].hotspots).map(([k, v]) => [k, tr(v[0])]));
const FACTORY = {
  'solar-system': env => solarSystemScene(env, { names: names() }),
  earth: env => earthScene(env), moon: moonScene, sun: sunScene, mars: marsScene, jupiter: jupiterScene, saturn: saturnScene,
  iss: issScene, rocket: rocketScene, chandrayaan: chandrayaanScene,
  'm:daynight': env => earthScene(env, { mission: true }), 'm:seasons': seasonsScene, 'm:phases': phasesScene,
  'm:scale': env => scaleScene(env, { names: names() }), 'm:orbit': orbitScene,
  'l:marsplanner': marsPlannerScene, 'l:gravity': gravityScene,
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = n => String(n).padStart(2, '0');
const v3 = new THREE.Vector3();

export class Player {
  constructor(root, { onExit, onGo }) {
    this.root = root; this.onExit = onExit; this.onGo = onGo;
    root.innerHTML = `
      <video class="feed" playsinline muted hidden></video>
      <div class="simHost"></div>
      <canvas class="gl"></canvas>
      <header class="topbar">
        <button class="icon" data-act="back" aria-label="${ui('back')}">‹</button>
        <div class="tt"><b class="vTitle"></b><span class="vSub"></span></div>
        <div class="seg modes" role="group">
          <button data-mode="ar">📷 <i>${ui('modeAr')}</i></button><button data-mode="3d">🧊 <i>${ui('mode3d')}</i></button><button data-mode="demo">🎬 <i>${ui('modeDemo')}</i></button>
        </div>
        <button class="chip" data-act="level"></button>
      </header>
      <div class="hint" hidden></div>
      <div class="insetHost"></div>
      <div class="toast" hidden></div>
      <aside class="sheet"></aside>
      <div class="modal" hidden></div>`;
    const $ = s => root.querySelector(s);
    this.el = { video: $('video'), simHost: $('.simHost'), gl: $('.gl'), title: $('.vTitle'), sub: $('.vSub'), modes: $('.modes'), level: $('[data-act=level]'), hint: $('.hint'), inset: $('.insetHost'), toast: $('.toast'), sheet: $('.sheet'), modal: $('.modal') };
    root.addEventListener('click', e => this.click(e));
    root.addEventListener('input', e => { const i = e.target.closest('input[data-c]'); if (i) this.ctrls[+i.dataset.c].set(parseFloat(i.value)); });
    this.entries = new Map(); this.ctrls = []; this.fact = 0; this.raf = 0; this.running = false;
    this.ray = new THREE.Raycaster(); this.clock = 0;
    this.ray.params.Line.threshold = 0; this.ray.params.Points.threshold = 0;   // only solid things and pins can be tapped
    this.bindPointer();
    window.addEventListener('resize', () => this.running && this.resize());
  }

  // ---------------------------------------------------------------- set-up
  ensureGL() {
    if (this.renderer) return true;
    try { this.renderer = new THREE.WebGLRenderer({ canvas: this.el.gl, alpha: true, antialias: true }); }
    catch { this.message('WebGL', L('This device cannot show 3D graphics in this browser.')); return false; }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.05, 300);
    const sunLamp = new THREE.DirectionalLight(0xffffff, 2.4); sunLamp.position.set(2, 3, 4);
    this.camera.add(sunLamp); this.scene.add(this.camera, new THREE.HemisphereLight(0xdfe8ff, 0x1a1f3a, 1.3));
    this.stars = starfield(); this.scene.add(this.stars);
    this.orbit = new OrbitControls(this.camera, this.el.gl);
    Object.assign(this.orbit, { enableDamping: true, enablePan: false, minDistance: 1.1, maxDistance: 9, rotateSpeed: 0.7 });
    this.tracker = new Tracker(CARDS.map(c => c.n));
    return true;
  }
  env() { const s = store.settings; return { level: s.level, lang: lang(), labels: s.labels, calm: s.calm, t: L }; }

  async open(route) {
    if (!this.ensureGL()) return;
    this.route = route; this.def = route.kind === 'mission' ? missionById[route.id] : route.kind === 'lab' ? labById[route.id] : null;
    this.mission = route.kind === 'mission' ? { pick: null, step: 'predict' } : null;
    this.focus = route.kind === 'card' ? route.id : null; this.fact = 0; this.goalShown = false; this.anchorCard = null;
    this.root.hidden = false; this.running = true; this.folded = false;
    clearTimeout(this.toastTimer); this.el.toast.hidden = true; this.el.modal.hidden = true;
    this.resize();
    await this.setMode(route.mode || store.settings.mode, true);
    store.touch(route.kind, route.id, this.mode);
    if (this.mission && this.mode !== 'none') this.showPredict();
    this.last = performance.now();
    cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(t => this.frame(t));
  }
  close() {
    this.running = false; cancelAnimationFrame(this.raf); hush();
    this.clearEntries(); this.closeSource(); this.el.modal.hidden = true; this.root.hidden = true;
  }
  closeSource() {
    if (this.stopCam) { this.stopCam(); this.stopCam = null; }
    if (this.sim) { this.sim.dispose(); this.sim = null; }
    this.el.video.hidden = true; this.tracker.source = null;
  }
  clearEntries() {
    for (const e of this.entries.values()) { (e.anchor || e.scene.group).removeFromParent(); e.scene.dispose(); }
    this.entries.clear(); this.el.inset.replaceChildren(); this.ctrls = [];
  }

  async setMode(mode, first = false) {
    this.clearEntries(); this.closeSource(); this.mode = mode; this.anchorCard = null; this.fitted = 0;
    if (!first || this.route.mode) store.set('mode', mode);
    this.root.dataset.mode = mode;
    for (const b of this.el.modes.children) b.setAttribute('aria-pressed', b.dataset.mode === mode);
    this.stars.visible = mode === '3d'; this.orbit.enabled = mode === '3d';
    if (mode === 'ar') {
      try {
        this.stopCam = await openCamera(this.el.video);
        this.el.video.hidden = false;
        this.tracker.setSource(this.el.video, this.el.video.videoWidth, this.el.video.videoHeight);
      } catch (err) { this.cameraFailed(err); return; }
    } else if (mode === 'demo') {
      this.sim = new SimSource(); this.sim.sway = !store.settings.calm;
      this.el.simHost.replaceChildren(this.sim.canvas);
      await this.sim.setCards(this.demoCards());
      this.tracker.setSource(this.sim.canvas, this.sim.width, this.sim.height);
    } else {
      const key = this.sceneKey();
      const scene = FACTORY[key](this.env());
      this.scene.add(scene.group);
      if (!this.def) this.focus = key;
      this.entries.set('main', { key: 'main', scene, cardId: this.def ? (this.def.cards || [])[0] : key });
      this.camera.position.set(...(scene.view || [0, 0.9, 3.6])); this.orbit.target.set(0, 0, 0);
    }
    this.resize(); this.renderChrome(); this.renderSheet();
  }
  sceneKey() {
    const r = this.route;
    if (r.kind === 'mission') return 'm:' + r.id;
    if (r.kind === 'lab') return 'l:' + this.def.scene;
    return this.focus || (r.kind === 'card' ? r.id : 'earth');
  }
  demoCards() {
    const r = this.route;
    if (this.def && this.def.cards) return this.def.cards.map(id => cardById[id]);
    if (r.kind === 'card') return [cardById[r.id]];
    return [cardById.sun, cardById.earth];
  }
  cameraFailed(err) {
    this.mode = 'none';
    this.modal(`<h2>${ui('camTitle')}</h2><p>${ui('camBody')}</p><p class="muted small">${esc(err && err.name || '')}</p>
      <div class="row"><button class="btn primary" data-setmode="demo">🎬 ${ui('useDemo')}</button><button class="btn" data-setmode="3d">🧊 ${ui('use3d')}</button></div>`);
  }

  // ---------------------------------------------------------------- layout
  resize() {
    if (!this.renderer) return;
    const W = this.root.clientWidth || window.innerWidth, H = this.root.clientHeight || window.innerHeight;
    this.W = W; this.H = H; this.renderer.setSize(W, H, false);
    this.camera.aspect = W / H; this.camera.clearViewOffset();
    if (this.mode === '3d') {
      this.camera.fov = 40;
      const wide = W > 860 && W > H, open = !this.folded;
      // keep the scene clear of the info panel
      if (open && wide) this.camera.setViewOffset(W, H, -190, 0, W, H);
      else if (open) this.camera.setViewOffset(W, H, 0, H * 0.2, W, H);
      const half = Math.tan(20 * Math.PI / 180), fitW = wide ? (W - 380) / H : W / H, need = 1.35 / (half * Math.min(1, fitW)) * (open && !wide ? 1.45 : 1.05);
      if (!this.fitted || Math.abs(this.fitted - need) > 0.01) { this.camera.position.setLength(need); this.fitted = need; }
    } else if (this.tracker.source) {
      this.camera.fov = this.tracker.fovFor(W, H); this.camera.position.set(0, 0, 0); this.camera.quaternion.identity(); this.fitted = 0;
    }
    this.camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- frame loop
  frame(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(t => this.frame(t));
    const dt = Math.min(Math.max((now - this.last) / 1000, 0), 0.1); this.last = now; this.clock += dt;
    if (this.mode === '3d') {
      this.orbit.update();
      for (const e of this.entries.values()) e.scene.update(dt, { sunWorld: null, partners: {} });
    } else if (this.tracker.source) this.stepAR(now, dt);
    this.renderer.render(this.scene, this.camera);
    if (now - (this.lastUi || 0) > 160) { this.lastUi = now; this.syncUi(); }
  }

  centreOf(pose) { return v3.set(0, 0, LIFT).applyQuaternion(pose.quaternion).add(pose.position).clone(); }
  makeEntry(key, sceneKey, cardId) {
    const scene = FACTORY[sceneKey](this.env()), anchor = new THREE.Group(), mount = new THREE.Group();
    mount.rotation.x = Math.PI / 2; mount.position.z = LIFT; mount.add(scene.group); anchor.add(mount); this.scene.add(anchor);
    const e = { key, scene, anchor, cardId, seen: 0 }; this.entries.set(key, e); return e;
  }
  stepAR(now, dt) {
    if (this.sim) { this.sim.lookX = this.W > 860 && this.W > this.H && !this.folded ? -1.9 : 0; this.sim.render(this.clock); }
    const poses = this.tracker.process(now), visible = new Map();
    for (const [id, p] of poses) if (now - p.seen < 350 && p.hits >= 3 && cardByMarker[id]) visible.set(cardByMarker[id].id, p);   // three sightings in a row: no one-frame ghosts
    const centres = {}; for (const [id, p] of visible) centres[id] = this.centreOf(p);
    let shown = 0;
    if (this.def && this.def.scene) {                               // one scene, pinned to the first of its cards in view
      if (!visible.has(this.anchorCard)) this.anchorCard = this.def.cards.find(id => visible.has(id)) || null;
      const e = this.entries.get('main') || this.makeEntry('main', this.sceneKey(), this.def.cards[0]);
      if (!this.sheetHasScene) this.renderSheet();
      e.anchor.visible = !!this.anchorCard;
      if (this.anchorCard) {
        const p = visible.get(this.anchorCard); e.anchor.position.copy(p.position); e.anchor.quaternion.copy(p.quaternion);
        const partners = { ...centres }; delete partners[this.anchorCard];
        e.scene.update(dt, { sunWorld: null, partners }); shown = 1;
      }
    } else {                                                         // free scanning: every card in view gets its own scene
      for (const [id, p] of visible) {
        let e = this.entries.get(id);
        if (!e) { if (this.entries.size >= 4) continue; e = this.makeEntry(id, id, id); }
        e.seen = now; e.anchor.position.copy(p.position); e.anchor.quaternion.copy(p.quaternion);
      }
      let focus = visible.has(this.focus) ? this.focus : null;
      for (const [id, e] of this.entries) {
        e.anchor.visible = visible.has(id);
        if (e.anchor.visible) {
          shown++; if (!focus) focus = id;
          const partners = { ...centres }; delete partners[id];
          e.scene.update(dt, { sunWorld: id !== 'sun' && centres.sun ? centres.sun : null, partners });
        } else if (now - e.seen > 15000) { e.anchor.removeFromParent(); e.scene.dispose(); this.entries.delete(id); }
      }
      if (focus && (focus !== this.focus || !this.sheetHasScene)) { this.focus = focus; this.fact = 0; this.renderChrome(); this.renderSheet(); }
    }
    const want = shown === 0;
    if (want !== !this.el.hint.hidden || this.hintFor !== this.mode) { this.hintFor = this.mode; this.renderHint(want); }
  }

  // ---------------------------------------------------------------- pointer: taps, hotspots, demo dragging
  bindPointer() {
    const gl = this.el.gl; let down = null, drag = -1;
    const frameXY = e => {                                           // screen point -> 0..1 across the (cover-scaled) camera picture
      const r = gl.getBoundingClientRect(), fw = this.sim.width, fh = this.sim.height, s = Math.max(r.width / fw, r.height / fh);
      return [((e.clientX - r.left) - (r.width - fw * s) / 2) / (fw * s), ((e.clientY - r.top) - (r.height - fh * s) / 2) / (fh * s)];
    };
    gl.addEventListener('pointerdown', e => {
      down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
      if (this.sim) { drag = this.sim.pickCard(...frameXY(e)); if (drag >= 0) { this.sim.dragStart(drag, ...frameXY(e)); gl.setPointerCapture(e.pointerId); } }
    });
    gl.addEventListener('pointermove', e => {
      if (!down) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
      if (this.sim && drag >= 0 && down.moved) this.sim.dragTo(drag, ...frameXY(e));
    });
    const up = e => {
      if (down && !down.moved && performance.now() - down.t < 600) this.tap(e);
      down = null; drag = -1;
    };
    gl.addEventListener('pointerup', up); gl.addEventListener('pointercancel', () => { down = null; drag = -1; });
  }
  tap(e) {
    const r = this.el.gl.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, 1 - (e.clientY - r.top) / r.height * 2), this.camera);
    const shownChain = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    for (const en of this.entries.values()) {
      const hits = this.ray.intersectObject(en.scene.group, true).filter(h => shownChain(h.object));
      if (!hits.length) continue;
      for (const h of hits) {
        let id = null;
        for (let o = h.object; o && !id; o = o.parent) { const hot = o.userData.hot; if (hot) id = typeof hot === 'function' ? hot(h) : hot; }
        if (id) { en.scene.onHot && en.scene.onHot(id); this.showHot(en, id); return; }
        if (!h.object.isSprite) break;                               // a solid surface blocks what is behind it
      }
      if (en.scene.onTap && en.scene.onTap(hits)) return;
    }
    this.el.toast.hidden = true;
  }
  showHot(entry, id) {
    const card = cardById[entry.cardId], h = card && card.hotspots[id]; if (!h) return;
    this.toast(`<b>${esc(tr(h[0]))}</b><span>${esc(tr(h[1]))}</span>`, 9000);
  }
  toast(html, ms = 5000) {
    const t = this.el.toast; t.innerHTML = html; t.hidden = false;
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => { t.hidden = true; }, ms);
  }

  // ---------------------------------------------------------------- interface
  current() {                                                        // the scene whose text and controls the panel shows
    if (this.entries.has('main')) return this.entries.get('main');
    return this.entries.get(this.focus) || null;
  }
  renderChrome() {
    const r = this.route, lv = LEVELS.find(l => l.id === store.settings.level), card = cardById[this.focus];
    this.el.title.textContent = this.def ? tr(this.def.title) : card ? tr(card.title) : ui('scan');
    this.el.sub.textContent = this.def ? (r.kind === 'mission' ? ui('missions') : ui('labs')) : card ? `${ui('cards')} ${pad2(card.n)}` : '';
    this.el.level.innerHTML = `${lv.icon} ${esc(tr(lv.name))}`;
  }
  renderHint(show) {
    const h = this.el.hint; h.hidden = !show; if (!show) return;
    const need = this.def && this.def.cards ? this.def.cards : this.route.kind === 'card' ? [this.route.id] : null;
    const list = need ? need.map(id => `<b>${pad2(cardById[id].n)} ${esc(tr(cardById[id].title))}</b>`).join(' + ') : '';
    h.innerHTML = this.mode === 'demo' ? `🎬 ${ui('hintDemo')}` : need ? `📷 ${ui('hintNeed')} ${list}` : `📷 ${ui('hintScan')}`;
  }
  renderSheet() {
    const r = this.route, cur = this.current(), lv = store.settings.level, sh = this.el.sheet;
    const card = !this.def ? cardById[this.focus] : null;
    this.sheetHasScene = !!cur;
    let html = `<button class="grab" data-act="fold" aria-label="fold"></button><div class="sheetBody">`;
    if (this.def) {
      html += `<div class="kicker">${this.def.icon} ${r.kind === 'mission' ? ui('missions') : ui('labs')}</div><h2>${esc(tr(this.def.title))}</h2>
        <p class="intro"><b>${ui('yourTask')}:</b> ${esc(tr(this.def.task))}</p>`;
    } else if (card) {
      const c = card.levels[lv], facts = c.facts;
      html += `<div class="kicker" style="color:${card.color}">${ui('cards')} ${pad2(card.n)} · ${esc(tr(card.tagline))}</div><h2>${esc(tr(card.title))}</h2>
        <p class="intro">${esc(tr(c.intro))}</p>
        <div class="fact"><span>💡 ${ui('fact')} <em>${this.fact + 1}/${facts.length}</em></span><p>${esc(tr(facts[this.fact]))}</p><button class="link" data-act="fact">${ui('next')} ›</button></div>`;
    } else html += `<h2>${ui('scan')}</h2><p class="intro">${ui('hintScan')}. ${ui('tapHint')}.</p>`;
    html += `<div class="controls">`;
    this.ctrls = cur ? cur.scene.controls : [];
    this.ctrls.forEach((c, i) => {
      if (c.type === 'range') html += `<label class="range"><span>${esc(c.label)}</span><output></output><input type="range" data-c="${i}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.get()}"></label>`;
      else if (c.type === 'toggle') html += `<button class="btn toggle" data-c="${i}" aria-pressed="${c.get()}">${esc(c.label)}</button>`;
      else html += `<button class="btn" data-c="${i}">${esc(c.label)}</button>`;
    });
    html += `</div><div class="status" aria-live="polite"></div>`;
    if (this.def && cur && cur.scene.goal) html += `<div class="goal"><div class="bar"><i></i></div>${r.kind === 'mission' ? `<button class="btn primary" data-act="why" disabled>✨ ${ui('seeWhy')}</button><button class="link" data-act="why">${ui('skip')}</button>` : ''}</div>`;
    html += `<div class="row">`;
    if (card || this.def) html += `<button class="btn ghost" data-act="speak">🔊 ${ui('readAloud')}</button>`;
    if (card && card.mission) html += `<button class="btn ghost" data-go="mission/${card.mission}">${missionById[card.mission].icon} ${ui('openMission')}</button>`;
    if (card && card.lab) html += `<button class="btn ghost" data-go="lab/${card.lab}">${labById[card.lab].icon} ${ui('openLab')}</button>`;
    html += `</div></div>`;
    sh.innerHTML = html; sh.classList.toggle('folded', this.folded);
    this.el.inset.replaceChildren(...(cur && cur.scene.hud ? [cur.scene.hud] : []));
    this.syncUi();
  }
  syncUi() {
    const cur = this.current(), sh = this.el.sheet; if (!cur) return;
    const st = sh.querySelector('.status'); if (st) { const s = cur.scene.status(); if (st.textContent !== s) st.textContent = s; }
    sh.querySelectorAll('[data-c]').forEach(n => {
      const c = this.ctrls[+n.dataset.c]; if (!c) return;
      if (c.type === 'range') { if (document.activeElement !== n) n.value = c.get(); n.previousElementSibling.textContent = c.fmt ? c.fmt(c.get()) : c.get(); }
      else if (c.type === 'toggle') n.setAttribute('aria-pressed', c.get());
    });
    const g = cur.scene.goal, bar = sh.querySelector('.goal .bar i');
    if (g && bar) {
      bar.style.width = Math.round(g.progress * 100) + '%';
      const btn = sh.querySelector('.goal .btn'), skip = sh.querySelector('.goal .link');
      if (btn) { btn.disabled = !g.done; if (skip) skip.hidden = g.done; }
      if (g.done && !this.goalShown) { this.goalShown = true; this.toast(`<b>⭐ ${L('You found it!')}</b>`, 3500); if (this.route.kind === 'lab') store.touch('lab', this.route.id, this.mode); }
    }
  }

  click(e) {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.mode) return void this.setMode(t.dataset.mode);
    if (t.dataset.setmode) { this.el.modal.hidden = true; return void this.setMode(t.dataset.setmode).then(() => { if (this.mission && this.mission.step === 'predict') this.showPredict(); }); }
    if (t.dataset.go) return void this.onGo(t.dataset.go);
    if (t.dataset.pick !== undefined) return void this.picked(+t.dataset.pick);
    if (t.dataset.c !== undefined && !t.matches('input')) {
      const c = this.ctrls[+t.dataset.c]; if (c.type === 'toggle') c.set(!c.get()); else c.action();
      return void this.syncUi();
    }
    switch (t.dataset.act) {
      case 'back': return void this.onExit();
      case 'fold': this.folded = !this.folded; this.el.sheet.classList.toggle('folded', this.folded); this.fitted = 0; return void this.resize();
      case 'fact': { const card = cardById[this.focus]; this.fact = (this.fact + 1) % card.levels[store.settings.level].facts.length; return void this.renderSheet(); }
      case 'level': {
        const i = LEVELS.findIndex(l => l.id === store.settings.level); store.set('level', LEVELS[(i + 1) % LEVELS.length].id);
        this.fact = 0; hush(); return void this.rebuild();
      }
      case 'speak': return void this.readAloud(t);
      case 'why': return void this.showExplain();
      case 'again': this.el.modal.hidden = true; return;
      case 'closeModal': this.el.modal.hidden = true; return;
    }
  }
  /** Rebuild scenes after a level change so labels, numbers and controls match the new level. */
  rebuild() {
    if (this.mode === '3d') { const pos = this.camera.position.clone(); this.setMode('3d').then(() => { this.camera.position.copy(pos); }); }
    else { this.clearEntries(); this.renderChrome(); this.renderSheet(); }
    if (!this.el.modal.hidden && this.mission && this.mission.step === 'explain') this.showExplain();
  }
  readAloud(btn) {
    let text = '';
    if (this.mission && !this.el.modal.hidden) text = this.el.modal.querySelector('.say').textContent;
    else if (this.def) text = tr(this.def.title) + '. ' + tr(this.def.task);
    else { const card = cardById[this.focus], c = card.levels[store.settings.level]; text = `${tr(card.title)}. ${tr(c.intro)} ${tr(c.facts[this.fact])}`; }
    const on = speak(text, () => btn.classList.remove('on')); btn.classList.toggle('on', on);
  }

  // ---------------------------------------------------------------- missions: predict -> observe -> explain
  modal(html) { this.el.modal.innerHTML = `<div class="dialog">${html}</div>`; this.el.modal.hidden = false; }
  message(title, body) { this.root.hidden = false; this.modal(`<h2>${esc(title)}</h2><p>${esc(body)}</p><div class="row"><button class="btn primary" data-act="back">${ui('back')}</button></div>`); }
  showPredict() {
    const m = this.def, order = OPTION_ORDER[m.id];
    this.modal(`<div class="kicker">${m.icon} ${esc(tr(m.title))}</div>
      <div class="say"><h2>${esc(tr(m.question))}</h2></div>
      <p class="muted">${ui('predict')} ${ui('predictSub')}</p>
      <div class="opts">${order.map((oi, i) => `<button class="opt" data-pick="${oi}"><b>${'ABC'[i]}</b>${esc(tr(m.options[oi].text))}</button>`).join('')}</div>
      <div class="row"><button class="btn ghost" data-act="speak">🔊 ${ui('readAloud')}</button></div>`);
  }
  picked(i) {
    this.mission.pick = i; this.mission.step = 'observe'; hush();
    store.logMission(this.def.id, this.def.options[i].k, false);
    this.el.modal.hidden = true;
    this.toast(`<b>${ui('yourTask')}</b><span>${esc(tr(this.def.task))}</span>`, 8000);
  }
  showExplain() {
    const m = this.def, ms = this.mission; if (!m || !ms) return;
    if (ms.pick === null) return void this.showPredict();
    ms.step = 'explain'; hush();
    const opt = m.options[ms.pick], first = !store.badges.includes(m.id);
    store.logMission(m.id, opt.k, true);
    const i = MISSIONS.findIndex(x => x.id === m.id), next = MISSIONS[(i + 1) % MISSIONS.length];
    const lv = LEVELS.find(l => l.id === store.settings.level);
    this.modal(`<div class="kicker">${m.icon} ${esc(tr(m.title))} · ${lv.icon} ${esc(tr(lv.name))}</div>
      ${first ? `<div class="badge">⭐ ${ui('badgeEarned')}</div>` : ''}
      <p class="muted">${ui('youSaid')} “${esc(tr(opt.text))}”</p>
      <div class="say"><p class="verdict ${opt.k}">${ui(opt.k === 'correct' ? 'right' : opt.k === 'misconception' ? 'common' : 'other')}</p>
      <p class="explain">${esc(tr(m.explain[store.settings.level]))}</p></div>
      <div class="follow"><span>💬 ${ui('talk')}</span>${esc(tr(m.follow))}</div>
      <div class="row"><button class="btn ghost" data-act="speak">🔊</button><button class="btn" data-act="again">${ui('again')}</button>
      <button class="btn primary" data-go="mission/${next.id}">${next.icon} ${ui('nextMission')}</button></div>`);
  }
}
