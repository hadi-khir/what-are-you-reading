#!/usr/bin/env node
/**
 * Generates apple-touch-icon.png (180x180) for the bookshelf app.
 * Pure Node.js — no external dependencies.
 *
 * Usage:  node scripts/generate-icons.mjs
 * Output: frontend/public/apple-touch-icon.png
 */

import { writeFileSync } from "fs";
import { deflateSync } from "zlib";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SIZE = 180;

// ── Color palette ────────────────────────────────────────────────────────────
const BG        = [255, 248, 240]; // #FFF8F0 cream
const SHELF     = [139, 94,  60];  // #8B5E3C warm brown
const SHELF_SH  = [107, 58,  32];  // darker shadow
const BOOK1     = [139, 58,  74];  // #8B3A4A burgundy
const BOOK2     = [58,  107, 124]; // #3A6B7C teal
const BOOK3     = [196, 137, 58];  // #C4893A golden
const BOOK4     = [74,  122, 74];  // #4A7A4A green
const BOOK5     = [107, 66,  38];  // #6B4226 dark brown
const SPINE_HI  = [255, 255, 255]; // spine highlight

// ── Canvas ───────────────────────────────────────────────────────────────────
// RGBA flat array, row-major
const data = new Uint8Array(SIZE * SIZE * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  // Alpha-composite over existing
  const srcA = a / 255;
  const dstA = data[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA === 0) return;
  data[i]     = Math.round((r * srcA + data[i]     * dstA * (1 - srcA)) / outA);
  data[i + 1] = Math.round((g * srcA + data[i + 1] * dstA * (1 - srcA)) / outA);
  data[i + 2] = Math.round((b * srcA + data[i + 2] * dstA * (1 - srcA)) / outA);
  data[i + 3] = Math.round(outA * 255);
}

function fillRect(x, y, w, h, color) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setPixel(x + dx, y + dy, ...color);
}

function fillRoundRect(x, y, w, h, r, color) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const px = x + dx, py = y + dy;
      // corner distance check
      const cx = Math.min(Math.max(px - x, r - 1), w - r);
      const cy = Math.min(Math.max(py - y, r - 1), h - r);
      const ddx = px - x - cx;
      const ddy = py - y - cy;
      if (Math.sqrt(ddx * ddx + ddy * ddy) < r + 0.5) {
        setPixel(px, py, ...color);
      }
    }
  }
}

// ── Background with rounded corners (iOS clips the icon, but still) ──────────
fillRoundRect(0, 0, SIZE, SIZE, 32, BG);

// ── Scene layout ─────────────────────────────────────────────────────────────
// Shelf sits at 60% height, occupies 55% of width, centred
const shelfY     = Math.round(SIZE * 0.60);
const shelfH     = Math.round(SIZE * 0.075);
const shelfX     = Math.round(SIZE * 0.12);
const shelfW     = Math.round(SIZE * 0.76);
const bookBottom = shelfY; // books sit on top of shelf

// Book definitions: [x offset from shelfX, width, height, color, spineHighlight?]
const books = [
  [0,   22, 72, BOOK1, true ],
  [24,  18, 52, BOOK2, false],
  [44,  24, 80, BOOK3, true ],
  [70,  18, 40, BOOK4, false],
  [90,  20, 58, BOOK5, false],
  [112, 16, 46, BOOK1, false],
  [130, 22, 68, BOOK2, true ],
];

// Draw books
for (const [bx, bw, bh, color, spine] of books) {
  const x = shelfX + bx;
  const y = bookBottom - bh;
  fillRoundRect(x, y, bw, bh, 2, color);
  if (spine) {
    // Thin highlight line on left edge
    fillRect(x + 2, y + 4, 2, bh - 8, [
      Math.min(255, color[0] + 40),
      Math.min(255, color[1] + 30),
      Math.min(255, color[2] + 30),
    ]);
  }
}

// Draw shelf
fillRoundRect(shelfX - 4, shelfY, shelfW + 8, shelfH, 3, SHELF);
// Shelf shadow line
fillRect(shelfX - 4, shelfY + shelfH - 2, shelfW + 8, 2, SHELF_SH);

// ── PNG encoding ─────────────────────────────────────────────────────────────
function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, body) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(body.length, 0);
  const payload = Buffer.concat([typeBytes, body]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(payload), 0);
  return Buffer.concat([len, payload, crcVal]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8]  = 8;  // bit depth
ihdr[9]  = 2;  // colour type: RGB
ihdr[10] = 0;  // compression
ihdr[11] = 0;  // filter
ihdr[12] = 0;  // interlace

// IDAT — build raw scanlines, filter byte 0 (None) + RGB rows
// (drop alpha; PNG colour type 2 = RGB)
const raw = Buffer.alloc(SIZE * (1 + SIZE * 3));
for (let y = 0; y < SIZE; y++) {
  raw[y * (1 + SIZE * 3)] = 0; // filter type None
  for (let x = 0; x < SIZE; x++) {
    const src = (y * SIZE + x) * 4;
    const dst = y * (1 + SIZE * 3) + 1 + x * 3;
    // If pixel is fully transparent, output background colour
    const a = data[src + 3] / 255;
    raw[dst]     = Math.round(data[src]     * a + BG[0] * (1 - a));
    raw[dst + 1] = Math.round(data[src + 1] * a + BG[1] * (1 - a));
    raw[dst + 2] = Math.round(data[src + 2] * a + BG[2] * (1 - a));
  }
}

const compressed = deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
  chunk("IHDR", ihdr),
  chunk("IDAT", compressed),
  chunk("IEND", Buffer.alloc(0)),
]);

const outPath = join(__dirname, "../frontend/public/apple-touch-icon.png");
writeFileSync(outPath, png);
console.log(`Written: ${outPath} (${png.length} bytes)`);
