import type { BundleItemRef, Model3D, Product, ProductImage, TextLabelOption } from "@/lib/types";

/** Data mock de la categoría Navidad. */

const photo = (file: string, alt: string, fit?: ProductImage["fit"]): ProductImage => ({
  src: `/assets/christmas/${file}`,
  alt,
  fit,
});

/**
 * Precio estándar de una pieza. Es el precio por pieza que ya está contemplado
 * en el precio de cada pack: las piezas más caras suman la diferencia como recargo.
 */
const PIECE_PRICE = 12;

type Piece = {
  slug: string;
  name: string;
  file: string;
  text: string;
  keywords: string[];
  /** Si no se define, usa PIECE_PRICE */
  price?: number;
  fit?: ProductImage["fit"];
  /** Texto de colección para la descripción */
  collection?: string;
  /** Modelo 3D (generado con scripts/build-3d-models.mjs) */
  model3d?: Model3D;
};

/* ---- Modelos 3D (ids de color: ver src/config/filaments.ts) ---- */

const renoModel: Model3D = {
  src: "/models/reno.glb",
  parts: [
    { id: "color_1", label: "Cuerpo", defaultColor: "marron-madera", editable: true },
    { id: "color_3", label: "Cuernos", defaultColor: "marron-oscuro", editable: true },
    { id: "color_4", label: "Nariz", defaultColor: "rojo", editable: true },
    { id: "color_2", label: "Ojos", defaultColor: "negro" },
  ],
};

const arbolModel: Model3D = {
  src: "/models/arbol-tejido.glb",
  parts: [
    { id: "arbol", label: "Árbol", defaultColor: "verde-oscuro", editable: true },
    { id: "estrella", label: "Estrella", defaultColor: "dorado", editable: true },
  ],
};

const nieveModel: Model3D = {
  src: "/models/muneco-nieve.glb",
  parts: [
    { id: "cuerpo", label: "Cuerpo", defaultColor: "blanco", editable: true },
    { id: "gorro", label: "Gorro", defaultColor: "rojo", editable: true },
    { id: "bufanda", label: "Bufanda", defaultColor: "rojo", editable: true },
    { id: "nariz", label: "Nariz", defaultColor: "naranja", editable: true },
    { id: "detalles", label: "Ojos y botones", defaultColor: "negro" },
  ],
};

const papaNoelModel: Model3D = {
  src: "/models/papa-noel.glb",
  parts: [
    { id: "traje", label: "Traje y gorro", defaultColor: "rojo", editable: true },
    { id: "barba", label: "Barba", defaultColor: "blanco", editable: true },
    { id: "blanco", label: "Pompón y cinturón", defaultColor: "blanco", editable: true },
    { id: "piel", label: "Cara y manos", defaultColor: "beige-claro", editable: true },
    { id: "botas", label: "Botas", defaultColor: "negro", editable: true },
    { id: "ojos", label: "Ojos", defaultColor: "negro" },
  ],
};

const angelModel: Model3D = {
  src: "/models/angel.glb",
  parts: [
    { id: "cuerpo", label: "Vestido y alas", defaultColor: "blanco", editable: true },
    { id: "pelo", label: "Pelo", defaultColor: "marron-madera", editable: true },
    { id: "aureola", label: "Aureola", defaultColor: "dorado", editable: true },
    { id: "piel", label: "Cara y manos", defaultColor: "beige-claro", editable: true },
    { id: "ojos", label: "Ojos", defaultColor: "negro" },
  ],
};

const galletaModel: Model3D = {
  src: "/models/galleta.glb",
  parts: [
    { id: "cuerpo", label: "Galleta", defaultColor: "marron-madera", editable: true },
    { id: "glaseado", label: "Glaseado", defaultColor: "blanco", editable: true },
    { id: "botones", label: "Botones", defaultColor: "rojo", editable: true },
    { id: "detalles", label: "Ojos y boca", defaultColor: "negro" },
  ],
};

