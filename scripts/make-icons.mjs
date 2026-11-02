/**
 * The Ombra emblem, rendered in pure Node — no image libraries, no quota,
 * no remote asset. An eclipse: a matte umbra disc on near-black grain,
 * its edge traced by one thin ember crescent, the last sliver of light.
 *
 * Output: public/icon-128.png, public/icon-48.png, public/icon-32.png,
 * public/icon-16.png (WXT discovers these and writes manifest.icons).
 * 4x supersampled for a crisp crescent at every size.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ————— geometry (128-canvas units, supersampled SS×) —————
const SS = 4; // supersample factor
const TILE = 128;
const RADIUS = 30; // tile corner radius
const GRAIN_AMP = 4; // ± intensity of the film grain

// the light source (ember ring) and the shadow (umbra) that eats it —
// given in 128-canvas units and scaled per output size below.
const EMBER = { x: 64, y: 64, r: 34, col: [210, 169, 111] }; // #d2a96f
const UMBRA = { x: 67, y: 61, r: 35, col: [5, 6, 7] }; // leaning off the light
const TILE_BG_IN = [10, 11, 13]; // silent center
const TILE_BG_OUT = [6, 7, 8]; // the corner dark

// five barely-there dust speckles, placed by hand, not by seed
const SPECKLES = [
  { x: 26, y: 34, r: 1.1, a: 0.32 },
  { x: 100, y: 30, r: 0.9, a: 0.26 },
  { x: 104, y: 92, r: 1.2, a: 0.3 },
  { x: 30, y: 98, r: 0.8, a: 0.24 },
  { x: 78, y: 112, r: 0.7, a: 0.2 },
];

/** Geometry scaled to a canvas. The umbra leans farther off the light on
 * small canvases — a hair-thin sliver of light would be swallowed by
 * antialiasing, so the crescent is emphasized as the icon shrinks. */
function makeGeometry(size) {
  const k = size / 128;
  const e = size >= 128 ? 1 : size >= 48 ? 1.8 : size >= 32 ? 3 : 4.5;
  return {
    ember: { x: 64 * k, y: 64 * k, r: EMBER.r * k, col: EMBER.col },
    umbra: {
      x: (64 + 3 * e) * k,
      y: (64 - 3 * e) * k,
      r: UMBRA.r * k,
      col: UMBRA.col,
    },
    speckles: SPECKLES.map((s) => ({ x: s.x * k, y: s.y * k, r: s.r * k, a: s.a })),
  };
}

// ————— coverage helpers (unit space: point in shape → 1 else 0) —————
const circleAt = (p, c) => {
  const dx = p.x - c.x, dy = p.y - c.y;
  return Math.sqrt(dx * dx + dy * dy) <= c.r ? 1 : 0;
};

const tileAt = (p, size) => {
  const r = (RADIUS / 128) * size;
  if (p.x < 0 || p.y < 0 || p.x >= size || p.y >= size) return 0;
  const cx = Math.max(r, Math.min(size - r, p.x));
  const cy = Math.max(r, Math.min(size - r, p.y));
  const dx = p.x - cx, dy = p.y - cy;
  return dx * dx + dy * dy <= r * r ? 1 : 0;
};

/**
 * One supersampled pixel. Samples the color of the scene, supersampled
 * on a jittered-but-fixed grid so the crescent edge stays crisp.
 */
function sample(x, y, size, geom) {
  let r = 0, g = 0, b = 0, a = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      const px = x + (sx + 0.5) / SS;
      const py = y + (sy + 0.5) / SS;
      const p = { x: px, y: py };
      // background: a soft radial lift toward the center
      const nx = (px / size - 0.5) * 2, ny = (py / size - 0.5) * 2;
      const d = Math.min(1, Math.sqrt(nx * nx + ny * ny));
      let col = [
        TILE_BG_IN[0] + (TILE_BG_OUT[0] - TILE_BG_IN[0]) * d,
        TILE_BG_IN[1] + (TILE_BG_OUT[1] - TILE_BG_IN[1]) * d,
        TILE_BG_IN[2] + (TILE_BG_OUT[2] - TILE_BG_IN[2]) * d,
      ];
      // grain: deterministic hash noise, quiet
      const h = Math.abs(Math.sin(px * 127.1 + py * 311.7) * 43758.5453) % 1;
      const gn = (h - 0.5) * 2 * (GRAIN_AMP / 128) * size;
      col = [col[0] + gn, col[1] + gn, col[2] + gn];
      // the ember ring, then the umbra over it — the shadow wins
      if (circleAt(p, geom.ember)) col = geom.ember.col.slice();
      if (circleAt(p, geom.umbra)) col = geom.umbra.col.slice();
      // speckles, only where tiles stand
      for (const sp of geom.speckles) {
        const dx = px - sp.x, dy = py - sp.y;
        if (dx * dx + dy * dy <= sp.r * sp.r) {
          col = [
            col[0] + (216 - col[0]) * sp.a,
            col[1] + (183 - col[1]) * sp.a,
            col[2] + (130 - col[2]) * sp.a,
          ];
        }
      }
      const cov = tileAt(p, size);
      r += col[0] * cov; g += col[1] * cov; b += col[2] * cov; a += cov;
    }
  }
  const n = SS * SS;
  return [r / n, g / n, b / n, a / n * 255];
}

// ————— PNG encode (RGBA8, no filter rows) —————
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return (buf) => {
    let c = 0xffffffff;
    for (const byte of buf) c = t[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(CRC(body));
  return Buffer.concat([len, body, crc]);
};

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; // bit depth 8, color type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const geom = makeGeometry(size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = sample(x, y, size, geom);
      const i = (y * size + x) * 4;
      rgba[i] = Math.max(0, Math.min(255, Math.round(r)));
      rgba[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
      rgba[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
      rgba[i + 3] = Math.round(a);
    }
  }
  return encodePNG(size, size, rgba);
}

mkdirSync(join(root, 'public'), { recursive: true });
for (const size of [128, 48, 32, 16]) {
  const png = render(size);
  const file = join(root, 'public', `icon-${size}.png`);
  writeFileSync(file, png);
  console.log(`icon-${size}.png  ${png.length} bytes`);
}
