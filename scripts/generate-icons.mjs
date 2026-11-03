// Generates the app icons (a plain white "R" on brand maroon) with Node built-ins only.
// Run: node scripts/generate-icons.mjs   (outputs are committed; re-run only to change the design)
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const MAROON = [0x7a, 0x2e, 0x3a];
const WHITE = [0xff, 0xff, 0xff];

// The letter R in a box 0.92 wide x 1 tall (origin top-left), as a coverage test.
function inR(x, y) {
  const inBox = (x0, y0, x1, y1) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  const inCircle = (cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  const bowlOuter = inBox(0, 0, 0.55, 0.54) || inCircle(0.55, 0.27, 0.27);
  const bowlInner = inBox(0.2, 0.2, 0.55, 0.34) || inCircle(0.55, 0.27, 0.07);
  const stem = inBox(0, 0, 0.2, 1);
  // diagonal leg: polygon (0.33,0.5) (0.56,0.5) (0.92,1) (0.67,1)
  const leg = inPoly(x, y, [[0.33, 0.5], [0.56, 0.5], [0.92, 1], [0.67, 1]]);
  return stem || (bowlOuter && !bowlInner) || leg;
}

function inPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** size px square; glyphHeight = fraction of the icon height the R occupies. */
function render(size, glyphHeight) {
  const gh = size * glyphHeight;
  const gw = gh * 0.92;
  const ox = (size - gw) / 2;
  const oy = (size - gh) / 2;
  const SS = 3;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0; // filter: none
    for (let px = 0; px < size; px++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const gx = (px + (sx + 0.5) / SS - ox) / gh;
          const gy = (py + (sy + 0.5) / SS - oy) / gh;
          if (inR(gx, gy)) hits++;
        }
      const a = hits / (SS * SS);
      const o = py * (size * 3 + 1) + 1 + px * 3;
      for (let c = 0; c < 3; c++) raw[o + c] = Math.round(MAROON[c] * (1 - a) + WHITE[c] * a);
    }
  }
  return encodePng(size, raw);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(size, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", render(192, 0.56));
writeFileSync("public/icons/icon-512.png", render(512, 0.56));
// Maskable: the R stays inside the central 80% safe zone so any mask shape keeps it.
writeFileSync("public/icons/icon-maskable-512.png", render(512, 0.4));
// iOS "Add to Home Screen" (Next links app/apple-icon.png automatically); iOS rounds the corners.
writeFileSync("app/apple-icon.png", render(180, 0.56));
console.log("icons written");
