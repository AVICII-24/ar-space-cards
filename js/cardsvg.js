// Builds the printable face of a card as SVG (units are millimetres, A6 = 105 x 148).
// The same artwork is used by the print sheet and by the camera-free demo mode,
// so what is tested on screen is exactly what gets printed.
import { DICTIONARY, MARKER_MM } from './tracker.js';
import { CARDS, cardById, LEVELS } from '../content/cards.js';

export const CARD_W = 105, CARD_H = 148;
export const MARKER_X = (CARD_W - MARKER_MM) / 2, MARKER_Y = 75.5;      // top-left of the black square
let dict = null;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The black-and-white code for marker `id`, drawn in a `size` mm square at (x, y). */
export function markerSVG(id, x, y, size) {
  dict = dict || new window.AR.Dictionary(DICTIONARY);
  const code = dict.codeList[id], n = dict.markSize, cell = size / n;      // n = 8: a 6x6 code inside a black border
  let out = `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#000"/>`;
  for (let r = 0; r < n - 2; r++) for (let c = 0; c < n - 2; c++)
    if (code[r * (n - 2) + c] === '1')
      out += `<rect x="${(x + (c + 1) * cell).toFixed(3)}" y="${(y + (r + 1) * cell).toFixed(3)}" width="${(cell + 0.02).toFixed(3)}" height="${(cell + 0.02).toFixed(3)}" fill="#fff"/>`;
  return out;
}

const FONT = `font-family="system-ui, 'Noto Sans', Arial, sans-serif"`;

export function cardSVG(card, { art = null, standalone = true } = {}) {
  const no = String(card.n).padStart(2, '0'), col = card.color;
  const sub = card.tagline.en, under = 'Point a tablet camera at the square below';
  const pairs = (card.pairs || []).map(id => cardById[id]).filter(Boolean).map(c => String(c.n).padStart(2, '0')).join(' · ');
  const stars = Array.from({ length: 26 }, (_, i) => {
    const x = (i * 37.7 + card.n * 13) % 97 + 4, y = (i * 23.3 + card.n * 7) % 34 + 26, r = 0.15 + (i % 3) * 0.12;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fff" opacity="0.7"/>`;
  }).join('');
  const body = `
  <defs>
    <linearGradient id="bg${card.n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101a44"/><stop offset="1" stop-color="#070b1f"/></linearGradient>
    <radialGradient id="orb${card.n}" cx="0.35" cy="0.35" r="0.8"><stop offset="0" stop-color="#fff" stop-opacity="0.9"/><stop offset="0.25" stop-color="${col}"/><stop offset="1" stop-color="#05081a"/></radialGradient>
    <clipPath id="art${card.n}"><rect x="6" y="25" width="93" height="37" rx="4"/></clipPath>
  </defs>
  <rect width="${CARD_W}" height="${CARD_H}" rx="5" fill="url(#bg${card.n})"/>
  <rect x="1.2" y="1.2" width="${CARD_W - 2.4}" height="${CARD_H - 2.4}" rx="4.2" fill="none" stroke="${col}" stroke-width="0.9"/>
  <circle cx="13.5" cy="13.5" r="7" fill="${col}"/>
  <text x="13.5" y="16.2" text-anchor="middle" font-size="7" font-weight="800" fill="#070b1f" ${FONT}>${no}</text>
  <text x="24" y="12.2" font-size="6.6" font-weight="800" fill="#fff" ${FONT}>${esc(card.title.en)}</text>
  <text x="24" y="19.6" font-size="4.3" font-weight="600" fill="${col}" ${FONT}>${esc(sub)}</text>
  <rect x="6" y="25" width="93" height="37" rx="4" fill="#05081a"/>
  <g clip-path="url(#art${card.n})">${stars}${art
    ? `<image href="${art}" x="6" y="25" width="93" height="37" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="52.5" cy="43.5" r="13" fill="url(#orb${card.n})"/>`}</g>
  <text x="52.5" y="66.8" text-anchor="middle" font-size="3.3" font-weight="600" fill="#cbd5ff" ${FONT}>${esc(under)}</text>
  <rect x="${MARKER_X - 7}" y="${MARKER_Y - 6}" width="${MARKER_MM + 14}" height="${MARKER_MM + 12}" rx="3" fill="#fff"/>
  <rect x="${MARKER_X - 7}" y="${MARKER_Y - 6}" width="${MARKER_MM + 14}" height="${MARKER_MM + 12}" rx="3" fill="none" stroke="${col}" stroke-width="0.5"/>
  ${markerSVG(card.n, MARKER_X, MARKER_Y, MARKER_MM)}
  <g font-size="2.7" font-weight="700" ${FONT}>
    ${LEVELS.map((l, i) => `<rect x="${7 + i * 24.5}" y="133.4" width="23" height="5.6" rx="2.8" fill="none" stroke="#8ea0ff" stroke-width="0.3"/><text x="${18.5 + i * 24.5}" y="137.2" text-anchor="middle" fill="#dbe2ff">${esc(l.name.en.toUpperCase())}</text>`).join('')}
    ${pairs ? `<text x="98" y="137.2" text-anchor="end" fill="${col}">+ ${pairs}</text>` : ''}
  </g>
  <text x="7" y="144" font-size="2.6" font-weight="800" fill="#fff" letter-spacing="0.3" ${FONT}>SPACE STORE INDIA</text>
  <text x="98" y="144" text-anchor="end" font-size="2.4" fill="#93a0d6" ${FONT}>AR card ${no} / ${String(CARDS.length).padStart(2, '0')} · wipe clean</text>`;
  return standalone ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}mm" height="${CARD_H}mm">${body}</svg>` : body;
}

/** Rasterise a card to a canvas (used as the texture of the virtual card in demo mode). */
export async function cardCanvas(card, pxPerMm = 8) {
  const svg = cardSVG(card).replace(`width="${CARD_W}mm" height="${CARD_H}mm"`, `width="${CARD_W * pxPerMm}" height="${CARD_H * pxPerMm}"`);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'); c.width = CARD_W * pxPerMm; c.height = CARD_H * pxPerMm;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
}
