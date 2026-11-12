// Print sheet: renders each card's 3D scene to a picture, then lays the cards out for printing.
import * as THREE from 'three';
import qrcode from '../vendor/qrcode.mjs';
import { CARDS, cardById } from '../content/cards.js';
import { cardSVG, CARD_W, CARD_H } from './cardsvg.js';
import { loadLand } from './gfx.js';
import { earthScene, moonScene, sunScene, marsScene, jupiterScene, saturnScene } from './scenes/bodies.js';
import { solarSystemScene } from './scenes/systems.js';
import { issScene, rocketScene, chandrayaanScene } from './scenes/craft.js';

const names = Object.fromEntries(Object.entries(cardById['solar-system'].hotspots).map(([k, v]) => [k, v[0].en]));
const FACTORY = { 'solar-system': e => solarSystemScene(e, { names }), earth: earthScene, moon: moonScene, sun: sunScene, mars: marsScene,
  jupiter: jupiterScene, saturn: saturnScene, iss: issScene, rocket: rocketScene, chandrayaan: chandrayaanScene };
const VIEW = { 'solar-system': [0, 2.4, 3.6], rocket: [0, 0.1, 6.2], chandrayaan: [0.4, 0.5, 4.4], iss: [0, 0.9, 4.4] };

function renderArt() {
  const W = 930, H = 370, renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H, false);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(26, W / H, 0.05, 300);
  const lamp = new THREE.DirectionalLight(0xffffff, 2.4); lamp.position.set(2, 3, 4); camera.add(lamp);
  scene.add(camera, new THREE.HemisphereLight(0xdfe8ff, 0x1a1f3a, 1.3));
  const env = { level: 'explorer', lang: 'en', labels: false, calm: true, t: en => en }, art = {};
  for (const card of CARDS) {
    const s = FACTORY[card.id](env);
    s.group.traverse(o => { if (o.userData.isPin || o.userData.isLabel) o.visible = false; });
    if (card.id === 'rocket') s.group.rotation.z = -Math.PI / 2 + 0.25;          // lay the rocket along the wide picture
    scene.add(s.group);
    camera.position.set(...(VIEW[card.id] || [0, 0.45, 4.7])); camera.lookAt(0, card.id === 'chandrayaan' ? -0.15 : 0, 0);
    for (let i = 0; i < 4; i++) s.update(0.016, { sunWorld: null, partners: {} });
    renderer.render(scene, camera);
    art[card.id] = renderer.domElement.toDataURL('image/png');
    scene.remove(s.group); s.dispose();
  }
  renderer.dispose();
  return art;
}

function startCard(url) {
  const q = qrcode(0, 'M'); q.addData(url); q.make();
  const n = q.getModuleCount(), size = 52, cell = size / n, x0 = (CARD_W - size) / 2, y0 = 40;
  let cells = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) cells += `<rect x="${(x0 + c * cell).toFixed(3)}" y="${(y0 + r * cell).toFixed(3)}" width="${(cell + 0.03).toFixed(3)}" height="${(cell + 0.03).toFixed(3)}"/>`;
  const F = `font-family="system-ui, 'Noto Sans', Arial, sans-serif"`;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const steps = [['1', 'Scan this code with a tablet or phone'], ['2', 'Choose your level'], ['3', 'Point the camera at any card']];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}">
    <defs><linearGradient id="bgS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101a44"/><stop offset="1" stop-color="#070b1f"/></linearGradient></defs>
    <rect width="${CARD_W}" height="${CARD_H}" rx="5" fill="url(#bgS)"/><rect x="1.2" y="1.2" width="${CARD_W - 2.4}" height="${CARD_H - 2.4}" rx="4.2" fill="none" stroke="#ffd34d" stroke-width="0.9"/>
    <text x="52.5" y="15" text-anchor="middle" font-size="8" font-weight="800" fill="#fff" ${F}>Start here</text>
    <text x="52.5" y="32" text-anchor="middle" font-size="3.2" fill="#cbd5ff" ${F}>AR Space Cards · Space Store India</text>
    <rect x="${x0 - 4}" y="${y0 - 4}" width="${size + 8}" height="${size + 8}" rx="3" fill="#fff"/><g fill="#000">${cells}</g>
    <text x="52.5" y="${y0 + size + 9.5}" text-anchor="middle" font-size="2.5" fill="#93a0d6" ${F}>${esc(url)}</text>
    ${steps.map(([k, en], i) => `<circle cx="13" cy="${112 + i * 10.5}" r="3.6" fill="#ffd34d"/><text x="13" y="${113.4 + i * 10.5}" text-anchor="middle" font-size="4" font-weight="800" fill="#070b1f" ${F}>${k}</text>
      <text x="20" y="${113.3 + i * 10.5}" font-size="3.4" font-weight="700" fill="#fff" ${F}>${en}</text>`).join('')}
    <text x="52.5" y="143.6" text-anchor="middle" font-size="2.5" fill="#93a0d6" ${F}>No card? Choose “Explore in 3D” · No login · No data leaves the device</text>
  </svg>`;
}

const $ = id => document.getElementById(id);
let art = {};
function layout() {
  const mode = $('layout').value, per = mode === 'a4' ? 4 : 1;
  $('pageRule').textContent = mode === 'a4' ? '@page { size: A4 portrait; margin: 6mm; }' : '@page { size: 105mm 148mm; margin: 0; }';
  const faces = [startCard($('url').value || location.href), ...CARDS.map(c => cardSVG(c, { art: art[c.id] }).replace(/ width="[^"]*mm" height="[^"]*mm"/, ''))];
  let html = '';
  for (let i = 0; i < faces.length; i += per) html += `<div class="page ${mode}">${faces.slice(i, i + per).join('')}</div>`;
  $('sheets').innerHTML = html;
}

$('url').value = new URL('./', location.href).href;
$('layout').addEventListener('change', layout); $('url').addEventListener('change', layout); $('go').addEventListener('click', () => window.print());
await loadLand();
try { art = renderArt(); $('note').textContent = 'Ready. On the 94% A4 layout the black square is 47 mm wide instead of 50 mm, so the gravity lab reads distances about 6% high. Everything else is unaffected.'; }
catch (e) { $('note').textContent = 'Card pictures could not be drawn on this device (' + e.message + '). The cards will still print and work.'; }
layout();
