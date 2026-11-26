// Genera los archivos 3MF para imprimir la bandeja "con etiqueta".
//
// Uso:
//   node scripts/build-label-print.mjs                         (bandejas grande y mediana + etiqueta de ejemplo)
//   node scripts/build-label-print.mjs --text "Familia Pérez" --width 110
//   node scripts/build-label-print.mjs --size mediana           (otros tamaños, si se habilitan)
//
// Salida en print/:
//   bandeja-<tamaño>-etiqueta.3mf   bandeja con el frente plano y dos agujeros
//                                   (no depende del texto: se imprime una vez por tamaño)
//   etiqueta-<tamaño>.3mf           placa con dos agujeros atrás + texto en relieve
//                                   (pieza "texto" en el filamento 2) + 2 cilindros.
//                                   El texto se guarda como texto de Bambu Studio: se edita con
//                                   clic derecho > Editar texto (o la herramienta Texto, tecla T).
//   --assembly <carpeta>            además guarda ensamble-<tamaño>.3mf (todo armado, sólo para revisar)
//
// Diseño (medidas en mm, iguales para los 3 tamaños):
//   - En el centro del frente se reemplaza el borde acanalado por un bloque liso de
//     FLAT_WIDTH de ancho: la zona plana es siempre igual, sin importar el largo de la etiqueta.
//     La cara plana queda al ras de la punta más saliente de las acanaladuras (FACE_INSET).
//   - Dos agujeros horizontales en esa cara (HOLE_SPACING entre centros, a media altura).
//   - La etiqueta es una placa con esquinas redondeadas y dos agujeros ciegos en la cara de
//     atrás, en la misma posición. Se une con dos cilindros (tarugos) sueltos.
//   - Se imprime acostada: la cara de atrás (con los agujeros) contra la cama, texto arriba.
//
// La bandeja original (models-src/bandeja.3mf) es "Japandi Tray" de SabreDesign:
// revisar su licencia antes de vender impresiones de esta versión modificada.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { unzipSync, zipSync, strFromU8, strToU8 } from "fflate";
import Module from "manifold-3d";
import opentype from "opentype.js";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const outDir = join(root, "print");

/* ---------- Parámetros ---------- */
const FLAT_WIDTH = 50; // ancho fijo de la zona plana del frente
const FACE_INSET = 0; // 0 = cara plana al ras de la punta más saliente de las acanaladuras (negativo: sobresale)
const HOLE_SPACING = 30; // distancia entre centros de los agujeros
const DOWEL_D = 4; // diámetro de los cilindros
const TRAY_HOLE_D = 4.3; // agujero de la bandeja (holgado: la etiqueta se puede sacar)
const TRAY_HOLE_DEPTH = 4;
const PLATE_HOLE_D = 4.1; // agujero de la placa (ajustado: el cilindro queda fijo en la placa)
const PLATE_HOLE_DEPTH = 2.4;
const CHAMFER = 0.4; // chaflán en la boca de los agujeros y en las puntas de los cilindros
const PLATE_THICKNESS = 4;
const PLATE_RADIUS = 3;
const PLATE_TOP_GAP = 0.5; // la placa queda 0.5 mm más baja que el borde de la bandeja
const TEXT_RELIEF = 0.6; // 3 capas de 0.2
const TEXT_MAX_LENGTH = 22;
const DEFAULT_WIDTH_RATIO = 0.5; // largo de la etiqueta = la mitad del largo de la bandeja (igual que la web)
const SEGMENTS = 64;

/** Tamaños: igual que models-src/models.json (fitMm) */
const SIZES = {
  chica: { x: 155, y: 97 },
  mediana: {},
  grande: { x: 235 },
};

/* ---------- Argumentos ---------- */
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .join(" ")
    .split(/\s--/)
    .map((s) => s.replace(/^--/, "").trim())
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf(" ");
      return i === -1 ? [s, "true"] : [s.slice(0, i), s.slice(i + 1).replace(/^"|"$/g, "")];
    }),
);
const text = (args.text ?? "nalita3d").slice(0, TEXT_MAX_LENGTH);
const sizes = args.size ? [args.size] : ["grande", "mediana"];
for (const s of sizes) if (!SIZES[s]) throw new Error(`Tamaño desconocido: ${s} (chica | mediana | grande)`);

