import type { Product, ProductVariant, ResolvedVariant } from "@/lib/types";

/** Aplica la herencia padre -> variante (precio, precio tachado, imágenes) */
export function resolveVariant(product: Product, variant: ProductVariant): ResolvedVariant {
  return {
    ...variant,
    price: variant.price ?? product.price,
    compareAtPrice: variant.compareAtPrice ?? (variant.price === undefined ? product.compareAtPrice : undefined),
    images: variant.images && variant.images.length > 0 ? variant.images : product.images,
    available: variant.available ?? true,
  };
}

export function resolveVariants(product: Product): ResolvedVariant[] {
  return product.variants.map((v) => resolveVariant(product, v));
}

/** Primera variante disponible (o la primera si ninguna lo está) */
export function getDefaultVariant(product: Product): ResolvedVariant | undefined {
  const resolved = resolveVariants(product);
  return resolved.find((v) => v.available) ?? resolved[0];
}

/** Rango de precios considerando todas las variantes */
export function getPriceRange(product: Product) {
  const prices = product.variants.length
    ? resolveVariants(product).map((v) => v.price)
    : [product.price];
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function isOnSale(price: number, compareAtPrice?: number) {
  return compareAtPrice !== undefined && compareAtPrice > price;
}

export function discountPercent(price: number, compareAtPrice?: number) {
  if (!isOnSale(price, compareAtPrice)) return 0;
  return Math.round((1 - price / compareAtPrice!) * 100);
}

export function isProductAvailable(product: Product) {
  return product.variants.length === 0 || product.variants.some((v) => v.available !== false);
}
