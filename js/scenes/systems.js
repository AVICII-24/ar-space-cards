// Multi-body scenes: the solar system card, the concept-mission scenes
// (seasons, phases, scale, orbit) and the Mars mission planner lab.
import * as THREE from 'three';
import {
  DEG, TAU, ll, earthTexture, moonTexture, marsTexture, jupiterTexture, saturnTexture, venusTexture, uranusTexture,
  neptuneTexture, mercuryTexture, ringTexture, ringGeometry, planetMaterial, sunMaterial, glowSprite, label, pin,
  circleLine, hitSphere,
} from '../gfx.js';
import { base, moonAge, phaseName, dayOfYear } from './bodies.js';

const tmp = new THREE.Vector3();
const MONTHS = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] };
const fmtDate = (d, lang) => `${d.getUTCDate()} ${MONTHS[lang][d.getUTCMonth()]} ${d.getUTCFullYear()}`;

function sunBall(r, time) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), sunMaterial(time)), glowSprite(0xffb347, r * 5, 0.8));
  return g;
}

// ------------------------------------------------------------------ Solar system
//           id        a (AU)  T (yr)   radius km  mean longitude at J2000
export const PLANETS = [
  ['mercury', 0.387, 0.2408, 2440, 252.25, mercuryTexture],
  ['venus', 0.723, 0.6152, 6052, 181.98, venusTexture],
  ['earth', 1.0, 1.0, 6371, 100.46, earthTexture],
  ['mars', 1.524, 1.8808, 3390, 355.45, marsTexture],
  ['jupiter', 5.203, 11.862, 69911, 34.4, jupiterTexture],
  ['saturn', 9.537, 29.457, 58232, 49.94, saturnTexture],
  ['uranus', 19.19, 84.02, 25362, 313.23, uranusTexture],
  ['neptune', 30.07, 164.8, 24622, 304.88, neptuneTexture],
];
const J2000 = Date.UTC(2000, 0, 1, 12);

export function solarSystemScene(env, { names }) {
  const s = base(env), L = env.t, time = { value: 0 };
  const sun = sunBall(0.085, time); sun.add(hitSphere(0.12, 'sun')); s.group.add(sun);
  s.view = [0, 2.3, 2.9];
  let trueScale = 0, target = 0, days = (Date.now() - J2000) / 864e5, speed = env.calm ? 0 : 12, selected = 'earth';
  const bodies = PLANETS.map(([id, a, T, km, L0, tex], i) => {
    const r = 0.011 * Math.pow(km / 2440, 0.4);
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), planetMaterial(tex(), s.sunPos, { ambient: 0.16 }));
    mesh.add(hitSphere(Math.max(r * 1.6, 0.055), id));
    if (id === 'saturn') {
      const ring = new THREE.Mesh(ringGeometry(r * 1.3, r * 2.1, 48), new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2 + 0.45; mesh.add(ring);
    }
    if (env.labels) { const lb = label(names[id], 0.055); lb.position.y = r + 0.055; mesh.add(lb); }
    const line = circleLine(1, 0xffffff, 0.22);
    s.group.add(mesh, line);
    return { id, a, T, L0, mesh, line, even: 0.2 + i * 0.108, lin: 0.05 + a / 30.07 * 0.93 };
  });
  s.update = (dt, frame) => {
    time.value += dt; days += dt * speed;
    trueScale += (target - trueScale) * Math.min(dt * 3, 1);
    s.group.updateWorldMatrix(true, false); s.group.getWorldPosition(s.sunPos.value);
    for (const b of bodies) {
      const r = b.even + (b.lin - b.even) * trueScale, ang = (b.L0 + 360 * (days / 365.25) / b.T) * DEG;
      b.mesh.position.set(Math.cos(ang) * r, 0, -Math.sin(ang) * r);
      b.mesh.rotation.y += dt * 0.5; b.line.scale.setScalar(r);
    }
  };
  s.onHot = id => { if (bodies.some(b => b.id === id)) selected = id; };
  s.status = () => {
    const b = bodies.find(x => x.id === selected), date = fmtDate(new Date(J2000 + days * 864e5), env.lang);
    if (env.level === 'explorer') return `${date} · ${names[b.id]}: ${L('one trip round the Sun takes')} ${b.T < 1 ? Math.round(b.T * 365.25) + L(' days') : b.T.toFixed(1) + L(' years')}`;
    const k = `${names[b.id]}: a = ${b.a.toFixed(2)} AU · T = ${b.T.toFixed(2)} ${L('yr')}`;
    return env.level === 'scientist' ? `${k} · T²/a³ = ${(b.T * b.T / b.a ** 3).toFixed(3)} · v = ${(29.78 / Math.sqrt(b.a)).toFixed(1)} km/s` : `${date} · ${k}`;
  };
  s.controls = [
    { type: 'range', label: L('Speed (days each second)'), min: 0, max: 120, step: 1, get: () => speed, set: v => { speed = v; }, fmt: v => String(Math.round(v)) },
    { type: 'button', label: L('Today'), action: () => { days = (Date.now() - J2000) / 864e5; } },
    ...(env.level === 'explorer' ? [] : [{ type: 'toggle', label: L('True distances'), get: () => target === 1, set: v => { target = v ? 1 : 0; } }]),
  ];
  return s;
}

