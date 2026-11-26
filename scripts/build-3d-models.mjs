// Convierte archivos .3mf (Bambu Studio / PrusaSlicer) o .glb pesados en modelos .glb livianos para la web.
//
// Uso:  node scripts/build-3d-models.mjs
//
// - Lee la lista de modelos de models-src/models.json
// - Agrupa las partes en "partes coloreables" para la web:
//     .3mf: por filamento/extrusor (ej. reno: cuerpo, ojos, cuernos, nariz)
//     .glb: por nombre de nodo según `groups` en models.json (o por color de material)
// - Opciones por modelo en models.json:
//     targetTriangles  cantidad máxima de triángulos
//     rotateY          grados para que el frente mire hacia +Z
//     fitMm            { "x": largo, "z": ancho } en mm: escala el modelo a esas medidas
//                      (sirve para generar varios tamaños desde un mismo archivo)
//     groups           { "idParte": ["nodo1", "nodo2"] } (sólo .glb)
// - Reduce la cantidad de triángulos (los .3mf de impresión pesan decenas de MB)
// - Comprime con meshopt y guarda en public/models/<out>
// - Imprime el bloque `model3d` sugerido para pegar en la data del producto
//
// Los .3mf originales NO van en public/ (se podrían descargar desde la web).

import { readFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { MeshoptSimplifier, MeshoptEncoder } from "meshoptimizer";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { meshopt } from "@gltf-transform/functions";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const srcDir = join(root, "models-src");
const outDir = join(root, "public", "models");
const models = JSON.parse(readFileSync(join(srcDir, "models.json"), "utf8"));

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;

/* ---------------------------------------------------------------- 3MF ---- */

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/** Matriz 3MF "m00 m01 m02 m10 m11 m12 m20 m21 m22 m30 m31 m32" (convención fila) */
const parseMatrix = (s) => (s ? s.trim().split(/\s+/).map(Number) : [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
const applyMatrix = (m, x, y, z) => [
  x * m[0] + y * m[3] + z * m[6] + m[9],
  x * m[1] + y * m[4] + z * m[7] + m[10],
  x * m[2] + y * m[5] + z * m[8] + m[11],
];
/** a luego b */
const multiply = (a, b) => {
  const r = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      const ar = row < 3 ? [a[row * 3], a[row * 3 + 1], a[row * 3 + 2]] : [a[9], a[10], a[11]];
      r.push(ar[0] * b[col] + ar[1] * b[3 + col] + ar[2] * b[6 + col] + (row === 3 ? b[9 + col] : 0));
    }
  }
  return r;
};

/** Devuelve { [objectId]: { mesh?: {positions, indices}, components?: [...] } } de un archivo .model */
function parseModelFile(xml) {
  const objects = {};
  const objectRe = /<object\b([^>]*)>([\s\S]*?)<\/object>/g;
  for (const [, head, body] of xml.matchAll(objectRe)) {
    const id = attr(head, "id");
    if (body.includes("<mesh")) {
      const verts = [];
      for (const [, x, y, z] of body.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)) verts.push(+x, +y, +z);
      const tris = [];
      for (const [, a, b, c] of body.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)) tris.push(+a, +b, +c);
      objects[id] = { mesh: { positions: new Float32Array(verts), indices: new Uint32Array(tris) } };
    } else {
      const components = [...body.matchAll(/<component\b([^>]*)\/>/g)].map(([, c]) => ({
        path: attr(c, "p:path"),
        objectId: attr(c, "objectid"),
        transform: parseMatrix(attr(c, "transform")),
      }));
      objects[id] = { components };
    }
  }
  return objects;
}

/** Info de partes (nombre, extrusor) desde Metadata/model_settings.config */
function parseModelSettings(xml) {
  const parts = {};
  const objectExtruder = {};
  for (const [, head, body] of xml.matchAll(/<object\b([^>]*)>([\s\S]*?)<\/object>/g)) {
    const objId = attr(head, "id");
    objectExtruder[objId] = Number(body.match(/<metadata key="extruder" value="(\d+)"\/>/)?.[1] ?? 1);
    for (const [, phead, pbody] of body.matchAll(/<part\b([^>]*)>([\s\S]*?)<\/part>/g)) {
      parts[`${objId}:${attr(phead, "id")}`] = {
        name: pbody.match(/<metadata key="name" value="([^"]*)"\/>/)?.[1],
        extruder: Number(pbody.match(/<metadata key="extruder" value="(\d+)"\/>/)?.[1] ?? objectExtruder[objId]),
        subtype: attr(phead, "subtype"),
      };
    }
  }
  return { parts, objectExtruder };
}

