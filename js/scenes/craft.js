// Spacecraft cards: the Space Station, the LVM3 rocket and Chandrayaan-3.
// Models are built from simple shapes so they stay light on old tablets.
import * as THREE from 'three';
import { DEG, TAU, mulberry, fbm, earthTexture, planetMaterial, glowSprite, label, pin } from '../gfx.js';
import { base, applySun } from './bodies.js';

const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.55, ...o });
const tag = (o, id) => { o.traverse(x => { if (x.isMesh) x.userData.hot = id; }); return o; };
const tmp = new THREE.Vector3();
const put = (o, x, y, z) => { o.position.set(x, y, z); return o; };

// ------------------------------------------------------------------ Space Station
export function issScene(env) {
  const s = base(env), L = env.t, st = new THREE.Group();
  const grey = std(0xcbd5e1), white = std(0xf8fafc, { metalness: 0.1 }), blue = std(0x1d3fa0, { emissive: 0x0b1a44, metalness: 0.5 }), gold = std(0xc99a2e, { metalness: 0.7 });
  st.add(new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.05, 0.05), grey));
  const arrays = new THREE.Group();
  for (const x of [-0.72, -0.55, 0.55, 0.72]) for (const z of [-0.29, 0.29]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.008, 0.44), blue); p.position.set(x, 0, z);
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.44), gold); rib.position.set(x, 0.006, z);
    arrays.add(p, rib);
  }
  const rads = new THREE.Group();
  for (const x of [-0.24, 0.24]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.3, 0.008), white); r.position.set(x, -0.18, -0.05); rads.add(r); }
  const mods = new THREE.Group(), cyl = (r, len, x, y, z, axis) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), white);
    axis === 'z' ? m.rotation.x = Math.PI / 2 : axis === 'x' ? m.rotation.z = Math.PI / 2 : 0; m.position.set(x, y, z); mods.add(m);
  };
  cyl(0.058, 0.78, 0, -0.01, 0.16, 'z'); cyl(0.05, 0.42, 0, -0.01, 0.42, 'x'); cyl(0.045, 0.3, 0, -0.01, -0.12, 'x'); cyl(0.04, 0.2, 0, -0.13, 0.5, 'y');
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), grey); node.position.set(0, -0.01, 0.42); mods.add(node);
  st.add(tag(arrays, 'solar'), tag(rads, 'radiators'), tag(mods, 'modules'));
  const add = (id, x, y, z, col) => { const p = pin(id, col); p.position.set(x, y, z); st.add(p); };
  add('solar', 0.64, 0.09, 0.3, '#60a5fa'); add('modules', 0, 0.12, 0.3, '#ffffff'); add('radiators', -0.24, -0.2, 0.02, '#fde68a');
  st.rotation.set(0.5, 0, 0.12); s.group.add(st);
  // Earth's curved edge far below, to show how close the station flies
  const capGeo = new THREE.SphereGeometry(3.2, 64, 32, 0, TAU, 0, 0.42), cp = capGeo.attributes.position, cuv = capGeo.attributes.uv;
  for (let i = 0; i < cp.count; i++)                                 // paint the cap with the map around India rather than the North Pole
    cuv.setXY(i, (258 + cp.getX(i) / 3.2 / DEG / Math.cos(22 * DEG)) / 360, 0.5 + (22 - cp.getZ(i) / 3.2 / DEG) / 180);
  const earth = new THREE.Mesh(capGeo, planetMaterial(earthTexture(), s.sunPos, { ambient: 0.25 }));
  earth.position.y = -4.05; s.group.add(earth);
  let t = 0;
  s.update = (dt, frame) => {
    applySun(s, frame, tmp.set(0.5, 0.8, 0.6).normalize());
    t += env.calm ? dt * 0.2 : dt; st.rotation.y = t * 0.15;
  };
  s.status = () => L('400 km up · 27,600 km/h · once around the Earth every 92 minutes');
  return s;
}

