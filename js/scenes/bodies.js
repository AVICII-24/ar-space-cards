// Single-body card scenes: Earth, Moon, Sun, Mars, Jupiter, Saturn.
// Convention: +Y is "up" from the card, the scene fits in a radius of about 1 unit
// (1 unit = the printed marker's width) and is centred on its own origin.
import * as THREE from 'three';
import {
  DEG, TAU, ll, earthTexture, moonTexture, marsTexture, jupiterTexture, saturnTexture, rockTexture,
  ringTexture, ringGeometry, planetMaterial, sunMaterial, glowSprite, label, pin, circleLine, hitSphere, disposeTree,
} from '../gfx.js';

const Y = new THREE.Vector3(0, 1, 0);
const tmp = new THREE.Vector3(), tmpQ = new THREE.Quaternion();

/** Skeleton shared by every scene. */
export function base(env) {
  const s = {
    env, group: new THREE.Group(), controls: [], hud: null, goal: null,
    sunPos: { value: new THREE.Vector3(60, 20, 30) },
    status: () => '', update() {}, onTap: null,
    dispose() { disposeTree(s.group); },
  };
  return s;
}
/** Point the scene's sunlight at the Sun card if one is on the table, else at a default side. */
export function applySun(s, frame, localDir) {
  if (frame.sunWorld) s.sunPos.value.copy(frame.sunWorld);
  else { s.group.updateWorldMatrix(true, false); s.sunPos.value.copy(s.group.localToWorld(tmp.copy(localDir).multiplyScalar(80))); }
}
const SIDE_SUN = new THREE.Vector3(1, 0.25, 0.45).normalize();

export const dayOfYear = d => Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
export const istHours = d => ((d.getUTCHours() + d.getUTCMinutes() / 60 + 5.5) % 24 + 24) % 24;
export const hhmm = h => { h = ((h % 24) + 24) % 24; const m = Math.round(h * 60) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
/** Moon's age in days since new moon (mean synodic month; within about half a day of the true phase). */
export const moonAge = d => (((d.getTime() / 864e5 - 10962.76) % 29.530588853) + 29.530588853) % 29.530588853;

export const CITIES = [['Delhi', 28.61, 77.21], ['Mumbai', 19.08, 72.88], ['Kolkata', 22.57, 88.36], ['Chennai', 13.08, 80.27], ['Bengaluru', 12.97, 77.59]];

// ------------------------------------------------------------------ Earth
export function earthScene(env, { mission = false } = {}) {
  const s = base(env), R = 0.78, L = env.t;
  const tilt = new THREE.Group(); s.group.add(tilt);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), planetMaterial(earthTexture(), s.sunPos, { ambient: 0.1 }));
  tilt.add(globe);
  s.group.add(glowSprite(0x4da3ff, R * 2.75, 0.5));
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, R * 2.5, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 }));
  axis.userData.hot = 'axis'; tilt.add(axis);
  const np = pin('axis', '#ffffff', 0.09); np.position.set(0, R * 1.25, 0); tilt.add(np);
  for (const [, lat, lon] of CITIES) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd34d }));
    dot.position.copy(ll(lat, lon, R * 1.004)); globe.add(dot);
  }
  if (env.labels) { const lb = label(L('India'), 0.085); lb.position.copy(ll(31, 79, R * 1.16)); globe.add(lb); }
  globe.userData.hot = hit => {
    const p = globe.worldToLocal(hit.point.clone()).normalize();
    const lat = Math.asin(p.y) / DEG, lon = Math.atan2(-p.z, p.x) / DEG;
    if (lat > 5 && lat < 38 && lon > 66 && lon < 99) return 'india';
    return s.litAt(hit.point) ? null : 'night';
  };

  // Today's real tilt direction: the axis leans towards the Sun in June, away in December.
  const eps = 23.44 * DEG, psi = TAU * (dayOfYear(new Date()) - 172) / 365.25;
  const e1 = new THREE.Vector3(SIDE_SUN.x, 0, SIDE_SUN.z).normalize(), e3 = new THREE.Vector3().crossVectors(e1, Y);
  const axisDir = new THREE.Vector3().addScaledVector(Y, Math.cos(eps)).addScaledVector(e1, Math.sin(eps) * Math.cos(psi)).addScaledVector(e3, Math.sin(eps) * Math.sin(psi));
  tilt.quaternion.setFromUnitVectors(Y, axisDir);

  let ist = istHours(new Date()), auto = !mission && !env.calm, isDay = true, flips = 0, first = true;
  const centre = new THREE.Vector3(), sunDir = new THREE.Vector3(), delhi = new THREE.Vector3();
  s.litAt = p => tmp.copy(p).sub(centre).normalize().dot(sunDir) > 0;
  s.update = (dt, frame) => {
    applySun(s, frame, SIDE_SUN);
    if (auto) ist = (ist + dt * 24 / 70) % 24;
    tilt.updateWorldMatrix(true, false);
    tilt.getWorldPosition(centre);
    sunDir.copy(s.sunPos.value).sub(centre).normalize();
    const sT = tmp.copy(sunDir).applyQuaternion(tilt.getWorldQuaternion(tmpQ).invert());
    const lon0 = Math.atan2(-sT.z, sT.x), target = (82.5 - 15 * (ist - 12)) * DEG;   // sub-solar longitude for this IST
    globe.rotation.y = lon0 - target;
    globe.updateWorldMatrix(false, false);
    delhi.copy(ll(28.61, 77.21, R)); globe.localToWorld(delhi);
    const day = s.litAt(delhi);
    if (!first && day !== isDay) flips++;
    isDay = day; first = false;
    if (s.goal) { s.goal.progress = Math.min(flips / 2, 1); s.goal.done = flips >= 2; }
  };
  s.status = () => `${L('India')} ${hhmm(ist)} · ${isDay ? L('Day ☀️') : L('Night 🌙')}` +
    (env.level !== 'explorer' ? ` · ${L('Earth turns 15° each hour')}` : '');
  s.controls = [
    { type: 'range', label: L('Clock in India'), min: 0, max: 24, step: 0.25, get: () => ist, set: v => { ist = v % 24; auto = false; }, fmt: hhmm },
    ...(mission ? [] : [{ type: 'toggle', label: L('Spin'), get: () => auto, set: v => { auto = v; } }]),
  ];
  if (mission) s.goal = { progress: 0, done: false };
  return s;
}

