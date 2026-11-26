import type { Product, ProductImage } from "@/lib/types";
import { christmasProducts } from "./products-christmas";

/** Helper para armar rutas de imágenes mock: /products/<slug>/<file>.svg */
const img = (slug: string, file: string, alt: string): ProductImage => ({
  src: `/products/${slug}/${file}.svg`,
  alt,
});

/**
 * Data mock — reemplazar por consulta a base de datos más adelante.
 *
 * Reglas de herencia:
 *  - Si una variante no define `price`, usa `product.price`.
 *  - Si una variante no define `images` (o está vacío), usa `product.images`.
 */
const generalProducts: Product[] = [
  {
    id: "p-maceta-geo",
    slug: "maceta-geometrica",
    name: "Maceta Geométrica",
    shortDescription: "Maceta facetada con plato y drenaje, ideal para suculentas.",
    description:
      "Nuestra maceta más vendida. Diseño low-poly con caras facetadas que juegan con la luz, plato inferior desmontable y orificio de drenaje. Impresa en PLA de alta calidad, liviana y resistente. Perfecta para suculentas, cactus y plantas pequeñas de interior.",
    categorySlugs: ["macetas", "decoracion"],
    price: 8500,
    images: [
      img("maceta-geometrica", "rosa-1", "Maceta geométrica rosa"),
      img("maceta-geometrica", "blanco-1", "Maceta geométrica blanca"),
    ],
    options: [
      { name: "Color", values: ["Rosa", "Blanco", "Verde"] },
      { name: "Tamaño", values: ["Chica", "Mediana", "Grande"] },
    ],
    variants: [
      { id: "v-mg-rosa-ch", sku: "MG-ROS-CH", name: "Rosa / Chica", options: { Color: "Rosa", Tamaño: "Chica" }, images: [img("maceta-geometrica", "rosa-1", "Maceta geométrica rosa chica")], keywords: ["rosa", "pink"] },
      { id: "v-mg-rosa-md", sku: "MG-ROS-MD", name: "Rosa / Mediana", options: { Color: "Rosa", Tamaño: "Mediana" }, price: 11500, images: [img("maceta-geometrica", "rosa-1", "Maceta geométrica rosa mediana")], keywords: ["rosa"] },
      { id: "v-mg-rosa-gr", sku: "MG-ROS-GR", name: "Rosa / Grande", options: { Color: "Rosa", Tamaño: "Grande" }, price: 15900, images: [img("maceta-geometrica", "rosa-1", "Maceta geométrica rosa grande")], keywords: ["rosa"] },
      { id: "v-mg-blanco-ch", sku: "MG-BLA-CH", name: "Blanco / Chica", options: { Color: "Blanco", Tamaño: "Chica" }, images: [img("maceta-geometrica", "blanco-1", "Maceta geométrica blanca chica")], keywords: ["blanco", "nordico"] },
      { id: "v-mg-blanco-md", sku: "MG-BLA-MD", name: "Blanco / Mediana", options: { Color: "Blanco", Tamaño: "Mediana" }, price: 11500, images: [img("maceta-geometrica", "blanco-1", "Maceta geométrica blanca mediana")], keywords: ["blanco"] },
      { id: "v-mg-blanco-gr", sku: "MG-BLA-GR", name: "Blanco / Grande", options: { Color: "Blanco", Tamaño: "Grande" }, price: 15900, available: false, images: [img("maceta-geometrica", "blanco-1", "Maceta geométrica blanca grande")] },
      { id: "v-mg-verde-ch", sku: "MG-VER-CH", name: "Verde / Chica", options: { Color: "Verde", Tamaño: "Chica" }, images: [img("maceta-geometrica", "verde-1", "Maceta geométrica verde chica")], keywords: ["verde", "salvia"] },
      { id: "v-mg-verde-md", sku: "MG-VER-MD", name: "Verde / Mediana", options: { Color: "Verde", Tamaño: "Mediana" }, price: 11500, images: [img("maceta-geometrica", "verde-1", "Maceta geométrica verde mediana")], keywords: ["verde"] },
    ],
    keywords: ["maceta", "planta", "suculenta", "cactus", "low poly", "geometrica", "jardin", "interior", "regalo"],
    specs: [
      { label: "Material", value: "PLA biodegradable" },
      { label: "Medidas", value: "Chica 8cm · Mediana 12cm · Grande 16cm" },
      { label: "Incluye", value: "Plato de drenaje" },
    ],
    featured: true,
    leadTimeDays: 3,
    createdAt: "2026-09-01",
  },
  {
    id: "p-maceta-carita",
    slug: "maceta-carita",
    name: "Maceta Carita Feliz",
    shortDescription: "Maceta con carita sonriente que le da vida a tu planta.",
    description:
      "Una maceta con personalidad: carita sonriente en relieve y acabado mate. Cuando la planta crece, ¡parece su pelo! Incluye orificio de drenaje.",
    categorySlugs: ["macetas"],
    price: 9900,
    compareAtPrice: 12000,
    images: [img("maceta-carita", "base-1", "Maceta carita feliz"), img("maceta-carita", "base-2", "Maceta carita feliz con planta")],
    options: [{ name: "Color", values: ["Celeste", "Amarillo", "Lila"] }],
    variants: [
      { id: "v-mc-celeste", sku: "MC-CEL", name: "Celeste", options: { Color: "Celeste" }, images: [img("maceta-carita", "celeste-1", "Maceta carita celeste")], keywords: ["celeste", "azul"] },
      { id: "v-mc-amarillo", sku: "MC-AMA", name: "Amarillo", options: { Color: "Amarillo" }, keywords: ["amarillo"] },
      { id: "v-mc-lila", sku: "MC-LIL", name: "Lila", options: { Color: "Lila" }, images: [img("maceta-carita", "lila-1", "Maceta carita lila")], keywords: ["lila", "violeta"] },
    ],
    keywords: ["maceta", "cara", "carita", "sonrisa", "kawaii", "planta", "divertida", "regalo"],
    specs: [
      { label: "Material", value: "PLA mate" },
      { label: "Medidas", value: "10 x 10 x 9 cm" },
    ],
    isNew: true,
    leadTimeDays: 3,
    createdAt: "2026-11-10",
  },
  {
    id: "p-llavero-nombre",
    slug: "llavero-personalizado",
    name: "Llavero Personalizado con Nombre",
    shortDescription: "Llavero con el nombre o palabra que quieras, en dos colores.",
    description:
      "Llavero bicolor con el nombre, inicial o palabra que elijas (hasta 10 letras). Ideal para regalos, souvenirs de cumpleaños o eventos. Al finalizar el pedido coordinamos el texto por WhatsApp.",
    categorySlugs: ["llaveros"],
    price: 2500,
    images: [img("llavero-personalizado", "base-1", "Llavero personalizado con nombre")],
    options: [{ name: "Combinación", values: ["Negro/Blanco", "Rosa/Blanco", "Azul/Amarillo"] }],
    variants: [
      { id: "v-ln-negro", sku: "LN-NEG", name: "Negro/Blanco", options: { Combinación: "Negro/Blanco" }, keywords: ["negro"] },
      { id: "v-ln-rosa", sku: "LN-ROS", name: "Rosa/Blanco", options: { Combinación: "Rosa/Blanco" }, images: [img("llavero-personalizado", "rosa-1", "Llavero rosa y blanco")], keywords: ["rosa"] },
      { id: "v-ln-azul", sku: "LN-AZU", name: "Azul/Amarillo", options: { Combinación: "Azul/Amarillo" }, images: [img("llavero-personalizado", "azul-1", "Llavero azul y amarillo")], keywords: ["azul", "amarillo"] },
    ],
    keywords: ["llavero", "nombre", "personalizado", "souvenir", "regalo", "cumpleaños", "evento", "letras"],
    customizable: true,
    featured: true,
    leadTimeDays: 2,
    createdAt: "2026-08-15",
  },
  {
    id: "p-llavero-gatito",
    slug: "llavero-gatito",
    name: "Llavero Gatito",
    shortDescription: "Gatito articulado que se mueve. ¡Adictivo!",
    description:
      "Llavero con forma de gatito con cuerpo articulado impreso en una sola pieza (print-in-place). Se mueve como un fidget toy y es súper liviano.",
    categorySlugs: ["llaveros", "figuras"],
    price: 3200,
    images: [img("llavero-gatito", "naranja-1", "Llavero gatito articulado")],
    options: [{ name: "Color", values: ["Naranja", "Negro", "Multicolor"] }],
    variants: [
      { id: "v-lg-naranja", sku: "LG-NAR", name: "Naranja", options: { Color: "Naranja" }, keywords: ["naranja"] },
      { id: "v-lg-negro", sku: "LG-NEG", name: "Negro", options: { Color: "Negro" }, images: [img("llavero-gatito", "negro-1", "Llavero gatito negro")], keywords: ["negro"] },
      { id: "v-lg-multi", sku: "LG-MUL", name: "Multicolor", options: { Color: "Multicolor" }, price: 3900, images: [img("llavero-gatito", "multicolor-1", "Llavero gatito multicolor")], keywords: ["arcoiris", "multicolor", "silk"] },
    ],
    keywords: ["llavero", "gato", "gatito", "michi", "articulado", "fidget", "flexi", "mascota"],
    isNew: true,
    leadTimeDays: 2,
    createdAt: "2026-11-05",
  },
  {
    id: "p-dragon",
    slug: "dragon-articulado",
    name: "Dragón Articulado",
    shortDescription: "Dragón flexible de 30 cm con escamas detalladas.",
    description:
      "Dragón articulado de cuerpo completo, impreso en una sola pieza sin ensamblado. Cada segmento se mueve libremente. Una pieza de colección y un juguete sensorial a la vez. Disponible en filamento silk con brillo metalizado.",
    categorySlugs: ["figuras"],
    price: 18500,
    images: [img("dragon-articulado", "verde-1", "Dragón articulado verde"), img("dragon-articulado", "detalle-1", "Detalle de escamas del dragón")],
    options: [{ name: "Color", values: ["Verde esmeralda", "Silk dorado", "Silk arcoíris"] }],
    variants: [
      { id: "v-dr-verde", sku: "DR-VER", name: "Verde esmeralda", options: { Color: "Verde esmeralda" }, keywords: ["verde"] },
      { id: "v-dr-dorado", sku: "DR-DOR", name: "Silk dorado", options: { Color: "Silk dorado" }, price: 21000, images: [img("dragon-articulado", "dorado-1", "Dragón articulado dorado")], keywords: ["dorado", "oro", "silk"] },
      { id: "v-dr-arcoiris", sku: "DR-ARC", name: "Silk arcoíris", options: { Color: "Silk arcoíris" }, price: 23500, images: [img("dragon-articulado", "arcoiris-1", "Dragón articulado arcoíris")], keywords: ["arcoiris", "multicolor", "silk"] },
    ],
    keywords: ["dragon", "articulado", "flexi", "figura", "coleccionable", "fantasia", "juguete", "fidget"],
    specs: [
      { label: "Largo", value: "30 cm" },
      { label: "Material", value: "PLA / PLA Silk" },
    ],
    featured: true,
    leadTimeDays: 4,
    createdAt: "2026-07-20",
  },
  {
    id: "p-organizador",
    slug: "organizador-escritorio",
    name: "Organizador de Escritorio Modular",
    shortDescription: "Módulos encastrables para lápices, clips y celular.",
    description:
      "Sistema modular de organización: combina módulos para lápices, bandeja de clips y soporte de celular. Se encastran entre sí para armar la configuración que necesites.",
    categorySlugs: ["organizadores"],
    price: 12900,
    images: [img("organizador-escritorio", "base-1", "Organizador de escritorio modular")],
    options: [{ name: "Kit", values: ["Básico (3 módulos)", "Completo (6 módulos)"] }],
    variants: [
      { id: "v-oe-basico", sku: "OE-BAS", name: "Básico (3 módulos)", options: { Kit: "Básico (3 módulos)" } },
      { id: "v-oe-completo", sku: "OE-COM", name: "Completo (6 módulos)", options: { Kit: "Completo (6 módulos)" }, price: 22900, images: [img("organizador-escritorio", "completo-1", "Organizador kit completo")] },
    ],
    keywords: ["organizador", "escritorio", "oficina", "lapicero", "home office", "modular", "soporte celular", "orden"],
    specs: [{ label: "Material", value: "PETG" }],
    leadTimeDays: 4,
    createdAt: "2026-06-10",
  },
  {
    id: "p-lampara-luna",
    slug: "lampara-luna",
    name: "Lámpara Luna",
    shortDescription: "Velador con relieve lunar realista y luz cálida LED.",
    description:
      "Réplica de la luna con relieve topográfico real. Al encenderla, los cráteres se revelan con una luz cálida y suave. Incluye base de madera y LED USB.",
    categorySlugs: ["lamparas", "decoracion"],
    price: 24900,
    compareAtPrice: 29900,
    images: [img("lampara-luna", "base-1", "Lámpara luna encendida"), img("lampara-luna", "base-2", "Lámpara luna sobre base de madera")],
    options: [{ name: "Diámetro", values: ["12 cm", "15 cm", "18 cm"] }],
    variants: [
      { id: "v-ll-12", sku: "LL-12", name: "12 cm", options: { Diámetro: "12 cm" } },
      { id: "v-ll-15", sku: "LL-15", name: "15 cm", options: { Diámetro: "15 cm" }, price: 29900, compareAtPrice: 34900 },
      { id: "v-ll-18", sku: "LL-18", name: "18 cm", options: { Diámetro: "18 cm" }, price: 36900, compareAtPrice: 41900 },
    ],
    keywords: ["lampara", "luna", "velador", "luz", "led", "dormitorio", "noche", "regalo", "decoracion"],
    specs: [
      { label: "Alimentación", value: "USB 5V" },
      { label: "Incluye", value: "Base de madera + cable" },
    ],
    featured: true,
    leadTimeDays: 5,
    createdAt: "2026-05-02",
  },
  {
    id: "p-lampara-espiral",
    slug: "lampara-espiral",
    name: "Lámpara Espiral",
    shortDescription: "Pantalla en espiral que proyecta sombras hipnóticas.",
    description:
      "Lámpara de mesa con pantalla en espiral paramétrica. Proyecta un patrón de sombras en las paredes. Funciona con lámpara E27 LED (no incluida).",
    categorySlugs: ["lamparas"],
    price: 32000,
    images: [img("lampara-espiral", "blanco-1", "Lámpara espiral blanca")],
    options: [{ name: "Color", values: ["Blanco", "Arena"] }],
    variants: [
      { id: "v-le-blanco", sku: "LE-BLA", name: "Blanco", options: { Color: "Blanco" }, keywords: ["blanco"] },
      { id: "v-le-arena", sku: "LE-ARE", name: "Arena", options: { Color: "Arena" }, images: [img("lampara-espiral", "arena-1", "Lámpara espiral color arena")], keywords: ["arena", "beige", "nude"] },
    ],
    keywords: ["lampara", "espiral", "parametrico", "sombras", "mesa", "living", "diseño"],
    leadTimeDays: 6,
    createdAt: "2026-10-01",
  },
  {
    id: "p-jarron-ondas",
    slug: "jarron-ondas",
    name: "Jarrón Ondas",
    shortDescription: "Jarrón decorativo con textura ondulada (para flores secas).",
    description:
      "Jarrón decorativo con paredes onduladas generadas paramétricamente. Ideal para flores secas, pampas o como pieza decorativa sola. No apto para agua.",
    categorySlugs: ["decoracion"],
    price: 14500,
    images: [img("jarron-ondas", "terracota-1", "Jarrón ondas terracota")],
    options: [{ name: "Color", values: ["Terracota", "Negro mate", "Blanco"] }],
    variants: [
      { id: "v-jo-terracota", sku: "JO-TER", name: "Terracota", options: { Color: "Terracota" }, keywords: ["terracota", "naranja"] },
      { id: "v-jo-negro", sku: "JO-NEG", name: "Negro mate", options: { Color: "Negro mate" }, images: [img("jarron-ondas", "negro-1", "Jarrón ondas negro")], keywords: ["negro"] },
      { id: "v-jo-blanco", sku: "JO-BLA", name: "Blanco", options: { Color: "Blanco" }, images: [img("jarron-ondas", "blanco-1", "Jarrón ondas blanco")], keywords: ["blanco"] },
    ],
    keywords: ["jarron", "florero", "flores secas", "pampas", "decoracion", "ondas", "boho", "living"],
    createdAt: "2026-09-20",
    leadTimeDays: 3,
  },
  {
    id: "p-soporte-auris",
    slug: "soporte-auriculares",
    name: "Soporte para Auriculares",
    shortDescription: "Soporte estable para auriculares over-ear, con base antideslizante.",
    description:
      "Soporte minimalista para auriculares de diadema. Base pesada con apoyos antideslizantes y canal para pasar el cable. Ideal para setups gamer y home office.",
    categorySlugs: ["organizadores"],
    price: 11000,
    images: [img("soporte-auriculares", "negro-1", "Soporte de auriculares negro")],
    options: [{ name: "Color", values: ["Negro", "Blanco"] }],
    variants: [
      { id: "v-sa-negro", sku: "SA-NEG", name: "Negro", options: { Color: "Negro" } },
      { id: "v-sa-blanco", sku: "SA-BLA", name: "Blanco", options: { Color: "Blanco" }, images: [img("soporte-auriculares", "blanco-1", "Soporte de auriculares blanco")] },
    ],
    keywords: ["soporte", "auriculares", "headset", "gamer", "setup", "escritorio", "home office"],
    leadTimeDays: 3,
    createdAt: "2026-04-11",
  },
];

export const products: Product[] = [...generalProducts, ...christmasProducts];
