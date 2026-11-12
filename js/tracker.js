// Marker tracking. Finds the printed ArUco code on each card in the camera image
// and works out where the card is in 3D. Everything runs on the device: frames are
// read into memory, analysed and discarded. Nothing is stored or sent anywhere.
import * as THREE from 'three';

const { AR, POS } = window;                    // js-aruco2, loaded as classic scripts
export const DICTIONARY = 'ARUCO_MIP_36h12';
export const MARKER_MM = 50;                   // printed width of the black square on an A6 card

const S = new THREE.Matrix4().makeScale(1, 1, -1);
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3();

function toPose(rot, tr) {
  // POSIT works in a camera frame with +z into the scene; three.js looks down -z.
  m4.set(rot[0][0], rot[0][1], rot[0][2], 0, rot[1][0], rot[1][1], rot[1][2], 0, rot[2][0], rot[2][1], rot[2][2], 0, 0, 0, 0, 1);
  m4.premultiply(S).multiply(S);
  return { q: new THREE.Quaternion().setFromRotationMatrix(m4), p: new THREE.Vector3(tr[0], tr[1], -tr[2]) };
}

export class Tracker {
  /** @param ids marker ids to accept (others are ignored as false positives) */
  constructor(ids, { maxWidth = 640, focalFactor = 0.82 } = {}) {
    this.ids = new Set(ids); this.maxWidth = maxWidth; this.focalFactor = focalFactor;
    // The library's default accepts codes with up to 11 wrong bits, which misreads cards.
    // Allow at most 3: this dictionary can safely correct 5.
    this.detector = new AR.Detector({ dictionaryName: DICTIONARY, maxHammingDistance: 4 });
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.poses = new Map();                    // id -> { position, quaternion, seen, hits }
    this.cost = 0; this.skip = false;
  }
  setSource(el, w, h) {
    const k = Math.min(1, this.maxWidth / w);
    this.source = el; this.pw = Math.round(w * k); this.ph = Math.round(h * k);
    this.canvas.width = this.pw; this.canvas.height = this.ph;
    this.focal = this.focalFactor * this.pw;
    this.posit = new POS.Posit(1, this.focal);  // marker width = 1 unit
    this.poses.clear();
  }
  /** Vertical field of view (degrees) that makes a W x H overlay line up with the "cover"-scaled video. */
  fovFor(W, H) {
    const scale = Math.max(W / this.pw, H / this.ph);
    return 2 * Math.atan(H / 2 / (this.focal * scale)) * 180 / Math.PI;
  }
  process(now) {
    if (!this.source) return this.poses;
    // On slow devices analyse every other frame; the overlay still renders every frame.
    if (this.cost > 22 && (this.skip = !this.skip)) return this.poses;
    const t0 = performance.now();
    this.ctx.drawImage(this.source, 0, 0, this.pw, this.ph);
    let markers = [];
    try { markers = this.detector.detect(this.ctx.getImageData(0, 0, this.pw, this.ph)); } catch { /* a bad frame is not fatal */ }
    for (const m of markers) {
      if (!this.ids.has(m.id)) continue;
      const corners = m.corners.map(c => ({ x: c.x - this.pw / 2, y: this.ph / 2 - c.y }));
      const res = this.posit.pose(corners);
      let best = toPose(res.bestRotation, res.bestTranslation);
      const prev = this.poses.get(m.id), fresh = prev && now - prev.seen < 400;
      // A flat square seen from a distance has two plausible tilts. Prefer the one
      // that agrees with where the card was a moment ago, to stop it flipping.
      if (fresh && res.alternativeError >= 0 && res.alternativeError < res.bestError * 4 + 2) {
        const alt = toPose(res.alternativeRotation, res.alternativeTranslation);
        if (prev.quaternion.angleTo(alt.q) < prev.quaternion.angleTo(best.q) * 0.5) best = alt;
      }
      if (!(best.p.z < 0) || !isFinite(best.p.x + best.p.y + best.p.z)) continue;
      if (fresh) {
        const k = Math.min(Math.max(prev.position.distanceTo(best.p) * 2.5, 0.25), 0.8);   // smooth when still, quick when moved
        prev.position.lerp(best.p, k); prev.quaternion.slerp(best.q, k); prev.seen = now; prev.hits++;
      } else this.poses.set(m.id, { position: best.p, quaternion: best.q, seen: now, hits: 1 });
    }
    this.cost += (performance.now() - t0 - this.cost) * 0.1;
    return this.poses;
  }
  /** Distance between two tracked cards in millimetres, or null. */
  distanceMm(a, b, now) {
    const A = this.poses.get(a), B = this.poses.get(b);
    if (!A || !B || now - A.seen > 400 || now - B.seen > 400) return null;
    return v.copy(A.position).sub(B.position).length() * MARKER_MM;
  }
}
void q;

/** Opens the rear camera. Resolves to a <video> that is already playing. */
export async function openCamera(video) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-camera-api');
  const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
  video.srcObject = stream; video.setAttribute('playsinline', ''); video.muted = true;
  await video.play();
  if (!video.videoWidth) await new Promise(r => video.addEventListener('loadedmetadata', r, { once: true }));
  return () => { stream.getTracks().forEach(t => t.stop()); video.srcObject = null; };
}