const osoModel: Model3D = {
  src: "/models/oso-polar.glb",
  parts: [
    { id: "cuerpo", label: "Cuerpo", defaultColor: "blanco", editable: true },
    { id: "gorro", label: "Gorro", defaultColor: "rojo", editable: true },
    { id: "borde_gorro", label: "Borde del gorro", defaultColor: "blanco", editable: true },
    { id: "detalles", label: "Ojos y nariz", defaultColor: "negro" },
  ],
};

const nacimientoModel: Model3D = {
  src: "/models/nacimiento.glb",
  parts: [{ id: "nacimiento", label: "Color", defaultColor: "beige-claro", editable: true }],
};

const arbolGrandeModel: Model3D = {
  src: "/models/arbol-grande.glb",
  parts: [
    { id: "arbol", label: "Árbol", defaultColor: "verde-oscuro", editable: true },
    { id: "estrella", label: "Estrella", defaultColor: "dorado", editable: true },
    { id: "base", label: "Base", defaultColor: "marron-madera", editable: true },
  ],
};

/** Bandejas: chica 155×97 mm, mediana 197×123 mm, grande 235×123 mm (generadas desde bandeja.3mf) */
const trayModel = (size: "chica" | "mediana" | "grande"): Model3D => ({
  src: `/models/bandeja-${size}.glb`,
  parts: [{ id: "color_1", label: "Bandeja", defaultColor: "beige-claro", editable: true }],
  // Versión "con etiqueta": zona plana fija de 50 mm en el centro del frente (sin acanalado,
  // al ras de la punta de las acanaladuras),
  // tapada por una etiqueta de la mitad del largo de la bandeja. Archivos de impresión:
  // scripts/build-label-print.mjs
  labelMount: { cutDepthMm: 0, plateWidthRatio: 0.5, flatWidthMm: 50 },
});

/** Bandeja con etiqueta: mismo tamaño, frente plano con dos agujeros y etiqueta con texto */
const trayLabel: TextLabelOption = {
  name: "Con etiqueta",
  description: "La bandeja lleva un frente plano con dos agujeros donde se inserta una etiqueta con tu texto.",
  maxLength: 22,
  price: 5, // TODO: confirmar precio de la etiqueta
  placeholder: "Ej: Familia Pérez 2026",
  plateColor: "blanco",
  textColor: "rojo",
};

const TEJIDO = "Forma parte de nuestra colección navideña de muñecos con textura tejida, impresos en 3D.";

const figures: Piece[] = [
  { slug: "muneco-arbol", name: "Arbolito Tejido", file: "arbol.png", text: "Arbolito verde con textura tejida y estrella dorada.", keywords: ["arbol", "pino", "estrella", "verde"], model3d: arbolModel },
  { slug: "muneco-papa-noel", name: "Papá Noel Tejido", file: "papanoel.png", text: "Papá Noel con textura tejida, listo para repartir regalos.", keywords: ["papa noel", "santa", "santa claus", "rojo"], model3d: papaNoelModel },
  { slug: "muneco-angel", name: "Ángel Tejido", file: "angel.png", text: "Angelito con aureola dorada y alas de textura tejida.", keywords: ["angel", "angelito", "aureola", "pesebre"], model3d: angelModel },
  { slug: "muneco-reno", name: "Reno Tejido", file: "reno.png", text: "Reno con astas y textura tejida, el ayudante favorito.", keywords: ["reno", "rodolfo", "rudolph", "astas"], model3d: renoModel },
  { slug: "muneco-nieve", name: "Muñeco de Nieve Tejido", file: "snowman.png", text: "Muñeco de nieve con bufanda y textura tejida.", keywords: ["muñeco de nieve", "snowman", "nieve", "bufanda"], model3d: nieveModel },
  { slug: "muneco-oso", name: "Osito Polar Tejido", file: "oso.png", text: "Osito polar blanco con gorro navideño.", keywords: ["oso", "osito", "polar", "gorro"], model3d: osoModel },
  { slug: "muneco-galleta", name: "Galleta de Jengibre Tejida", file: "galleta.png", text: "Galletita de jengibre sonriente con botones rojos.", keywords: ["galleta", "jengibre", "gingerbread", "galletita"], model3d: galletaModel },
  {
    slug: "arbol-navideno-grande",
    name: "Árbol Navideño Grande",
    file: "arbol-grande.png",
    text: "Árbol decorativo alto con capas onduladas y estrella en la punta.",
    keywords: ["arbol", "pino", "grande", "estrella"],
    price: 14, // en los packs suma +S/ 2 (14 − 12)
    fit: "contain",
    collection: "Pieza decorativa impresa en 3D con acabado mate.",
    model3d: arbolGrandeModel,
  },
  {
    slug: "nacimiento",
    name: "Nacimiento",
    file: "nacimiento.png",
    text: "Sagrada Familia en una sola pieza, de líneas suaves y estilo minimalista.",
    keywords: ["nacimiento", "pesebre", "belen", "sagrada familia", "jesus", "maria", "jose", "niño dios"],
    price: 22, // pieza más grande: en los packs ocupa 2 lugares (ver BIG_PIECES)
    collection: "Pieza de mayor tamaño, impresa en 3D con acabado tipo piedra.",
    model3d: nacimientoModel,
  },
];

