// Copies third-party libraries from node_modules into /vendor so the app runs
// with no build step and fully offline. Run: npm run vendor
import { copyFileSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { feature } from 'topojson-client';

const cp = (from, to) => { copyFileSync(from, to); console.log('copied', to); };
mkdirSync('vendor/three', { recursive: true });
mkdirSync('vendor/aruco', { recursive: true });
mkdirSync('assets', { recursive: true });

cp('node_modules/three/build/three.module.min.js', 'vendor/three/three.module.min.js');
cp('node_modules/three/examples/jsm/controls/OrbitControls.js', 'vendor/three/OrbitControls.js');
cp('node_modules/three/LICENSE', 'vendor/three/LICENSE');
for (const f of ['cv.js', 'aruco.js', 'svd.js', 'posit1.js'])
  cp(`node_modules/js-aruco2/src/${f}`, `vendor/aruco/${f}`);
cp('node_modules/js-aruco2/LICENSE.txt', 'vendor/aruco/LICENSE.txt');
cp('node_modules/qrcode-generator/dist/qrcode.mjs', 'vendor/qrcode.mjs');

// Land outlines (Natural Earth 1:110m, public domain) -> compact JSON.
// Only land/sea is drawn: no country borders, so no boundary depiction issues.
const topo = JSON.parse(readFileSync('node_modules/world-atlas/land-110m.json', 'utf8'));
const land = feature(topo, topo.objects.land);
const rings = [];
const geoms = land.type === 'FeatureCollection' ? land.features.map(f => f.geometry) : [land.geometry];
for (const g of geoms) {
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const ring of poly)
    rings.push(ring.flatMap(([lon, lat]) => [Math.round(lon * 10), Math.round(lat * 10)]));
}
writeFileSync('assets/land.json', JSON.stringify(rings));
console.log('land rings:', rings.length);