// ------------------------------------------------------------------ Seasons mission
// The axis is fixed in space. June solstice is at orbit angle 180° (Earth on the -X side).
export function seasonsScene(env) {
  const s = base(env), L = env.t, time = { value: 0 }, EPS = 23.44 * DEG, RE = 0.15;
  s.view = [0, 1.7, 3.3];
  const sun = sunBall(0.11, time); s.group.add(sun);
  const orbit = circleLine(1, 0xffffff, 0.3); s.group.add(orbit);
  const earth = new THREE.Group(), tilt = new THREE.Group();
  tilt.rotation.z = -EPS;                                              // north pole leans towards +X
  const globe = new THREE.Mesh(new THREE.SphereGeometry(RE, 48, 32), planetMaterial(earthTexture(), s.sunPos, { ambient: 0.1 }));
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, RE * 3.4, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const eq = circleLine(RE * 1.01, 0xffffff, 0.5, 64);
  const delhi = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff4d4d }));
  delhi.position.copy(ll(28.6, 77.2, RE * 1.01)); globe.add(delhi);
  tilt.add(globe, axis, eq); earth.add(tilt); s.group.add(earth);
  const overhead = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe066 }));
  earth.add(overhead);
  const marks = [[180, L('21 June')], [270, L('23 Sept')], [0, L('22 Dec')], [90, L('21 March')]]
    .map(([deg, txt]) => { const lb = label(txt, 0.07); s.group.add(lb); return { deg, lb }; });
  const near = label(L('Closest to the Sun · 3 Jan'), 0.055, { color: '#fde68a' }); s.group.add(near);
  let lam = ((dayOfYear(new Date()) - 356) / 365.25 * 360 + 720) % 360, R = 0.8, driven = false, june = false, dec = false, spin = 0;
  const info = { date: '', decl: 0, hours: 12, alt: 60, dist: 149.6 };
  s.update = (dt, frame) => {
    time.value += dt;
    s.group.updateWorldMatrix(true, false); s.group.getWorldPosition(s.sunPos.value);
    const partner = frame.partners && frame.partners.earth;        // Earth card on the table: it drives the orbit
    driven = !!partner;
    if (partner) {
      const p = s.group.worldToLocal(tmp.copy(partner)); p.y = 0;
      R = Math.min(Math.max(p.length(), 0.45), 3); lam = (Math.atan2(-p.z, p.x) / DEG + 360) % 360;
    } else R += (0.8 - R) * Math.min(dt * 4, 1);
    const a = lam * DEG, big = driven ? 2.6 : 1;                     // two cards on a table are far apart: draw everything larger
    sun.scale.setScalar(big); earth.scale.setScalar(big);
    for (const m of [...marks.map(x => x.lb), near]) { m.userData.base = m.userData.base || m.scale.clone(); m.scale.copy(m.userData.base).multiplyScalar(big); }
    earth.position.set(Math.cos(a) * R, 0, -Math.sin(a) * R); orbit.scale.setScalar(R);
    spin += dt * (env.calm ? 0.2 : 0.9); globe.rotation.y = spin;
    for (const m of marks) m.lb.position.set(Math.cos(m.deg * DEG) * (R + 0.26 * big), 0.02, -Math.sin(m.deg * DEG) * (R + 0.26 * big));
    near.position.set(Math.cos(12 * DEG) * (R + 0.3 * big), -0.16 * big, -Math.sin(12 * DEG) * (R + 0.3 * big));
    // sub-solar point, Delhi day length and noon Sun height
    const decl = Math.asin(-Math.cos(a) * Math.sin(EPS)), phi = 28.6 * DEG;
    const toSun = tmp.set(-Math.cos(a), 0, Math.sin(a));
    overhead.position.copy(toSun).multiplyScalar(RE * 1.02);
    info.decl = decl / DEG;
    info.hours = 2 * Math.acos(Math.min(Math.max(-Math.tan(phi) * Math.tan(decl), -1), 1)) / DEG / 15;
    info.alt = 90 - Math.abs(28.6 - info.decl);
    info.dist = 149.6 * (1 - 0.0167 ** 2) / (1 + 0.0167 * Math.cos((lam - 12) * DEG));
    const d = new Date(Date.UTC(2025, 11, 22) + lam / 360 * 365.25 * 864e5);
    info.date = `${d.getUTCDate()} ${MONTHS[env.lang][d.getUTCMonth()]}`;
    if (Math.abs(lam - 180) < 22) june = true;
    if (lam < 22 || lam > 338) dec = true;
    if (s.goal) { s.goal.progress = (june + dec) / 2; s.goal.done = june && dec; }
  };
  s.status = () => {
    const season = info.decl > 12 ? L('summer in India') : info.decl < -12 ? L('winter in India') : L('between seasons');
    const day = `${L('Delhi daylight')} ${info.hours.toFixed(1)} ${L('h')}`;
    if (env.level === 'explorer') return `${info.date} · ${season} · ${day}`;
    const more = `${info.date} · ${season} · ${day} · ${L('noon Sun')} ${Math.round(info.alt)}° · ${L('Sun')}–${L('Earth')} ${info.dist.toFixed(1)} ${L('million km')}`;
    return env.level === 'scientist' ? `${more} · δ = ${info.decl.toFixed(1)}°` : more;
  };
  s.controls = [{ type: 'range', label: L('Move Earth around the Sun'), min: 0, max: 360, step: 1,
    get: () => (lam + 180) % 360, set: v => { if (!driven) lam = (v + 180) % 360; }, fmt: () => info.date }];
  s.goal = { progress: 0, done: false };
  return s;
}