const figureProducts: Product[] = figures.map((f, i) => ({
  id: `p-${f.slug}`,
  slug: f.slug,
  name: f.name,
  shortDescription: f.text,
  description: `${f.text} ${f.collection ?? TEJIDO} Se vende por unidad o combinado en packs con bandeja: elige tus favoritos y arma tu propia escena.`,
  categorySlugs: ["navidad"],
  price: f.price ?? PIECE_PRICE,
  images: [photo(f.file, f.name, f.fit)],
  model3d: f.model3d,
  options: [],
  variants: [],
  keywords: [...f.keywords, "navidad", "navideño", "adorno", "decoracion navideña", ...(f.collection ? [] : ["muñeco", "tejido"])],
  specs: [{ label: "Material", value: "PLA" }],
  leadTimeDays: 3,
  createdAt: `2026-10-${String(10 + i).padStart(2, "0")}`,
}));

const TRAY = "bandeja-navidena";
const trayPhoto = photo("bandeja.png", "Bandeja con textura acanalada", "contain");

const tray: Product = {
  id: "p-bandeja-navidena",
  slug: TRAY,
  name: "Bandeja Decorativa",
  shortDescription: "Bandeja ovalada acanalada para exhibir tus piezas navideñas. 3 tamaños.",
  description:
    "Bandeja ovalada con borde acanalado, ideal como base para tus muñecos navideños o como bandeja decorativa todo el año. Disponible en 3 tamaños según cuántas piezas quieras ubicar.",
  categorySlugs: ["navidad", "decoracion"],
  price: 13,
  images: [trayPhoto],
  options: [{ name: "Tamaño", values: ["Chica (2 piezas)", "Mediana (3 piezas)", "Grande (5 piezas)"] }],
  variants: [
    { id: "v-bn-chica", sku: "BN-CH", name: "Chica (2 piezas)", options: { Tamaño: "Chica (2 piezas)" }, model3d: trayModel("chica") },
    { id: "v-bn-mediana", sku: "BN-MD", name: "Mediana (3 piezas)", options: { Tamaño: "Mediana (3 piezas)" }, price: 15, model3d: trayModel("mediana") },
    { id: "v-bn-grande", sku: "BN-GR", name: "Grande (5 piezas)", options: { Tamaño: "Grande (5 piezas)" }, price: 19, model3d: trayModel("grande") },
  ],
  keywords: ["bandeja", "base", "ovalada", "navidad", "exhibidor", "decoracion", "etiqueta", "nombre", "personalizada"],
  labelOption: trayLabel,
  leadTimeDays: 3,
  createdAt: "2026-10-05",
};

/** Piezas que ocupan más de un lugar en la bandeja */
const BIG_PIECES: Record<string, number> = { nacimiento: 2 };

