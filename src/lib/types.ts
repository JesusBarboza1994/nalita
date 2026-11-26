/**
 * Modelo de datos del catálogo.
 * Pensado para migrar fácilmente a base de datos: cada tipo mapea a una tabla
 * (categories, products, product_variants, product_images).
 */

/**
 * Temporada en la que una categoría se destaca (navbar, home).
 * Meses 1-12 inclusive. Puede cruzar el año: { fromMonth: 11, toMonth: 2 }.
 */
export interface CategorySeason {
  fromMonth: number;
  toMonth: number;
  /** Texto del banner destacado, ej: "Temporada navideña" */
  label?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Emoji o ícono corto para mostrar en tarjetas */
  icon?: string;
  /** Orden en el navbar (menor = primero) */
  order: number;
  /** Si se define, la categoría se ve siempre pero se resalta en esas fechas */
  season?: CategorySeason;
}

/** Categoría con el estado de temporada ya calculado */
export interface NavCategory extends Category {
  highlighted: boolean;
}

export interface ProductImage {
  src: string;
  alt: string;
  /** cover (default) recorta para llenar el cuadrado; contain muestra la foto entera */
  fit?: "cover" | "contain";
}

/* -------------------------------------------------------------------------
   MODELOS 3D
   Se generan desde .3mf con `node scripts/build-3d-models.mjs`.
   Cada parte es un grupo de color del archivo (un filamento/extrusor).
   ------------------------------------------------------------------------- */

export interface Model3DPart {
  /** Nombre del grupo dentro del .glb (ej. "color_1") */
  id: string;
  /** Nombre visible, ej. "Nariz" */
  label: string;
  /** Id de filamento por defecto (ver src/config/filaments.ts) */
  defaultColor: string;
  /** Si el cliente puede cambiarle el color */
  editable?: boolean;
  /** Ids de filamento permitidos. Si no se define, todos */
  palette?: string[];
}

/**
 * Montaje de etiqueta: el modelo se "corta" adelante (cara plana con dos agujeros)
 * y se inserta una etiqueta plana con dos cilindros.
 */
export interface LabelMount {
  /** Cuánto se recorta el frente (mm) para formar la cara plana */
  cutDepthMm: number;
  /** Largo de la etiqueta respecto del largo del modelo (0.5 = la mitad) */
  plateWidthRatio: number;
  /**
   * Ancho fijo (mm) de la zona plana del frente donde se engancha la etiqueta.
   * No depende del largo de la etiqueta (ver scripts/build-label-print.mjs)
   */
  flatWidthMm: number;
  /** Alto de la etiqueta (mm). Si no se indica, el alto del modelo */
  plateHeightMm?: number;
}

/** Opción de venta: etiqueta con texto personalizado */
export interface TextLabelOption {
  /** Ej. "Con etiqueta personalizada" */
  name: string;
  description?: string;
  maxLength: number;
  /** Recargo por la etiqueta */
  price: number;
  placeholder?: string;
  /** Filamentos por defecto */
  plateColor: string;
  textColor: string;
}

/** Etiqueta elegida por el cliente */
export interface LabelValue {
  text: string;
  plateColor: string;
  textColor: string;
}

export interface Model3D {
  src: string;
  parts: Model3DPart[];
  /** Si admite etiqueta personalizada, cómo se monta */
  labelMount?: LabelMount;
  /** Escala [x, y, z] para reutilizar un modelo (ej. otro tamaño de bandeja) */
  scale?: [number, number, number];
  /** true = es una vista referencial, no el modelo exacto */
  approximate?: boolean;
}

/** Colores elegidos: { [partId]: filamentId } */
export type PartColors = Record<string, string>;

/** Opción configurable de un producto, ej: { name: "Color", values: ["Rosa", "Blanco"] } */
export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  /** Nombre legible, ej: "Rosa / Mediana" */
  name: string;
  /** Valores de cada opción, ej: { Color: "Rosa", Tamaño: "Mediana" } */
  options: Record<string, string>;
  /** Si no se define, usa el precio del producto padre */
  price?: number;
  /** Precio tachado (oferta). Si no se define, usa el del padre */
  compareAtPrice?: number;
  /** Si no tiene imágenes, usa las del producto padre */
  images?: ProductImage[];
  /** false = sin stock / no disponible */
  available?: boolean;
  /** Palabras clave extra para el buscador (ej: el color) */
  keywords?: string[];
  /** Modelo 3D propio de la variante (si no, usa el del producto) */
  model3d?: Model3D;
}

/* -------------------------------------------------------------------------
   PAQUETES (bundles)
   Un producto puede ser un pack de otros productos del catálogo.
   Es genérico: sirve para "bandeja con N muñecos", "pack de 3 llaveros", etc.
   ------------------------------------------------------------------------- */

/** Referencia a un producto (y opcionalmente a una variante concreta) */
export interface ProductRef {
  productSlug: string;
  variantId?: string;
}