const wasm = await Module();
wasm.setup();
const { Manifold, Mesh, CrossSection } = wasm;

/* ---------- Bandeja original ---------- */
function loadTray() {
  const zip = unzipSync(readFileSync(join(root, "models-src/bandeja.3mf")));
  const main = strFromU8(zip["3D/3dmodel.model"]);
  const xml = strFromU8(zip["3D/Objects/object_1.model"]);
  const T = main.match(/<item [^>]*transform="([^"]+)"/)[1].split(" ").map(Number);
  const pos = [];
  for (const m of xml.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)) {
    const [x, y, z] = [+m[1], +m[2], +m[3]];
    pos.push(x * T[0] + y * T[3] + z * T[6] + T[9], x * T[1] + y * T[4] + z * T[7] + T[10], x * T[2] + y * T[5] + z * T[8] + T[11]);
  }
  const tris = [];
  for (const m of xml.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)) tris.push(+m[1], +m[2], +m[3]);
  const mesh = new Mesh({ numProp: 3, vertProperties: new Float32Array(pos), triVerts: new Uint32Array(tris) });
  mesh.merge();
  const tray = new Manifold(mesh);
  if (tray.status() !== "NoError") throw new Error(`La bandeja no es un sólido cerrado: ${tray.status()}`);
  // Centrar en X/Y y apoyar en Z = 0
  const { min, max } = tray.boundingBox();
  return tray.translate([-(min[0] + max[0]) / 2, -(min[1] + max[1]) / 2, -min[2]]);
}

function sizeOf(m) {
  const { min, max } = m.boundingBox();
  return [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
}

/** Cruces de un corte horizontal con la recta x = const (valores de y) */
function crossings(polys, x) {
  const ys = [];
  for (const poly of polys)
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      if ((a[0] - x) * (b[0] - x) < 0) ys.push(a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]));
    }
  return ys.sort((p, q) => p - q);
}

/**
 * Mide el frente (lado -Y) dentro de la zona plana:
 *  - tip: lo más afuera que llega el borde exterior (punta de las acanaladuras)
 *  - inner: lo más afuera que llega la pared interior
 */
function measureFront(tray, height) {
  let tip = 0;
  let inner = Infinity;
  for (let zf = 0.1; zf <= 0.9; zf += 0.05) {
    const polys = tray.slice(height * zf).toPolygons();
    for (let x = -FLAT_WIDTH / 2; x <= FLAT_WIDTH / 2; x += 0.5) {
      const ys = crossings(polys, x).filter((y) => y < 0);
      if (ys.length < 2) continue;
      tip = Math.max(tip, -ys[0]);
      inner = Math.min(inner, -ys[ys.length - 1]);
    }
  }
  return { tip, inner };
}

/** Agujero a lo largo de +Y desde y0, con chaflán en la boca */
function holeAlongY(d, depth, x, y0, z) {
  const r = d / 2;
  const body = Manifold.cylinder(depth + 1, r, r, SEGMENTS).translate([0, 0, -1]);
  const mouth = Manifold.cylinder(CHAMFER + 1, r + CHAMFER + 1, r, SEGMENTS).translate([0, 0, -1]);
  // cilindro en Z (z=0 es la boca) -> girar para que avance hacia +Y
  return body.add(mouth).rotate([-90, 0, 0]).translate([x, y0, z]);
}

function buildTray(base, size) {
  const spec = SIZES[size];
  const [sx, sy, sz] = sizeOf(base);
  const tray = base.scale([spec.x ? spec.x / sx : 1, spec.y ? spec.y / sy : 1, 1]);
  const height = sz;
  const { tip, inner } = measureFront(tray, height);
  const face = tip - FACE_INSET; // la cara plana queda en y = -face
  const back = inner + 0.5; // el bloque llega hasta 0.5 mm antes de la pared interior
  const wall = face - inner;
  if (wall < TRAY_HOLE_DEPTH + 1) throw new Error(`Pared muy delgada en la bandeja ${size}: ${wall.toFixed(1)} mm`);

  const big = 200;
  // 1) quitar todo el borde acanalado de la zona central del frente
  const cut = Manifold.cube([FLAT_WIDTH, big, height + 2]).translate([-FLAT_WIDTH / 2, -face - big, -1]);
  // 2) bloque liso de altura completa (rellena también la parte superior, que es más angosta)
  const block = Manifold.cube([FLAT_WIDTH, face - back, height]).translate([-FLAT_WIDTH / 2, -face, 0]);
  // 3) agujeros
  const holeZ = height / 2;
  const holes = [-1, 1].map((s) => holeAlongY(TRAY_HOLE_D, TRAY_HOLE_DEPTH, (s * HOLE_SPACING) / 2, -face, holeZ));
  const result = tray.subtract(cut).add(block).subtract(Manifold.union(holes));
  return { mesh: result, height, face, inner, length: sizeOf(tray)[0], holeZ };
}