// ------------------------------------------------------------------ Moon phases mission
export function phasesScene(env) {
  const s = base(env), L = env.t, RO = 0.72;
  s.view = [0, 2.0, 3.1];
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.17, 40, 28), planetMaterial(earthTexture(), s.sunPos, { ambient: 0.12 }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 24), planetMaterial(moonTexture(), s.sunPos, { ambient: 0.1 }));
  s.group.add(earth, moon, circleLine(RO, 0xffffff, 0.3));
  const rays = new THREE.Group(), rayMat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.8 });
  for (let i = -2; i <= 2; i++) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 6), rayMat), head = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 8), rayMat);
    shaft.rotation.z = Math.PI / 2; shaft.position.set(1.3, 0, i * 0.3);
    head.rotation.z = Math.PI / 2; head.position.set(1.15, 0, i * 0.3); rays.add(shaft, head);
  }
  s.group.add(rays);
  if (env.labels) {
    const a = label(L('Sunlight'), 0.075, { color: '#fde68a' }); a.position.set(1.25, 0.2, 0); s.group.add(a);
    const b = label(L('Earth'), 0.065); b.position.set(0, 0.27, 0); s.group.add(b);
  }
  // "View from Earth" window
  const hud = document.createElement('div'); hud.className = 'inset';
  hud.innerHTML = `<canvas width="160" height="160"></canvas><span>${L('Seen from Earth')}</span>`;
  const ctx = hud.firstChild.getContext('2d'); s.hud = hud;
  const draw = th => {
    const k = (1 - Math.cos(th)) / 2, waxing = th % TAU < Math.PI, c = 80, r = 66;
    ctx.clearRect(0, 0, 160, 160); ctx.save();
    ctx.beginPath(); ctx.arc(c, c, r, 0, TAU); ctx.clip();
    ctx.fillStyle = '#1b2030'; ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = '#e8e6dc'; ctx.beginPath(); ctx.arc(c, c, r, -Math.PI / 2, Math.PI / 2, !waxing); ctx.fill();
    ctx.fillStyle = k < 0.5 ? '#1b2030' : '#e8e6dc'; ctx.beginPath(); ctx.ellipse(c, c, r * Math.abs(Math.cos(th)), r, 0, 0, TAU); ctx.fill();
    ctx.restore();
  };
  let age = moonAge(new Date()), full = false, nw = false, last = -1;
  s.update = () => {
    s.group.updateWorldMatrix(true, false); s.sunPos.value.copy(s.group.localToWorld(tmp.set(90, 0, 0)));
    const th = age / 29.530588853 * TAU;
    moon.position.set(Math.cos(th) * RO, 0, -Math.sin(th) * RO);
    moon.rotation.y = th + Math.PI;                                    // same face towards Earth
    earth.rotation.y += 0.01;
    if (Math.abs(th - last) > 0.001) { draw(th); last = th; }
    const f = age / 29.530588853;
    if (Math.abs(f - 0.5) < 0.035) full = true;
    if (f < 0.035 || f > 0.965) nw = true;
    if (s.goal) { s.goal.progress = (full + nw) / 2; s.goal.done = full && nw; }
  };
  s.status = () => `${L('Day')} ${age.toFixed(1)} · ${phaseName(age, L)} · ${L('we see')} ${Math.round((1 - Math.cos(age / 29.530588853 * TAU)) / 2 * 100)}% · ${L('half is always lit')}`;
  s.controls = [
    { type: 'range', label: L('Move the Moon (day of the month)'), min: 0, max: 29.5, step: 0.25, get: () => age, set: v => { age = v; }, fmt: v => v.toFixed(1) },
    { type: 'button', label: L('Today’s Moon'), action: () => { age = moonAge(new Date()); } },
  ];
  s.goal = { progress: 0, done: false };
  return s;
}