const allFigures: BundleItemRef[] = figures.map((f) => ({ productSlug: f.slug, slots: BIG_PIECES[f.slug] }));

/** Tamaños de pack: el precio es el del pack completo (bandeja + piezas estándar de S/ 12) */
const traySizes = [
  { id: "chica", name: "Bandeja chica", slots: 2, price: 35, base: { productSlug: TRAY, variantId: "v-bn-chica" } },
  { id: "mediana", name: "Bandeja mediana", slots: 3, price: 40, base: { productSlug: TRAY, variantId: "v-bn-mediana" } },
  { id: "grande", name: "Bandeja grande", slots: 5, price: 65, base: { productSlug: TRAY, variantId: "v-bn-grande" } },
];

const packLabel = { singular: "pieza", plural: "piezas" };

const customPack: Product = {
  id: "p-pack-navidad-arma",
  slug: "arma-tu-pack-navideno",
  name: "Arma tu Pack Navideño",
  shortDescription: "Elige la bandeja y combina tus piezas favoritas: muñecos, árbol o nacimiento.",
  description:
    "Crea tu propia escena navideña: elige una bandeja (2, 3 o 5 lugares) y complétala con las piezas que más te gusten: muñecos tejidos, árbol grande o nacimiento. Puedes repetir piezas. El nacimiento es más grande y ocupa 2 lugares. El precio del pack incluye piezas de S/ 12; las piezas especiales (como el árbol grande) suman solo la diferencia, así siempre ahorras frente a comprar por separado.",
  categorySlugs: ["navidad"],
  price: 35,
  images: [{ src: "/products/navidad/arma-tu-pack.png", alt: "Muñecos navideños tejidos y bandeja" }],
  options: [],
  variants: [],
  keywords: ["pack", "combo", "kit", "set", "bandeja", "navidad", "regalo", "muñecos", "nacimiento", "armar", "personalizado"],
  bundle: {
    items: allFigures,
    sizes: traySizes,
    allowRepeats: true,
    includedItemPrice: PIECE_PRICE,
    itemLabel: packLabel,
    labelOption: trayLabel,
    // Al abrir el armador ya se ve un pack de ejemplo (el cliente lo puede cambiar)
    initial: {
      sizeId: "mediana",
      items: [{ productSlug: "muneco-arbol" }, { productSlug: "muneco-papa-noel" }, { productSlug: "muneco-angel" }],
    },
  },
  featured: true,
  isNew: true,
  leadTimeDays: 4,
  createdAt: "2026-10-20",
};

const classicPack: Product = {
  id: "p-pack-navidad-clasico",
  slug: "pack-navideno-clasico",
  name: "Pack Navideño Clásico",
  shortDescription: "Arbolito, Papá Noel y Ángel sobre bandeja mediana.",
  description:
    "Nuestro pack más tradicional: Arbolito, Papá Noel y Ángel tejidos sobre una bandeja mediana. Listo para decorar la mesa, el recibidor o regalar.",
  categorySlugs: ["navidad"],
  price: 40,
  // TODO: reemplazar por la foto real del pack armado
  images: [{ src: "/products/navidad/pack-clasico.png", alt: "Pack navideño clásico: arbolito, Papá Noel y ángel con bandeja" }],
  options: [],
  variants: [],
  keywords: ["pack", "combo", "set", "clasico", "navidad", "regalo", "arbol", "papa noel", "angel", "bandeja"],
  bundle: {
    items: allFigures,
    sizes: traySizes,
    allowRepeats: true,
    includedItemPrice: PIECE_PRICE,
    itemLabel: packLabel,
    labelOption: trayLabel,
    preset: {
      sizeId: "mediana",
      items: [{ productSlug: "muneco-arbol" }, { productSlug: "muneco-papa-noel" }, { productSlug: "muneco-angel" }],
    },
    customizeSlug: customPack.slug,
  },
  featured: true,
  leadTimeDays: 4,
  createdAt: "2026-10-21",
};

export const christmasProducts: Product[] = [classicPack, customPack, ...figureProducts, tray];