// ------------------------------------------------------------------ LVM3 rocket
// Flight events (seconds after lift-off) follow the published Chandrayaan-3 launch sequence, rounded.
const EVENTS = [
  [0, ['Lift-off: both S200 boosters fire'], 0],
  [108, ['L110 core engines start'], 44],
  [127, ['Boosters burn out and separate'], 62],
  [195, ['Above the air: the nose fairing opens'], 115],
  [306, ['Core stage separates, cryogenic stage starts'], 175],
  [954, ['Engine off: the spacecraft is in orbit'], 179],
  [970, ['Chandrayaan-3 flies free'], 180],
];
export function rocketScene(env) {
  const s = base(env), L = env.t, K = 1.6 / 43.5, rocket = new THREE.Group();
  const white = std(0xf1f5f9), dark = std(0x475569), orange = std(0xe2792b);
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const flame = (r, len) => { const f = new THREE.Mesh(new THREE.ConeGeometry(r, len, 12, 1, true), flameMat); f.rotation.x = Math.PI; f.position.y = -len / 2; f.raycast = () => {}; return f; };
  const y0 = -0.8;
  // core stage (L110)
  const core = new THREE.Group(), coreH = 21 * K;
  core.add(new THREE.Mesh(new THREE.CylinderGeometry(2 * K, 2 * K, coreH, 20), white), put(new THREE.Mesh(new THREE.CylinderGeometry(2.02 * K, 2.02 * K, 0.03, 20), orange), 0, coreH * 0.3, 0));
  const coreNoz = new THREE.Mesh(new THREE.ConeGeometry(1.3 * K, 0.07, 12), dark); coreNoz.position.y = -coreH / 2 - 0.02;
  const coreFlame = flame(1.4 * K, 0.34); coreFlame.position.y = -coreH / 2 - 0.2; core.add(coreNoz, coreFlame);
  core.position.y = y0 + coreH / 2 + 0.05; tag(core, 'core');
  // boosters (S200)
  const boosters = [-1, 1].map(side => {
    const b = new THREE.Group(), h = 25 * K;
    b.add(new THREE.Mesh(new THREE.CylinderGeometry(1.6 * K, 1.6 * K, h, 16), white));
    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.6 * K, 0.11, 16), orange); nose.position.y = h / 2 + 0.055;
    const noz = new THREE.Mesh(new THREE.ConeGeometry(1.5 * K, 0.08, 12), dark); noz.position.y = -h / 2 - 0.02;
    const fl = flame(1.7 * K, 0.5); fl.position.y = -h / 2 - 0.28; b.add(nose, noz, fl);
    b.position.set(side * 3.75 * K, y0 + h / 2 + 0.05, 0); b.userData = { side, fl, home: b.position.clone() };
    tag(b, 'boosters'); return b;
  });
  // cryogenic upper stage (C25) and the spacecraft it carries
  const upper = new THREE.Group(), upH = 13.5 * K;
  upper.add(new THREE.Mesh(new THREE.CylinderGeometry(2 * K, 2 * K, upH, 20), std(0xe2e8f0)), put(new THREE.Mesh(new THREE.CylinderGeometry(2.03 * K, 2.03 * K, 0.05, 20), dark), 0, -upH / 2 + 0.03, 0));
  const upFlame = flame(1.1 * K, 0.26); upFlame.material = new THREE.MeshBasicMaterial({ color: 0x9bd5ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
  upFlame.position.y = -upH / 2 - 0.15; upper.add(upFlame);
  upper.position.y = core.position.y + coreH / 2 + upH / 2; tag(upper, 'cryo');
  const sat = new THREE.Group();
  sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.09), std(0xd4a017, { metalness: 0.7 })), put(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.006), std(0x1d3fa0)), 0, 0, 0.05));
  sat.position.y = upper.position.y + upH / 2 + 0.07;
  // fairing: two half shells
  const prof = [[0, 0.33], [0.045, 0.3], [0.08, 0.24], [0.092, 0.17], [0.092, 0], [0.074, -0.03]].map(([x, y]) => new THREE.Vector2(x, y));
  const halves = [0, 1].map(i => {
    const h = new THREE.Mesh(new THREE.LatheGeometry(prof, 16, i * Math.PI, Math.PI), std(0xf8fafc, { side: THREE.DoubleSide }));
    h.position.y = upper.position.y + upH / 2; h.userData = { hot: 'fairing', dir: i ? -1 : 1, home: h.position.clone() }; return h;
  });
  rocket.add(core, ...boosters, upper, sat, ...halves);
  const add = (id, x, y, col) => { const p = pin(id, col); p.position.set(x, y, 0.12); rocket.add(p); return p; };
  const pins = { boosters: add('boosters', -0.24, y0 + 0.5, '#fb923c'), core: add('core', 0.13, y0 + 0.3, '#ffffff'), cryo: add('cryo', 0.13, upper.position.y, '#93c5fd'), fairing: add('fairing', 0.14, upper.position.y + upH / 2 + 0.2, '#fde68a') };
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.05, 32), std(0x64748b)); pad.position.y = y0;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), std(0x94a3b8)); tower.position.set(-0.36, y0 + 0.6, -0.1);
  const ground = new THREE.Group(); ground.add(pad, tower);
  s.group.add(rocket, ground);

  let T = 0, playing = false, flick = 0;
  const lerp = (a, b, k) => a + (b - a) * Math.min(Math.max(k, 0), 1), sq = k => Math.max(k, 0) ** 2;
  s.update = dt => {
    if (playing) { T += dt * (T < 320 ? 16 : 60) * (env.calm ? 0.6 : 1); if (T >= 980) { T = 980; playing = false; } }
    flick += dt * 30; const f = env.calm ? 1 : 0.9 + 0.2 * Math.sin(flick);
    ground.position.y = -Math.min(T, 40) / 40 * 2.2; ground.visible = T < 40;
    for (const b of boosters) {
      const k = (T - 127) / 40, { side, fl, home } = b.userData;
      b.position.set(home.x + side * lerp(0, 0.5, k), home.y - lerp(0, 1.6, sq(k)), 0); b.rotation.z = -side * lerp(0, 0.7, k);
      b.visible = T < 170; fl.visible = T > 0 && T < 127; fl.scale.set(1, f, 1);
    }
    pins.boosters.visible = T < 127;
    const kc = (T - 306) / 60; core.position.y = y0 + 21 * K / 2 + 0.05 - lerp(0, 1.8, sq(kc)); core.visible = T < 370;
    coreFlame.visible = T >= 108 && T < 306; coreFlame.scale.set(1, f, 1); pins.core.visible = T < 306;
    for (const h of halves) { const k = (T - 195) / 40, { dir, home } = h.userData; h.position.set(dir * lerp(0, 0.6, k), home.y - lerp(0, 1.2, sq(k)), 0); h.rotation.z = -dir * lerp(0, 1.1, k); h.visible = T < 240; }
    pins.fairing.visible = T < 195;
    upFlame.visible = T >= 306 && T < 954; upFlame.scale.set(1, f, 1);
    const ks = (T - 954) / 26; sat.position.y = upper.position.y + 13.5 * K / 2 + 0.07 + lerp(0, 0.32, ks);
    rocket.position.y = lerp(0, -0.35, (T - 306) / 80);                // keep the upper stage centred once the core has gone
    rocket.rotation.z = -lerp(0, 0.5, (T - 60) / 400);                 // gravity turn
  };
  const at = () => { let e = EVENTS[0]; for (const x of EVENTS) if (T >= x[0]) e = x; return e; };
  s.status = () => {
    if (T <= 0) return L('On the launch pad at Sriharikota. Slide the timeline or press Launch.');
    let h = 0; for (let i = 1; i < EVENTS.length; i++) if (T <= EVENTS[i][0] || i === EVENTS.length - 1) { h = lerp(EVENTS[i - 1][2], EVENTS[i][2], (T - EVENTS[i - 1][0]) / (EVENTS[i][0] - EVENTS[i - 1][0])); break; }
    return `T+${Math.round(T)} s · ${L(...at()[1])} · ${L('height')} ${Math.round(h)} km`;
  };
  s.controls = [
    { type: 'range', label: L('Flight timeline (seconds)'), min: 0, max: 980, step: 1, get: () => T, set: v => { T = v; playing = false; }, fmt: v => 'T+' + Math.round(v) },
    { type: 'button', label: L('Launch'), action: () => { if (T >= 980) T = 0; playing = true; } },
  ];
  return s;
}