// ------------------------------------------------------------------ Distance and scale mission
export function scaleScene(env, { names }) {
  const s = base(env), L = env.t;
  const D = 1.86 / 31.83;                                    // one Earth-width when the Moon sits at 405,500 km
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), planetMaterial(earthTexture(), s.sunPos, { ambient: 0.2 }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), planetMaterial(moonTexture(), s.sunPos, { ambient: 0.2 }));
  s.group.add(earth, moon);
  const ghosts = new THREE.Group(), gm = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55 });
  for (let i = 1; i <= 29; i++) {
    const c = circleLine(D / 2, 0x7dd3fc, 0.55, 32); c.material = gm; c.rotation.x = Math.PI / 2; c.position.x = -0.93 + D * i; ghosts.add(c);
  }
  s.group.add(ghosts);
  const widths = { mercury: 0.383, venus: 0.95, mars: 0.532, jupiter: 10.97, saturn: 9.14, uranus: 3.98, neptune: 3.865 };
  const tex = { mercury: mercuryTexture, venus: venusTexture, mars: marsTexture, jupiter: jupiterTexture, saturn: saturnTexture, uranus: uranusTexture, neptune: neptuneTexture };
  const row = new THREE.Group(); let x = -0.93 + D / 2;
  for (const id of ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) {
    const r = widths[id] * D / 2, m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), planetMaterial(tex[id](), s.sunPos, { ambient: 0.25 }));
    m.position.x = x + r; x += r * 2;
    if (id === 'saturn') { const ring = new THREE.Mesh(ringGeometry(r * 1.25, r * 1.9, 48), new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -1.3; m.add(ring); }
    if (env.labels && r > 0.05) { const lb = label(names[id], 0.055); lb.position.y = r + 0.06; m.add(lb); }
    row.add(m);
  }
  s.group.add(row);
  const le = label(names.earth, 0.06), lm = label(L('Moon'), 0.06); s.group.add(le, lm);
  let real = false, lined = false, k = 0, far = 0, rowScale = 0;
  s.update = dt => {
    s.group.updateWorldMatrix(true, false); s.sunPos.value.copy(s.group.localToWorld(tmp.set(20, 30, 60)));
    k += ((real ? 1 : 0) - k) * Math.min(dt * 2.5, 1);
    far += ((lined ? 1 : 0) - far) * Math.min(dt * 2.5, 1);
    rowScale += ((lined && real ? 1 : 0) - rowScale) * Math.min(dt * 2.5, 1);
    const er = 0.3 + (D / 2 - 0.3) * k, mr = 0.082 + (D * 0.2727 / 2 - 0.082) * k;
    const sep = 384.4 + (405.5 - 384.4) * far;                       // thousand km
    earth.scale.setScalar(er); moon.scale.setScalar(mr);
    earth.position.x = -0.5 + (-0.93 + 0.5) * k; moon.position.x = 0.5 + (-0.93 + D * sep / 12.742 - 0.5) * k;
    earth.rotation.y += dt * 0.2;
    ghosts.visible = k > 0.9 && rowScale < 0.1; row.visible = rowScale > 0.01; row.scale.set(1, rowScale, rowScale);
    le.position.set(earth.position.x, er + 0.09, 0); lm.position.set(moon.position.x, mr + 0.09, 0);
    le.visible = lm.visible = env.labels;
    if (s.goal) { s.goal.progress = (real + (real && lined)) / 2; s.goal.done = real && lined; }
  };
  s.status = () => !real ? L('This is how books draw it. Is the Moon really this close?')
    : !lined ? L('True scale: 30 Earths fit in the gap · 384,400 km')
    : L('All 7 other planets: 380,000 km side by side · Moon at its farthest: 405,500 km');
  s.controls = [
    { type: 'toggle', label: L('True scale'), get: () => real, set: v => { real = v; if (!v) lined = false; } },
    { type: 'toggle', label: L('Line up the planets'), get: () => lined, set: v => { lined = v; if (v) real = true; } },
  ];
  s.goal = { progress: 0, done: false };
  return s;
}

