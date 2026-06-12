#!/usr/bin/env node
/**
 * Генерирует абстрактные SVG-заглушки для проектов из data/projects.json.
 * Заглушки нужны только до загрузки реальных фотографий: положите свои
 * .jpg/.webp в assets/img/projects/<slug>/ и поменяйте пути в JSON.
 *
 * Запуск: node tools/generate-placeholders.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { projects } = JSON.parse(readFileSync(resolve(root, "data/projects.json"), "utf8"));

// детерминированный генератор, чтобы картинки не менялись от запуска к запуску
function rng(seedStr) {
  let h = 2166136261;
  for (const c of seedStr) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function composition(seed, W, H, palette) {
  const r = rng(seed);
  const [bg, mid, deep, ink] = palette;
  const shapes = [];

  // стена-фон с мягким градиентом
  shapes.push(`<rect width="${W}" height="${H}" fill="url(#wash)"/>`);

  // линия пола
  const floorY = H * (0.62 + r() * 0.18);
  shapes.push(`<rect y="${floorY.toFixed(0)}" width="${W}" height="${H - floorY}" fill="${mid}" opacity="0.55"/>`);
  shapes.push(`<rect y="${floorY.toFixed(0)}" width="${W}" height="3" fill="${ink}" opacity="0.25"/>`);

  // арка или панель
  const aw = W * (0.26 + r() * 0.2);
  const ax = W * (0.1 + r() * 0.5);
  const ah = H * (0.45 + r() * 0.25);
  const ay = floorY - ah;
  if (r() > 0.45) {
    shapes.push(`<path d="M ${ax} ${floorY} V ${ay + aw / 2} A ${aw / 2} ${aw / 2} 0 0 1 ${ax + aw} ${ay + aw / 2} V ${floorY} Z" fill="${deep}" opacity="0.85"/>`);
  } else {
    shapes.push(`<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="${deep}" opacity="0.85"/>`);
  }

  // вертикальная световая полоса
  const lx = W * (0.65 + r() * 0.25);
  shapes.push(`<rect x="${lx.toFixed(0)}" y="0" width="${(W * 0.012).toFixed(0)}" height="${floorY}" fill="#FFFFFF" opacity="${(0.25 + r() * 0.3).toFixed(2)}"/>`);

  // «мебель» — низкие объёмы на полу
  const n = 1 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) {
    const fw = W * (0.14 + r() * 0.22);
    const fh = H * (0.05 + r() * 0.08);
    const fx = W * (0.06 + r() * 0.7);
    shapes.push(`<rect x="${fx.toFixed(0)}" y="${(floorY - fh).toFixed(0)}" width="${fw.toFixed(0)}" height="${fh.toFixed(0)}" rx="${(fh * 0.18).toFixed(0)}" fill="${ink}" opacity="${(0.7 + r() * 0.25).toFixed(2)}"/>`);
  }

  // солнечное пятно
  const cx = W * (0.2 + r() * 0.6);
  const cy = H * (0.15 + r() * 0.35);
  shapes.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(W * (0.06 + r() * 0.07)).toFixed(0)}" fill="#FFFFFF" opacity="0.18"/>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="wash" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="${mid}"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.06"/></feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic"/>
    </filter>
  </defs>
  <g filter="url(#grain)">${shapes.join("\n  ")}</g>
</svg>
`;
}

let count = 0;
for (const p of projects) {
  const files = [{ path: p.cover, w: 1600, h: 2000 }];
  p.images.forEach((img, i) => {
    const landscape = i % 2 === 0;
    files.push({ path: img, w: landscape ? 1600 : 1200, h: landscape ? 1100 : 1500 });
  });
  for (const f of files) {
    const abs = resolve(root, f.path);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, composition(p.slug + f.path, f.w, f.h, p.palette));
    count++;
  }
}
console.log(`Сгенерировано ${count} изображений для ${projects.length} проектов.`);