/** Unidad elegible dentro de un pack */
export interface BundleItemRef extends ProductRef {
  /**
   * Recargo fijo al elegir esta unidad. Si no se define, se calcula solo
   * con `includedItemPrice` (precio de la unidad − precio incluido).
   */
  extraPrice?: number;
  /**
   * Lugares que ocupa en el pack (por defecto 1). Una pieza grande puede valer
   * por 2 (ej. el nacimiento). El recargo automático descuenta lo incluido por cada lugar.
   */
  slots?: number;
}

/** Un tamaño/formato del pack: cuántas unidades lleva y cuánto cuesta */
export interface BundleSize {
  id: string;
  /** Ej: "Bandeja mediana" o "Pack x3" */
  name: string;
  /** Cantidad de lugares a completar (una unidad puede ocupar más de uno) */
  slots: number;
  /** Precio del pack completo (base + unidades) */
  price: number;
  /**
   * Producto base incluido en el pack (ej. la bandeja). Opcional:
   * un pack de llaveros no tiene base. Se usa para la foto y para calcular el ahorro.
   */
  base?: ProductRef;
  images?: ProductImage[];
}

export interface ProductBundle {
  /** Productos que se pueden elegir para llenar el pack */
  items: BundleItemRef[];
  /**
   * Precio por unidad que ya está contemplado en el precio del pack.
   * Las unidades más caras suman la diferencia como recargo (ej. incluido 12,
   * pieza de 14 => +2; si ocupa 2 lugares se descuentan 24). Así el precio del pack no se ve afectado por el cambio de piezas.
   */
  includedItemPrice?: number;
  sizes: BundleSize[];
  /** ¿Se puede elegir el mismo producto más de una vez? */
  allowRepeats: boolean;
  /** Cómo se llama cada unidad en la interfaz */
  itemLabel: { singular: string; plural: string };
  /**
   * Pack prearmado: tamaño y contenido fijos (el cliente no elige).
   * Si no se define, el cliente arma su propio pack.
   */
  preset?: { sizeId: string; items: BundleItemRef[] };
  /** Selección inicial del armador (tamaño y unidades ya elegidas, editables) */
  initial?: { sizeId: string; items: BundleItemRef[] };
  /** Opción de etiqueta con texto sobre la base del pack (ej. bandeja) */
  labelOption?: TextLabelOption;
  /** Slug del pack personalizable, para ofrecer "arma el tuyo" desde un prearmado */
  customizeSlug?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  /** Un producto puede estar en varias categorías */
  categorySlugs: string[];
  /** Precio base (lo heredan las variantes que no tengan precio propio) */
  price: number;
  compareAtPrice?: number;
  /** Imágenes base (las heredan las variantes sin imágenes propias) */
  images: ProductImage[];
  options: ProductOption[];
  variants: ProductVariant[];
  /** Palabras clave para el buscador */
  keywords: string[];
  specs?: ProductSpec[];
  featured?: boolean;
  isNew?: boolean;
  /** Se puede personalizar (nombre, color, etc.) */
  customizable?: boolean;
  /** Días hábiles de producción */
  leadTimeDays?: number;
  /** Si es un pack de otros productos */
  bundle?: ProductBundle;
  /** Modelo 3D para ver y personalizar colores */
  model3d?: Model3D;
  /** Opción de etiqueta con texto (el modelo 3D debe tener labelMount) */
  labelOption?: TextLabelOption;
  /** false = no se muestra en la tienda (borrador) */
  published?: boolean;
  createdAt: string;
}

/** Datos resueltos de un pack, listos para la interfaz (sin depender del catálogo) */
export interface ResolvedBundleItem {
  key: string;
  productSlug: string;
  variantId: string;
  name: string;
  price: number;
  image?: ProductImage;
  available: boolean;
  /** Recargo que suma al precio del pack al elegir esta unidad */
  extraPrice: number;
  /** Lugares que ocupa en el pack */
  slots: number;
  model3d?: Model3D;
}

export interface ResolvedBundleSize extends Omit<BundleSize, "base"> {
  base?: { name: string; price: number; image?: ProductImage; model3d?: Model3D };
  images: ProductImage[];
}

export interface ResolvedBundle {
  items: ResolvedBundleItem[];
  sizes: ResolvedBundleSize[];
  allowRepeats: boolean;
  itemLabel: { singular: string; plural: string };
  preset?: { sizeId: string; items: ResolvedBundleItem[] };
  initial?: { sizeId: string; items: ResolvedBundleItem[] };
  labelOption?: TextLabelOption;
  customizeSlug?: string;
}

/** Variante con precio/imágenes ya resueltos (heredados del padre si hacía falta) */
export interface ResolvedVariant extends ProductVariant {
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  available: boolean;
}

export interface CartItem {
  /** productId:variantId */
  key: string;
  productId: string;
  productSlug: string;
  variantId: string;
  name: string;
  variantName: string;
  price: number;
  image?: ProductImage;
  quantity: number;
  /** Contenido del pack, si el ítem es un pack */
  bundleItems?: { name: string; quantity: number; details?: string }[];
  /** Personalizaciones elegidas, ej. [{ label: "Nariz", value: "Dorado" }] */
  customizations?: { label: string; value: string }[];
}

export interface CheckoutCustomer {
  name: string;
  phone: string;
  address: string;
  city: string;
  reference?: string;
  notes?: string;
}
