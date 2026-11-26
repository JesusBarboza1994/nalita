/**
 * Modelo de datos del catálogo.
 * Pensado para migrar fácilmente a base de datos: cada tipo mapea a una tabla
 * (categories, products, product_variants, product_images).
 */

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Emoji o ícono corto para mostrar en tarjetas */
  icon?: string;
  /** Orden en el navbar (menor = primero) */
  order: number;
}

export interface ProductImage {
  src: string;
  alt: string;
}

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
  createdAt: string;
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
}

export interface CheckoutCustomer {
  name: string;
  phone: string;
  address: string;
  city: string;
  reference?: string;
  notes?: string;
}