// ------------------------------------------------------------------ Gravity in orbit mission (Newton's cannon)
export function miniStation() {
  const g = new THREE.Group(), grey = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.5, roughness: 0.5 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x2847a8, metalness: 0.4, roughness: 0.4, emissive: 0x0a1535 });
  g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.05), grey), new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 10).rotateX(Math.PI / 2), grey));
  for (const x of [-0.42, 0.42]) for (const z of [-0.2, 0.2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.34), blue); p.position.set(x, 0, z); g.add(p); }
  return g;
}
export function orbitScene(env) {
  const s = base(env), L = env.t, RE = 0.5, KM = RE / 6371, MU = 398600, R0 = 6771;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(RE, 64, 40), planetMaterial(earthTexture(), s.sunPos, { ambient: 0.22 }));
  earth.rotation.x = 0.4; s.group.add(earth, glowSprite(0x4da3ff, RE * 2.7, 0.4));
  const ship = miniStation(); ship.scale.setScalar(0.11); s.group.add(ship);
  const N = 1500, pts = new Float32Array(N * 3), geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const trail = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x67e8f9 })); trail.frustumCulled = false; s.group.add(trail);
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 0.2, 0xfb7185, 0.06, 0.04); s.group.add(arrow);
  const gl = label('g', 0.06, { color: '#fecdd3' }); s.group.add(gl);
  if (env.labels) { const a = label(L('400 km up: this thin gap'), 0.055); a.position.set(0, RE + 0.2, 0); s.group.add(a); }
  let v0 = 4, state = 'ready', px, py, vx, vy, n = 0, swept = 0, lastAng = 0, msg = '';
  const reset = () => { px = 0; py = R0; vx = v0; vy = 0; n = 0; swept = 0; lastAng = Math.PI / 2; geo.setDrawRange(0, 0); };
  reset();
  const step = h => {                                                   // velocity-Verlet, km and seconds
    const acc = (x, y) => { const r3 = Math.pow(x * x + y * y, 1.5); return [-MU * x / r3, -MU * y / r3]; };
    let [ax, ay] = acc(px, py);
    px += vx * h + ax * h * h / 2; py += vy * h + ay * h * h / 2;
    const [bx, by] = acc(px, py); vx += (ax + bx) * h / 2; vy += (ay + by) * h / 2;
  };
  s.update = dt => {
    s.group.updateWorldMatrix(true, false); s.sunPos.value.copy(s.group.localToWorld(tmp.set(40, 30, 60)));
    earth.rotation.y += dt * 0.05;
    if (state === 'flying') {
      const r0 = Math.hypot(px, py), simT = Math.min(dt, 0.05) * (env.calm ? 420 : 700) * Math.pow(r0 / R0, 1.5);
      for (let i = 0; i < 40 && state === 'flying'; i++) {
        step(simT / 40);
        const r = Math.hypot(px, py), ang = Math.atan2(py, px);
        let d = lastAng - ang; if (d < -Math.PI) d += TAU; if (d > Math.PI) d -= TAU; swept += d; lastAng = ang;
        if (r < 6371 + 80) { state = 'crashed'; msg = v0 < 0.5 ? L('With no sideways speed it falls straight down. Gravity is there!') : L('Too slow: gravity pulled it back to the ground.'); }
        else if (r > 6371 * 9) { state = 'escaped'; msg = L('Too fast: it escaped from Earth altogether.'); }
        else if (swept > TAU * 0.97) { state = 'orbit'; msg = Math.abs(v0 - 7.66) < 0.2 ? L('Orbit! It falls around the Earth and never lands, just like the Space Station.') : L('It orbits, in a stretched loop. The Space Station uses 7.7 km/s for a circle.'); }
      }
      if (n < N) { pts.set([px * KM, py * KM, 0], n * 3); n++; geo.setDrawRange(0, n); geo.attributes.position.needsUpdate = true; }
    }
    if (state === 'orbit') { step(Math.min(dt, 0.05) * 700 * Math.pow(Math.hypot(px, py) / R0, 1.5) / 4); }
    ship.position.set(px * KM, py * KM, 0); ship.rotation.z = Math.atan2(py, px) - Math.PI / 2;
    const r = Math.hypot(px, py), down = tmp.set(-px / r, -py / r, 0);
    arrow.position.copy(ship.position); arrow.setDirection(down); arrow.setLength(0.24 * (6371 / r) ** 2, 0.06, 0.04);
    gl.position.copy(ship.position).addScaledVector(down, 0.3); arrow.visible = gl.visible = state !== 'crashed';
    if (s.goal) { s.goal.done = s.goal.done || state === 'orbit'; s.goal.progress = s.goal.done ? 1 : 0; }
  };
  s.status = () => {
    const r = Math.hypot(px, py), g = Math.round((6371 / r) ** 2 * 100), h = Math.max(Math.round(r - 6371), 0);
    const live = `${L('Speed')} ${(state === 'ready' ? v0 : Math.hypot(vx, vy)).toFixed(1)} km/s · ${L('Height')} ${h} km · ${L('Gravity')} ${g}%`;
    return state === 'ready' ? `${live} · ${L('Pick a speed, then launch')}` : state === 'flying' ? live : `${msg} · ${live}`;
  };
  s.controls = [
    { type: 'range', label: L('Sideways speed (km/s)'), min: 0, max: 11, step: 0.1, get: () => v0, set: v => { v0 = v; state = 'ready'; reset(); }, fmt: v => v.toFixed(1) },
    { type: 'button', label: L('Launch'), action: () => { reset(); state = 'flying'; } },
  ];
  s.goal = { progress: 0, done: false };
  return s;
}

