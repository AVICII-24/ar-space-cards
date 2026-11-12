// Shared graphics helpers. Every texture is painted procedurally at start-up,
// so the app ships no image assets, has no licensing questions and works offline.
import * as THREE from 'three';

export const DEG = Math.PI / 180;
export const TAU = Math.PI * 2;

export function mulberry(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Longitude/latitude (degrees) to a point on a three.js sphere of radius r. */
export function ll(lat, lon, r = 1) {
  const a = lat * DEG, o = lon * DEG;
  return new THREE.Vector3(r * Math.cos(a) * Math.cos(o), r * Math.sin(a), -r * Math.cos(a) * Math.sin(o));
}

// ---------- noise ----------
function grid(seed, gx, gy) {
  const r = mulberry(seed), g = new Float32Array(gx * gy);
  for (let i = 0; i < g.length; i++) g[i] = r();
  return (u, v) => {
    const x = u * gx, y = v * gy, x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const at = (i, j) => g[(Math.min(Math.max(j, 0), gy - 1)) * gx + ((i % gx) + gx) % gx];
    const a = at(x0, y0), b = at(x0 + 1, y0), c = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
/** Fractal noise, seamless around the sphere (wraps in u). Returns 0..1. */
export function fbm(seed, octaves = 4, base = 8) {
  const layers = [];
  for (let o = 0; o < octaves; o++) layers.push(grid(seed + o * 101, base << o, (base << o) >> 1));
  return (u, v) => {
    let s = 0, a = 0.5, n = 0;
    for (const l of layers) { s += l(u, v) * a; n += a; a *= 0.5; }
    return s / n;
  };
}

// ---------- textures ----------
const cache = new Map();
function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}
function toTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function paint(w, h, fn) {
  const [c, ctx] = canvas(w, h), img = ctx.createImageData(w, h), d = img.data;
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
    const rgb = fn(x / w, y / h);
    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return [c, ctx];
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
function ramp(stops, t) {
  t = Math.min(Math.max(t, 0), 1);
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
    const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
    return mix(c0, c1, (t - t0) / (t1 - t0 || 1));
  }
  return stops[stops.length - 1][1];
}

let LAND = null;
/** Land outlines (Natural Earth, public domain). Loaded once at start-up. */
export async function loadLand(url = './assets/land.json') {
  try { LAND = await (await fetch(url)).json(); } catch { LAND = []; }
}

export function earthTexture() {
  return cached('earth', () => {
    const W = 1024, H = 512, [c, ctx] = canvas(W, H);
    const sea = ctx.createLinearGradient(0, 0, 0, H);
    sea.addColorStop(0, '#12508f'); sea.addColorStop(0.5, '#1668c4'); sea.addColorStop(1, '#12508f');
    ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);
    const land = ctx.createLinearGradient(0, 0, 0, H);
    [[0, '#f4f7fa'], [0.1, '#e6ece8'], [0.17, '#8aa57c'], [0.27, '#5f9a56'], [0.36, '#cdb97c'], [0.42, '#a9b06a'],
     [0.5, '#3f9350'], [0.58, '#7fa85c'], [0.65, '#c9ad70'], [0.74, '#69a25c'], [0.85, '#eef2f5'], [1, '#ffffff']]
      .forEach(([t, col]) => land.addColorStop(t, col));
    ctx.fillStyle = land;
    for (const ring of LAND || []) {
      // Unwrap rings that cross the 180° meridian so they do not smear across the map,
      // and close the one ring that circles the South Pole (Antarctica) down at the pole.
      const pts = []; let prev = ring[0] / 10, lon = prev;
      for (let i = 0; i < ring.length; i += 2) {
        let d = ring[i] / 10 - prev; if (d > 180) d -= 360; else if (d < -180) d += 360;
        lon += d; prev = ring[i] / 10; pts.push([lon, ring[i + 1] / 10]);
      }
      const span = pts[pts.length - 1][0] - pts[0][0];
      if (Math.abs(span) > 180) { const pole = pts[0][1] < 0 ? -90 : 90; pts.push([pts[pts.length - 1][0], pole], [pts[0][0], pole]); }
      for (const shift of [-360, 0, 360]) {
        ctx.beginPath();
        pts.forEach(([o, a], i) => { const x = (o + shift + 180) / 360 * W, y = (90 - a) / 180 * H; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.closePath(); ctx.fill();
      }
    }
    return toTexture(c);
  });
}

const MARIA = [ // lat, lon, radius (deg), strength
  [33, -16, 19, 0.9], [28, 17, 11, 0.85], [9, 31, 13, 0.85], [17, 59, 8, 0.9], [-8, 51, 9, 0.7], [-15, 35, 6, 0.7],
  [18, -57, 24, 0.75], [-2, -45, 16, 0.6], [-21, -17, 11, 0.7], [-24, -39, 7, 0.75], [56, 0, 9, 0.45], [56, -25, 9, 0.4], [50, 25, 8, 0.4],
];
export function moonTexture() {
  return cached('moon', () => {
    const W = 1024, H = 512, n = fbm(7, 5, 8), r = mulberry(11);
    const [c, ctx] = paint(W, H, (u, v) => {
      const g = 150 + n(u, v) * 60;
      return [g, g, g - 4];
    });
    const blob = (lat, lon, rad, col, a) => {
      const x = (lon + 180) / 360 * W, y = (90 - lat) / 180 * H, ry = rad / 180 * H;
      const rx = ry / Math.max(Math.cos(lat * DEG), 0.25);
      ctx.save(); ctx.translate(x, y); ctx.scale(rx / ry, 1);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.7, `rgba(${col},${a * 0.8})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ry, 0, TAU); ctx.fill(); ctx.restore();
    };
    for (const [lat, lon, rad, s] of MARIA) blob(lat, lon, rad, '82,84,92', s);
    for (let i = 0; i < 420; i++) { // craters, denser on the far side and in the south
      const lon = r() * 360 - 180, lat = Math.asin(r() * 2 - 1) / DEG, rad = 0.5 + r() * r() * 4;
      if (Math.abs(lon) < 70 && lat > -10 && r() < 0.6) continue;
      blob(lat, lon, rad, '95,95,98', 0.55); blob(lat, lon, rad * 0.55, '190,190,186', 0.25);
    }
    blob(-43, -11, 2.2, '235,235,230', 0.95); blob(-43, -11, 9, '215,215,210', 0.3);   // Tycho
    blob(10, -20, 2, '225,225,220', 0.8); blob(8, -38, 1.4, '225,225,220', 0.7);       // Copernicus, Kepler
    return toTexture(c);
  });
}

export function marsTexture() {
  return cached('mars', () => {
    const W = 1024, H = 512, n = fbm(21, 5, 8), n2 = fbm(33, 3, 4);
    const [c, ctx] = paint(W, H, (u, v) => {
      const lat = 90 - v * 180, a = n(u, v), b = n2(u, v);
      let col = ramp([[0, hex(0x7a3b1e)], [0.45, hex(0xb8552a)], [0.7, hex(0xd17a45)], [1, hex(0xe6a36a)]], a * 0.7 + b * 0.4);
      if (b < 0.42) col = mix(col, hex(0x5a3020), (0.42 - b) * 3.2);               // dark albedo regions
      const cap = Math.abs(lat) - (lat > 0 ? 78 : 82) + (a - 0.5) * 10;
      if (cap > 0) col = mix(col, [245, 245, 248], Math.min(cap / 4, 1));
      return col;
    });
    const px = (lat, lon) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];
    ctx.strokeStyle = 'rgba(70,30,18,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round';       // Valles Marineris
    ctx.beginPath(); ctx.moveTo(...px(-6, -92)); ctx.quadraticCurveTo(...px(-9, -70), ...px(-15, -45)); ctx.stroke();
    for (const [lat, lon, rad] of [[18.6, -133.8, 9], [1, -113, 4], [-8, -120, 4], [11, -104, 4]]) {  // Olympus + Tharsis
      const [x, y] = px(lat, lon), g = ctx.createRadialGradient(x, y, 0, x, y, rad * 2.8);
      g.addColorStop(0, 'rgba(240,190,140,0.9)'); g.addColorStop(0.25, 'rgba(150,80,45,0.8)'); g.addColorStop(1, 'rgba(150,80,45,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad * 2.8, 0, TAU); ctx.fill();
    }
    return toTexture(c);
  });
}

function bands(key, seed, stops, turbulence, extra) {
  return cached(key, () => {
    const W = 1024, H = 512, n = fbm(seed, 4, 8), n2 = fbm(seed + 9, 3, 16);
    const [c, ctx] = paint(W, H, (u, v) => {
      const w = v + (n(u, v) - 0.5) * turbulence + (n2(u * 2, v) - 0.5) * turbulence * 0.4;
      return ramp(stops, w);
    });
    extra && extra(ctx, W, H);
    return toTexture(c);
  });
}
export const jupiterTexture = () => bands('jupiter', 41, [
  [0, hex(0x8c7a66)], [0.1, hex(0xb49a7a)], [0.2, hex(0xe9dcc0)], [0.3, hex(0xb5773f)], [0.38, hex(0xeadfc8)], [0.46, hex(0xf3ead6)],
  [0.54, hex(0xe2c9a0)], [0.61, hex(0xa9652f)], [0.7, hex(0xe6d7b8)], [0.8, hex(0xc09868)], [0.9, hex(0xa58e74)], [1, hex(0x86786a)],
], 0.035, (ctx, W, H) => {                                      // Great Red Spot at 22°S
  const x = W * 0.5, y = (90 + 22) / 180 * H;
  ctx.save(); ctx.translate(x, y); ctx.scale(1.8, 1);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
  g.addColorStop(0, '#b8402a'); g.addColorStop(0.6, '#c65a36'); g.addColorStop(0.85, 'rgba(235,215,190,0.8)'); g.addColorStop(1, 'rgba(235,215,190,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill(); ctx.restore();
});
export const saturnTexture = () => bands('saturn', 55, [
  [0, hex(0x9c8f6c)], [0.15, hex(0xcdbb86)], [0.3, hex(0xe6d6a2)], [0.42, hex(0xd9c48a)], [0.5, hex(0xefe2b4)],
  [0.6, hex(0xdcc78e)], [0.72, hex(0xe8d8a6)], [0.86, hex(0xcab682)], [1, hex(0x9a8c69)],
], 0.02);
export const venusTexture = () => bands('venus', 61, [[0, hex(0xd9b36a)], [0.3, hex(0xf0d79a)], [0.6, hex(0xe2bd72)], [1, hex(0xcfa35c)]], 0.25);
export const uranusTexture = () => bands('uranus', 67, [[0, hex(0x9fdde2)], [0.5, hex(0xb6ebee)], [1, hex(0x9ad6dc)]], 0.03);
export const neptuneTexture = () => bands('neptune', 71, [[0, hex(0x2c4fb8)], [0.35, hex(0x3f6fe0)], [0.5, hex(0x5a8cf0)], [0.7, hex(0x3a66d6)], [1, hex(0x294aa8)]], 0.06);
export function rockTexture(key, seed, dark, light) {
  return cached(key, () => {
    const n = fbm(seed, 5, 8);
    const [c] = paint(512, 256, (u, v) => mix(hex(dark), hex(light), n(u, v)));
    return toTexture(c);
  });
}
export const mercuryTexture = () => rockTexture('mercury', 81, 0x6e6a66, 0xb8b2aa);

export function ringTexture() {
  return cached('ring', () => {
    const [c, ctx] = canvas(512, 4), img = ctx.createImageData(512, 4), n = mulberry(5);
    for (let x = 0; x < 512; x++) {
      const t = x / 511; let a, b;
      if (t < 0.2) { a = 0.22 + t; b = 150; }                 // C ring
      else if (t < 0.56) { a = 0.92; b = 225; }               // B ring
      else if (t < 0.62) { a = 0.05; b = 120; }               // Cassini Division
      else if (t < 0.97) { a = 0.72; b = 200; }               // A ring
      else { a = 0.15; b = 180; }
      if (t > 0.88 && t < 0.895) a = 0.1;                     // Encke gap
      const j = 0.85 + n() * 0.3;
      for (let y = 0; y < 4; y++) {
        const i = (y * 512 + x) * 4;
        img.data[i] = b * j; img.data[i + 1] = b * 0.92 * j; img.data[i + 2] = b * 0.76 * j; img.data[i + 3] = 255 * a;
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = toTexture(c); t.wrapS = THREE.ClampToEdgeWrapping; return t;
  });
}
/** Flat ring whose texture runs from the inner edge (u=0) to the outer edge (u=1). */
export function ringGeometry(inner, outer, seg = 96) {
  const g = new THREE.RingGeometry(inner, outer, seg, 1), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - inner) / (outer - inner), 0.5);
  return g;
}

// ---------- materials ----------
const PLANET_VERT = `
varying vec3 vWp; varying vec3 vWn; varying vec2 vUv;
void main(){
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWp = wp.xyz;
  vWn = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PLANET_FRAG = `
uniform sampler2D map; uniform vec3 uSunPos; uniform float uAmbient; uniform float uOpacity;
varying vec3 vWp; varying vec3 vWn; varying vec2 vUv;
void main(){
  float d = dot(normalize(vWn), normalize(uSunPos - vWp));
  float lit = smoothstep(-0.06, 0.22, d);
  vec3 base = texture2D(map, vUv).rgb;
  gl_FragColor = vec4(base * mix(uAmbient, 1.0, lit), uOpacity);
  #include <colorspace_fragment>
}`;
/** Sphere material lit from one point (the Sun), with a soft day/night edge.
 *  The dark side keeps a little light so "the unlit half" stays visible. */
export function planetMaterial(map, sunPos, { ambient = 0.09 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, uSunPos: sunPos, uAmbient: { value: ambient }, uOpacity: { value: 1 } },
    vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG,
  });
}

const SUN_FRAG = `
uniform float uTime; varying vec3 vP; varying vec3 vN; varying vec3 vV;
float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * noise(p); p *= 2.1; a *= 0.5; } return s; }
void main(){
  vec3 p = normalize(vP);
  float g = fbm(p * 6.0 + vec3(0.0, uTime * 0.05, uTime * 0.03));
  float spots = smoothstep(0.66, 0.74, fbm(p * 2.2 + 7.0)) * step(abs(p.y), 0.55);
  vec3 col = mix(vec3(1.0, 0.42, 0.05), vec3(1.0, 0.86, 0.35), g * 1.3);
  col = mix(col, vec3(0.35, 0.12, 0.02), spots * 0.85);
  float limb = pow(max(dot(normalize(vN), normalize(vV)), 0.0), 0.45);
  gl_FragColor = vec4(col * mix(0.55, 1.15, limb), 1.0);
  #include <colorspace_fragment>
}`;
const SUN_VERT = `
varying vec3 vP; varying vec3 vN; varying vec3 vV;
void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
export function sunMaterial(time) {
  return new THREE.ShaderMaterial({ uniforms: { uTime: time }, vertexShader: SUN_VERT, fragmentShader: SUN_FRAG });
}

// ---------- sprites ----------
export function glowSprite(color, size, opacity = 1) {
  const tex = cached('glow', () => {
    const [c, ctx] = canvas(128, 128), g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.setScalar(size); s.raycast = () => {};
  return s;
}

/** Text label that always faces the viewer. `h` is its height in scene units. */
export function label(text, h = 0.09, { color = '#ffffff', bg = 'rgba(10,14,34,0.72)' } = {}) {
  const font = '600 44px system-ui, sans-serif';
  const [c, ctx] = canvas(8, 8); ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 44; c.width = w; c.height = 72;
  ctx.font = font; ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(0, 0, w, 72, 36); ctx.fill();
  ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText(text, w / 2, 38);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
  s.scale.set(h * w / 72, h, 1); s.renderOrder = 10; s.raycast = () => {}; s.userData.isLabel = true;
  return s;
}

/** Tappable "look here" marker for a hotspot. */
export function pin(id, color = '#ffd34d', size = 0.11) {
  const tex = cached('pin' + color, () => {
    const [c, ctx] = canvas(96, 96);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(48, 48, 34, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(10,14,34,0.45)'; ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(48, 48, 15, 0, TAU); ctx.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.setScalar(size); s.userData.hot = id; s.userData.isPin = true; s.renderOrder = 9;
  return s;
}

export function circleLine(radius, color = 0xffffff, opacity = 0.35, seg = 128) {
  const pts = [];
  for (let i = 0; i <= seg; i++) pts.push(new THREE.Vector3(Math.cos(i / seg * TAU) * radius, 0, Math.sin(i / seg * TAU) * radius));
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

export function starfield(count = 900, radius = 40) {
  const r = mulberry(3), pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const z = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - z * z);
    pos.set([s * Math.cos(a) * radius, z * radius, s * Math.sin(a) * radius], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.8 }));
}

/** Invisible, generously sized tap target so small objects are easy to hit. */
export function hitSphere(radius, id) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
  m.userData.hot = id; return m;
}

export function disposeTree(root) {
  root.traverse(o => {
    o.geometry && o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of mats) m.dispose();   // shared textures stay cached on purpose
  });
}