// ------------------------------------------------------------------ Moon
export const PHASES = [
  ['New moon'], ['Waxing crescent'], ['First quarter'], ['Waxing gibbous'],
  ['Full moon'], ['Waning gibbous'], ['Last quarter'], ['Waning crescent'],
];
export function phaseName(age, L) {
  const f = age / 29.530588853;
  const i = f < 0.03 || f > 0.97 ? 0 : f < 0.22 ? 1 : f < 0.28 ? 2 : f < 0.47 ? 3 : f < 0.53 ? 4 : f < 0.72 ? 5 : f < 0.78 ? 6 : 7;
  return L(...PHASES[i]);
}
export function moonScene(env) {
  const s = base(env), R = 0.72, L = env.t;
  const moon = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), planetMaterial(moonTexture(), s.sunPos, { ambient: 0.07 }));
  moon.rotation.y = -Math.PI / 2;                      // near side faces the reader
  s.group.add(moon);
  const add = (id, lat, lon, col) => { const p = pin(id, col); p.position.copy(ll(lat, lon, R * 1.03)); moon.add(p); };
  add('maria', 30, -14, '#93c5fd'); add('tycho', -43, -11, '#ffd34d'); add('southpole', -69.4, 32.3, '#ff9933');
  if (env.labels) { const lb = label(L('Chandrayaan-3'), 0.075); lb.position.copy(ll(-69.4, 32.3, R * 1.2)); moon.add(lb); }
  let age = moonAge(new Date()), t = 0;
  const dir = new THREE.Vector3();
  s.update = (dt, frame) => {
    t += dt;
    const th = age / 29.530588853 * TAU;             // elongation: 0 = new, pi = full
    applySun(s, frame, dir.set(Math.sin(th), 0.05, -Math.cos(th)).normalize());
    if (!env.calm) moon.rotation.y = -Math.PI / 2 + Math.sin(t * 0.25) * 0.09;   // gentle libration
  };
  s.status = () => `${phaseName(age, L)} · ${Math.round((1 - Math.cos(age / 29.530588853 * TAU)) / 2 * 100)}% ${L('lit')} · ${L('day')} ${age.toFixed(1)}`;
  s.controls = [
    { type: 'range', label: L('Day of the Moon month'), min: 0, max: 29.5, step: 0.25, get: () => age, set: v => { age = v; }, fmt: v => v.toFixed(1) },
    { type: 'button', label: L('Today'), action: () => { age = moonAge(new Date()); } },
  ];
  return s;
}