// ------------------------------------------------------------------ Lab: plan a trip to Mars (Hohmann transfer)
export function marsPlannerScene(env) {
  const s = base(env), L = env.t, time = { value: 0 }, AU = 0.5, AM = 1.524, AT = (1 + AM) / 2, E = (AM - 1) / (AM + 1);
  const TRIP = 0.5 * Math.pow(AT, 1.5), W_E = TAU, W_M = TAU / 1.8808;       // years, rad per year
  s.view = [0, 3.2, 1.9];
  s.group.add(sunBall(0.07, time), circleLine(AU, 0x60a5fa, 0.5), circleLine(AU * AM, 0xf87171, 0.5));
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 16), planetMaterial(earthTexture(), s.sunPos, { ambient: 0.3 }));
  const mars = new THREE.Mesh(new THREE.SphereGeometry(0.034, 24, 16), planetMaterial(marsTexture(), s.sunPos, { ambient: 0.3 }));
  const craft = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 8), new THREE.MeshBasicMaterial({ color: 0xfde047 })); craft.visible = false;
  const N = 200, pts = new Float32Array(N * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const path = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfde047 })); path.frustumCulled = false;
  s.group.add(earth, mars, craft, path);
  if (env.labels) { const a = label(L('Earth'), 0.055), b = label(L('Mars'), 0.055); a.position.y = 0.1; b.position.y = 0.09; earth.add(a); mars.add(b); }
  let lead = 90, tau = 0, state = 'ready', e0 = 0, n = 0, miss = 0;
  const place = (m, r, a) => m.position.set(Math.cos(a) * r, 0, -Math.sin(a) * r);
  s.update = dt => {
    time.value += dt; s.group.updateWorldMatrix(true, false); s.group.getWorldPosition(s.sunPos.value);
    if (state === 'ready') { e0 += dt * (env.calm ? 0 : 0.15); n = 0; geo.setDrawRange(0, 0); craft.visible = false; }
    if (state === 'flying') {
      tau = Math.min(tau + dt / (env.calm ? 12 : 7), 1);
      let Ecc = Math.PI * tau; for (let i = 0; i < 6; i++) Ecc -= (Ecc - E * Math.sin(Ecc) - Math.PI * tau) / (1 - E * Math.cos(Ecc));   // Kepler's equation
      const nu = 2 * Math.atan2(Math.sqrt(1 + E) * Math.sin(Ecc / 2), Math.sqrt(1 - E) * Math.cos(Ecc / 2)), r = AT * (1 - E * Math.cos(Ecc));
      craft.visible = true; place(craft, r * AU, e0 + nu);
      if (n < N) { pts.set([craft.position.x, 0, craft.position.z], n * 3); n++; geo.setDrawRange(0, n); geo.attributes.position.needsUpdate = true; }
      if (tau >= 1) {
        miss = ((lead * DEG + W_M * TRIP - Math.PI) / DEG + 540) % 360 - 180;       // where Mars is, relative to the craft
        state = Math.abs(miss) < 5 ? 'arrived' : 'missed';
      }
    }
    const t = state === 'ready' ? 0 : tau * TRIP;
    place(earth, AU, e0 + W_E * t); place(mars, AU * AM, e0 + lead * DEG + W_M * t);
    if (s.goal) { s.goal.done = s.goal.done || state === 'arrived'; s.goal.progress = s.goal.done ? 1 : 0; }
  };
  s.status = () => {
    const days = Math.round(tau * TRIP * 365.25);
    if (state === 'ready') return L(`Mars is ${Math.round(lead)}° ahead of Earth. The trip takes 259 days, so aim for where Mars will be.`);
    if (state === 'flying') return L(`Day ${days} of 259 · coasting on a Hohmann transfer`);
    if (state === 'arrived') return L('Arrival! Mars was there to meet you. The right lead angle is about 44°.');
    const km = Math.round(Math.abs(miss) * DEG * AM * 149.6);
    return miss > 0 ? L(`Missed: Mars was ${km} million km further along. Launch when it is less far ahead.`)
      : L(`Missed: Mars was still ${km} million km behind. Launch when it is further ahead.`);
  };
  s.controls = [
    { type: 'range', label: L('Mars ahead of Earth (degrees)'), min: 0, max: 180, step: 1, get: () => lead, set: v => { lead = v; state = 'ready'; tau = 0; }, fmt: v => Math.round(v) + '°' },
    { type: 'button', label: L('Launch'), action: () => { tau = 0; n = 0; state = 'flying'; } },
  ];
  s.goal = { progress: 0, done: false };
  return s;
}

