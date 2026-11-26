// Genera imágenes de portada para packs combinando las fotos individuales (collage).
// Uso: node scripts/compose-pack-images.mjs
// Cuando tengas la foto real de un pack, reemplaza el archivo de salida o cambia la ruta en la data.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const pub = (p) => join(root, "public", p);

const SIZE = 800;
const BG = "#fbf3ea";

/** Define acá los collages: filas de fotos + foto de base opcional */
const packs = [
  {
    out: "products/navidad/pack-clasico.png",
    rows: [["assets/christmas/arbol.png", "assets/christmas/papanoel.png", "assets/christmas/angel.png"]],
    tile: 230,
    base: "assets/christmas/bandeja.png",
  },
  {
    out: "products/navidad/arma-tu-pack.png",
    rows: [
      ["assets/christmas/nacimiento.png", "assets/christmas/arbol.png", "assets/christmas/papanoel.png", "assets/christmas/angel.png", "assets/christmas/arbol-grande.png"],
      ["assets/christmas/reno.png", "assets/christmas/snowman.png", "assets/christmas/oso.png", "assets/christmas/galleta.png"],
    ],
    tile: 136,
    base: "assets/christmas/bandeja.png",
  },
];

const GAP = 22;

async function roundedTile(file, size) {
  const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.12}" fill="#fff"/></svg>`);
  // Fotos muy alargadas (ej. árbol grande) se muestran enteras en vez de recortarse
  const { width, height } = await sharp(pub(file)).metadata();
  const elongated = Math.max(width, height) / Math.min(width, height) > 1.6;
  let input = pub(file);
  if (elongated) {
    const blurred = await sharp(pub(file)).resize(size, size, { fit: "cover" }).blur(18).toBuffer();
    const whole = await sharp(pub(file)).resize(size, size, { fit: "inside" }).toBuffer();
    const meta = await sharp(whole).metadata();
    input = await sharp(blurred)
      .composite([{ input: whole, left: Math.round((size - meta.width) / 2), top: Math.round((size - meta.height) / 2) }])
      .toBuffer();
  }
  return sharp(input)
    .resize(size, size, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

for (const pack of packs) {
  const layers = [];
  const baseHeight = pack.base ? 300 : 0;
  const rowsHeight = pack.rows.length * pack.tile + (pack.rows.length - 1) * GAP;
  let y = Math.round((SIZE - rowsHeight - baseHeight - GAP) / 2);

  for (const row of pack.rows) {
    const width = row.length * pack.tile + (row.length - 1) * GAP;
    let x = Math.round((SIZE - width) / 2);
    for (const file of row) {
      layers.push({ input: await roundedTile(file, pack.tile), left: x, top: y });
      x += pack.tile + GAP;
    }
    y += pack.tile + GAP;
  }

  if (pack.base) {
    const base = await sharp(pub(pack.base)).resize(SIZE - 120, baseHeight, { fit: "inside" }).png().toBuffer();
    const meta = await sharp(base).metadata();
    const mask = Buffer.from(`<svg width="${meta.width}" height="${meta.height}"><rect width="${meta.width}" height="${meta.height}" rx="28" fill="#fff"/></svg>`);
    const rounded = await sharp(base).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    layers.push({ input: rounded, left: Math.round((SIZE - meta.width) / 2), top: y });
  }

  mkdirSync(dirname(pub(pack.out)), { recursive: true });
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: BG } })
    .composite(layers)
    .png()
    .toFile(pub(pack.out));
  console.log("✓", pack.out);
}
