// Genera imágenes SVG placeholder para cada imagen referenciada en la data mock.
// Uso: node scripts/generate-placeholders.mjs
// Cuando tengas fotos reales, reemplaza los archivos en public/products/ (o cambia las rutas en la data).
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const src = readFileSync(join(root, "src/lib/data/products.ts"), "utf8");

const colors = {
  rosa: "#f4a3bd", blanco: "#f3f0ee", verde: "#8cc8a0", celeste: "#9fd3f0", lila: "#c7b3f0",
  amarillo: "#ffd873", negro: "#3b3b45", azul: "#7aa7f0", naranja: "#ffad6b", multicolor: "#d9a3f4",
  dorado: "#e8c25c", arcoiris: "#f4a3d6", arena: "#e6d3b8", terracota: "#d98a66", base: "#f2c6d6",
  detalle: "#a6d9b9", completo: "#c3b6f2",
};

const re = /img\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\)/g;
const seen = new Set();
let count = 0;
for (const [, slug, file, alt] of src.matchAll(re)) {
  const key = `${slug}/${file}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const out = join(root, "public/products", slug, `${file}.svg`);
  if (existsSync(out) && !process.argv.includes("--force")) continue;
  const tone = colors[file.split("-")[0]] ?? "#f2c6d6";
  const title = alt.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${tone}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${tone}" stop-opacity="0.8"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <g transform="translate(400 360)" fill="none" stroke="${tone}" stroke-width="6" stroke-linejoin="round">
    <polygon points="0,-150 130,-75 130,75 0,150 -130,75 -130,-75" fill="${tone}" fill-opacity="0.55" stroke="#ffffff" stroke-opacity="0.8"/>
    <polyline points="-130,-75 0,0 130,-75" stroke="#ffffff" stroke-opacity="0.8"/>
    <line x1="0" y1="0" x2="0" y2="150" stroke="#ffffff" stroke-opacity="0.8"/>
  </g>
  <text x="400" y="640" text-anchor="middle" font-family="system-ui, sans-serif" font-size="34" font-weight="600" fill="#2a1f2d" fill-opacity="0.75">${title}</text>
  <text x="400" y="690" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="#2a1f2d" fill-opacity="0.45">nalita3d · imagen de ejemplo</text>
</svg>
`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, svg);
  count++;
}
console.log(`Generadas ${count} imágenes placeholder (${seen.size} referenciadas).`);