// ------------------------------------------------------------------ Lab: gravity between two cards
// With the Earth and Moon cards both on the table, the real gap between them (in cm) sets the pull.
// Scale used for the numbers: 24 cm on the table stands for the real 384,400 km.
export function gravityScene(env) {
  const s = base(env), L = env.t, CM = 0.2;                           // 1 cm = 0.2 units (the marker is 5 cm wide)
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 28), planetMaterial(earthTexture(), s.sunPos, { ambient: 0.2 }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.075, 32, 24), planetMaterial(moonTexture(), s.sunPos, { ambient: 0.2 }));
  const a1 = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.2, 0xfb7185, 0.07, 0.05);
  const a2 = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(), 0.2, 0xfb7185, 0.07, 0.05);
  const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]);
  const line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })); line.frustumCulled = false;
  s.group.add(earth, moon, a1, a2, line);
  let cm = 24, driven = false; const pe = new THREE.Vector3(), pm = new THREE.Vector3(), dir = new THREE.Vector3();
  s.update = (dt, frame) => {
    s.group.updateWorldMatrix(true, false); s.sunPos.value.copy(s.group.localToWorld(tmp.set(20, 40, 60)));
    const partner = frame.partners && (frame.partners.moon || frame.partners.earth);
    driven = !!partner;
    if (partner) { pe.set(0, 0, 0); s.group.worldToLocal(pm.copy(partner)); cm = Math.max(pm.length() / CM, 3); }
    else { const d = cm * CM * 0.3; pe.set(-d / 2, 0, 0); pm.set(d / 2, 0, 0); }
    earth.position.copy(pe); moon.position.copy(pm); earth.rotation.y += dt * 0.2;
    dir.copy(pm).sub(pe).normalize();
    const len = Math.min(Math.max(0.16 * (24 / cm) ** 2, 0.06), 0.7);
    a1.position.copy(pe).addScaledVector(dir, 0.22); a1.setDirection(dir); a1.setLength(len, 0.07, 0.05);
    a2.position.copy(pm).addScaledVector(dir, -0.1); a2.setDirection(dir.clone().negate()); a2.setLength(len, 0.07, 0.05);
    lg.attributes.position.setXYZ(0, pe.x, pe.y, pe.z); lg.attributes.position.setXYZ(1, pm.x, pm.y, pm.z); lg.attributes.position.needsUpdate = true;
    if (s.goal) { s.goal.done = s.goal.done || Math.abs(cm - 12) < 0.8; s.goal.progress = s.goal.done ? 1 : 0; }
  };
  s.status = () => {
    const k = (24 / cm) ** 2, txt = `${L('Gap')} ${cm.toFixed(1)} cm · ${L('pull')} ×${k.toFixed(k < 10 ? 2 : 0)}`;
    if (env.level === 'explorer') return `${txt} · ${L('closer means a stronger pull')}`;
    if (env.level === 'navigator') return `${txt} · ${L('half the gap gives 4 times the pull, and both pull equally')}`;
    return `r = ${Math.round(cm / 24 * 384400).toLocaleString('en-IN')} km · F = GMm/r² = ${(1.98 * k).toFixed(2)} × 10²⁰ N · ${L('equal and opposite on both bodies')}`;
  };
  s.controls = [{ type: 'range', label: L('Gap between Earth and Moon (cm)'), min: 8, max: 40, step: 0.5, get: () => Math.min(Math.max(cm, 8), 40), set: v => { if (!driven) cm = v; }, fmt: v => v.toFixed(1) }];
  s.goal = { progress: 0, done: false };
  return s;
}