/* ---------- Etiqueta ---------- */
const font = opentype.parse(readFileSync(join(root, "models-src/fonts/LiberationSans-Bold.ttf")).buffer);

/** Contornos del texto (curvas convertidas en polilíneas), en mm, eje Y hacia arriba */
function textContours(str, fontSize) {
  const contours = [];
  let cur = [];
  let last = [0, 0];
  const push = (p) => {
    cur.push([p[0], -p[1]]);
    last = p;
  };
  const steps = 8;
  for (const c of font.getPath(str, 0, 0, fontSize).commands) {
    if (c.type === "M") {
      if (cur.length > 2) contours.push(cur);
      cur = [];
      push([c.x, c.y]);
    } else if (c.type === "L") push([c.x, c.y]);
    else if (c.type === "Q") {
      const p0 = last;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        push([u * u * p0[0] + 2 * u * t * c.x1 + t * t * c.x, u * u * p0[1] + 2 * u * t * c.y1 + t * t * c.y]);
      }
    } else if (c.type === "C") {
      const p0 = last;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const u = 1 - t;
        push([
          u ** 3 * p0[0] + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t ** 3 * c.x,
          u ** 3 * p0[1] + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t ** 3 * c.y,
        ]);
      }
    } else if (c.type === "Z") {
      if (cur.length > 2) contours.push(cur);
      cur = [];
    }
  }
  if (cur.length > 2) contours.push(cur);
  return contours;
}