// ------------------------------------------------------------------ Sun
export function sunScene(env) {
  const s = base(env), R = 0.66, L = env.t, time = { value: 0 };
  const whole = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), sunMaterial(time));
  const cut = new THREE.Group(); cut.visible = false;
  cut.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40, Math.PI, Math.PI * 1.5), sunMaterial(time)));
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d'), g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  [[0, '#ffffff'], [0.22, '#fff3b0'], [0.27, '#ffd24a'], [0.68, '#ff9a1f'], [0.72, '#f0641a'], [0.97, '#d9480f'], [1, '#ffb347']].forEach(([p, col]) => g.addColorStop(p, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  const capTex = new THREE.CanvasTexture(c); capTex.colorSpace = THREE.SRGBColorSpace;
  const capMat = new THREE.MeshBasicMaterial({ map: capTex, side: THREE.DoubleSide });
  const cap1 = new THREE.Mesh(new THREE.CircleGeometry(R * 0.995, 48, -Math.PI / 2, Math.PI), capMat);
  const cap2 = cap1.clone(); cap2.rotation.y = -Math.PI / 2;
  const corePin = pin('core', '#ffffff'); corePin.position.set(0.09, 0, 0.09);
  cut.add(cap1, cap2, corePin);
  if (env.labels) {
    for (const [txt, r] of [[L('Core'), 0.12], [L('Radiative zone'), 0.47], [L('Convective zone'), 0.85]]) {
      const lb = label(txt, 0.06); lb.position.set(R * r * 0.72, R * r * 0.6 + 0.03, 0.02); cut.add(lb);
    }
  }
  s.group.add(whole, cut, glowSprite(0xffb347, R * 4.2, 0.75));
  // prominence loop, sunspot marker, Earth to scale
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 8, 32, Math.PI), new THREE.MeshBasicMaterial({ color: 0xff7a3d }));
  loop.position.copy(ll(28, 150, R * 0.99)); loop.lookAt(0, 0, 0); loop.rotateX(Math.PI / 2); loop.rotateZ(Math.PI / 2);
  const fl = pin('flare', '#ff7a3d'); fl.position.copy(ll(28, 150, R * 1.3));
  const sp = pin('sunspot', '#7c2d12'); sp.position.copy(ll(-12, 205, R * 1.03));
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R / 109, 12, 8), new THREE.MeshBasicMaterial({ color: 0x4da3ff }));
  earth.position.set(-R * 1.32, -R * 0.55, 0.2);
  const ep = pin('earthsize', '#4da3ff'); ep.position.copy(earth.position).add(new THREE.Vector3(0, 0.1, 0));
  s.group.add(loop, fl, sp, earth, ep);
  if (env.labels) { const lb = label(L('Earth, to scale'), 0.06); lb.position.copy(earth.position).add(new THREE.Vector3(0, -0.09, 0)); s.group.add(lb); }
  let open = false;
  s.update = dt => { time.value += env.calm ? dt * 0.3 : dt; };
  s.status = () => open ? L('Energy is made in the core and slowly works its way out.')
    : L('109 Earths would fit across the Sun.');
  s.controls = [{ type: 'toggle', label: L('Look inside'), get: () => open, set: v => { open = v; cut.visible = v; whole.visible = !v; } }];
  return s;
}

// ------------------------------------------------------------------ Mars
export function marsScene(env) {
  const s = base(env), R = 0.62, L = env.t;
  const tilt = new THREE.Group(); tilt.rotation.z = 25.2 * DEG; s.group.add(tilt);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), planetMaterial(marsTexture(), s.sunPos));
  tilt.add(mars);
  s.group.add(glowSprite(0xff8a5c, R * 2.6, 0.28));
  const add = (id, lat, lon, col) => { const p = pin(id, col); p.position.copy(ll(lat, lon, R * 1.04)); mars.add(p); };
  add('olympus', 18.6, -133.8, '#ffd34d'); add('valles', -11, -68, '#fb923c'); add('icecap', 86, 0, '#ffffff');
  const rock = rockTexture('rock', 91, 0x5c5048, 0x9a8c80);
  const moons = [[0.9, 3.2, 0.03, 0], [1.12, 0.8, 0.022, 2]].map(([r, speed, size, ph]) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), planetMaterial(rock, s.sunPos)); m.scale.set(1.3, 0.9, 1);
    m.add(hitSphere(0.09, 'moons')); tilt.add(m, circleLine(r, 0xffffff, 0.16));
    return { m, r, speed, ph };
  });
  // Mangalyaan: a little orbiter on a tilted, stretched orbit
  const craft = new THREE.Group(), gold = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.6, roughness: 0.4 });
  craft.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), gold));
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.004, 0.045), new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.3, roughness: 0.5 }));
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.02, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xe5e7eb, side: THREE.DoubleSide }));
  dish.position.y = 0.036; craft.add(panel, dish, hitSphere(0.1, 'mangalyaan'));
  const orbit = new THREE.Group(); orbit.rotation.set(0.5, 0, 0.9); orbit.add(craft); s.group.add(orbit);
  if (env.labels) { const lb = label(L('Mangalyaan'), 0.065); lb.position.y = 0.09; craft.add(lb); }
  let t = 0;
  s.update = (dt, frame) => {
    applySun(s, frame, SIDE_SUN);
    t += env.calm ? dt * 0.25 : dt;
    mars.rotation.y = t * 0.12;
    for (const o of moons) o.m.position.set(Math.cos(t * o.speed * 0.2 + o.ph) * o.r, 0, -Math.sin(t * o.speed * 0.2 + o.ph) * o.r);
    const a = t * 0.3; craft.position.set(Math.cos(a) * 1.15 - 0.3, 0, Math.sin(a) * 0.82); craft.rotation.y = -a;
  };
  s.status = () => L('A day on Mars: 24 h 37 min · A year: 687 Earth days');
  return s;
}