function read3mf(file) {
  const zip = unzipSync(readFileSync(file));
  const text = (p) => (zip[p.replace(/^\//, "")] ? strFromU8(zip[p.replace(/^\//, "")]) : undefined);

  const mainPath = "3D/3dmodel.model";
  const fileCache = { [mainPath]: parseModelFile(text(mainPath)) };
  const getFile = (p) => (fileCache[p] ??= parseModelFile(text(p)));

  const settingsXml = text("Metadata/model_settings.config");
  const settings = settingsXml ? parseModelSettings(settingsXml) : { parts: {}, objectExtruder: {} };
  let colors = ["#cccccc"];
  try {
    colors = JSON.parse(text("Metadata/project_settings.config")).filament_colour ?? colors;
  } catch {
    /* sin config de proyecto */
  }

  const main = text(mainPath);
  const items = [...main.matchAll(/<item\b([^>]*)\/>/g)].map(([, it]) => ({
    objectId: attr(it, "objectid"),
    transform: parseMatrix(attr(it, "transform")),
  }));

  // Recolecta mallas ya transformadas, con su parte/extrusor
  const pieces = [];
  for (const item of items) {
    const obj = fileCache[mainPath][item.objectId];
    const entries = obj.mesh
      ? [{ mesh: obj.mesh, transform: item.transform, key: `${item.objectId}:1` }]
      : obj.components.map((c) => ({
          mesh: getFile((c.path ?? `/${mainPath}`).replace(/^\//, ""))[c.objectId].mesh,
          transform: multiply(c.transform, item.transform),
          key: `${item.objectId}:${c.objectId}`,
        }));
    for (const e of entries) {
      const part = settings.parts[e.key];
      if (part && part.subtype && part.subtype !== "normal_part") continue; // modificadores, soportes, etc.
      const extruder = part?.extruder ?? settings.objectExtruder[item.objectId] ?? 1;
      pieces.push({ ...e, name: part?.name ?? `parte_${e.key}`, extruder });
    }
  }
  return { pieces, colors };
}

/* ------------------------------------------------------------- build ---- */

/** Grupos desde un .3mf: uno por extrusor. Posiciones en metros, Y arriba. */
function groupsFrom3mf(file) {
  const { pieces, colors } = read3mf(file);
  const groups = new Map();
  for (const p of pieces) {
    const g = groups.get(p.extruder) ?? { id: `color_${p.extruder}`, names: new Set(), positions: [], indices: [], offset: 0, color: colors[p.extruder - 1] ?? "#cccccc" };
    g.names.add(p.name.replace(/[_\s-]*\d+$/, ""));
    const { positions, indices } = p.mesh;
    for (let i = 0; i < positions.length; i += 3) {
      // 3MF es Z-arriba en mm -> glTF Y-arriba en metros
      const [x, y, z] = applyMatrix(p.transform, positions[i], positions[i + 1], positions[i + 2]);
      g.positions.push(x / 1000, z / 1000, -y / 1000);
    }
    for (let i = 0; i < indices.length; i++) g.indices.push(indices[i] + g.offset);
    g.offset += positions.length / 3;
    groups.set(p.extruder, g);
  }
  return [...groups.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Grupos desde un .glb: por `groups` (nombre de nodo) o por color de material */
async function groupsFromGlb(file, groupsConfig) {
  const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(file);
  const toHex = (f) => "#" + f.slice(0, 3).map((c) => Math.round(Math.pow(c, 1 / 2.2) * 255).toString(16).padStart(2, "0")).join("");
  const nodeGroup = new Map(Object.entries(groupsConfig ?? {}).flatMap(([id, names]) => names.map((n) => [n, id])));
  const groups = new Map();
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const m = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const color = toHex(prim.getMaterial()?.getBaseColorFactor() ?? [0.8, 0.8, 0.8, 1]);
      const id = nodeGroup.get(node.getName()) ?? (groupsConfig ? node.getName() : `color_${color.slice(1)}`);
      const g = groups.get(id) ?? { id, names: new Set(), positions: [], indices: [], offset: 0, color };
      g.names.add(node.getName());
      const pos = prim.getAttribute("POSITION");
      const v = [];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, v);
        g.positions.push(
          m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
          m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
          m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14],
        );
      }
      const idx = prim.getIndices()?.getArray() ?? Uint32Array.from({ length: pos.getCount() }, (_, i) => i);
      for (let i = 0; i < idx.length; i++) g.indices.push(idx[i] + g.offset);
      g.offset += pos.getCount();
      groups.set(id, g);
    }
  }
  const order = Object.keys(groupsConfig ?? {});
  return [...groups.values()].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

for (const model of models) {
  const file = join(srcDir, model.src);
  const groupList = model.src.endsWith(".3mf") ? groupsFrom3mf(file) : await groupsFromGlb(file, model.groups);

  // Rotación (para que el frente mire a +Z, como el resto de los modelos)
  if (model.rotateY) {
    const a = (model.rotateY * Math.PI) / 180;
    const [c, sn] = [Math.cos(a), Math.sin(a)];
    for (const g of groupList)
      for (let i = 0; i < g.positions.length; i += 3) {
        const [x, z] = [g.positions[i], g.positions[i + 2]];
        g.positions[i] = x * c + z * sn;
        g.positions[i + 2] = -x * sn + z * c;
      }
  }

  // Centrar: base en y=0, centro en x/z
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const g of groupList)
    for (let i = 0; i < g.positions.length; i++) {
      min[i % 3] = Math.min(min[i % 3], g.positions[i]);
      max[i % 3] = Math.max(max[i % 3], g.positions[i]);
    }
  const center = [(min[0] + max[0]) / 2, min[1], (min[2] + max[2]) / 2];

  // Escalar a medidas pedidas (mm), ej. bandeja chica / grande desde la mediana
  const fit = [
    model.fitMm?.x ? model.fitMm.x / 1000 / (max[0] - min[0]) : 1,
    model.fitMm?.y ? model.fitMm.y / 1000 / (max[1] - min[1]) : 1,
    model.fitMm?.z ? model.fitMm.z / 1000 / (max[2] - min[2]) : 1,
  ];
  for (let i = 0; i < 3; i++) {
    const c = i === 1 ? min[1] : center[i];
    min[i] = c + (min[i] - c) * fit[i];
    max[i] = c + (max[i] - c) * fit[i];
  }

  const totalTris = groupList.reduce((n, g) => n + g.indices.length / 3, 0);
  const ratio = Math.min(1, model.targetTriangles / totalTris);

  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(model.out);
  const parts = [];
  let finalTris = 0;

  for (const g of groupList) {
    const positions = new Float32Array(g.positions);
    for (let i = 0; i < positions.length; i++) positions[i] = (positions[i] - center[i % 3]) * fit[i % 3];
    const indices = new Uint32Array(g.indices);
    const tris = indices.length / 3;
    const target = Math.min(tris, Math.max(1500, Math.round(tris * ratio))) * 3;
    const [simplified] =
      target < indices.length ? MeshoptSimplifier.simplify(indices, positions, 3, target, 0.01, ["LockBorder"]) : [indices];

    // Compactar vértices no usados
    const remap = new Int32Array(positions.length / 3).fill(-1);
    const newPos = [];
    const newIdx = new Uint32Array(simplified.length);
    for (let i = 0; i < simplified.length; i++) {
      const v = simplified[i];
      if (remap[v] === -1) {
        remap[v] = newPos.length / 3;
        newPos.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
      }
      newIdx[i] = remap[v];
    }
    finalTris += newIdx.length / 3;

    const { id, color } = g;
    const rgb = [1, 3, 5].map((o) => Math.pow(parseInt(color.slice(o, o + 2), 16) / 255, 2.2));
    const material = doc.createMaterial(id).setBaseColorFactor([...rgb, 1]).setRoughnessFactor(0.75).setMetallicFactor(0);
    const prim = doc
      .createPrimitive()
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(newPos)).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(newIdx).setBuffer(buffer))
      .setMaterial(material);
    const mesh = doc.createMesh(id).addPrimitive(prim);
    scene.addChild(doc.createNode(id).setMesh(mesh));
    parts.push({ id, label: [...g.names].join(" / "), defaultColor: color });
  }

  await doc.transform(meshopt({ encoder: MeshoptEncoder, level: "medium" }));
  const io = new NodeIO()
    .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, model.out);
  await io.write(outPath, doc);

  const size = [0, 1, 2].map((i) => Math.round((max[i] - min[i]) * 1000));
  console.log(
    `\n✓ ${model.out}: ${totalTris.toLocaleString()} → ${finalTris.toLocaleString()} triángulos, ` +
      `${(statSync(outPath).size / 1024 / 1024).toFixed(2)} MB, medidas ${size[0]}×${size[2]}×${size[1]} mm (ancho×prof×alto)`,
  );
  console.log("  model3d sugerido:");
  console.log(
    JSON.stringify({ src: `/models/${model.out}`, parts: parts.map((p) => ({ ...p, editable: true })) }, null, 2)
      .split("\n")
      .map((l) => "  " + l)
      .join("\n"),
  );
}