function buildLabel(tray, widthMm) {
  const w = widthMm;
  const h = tray.height - PLATE_TOP_GAP;
  if (w < FLAT_WIDTH + 6) throw new Error(`La etiqueta debe medir al menos ${FLAT_WIDTH + 6} mm para tapar la zona plana`);

  // Placa: rectángulo redondeado en XY (Y = alto de la etiqueta), espesor en Z
  const outline = CrossSection.square([w - 2 * PLATE_RADIUS, h - 2 * PLATE_RADIUS], true).offset(PLATE_RADIUS, "Round", 2, SEGMENTS);
  // Agujeros ciegos desde la cara de atrás (z = 0). Misma altura que los de la bandeja
  const holeY = tray.holeZ - h / 2;
  const holes = [-1, 1].map((s) => {
    const r = PLATE_HOLE_D / 2;
    const body = Manifold.cylinder(PLATE_HOLE_DEPTH + 1, r, r, SEGMENTS).translate([0, 0, -1]);
    const mouth = Manifold.cylinder(CHAMFER + 1, r + CHAMFER + 1, r, SEGMENTS).translate([0, 0, -1]);
    return body.add(mouth).translate([(s * HOLE_SPACING) / 2, holeY, 0]);
  });
  const plate = outline.extrude(PLATE_THICKNESS).subtract(Manifold.union(holes));

  // Texto: se ajusta al ancho y alto disponibles, centrado
  let textMesh;
  let textInfo;
  const clean = text.trim();
  if (clean) {
    const ref = 10;
    const bb = font.getPath(clean, 0, 0, ref).getBoundingBox();
    const scale = Math.min((w - 2 * PLATE_RADIUS - 6) / (bb.x2 - bb.x1), (h * 0.58) / (bb.y2 - bb.y1));
    const size = ref * scale;
    const b = font.getPath(clean, 0, 0, size).getBoundingBox();
    const glyphs = new CrossSection(textContours(clean, size), "NonZero");
    // centrar (las coordenadas Y del texto vienen invertidas)
    // La malla queda centrada en el origen; la parte se ubica sobre la placa con `offset`
    textMesh = glyphs.translate([-(b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2]).extrude(TEXT_RELIEF);
    textInfo = { text: clean, fontSize: size, thickness: TEXT_RELIEF, hit: [0, 0, PLATE_THICKNESS] };
  }

  // Cilindros con chaflán en las puntas
  const len = TRAY_HOLE_DEPTH + PLATE_HOLE_DEPTH - 0.4;
  const r = DOWEL_D / 2;
  const dowel = Manifold.union([
    Manifold.cylinder(CHAMFER, r - CHAMFER, r, SEGMENTS),
    Manifold.cylinder(len - 2 * CHAMFER, r, r, SEGMENTS).translate([0, 0, CHAMFER]),
    Manifold.cylinder(CHAMFER, r, r - CHAMFER, SEGMENTS).translate([0, 0, len - CHAMFER]),
  ]);
  return { plate, textMesh, textInfo, dowel, w, h, dowelLength: len };
}

/* ---------- Escritura 3MF (compatible con Bambu Studio / OrcaSlicer / PrusaSlicer) ---------- */
function meshXml(id, name, manifold) {
  const m = manifold.getMesh();
  const v = m.vertProperties;
  const n = m.numProp;
  const out = [`<object id="${id}" name="${name}" type="model"><mesh><vertices>`];
  for (let i = 0; i < v.length; i += n) out.push(`<vertex x="${+v[i].toFixed(4)}" y="${+v[i + 1].toFixed(4)}" z="${+v[i + 2].toFixed(4)}"/>`);
  out.push("</vertices><triangles>");
  const t = m.triVerts;
  for (let i = 0; i < t.length; i += 3) out.push(`<triangle v1="${t[i]}" v2="${t[i + 1]}" v3="${t[i + 2]}"/>`);
  out.push("</triangles></mesh></object>");
  return out.join("\n");
}

const xmlAttr = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Configuración de texto editable de Bambu Studio (<text_info> en model_settings.config).
 * Fuente "Arial" en negrita: la malla se genera con Liberation Sans Bold (mismas medidas que Arial),
 * así al editar el texto en Bambu Studio se ve igual.
 */
function textInfoXml(t) {
  const n = (v) => +v.toFixed(4);
  return (
    `<text_info text="${xmlAttr(t.text)}" font_name="Arial" font_version="" style_name="" boldness="0" skew="0" font_index="0" ` +
    `font_size="${n(t.fontSize)}" thickness="${n(t.thickness)}" embeded_depth="0" rotate_angle="0" text_gap="0" ` +
    `horizontal="center" vertical="middle" bold="1" italic="0" surface_text="0" keep_horizontal="0" hit_mesh="0" ` +
    `hit_position="${t.hit.map(n).join(" ")}" hit_normal="0 0 1"/>`
  );
}

/**
 * objects: [{ name, at: [x, y], parts: [{ name, manifold, extruder }] }]
 * Cada objeto es un ensamble de partes (así el texto queda unido a la placa con otro filamento).
 */
function write3mf(file, objects, title) {
  let nextId = 1;
  const resources = [];
  const items = [];
  const settings = [];
  for (const obj of objects) {
    const parts = obj.parts.map((p) => ({ ...p, id: nextId++ }));
    const id = nextId++;
    for (const p of parts) resources.push(meshXml(p.id, p.name, p.manifold));
    resources.push(
      `<object id="${id}" name="${obj.name}" type="model"><components>${parts
        .map((p) => `<component objectid="${p.id}"${p.offset ? ` transform="1 0 0 0 1 0 0 0 1 ${p.offset.join(" ")}"` : ""}/>`)
        .join("")}</components></object>`,
    );
    const m = obj.matrix ?? [1, 0, 0, 0, 1, 0, 0, 0, 1];
    items.push(`<item objectid="${id}" transform="${m.join(" ")} ${obj.at[0]} ${obj.at[1]} ${obj.at[2] ?? 0}" printable="1"/>`);
    settings.push(
      `  <object id="${id}">\n    <metadata key="name" value="${obj.name}"/>\n    <metadata key="extruder" value="${parts[0].extruder}"/>\n` +
        parts
          .map(
            (p) =>
              `    <part id="${p.id}" subtype="normal_part">\n      <metadata key="name" value="${p.name}"/>\n      <metadata key="extruder" value="${p.extruder}"/>\n` +
              (p.textInfo ? `      ${textInfoXml(p.textInfo)}\n` : "") +
              "    </part>\n",
          )
          .join("") +
        "  </object>",
    );
  }
  const model = `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="es-PE" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">
 <metadata name="Title">${title}</metadata>
 <metadata name="Designer">nalita3d</metadata>
 <resources>
${resources.join("\n")}
 </resources>
 <build>
${items.join("\n")}
 </build>
</model>`;
  const zip = zipSync(
    {
      "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
 <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
 <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
 <Default Extension="config" ContentType="text/xml"/>
</Types>`),
      "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
 <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`),
      "3D/3dmodel.model": strToU8(model),
      "Metadata/model_settings.config": strToU8(`<?xml version="1.0" encoding="UTF-8"?>\n<config>\n${settings.join("\n")}\n</config>\n`),
    },
    { level: 6 },
  );
  writeFileSync(file, zip);
  return zip.length;
}