// ------------------------------------------------------------------ Chandrayaan-3
export function chandrayaanScene(env) {
  const s = base(env), L = env.t, GY = -0.55;
  // cratered ground
  const n = fbm(17, 4, 8), rnd = mulberry(23);
  const craters = Array.from({ length: 12 }, () => { const a = rnd() * TAU, r = 0.35 + rnd() * 0.7; return [Math.cos(a) * r, Math.sin(a) * r, 0.05 + rnd() * 0.09]; });
  const fine = new THREE.PlaneGeometry(2.3, 2.3, 70, 70).rotateX(-Math.PI / 2), fp = fine.attributes.position;
  const height = (x, z) => {
    let h = (n((x + 2) / 4, (z + 2) / 4) - 0.5) * 0.09;
    for (const [cx, cz, cr] of craters) { const d = Math.hypot(x - cx, z - cz) / cr; if (d < 1.3) h += d < 1 ? -0.035 * (1 - d * d) : 0.012 * (1.3 - d) / 0.3; }
    return h * Math.min(Math.hypot(x, z) / 0.3, 1);                    // flat where the lander stands
  };
  for (let i = 0; i < fp.count; i++) fp.setY(i, height(fp.getX(i), fp.getZ(i)));
  fine.computeVertexNormals();
  const ground = new THREE.Mesh(fine, new THREE.MeshStandardMaterial({ color: 0x9a9a9e, roughness: 1, metalness: 0, flatShading: true }));
  ground.position.y = GY; ground.userData.ground = true; s.group.add(ground);

  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a520, metalness: 0.75, roughness: 0.35 }), panel = new THREE.MeshStandardMaterial({ color: 0x1b2f7a, metalness: 0.5, roughness: 0.4 }), metal = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.6, roughness: 0.4 });
  // Vikram lander
  const lander = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.17, 0.26), gold); body.position.y = 0.2; lander.add(body);
  for (const [x, z] of [[0.131, 0], [-0.131, 0], [0, -0.131]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(x ? 0.004 : 0.2, 0.14, z ? 0.004 : 0.2), panel); p.position.set(x, 0.2, z); lander.add(p); }
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.24, 6), metal); leg.position.set(x * 0.17, 0.09, z * 0.17); leg.rotation.set(-z * 0.5, 0, x * 0.5);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.01, 12), metal); foot.position.set(x * 0.22, 0.005, z * 0.22); lander.add(leg, foot);
  }
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8, 0, TAU, 0, 1), metal); dish.rotation.x = Math.PI; dish.position.set(-0.05, 0.36, 0.03); lander.add(dish);
  tag(lander, 'lander');
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.006, 0.12), metal); ramp.position.set(0.27, 0.075, 0.02); ramp.rotation.z = -0.48; ramp.userData.hot = 'ramp'; lander.add(ramp);
  lander.position.y = GY; s.group.add(lander);
  // Pragyan rover
  const rover = new THREE.Group(), wheels = [];
  const rb = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.085), gold); rb.position.y = 0.05;
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.004, 0.09), panel); top.position.set(-0.01, 0.1, 0); top.rotation.z = 0.5;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.07, 6), metal); mast.position.set(0.05, 0.1, 0);
  rover.add(rb, top, mast);
  for (const x of [-0.05, 0, 0.05]) for (const z of [-0.052, 0.052]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.014, 12).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })); w.position.set(x, 0.02, z); wheels.push(w); rover.add(w); }
  tag(rover, 'rover'); rover.position.set(0.5, GY, 0.05); s.group.add(rover);
  const add = (id, x, y, z, col) => { const p = pin(id, col); p.position.set(x, y, z); s.group.add(p); return p; };
  add('lander', 0, GY + 0.5, 0, '#fde68a'); add('ramp', 0.3, GY + 0.2, 0.1, '#ffffff'); const rp = add('rover', 0.5, GY + 0.2, 0.05, '#93c5fd');
  // Earth hanging in the black sky
  const earth = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 20), planetMaterial(earthTexture(), s.sunPos, { ambient: 0.12 }));
  earth.position.set(-0.55, 0.62, -0.75); earth.userData.hot = 'earth'; s.group.add(earth);
  const eg = glowSprite(0x4da3ff, 0.4, 0.4); eg.position.copy(earth.position); s.group.add(eg);
  if (env.labels) { const a = label(L('Vikram'), 0.065); a.position.set(0, GY + 0.62, 0); const b = label(L('Pragyan'), 0.06); b.position.set(0, 0.2, 0); s.group.add(a); rover.add(b); }
  // tracks
  const N = 600, tp = new Float32Array(N * 3), tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  const tracks = new THREE.Points(tg, new THREE.PointsMaterial({ color: 0x3f3f46, size: 0.012 })); tracks.frustumCulled = false; tracks.raycast = () => {}; s.group.add(tracks);
  let target = null, driven = 0, nt = 0, lastMark = 0;
  s.onTap = hits => {
    const h = hits.find(x => x.object.userData.ground); if (!h) return false;
    const p = s.group.worldToLocal(h.point.clone());
    if (Math.hypot(p.x, p.z) < 0.36) return false;                     // not under the lander
    target = new THREE.Vector3(p.x, 0, p.z); return true;
  };
  s.update = (dt, frame) => {
    applySun(s, frame, tmp.set(0.8, 0.28, 0.5).normalize());
    earth.rotation.y += dt * 0.05;
    if (target) {
      const dx = target.x - rover.position.x, dz = target.z - rover.position.z, d = Math.hypot(dx, dz);
      if (d < 0.02) target = null;
      else {
        const want = Math.atan2(-dz, dx); let da = want - rover.rotation.y; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        rover.rotation.y += da * Math.min(dt * 4, 1);
        if (Math.abs(da) < 0.5) {
          const stepLen = Math.min((env.calm ? 0.08 : 0.14) * dt, d); rover.position.x += dx / d * stepLen; rover.position.z += dz / d * stepLen; driven += stepLen;
          for (const w of wheels) w.rotation.z -= stepLen / 0.02;
          if (driven - lastMark > 0.02 && nt < N) { tp.set([rover.position.x, rover.position.y + 0.004, rover.position.z], nt * 3); nt++; lastMark = driven; tg.setDrawRange(0, nt); tg.attributes.position.needsUpdate = true; }
        }
      }
    }
    rover.position.y = GY + height(rover.position.x, rover.position.z);
    rp.position.set(rover.position.x, rover.position.y + 0.2, rover.position.z);
  };
  tg.setDrawRange(0, 0);
  s.status = () => driven < 0.01 ? L('Tap the ground to drive Pragyan')
    : L(`Pragyan has driven ${(driven * 8).toFixed(1)} m. On the Moon that takes ${Math.round(driven * 8 * 100 / 60)} minutes at 1 cm each second.`);
  return s;
}
