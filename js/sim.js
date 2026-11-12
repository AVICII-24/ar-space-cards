// Demo mode: a virtual table with virtual cards, filmed by a virtual camera.
// The picture it produces is fed to the real marker tracker in place of a webcam, so the
// whole AR pipeline can be shown (and tested) on any screen, with no printed cards.
import * as THREE from 'three';
import { cardCanvas, CARD_W, CARD_H, MARKER_Y } from './cardsvg.js';
import { MARKER_MM } from './tracker.js';
import { fbm } from './gfx.js';

const U = 1 / MARKER_MM;                               // millimetres -> scene units (1 unit = marker width)
const MARKER_DZ = (MARKER_Y + MARKER_MM / 2 - CARD_H / 2) * U;   // marker centre sits below the card centre

export class SimSource {
  constructor(width = 960, height = 720, focalFactor = 0.82) {
    this.width = width; this.height = height;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height, false);
    this.canvas = this.renderer.domElement; this.canvas.className = 'feed';
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x8a7460);
    this.camera = new THREE.PerspectiveCamera(2 * Math.atan(height / 2 / (focalFactor * width)) * 180 / Math.PI, width / height, 0.1, 200);
    const n = fbm(5, 4, 8), c = document.createElement('canvas'); c.width = c.height = 256;
    const ctx = c.getContext('2d'), img = ctx.createImageData(256, 256);
    for (let y = 0, i = 0; y < 256; y++) for (let x = 0; x < 256; x++, i += 4) {
      const g = 0.8 + n(x / 256, (y / 256) * 0.2) * 0.3; img.data[i] = 178 * g; img.data[i + 1] = 150 * g; img.data[i + 2] = 118 * g; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    const wood = new THREE.CanvasTexture(c); wood.colorSpace = THREE.SRGBColorSpace; wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(5, 5);
    const table = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: wood }));
    table.position.y = -0.01; this.scene.add(table);
    this.cards = []; this.ray = new THREE.Raycaster(); this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.sway = true; this.lookX = 0;                    // lookX slides the picture sideways, clear of the info panel
  }
  async setCards(cards) {
    for (const c of this.cards) { this.scene.remove(c.mesh); c.mesh.geometry.dispose(); c.mesh.material.map.dispose(); c.mesh.material.dispose(); }
    this.cards = [];
    const xs = cards.length === 1 ? [0] : cards.length === 2 ? [-1.7, 1.7] : [-2.5, 0, 2.5];
    for (let i = 0; i < cards.length; i++) {
      const tex = new THREE.CanvasTexture(await cardCanvas(cards[i]));
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W * U, CARD_H * U).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex }));
      mesh.position.set(xs[i] ?? (i - 1) * 2.5, 0, cards.length > 1 ? 0.2 : 0);
      this.scene.add(mesh); this.cards.push({ card: cards[i], mesh });
    }
    this.dist = cards.length > 1 ? 9.2 : 7.4;
  }
  render(t) {
    const a = this.sway ? Math.sin(t * 0.35) * 0.28 : 0, b = this.sway ? Math.sin(t * 0.23) * 0.05 : 0;
    const el = 0.92 + b, d = this.dist;
    this.camera.position.set(this.lookX + Math.sin(a) * Math.cos(el) * d, Math.sin(el) * d, Math.cos(a) * Math.cos(el) * d + 0.4);
    this.camera.lookAt(this.lookX, 0.6, 0.4);
    this.renderer.render(this.scene, this.camera);
  }
  /** nx, ny are 0..1 across the camera picture. */
  _hit(nx, ny) {
    this.ray.setFromCamera(new THREE.Vector2(nx * 2 - 1, 1 - ny * 2), this.camera);
    return this.ray.ray.intersectPlane(this.plane, new THREE.Vector3());
  }
  pickCard(nx, ny) {
    const p = this._hit(nx, ny); if (!p) return -1;
    return this.cards.findIndex(c => Math.abs(p.x - c.mesh.position.x) < CARD_W * U / 2 && Math.abs(p.z - c.mesh.position.z) < CARD_H * U / 2);
  }
  dragStart(i, nx, ny) { const p = this._hit(nx, ny); this.grab = p ? p.sub(this.cards[i].mesh.position) : new THREE.Vector3(); }
  dragTo(i, nx, ny) {
    const p = this._hit(nx, ny); if (!p) return;
    this.cards[i].mesh.position.set(Math.min(Math.max(p.x - this.grab.x, -5), 5), 0, Math.min(Math.max(p.z - this.grab.z, -3.5), 3.2));
  }
  /** True position of a card's marker centre, in the virtual camera's frame (for self-tests). */
  truth(i) {
    this.camera.updateMatrixWorld();
    return this.cards[i].mesh.position.clone().add(new THREE.Vector3(0, 0, MARKER_DZ)).applyMatrix4(this.camera.matrixWorldInverse);
  }
  dispose() { this.setCards([]); this.renderer.dispose(); this.canvas.remove(); }
}