/* ---------- Main ---------- */
mkdirSync(outDir, { recursive: true });
const base = loadTray();
const BED = 128; // centro de la cama (Bambu 256×256)

for (const size of sizes) {
  const tray = buildTray(base, size);
  if (tray.mesh.status() !== "NoError") throw new Error(`Error al generar la bandeja ${size}: ${tray.mesh.status()}`);
  const trayFile = join(outDir, `bandeja-${size}-etiqueta.3mf`);
  const trayBytes = write3mf(trayFile, [{ name: `bandeja-${size}-etiqueta`, at: [BED, BED], parts: [{ name: "bandeja", manifold: tray.mesh, extruder: 1 }] }], `Bandeja ${size} con etiqueta`);

  const width = Math.round(Number(args.width) || tray.length * DEFAULT_WIDTH_RATIO);
  const label = buildLabel(tray, width);
  const plateParts = [{ name: "placa", manifold: label.plate, extruder: 1 }];
  if (label.textMesh)
    plateParts.push({ name: "texto", manifold: label.textMesh, extruder: 2, offset: [0, 0, PLATE_THICKNESS], textInfo: label.textInfo });
  const dowelY = BED - label.h / 2 - 10;
  const labelFile = join(outDir, `etiqueta-${size}.3mf`);
  const labelBytes = write3mf(
    labelFile,
    [
      { name: "etiqueta", at: [BED, BED], parts: plateParts },
      { name: "cilindro-1", at: [BED - 6, dowelY], parts: [{ name: "cilindro", manifold: label.dowel, extruder: 1 }] },
      { name: "cilindro-2", at: [BED + 6, dowelY], parts: [{ name: "cilindro", manifold: label.dowel, extruder: 1 }] },
    ],
    `Etiqueta ${size}: ${text}`,
  );

  if (args.assembly) {
    // Etiqueta parada contra la cara plana: x -> x, z (frente) -> -y, y (alto) -> z
    const stand = [1, 0, 0, 0, 0, 1, 0, -1, 0];
    const asm = join(args.assembly, `ensamble-${size}.3mf`);
    write3mf(
      asm,
      [
        { name: "bandeja", at: [BED, BED], parts: [{ name: "bandeja", manifold: tray.mesh, extruder: 1 }] },
        { name: "etiqueta", at: [BED, BED - tray.face, label.h / 2], matrix: stand, parts: plateParts },
        ...[-1, 1].map((sx, i) => ({
          name: `cilindro-${i + 1}`,
          at: [BED + (sx * HOLE_SPACING) / 2, BED - tray.face + TRAY_HOLE_DEPTH - 0.2, tray.holeZ],
          matrix: stand,
          parts: [{ name: "cilindro", manifold: label.dowel, extruder: 1 }],
        })),
      ],
      `Ensamble ${size}`,
    );
  }

  const [tx, ty, tz] = sizeOf(tray.mesh);
  console.log(`✓ ${size}`);
  console.log(
    `  bandeja: ${tx.toFixed(1)}×${ty.toFixed(1)}×${tz.toFixed(1)} mm · zona plana ${FLAT_WIDTH} mm · pared detrás de la cara ${(tray.face - tray.inner).toFixed(1)} mm · ${(trayBytes / 1e6).toFixed(1)} MB`,
  );
  console.log(
    `  etiqueta: ${label.w}×${label.h.toFixed(1)}×${PLATE_THICKNESS} mm (+${TEXT_RELIEF} texto) "${text}" · 2 cilindros Ø${DOWEL_D}×${label.dowelLength.toFixed(1)} mm · ${(labelBytes / 1e3).toFixed(0)} KB`,
  );
}