// ------------------------------------------------------------------ Jupiter
export function jupiterScene(env) {
  const s = base(env), R = 0.5, L = env.t;
  const jup = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), planetMaterial(jupiterTexture(), s.sunPos));
  jup.scale.y = 0.935; s.group.add(jup);
  const rs = pin('redspot', '#f87171'); rs.position.copy(ll(-22, 0, R * 1.04)); jup.add(rs);
  const defs = [['io', 0.72, 1.769, 0.03, 0xe8d36a, L('Io')], ['europa', 0.86, 3.551, 0.026, 0xd9d2c0, L('Europa')],
    ['ganymede', 1.02, 7.155, 0.042, 0xa89f94, L('Ganymede')], ['callisto', 1.2, 16.689, 0.038, 0x6f665e, L('Callisto')]];
  const plane = new THREE.Group(); plane.rotation.x = 0.06; s.group.add(plane);
  const moons = defs.map(([id, r, period, size, color, name], i) => {
    const tex = rockTexture('m' + id, 100 + i, new THREE.Color(color).multiplyScalar(0.7).getHex(), color);
    const m = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 12), planetMaterial(tex, s.sunPos, { ambient: 0.15 }));
    m.add(hitSphere(0.085, id));
    if (env.labels) { const lb = label(name, 0.06); lb.position.y = size + 0.06; m.add(lb); }
    plane.add(m, circleLine(r, 0xffffff, 0.2));
    return { m, r, period, ph: i * 1.7 };
  });
  let t = 0, days = 0;
  s.update = (dt, frame) => {
    applySun(s, frame, SIDE_SUN);
    t += dt; days += dt * (env.calm ? 0.1 : 0.3);                 // one Io orbit takes about 6 s
    jup.rotation.y = t * (env.calm ? 0.1 : 0.4);
    for (const o of moons) { const a = days / o.period * TAU + o.ph; o.m.position.set(Math.cos(a) * o.r, 0, -Math.sin(a) * o.r); }
  };
  s.status = () => env.level === 'scientist'
    ? L(`Day ${days.toFixed(1)} · Io ${(days / 1.769).toFixed(1)} orbits · Europa ${(days / 3.551).toFixed(1)} · Ganymede ${(days / 7.155).toFixed(1)}`)
    : L('Four big moons, found by Galileo in 1610');
  return s;
}

// ------------------------------------------------------------------ Saturn
export function saturnScene(env) {
  const s = base(env), R = 0.44, L = env.t;
  const tilt = new THREE.Group(); tilt.rotation.set(0.12, 0, 26.7 * DEG); s.group.add(tilt);
  const sat = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 40), planetMaterial(saturnTexture(), s.sunPos));
  sat.scale.y = 0.9; tilt.add(sat);
  const inner = R * 1.24, outer = R * 2.27;
  const ring = new THREE.Mesh(ringGeometry(inner, outer), new THREE.MeshBasicMaterial({ map: ringTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.userData.hot = 'rings'; tilt.add(ring);
  const rp = pin('rings', '#fde68a'); rp.position.set(0, 0.03, inner + (outer - inner) * 0.38); tilt.add(rp);
  const cp = pin('cassini', '#94a3b8'); cp.position.set(inner + (outer - inner) * 0.59, 0.03, 0); tilt.add(cp);
  const titan = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), planetMaterial(rockTexture('titan', 140, 0xb8862e, 0xe0a94a), s.sunPos, { ambient: 0.15 }));
  titan.add(hitSphere(0.09, 'titan'));
  if (env.labels) { const lb = label(L('Titan'), 0.06); lb.position.y = 0.1; titan.add(lb); }
  tilt.add(titan);
  let t = 0;
  s.update = (dt, frame) => {
    applySun(s, frame, SIDE_SUN);
    t += env.calm ? dt * 0.25 : dt;
    sat.rotation.y = t * 0.35; ring.rotation.z = t * 0.05;
    titan.position.set(Math.cos(t * 0.22) * 1.22, 0, -Math.sin(t * 0.22) * 1.22);
  };
  s.status = () => L('The rings are 280,000 km wide but mostly about 10 m thick');
  return s;
}
