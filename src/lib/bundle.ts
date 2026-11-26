import { resolveVariant, resolveVariants } from "@/lib/product-utils";
import type { BundleItemRef, Product, ProductRef, ResolvedBundle, ResolvedBundleItem } from "@/lib/types";

/**
 * Convierte la definición de un pack (referencias por slug) en datos listos para la UI,
 * buscando nombre, precio e imagen de cada producto referenciado.
 */
export function resolveBundle(product: Product, catalog: Product[]): ResolvedBundle | undefined {
  const bundle = product.bundle;
  if (!bundle) return undefined;
  const bySlug = new Map(catalog.map((p) => [p.slug, p]));

  const resolveRef = (ref: ProductRef): ResolvedBundleItem | undefined => {
    const p = bySlug.get(ref.productSlug);
    if (!p) return undefined;
    const variant = ref.variantId ? p.variants.find((v) => v.id === ref.variantId) : undefined;
    const resolved = variant ? resolveVariant(p, variant) : undefined;
    const fallback = resolved ?? resolveVariants(p).find((v) => v.available);
    return {
      key: ref.variantId ? `${p.slug}:${ref.variantId}` : p.slug,
      productSlug: p.slug,
      variantId: fallback?.id ?? "default",
      name: variant ? `${p.name} – ${variant.name}` : p.name,
      price: fallback?.price ?? p.price,
      image: fallback?.images[0] ?? p.images[0],
      available: fallback?.available ?? p.published !== false,
      extraPrice: 0,
      slots: 1,
      model3d: (variant ?? fallback)?.model3d ?? p.model3d,
    };
  };

  /** Unidad elegible: además calcula su recargo dentro del pack */
  const resolveItem = (ref: BundleItemRef): ResolvedBundleItem | undefined => {
    const item = resolveRef(ref);
    if (!item) return undefined;
    const slots = Math.max(1, ref.slots ?? 1);
    const auto = bundle.includedItemPrice !== undefined ? Math.max(0, item.price - bundle.includedItemPrice * slots) : 0;
    return { ...item, slots, extraPrice: ref.extraPrice ?? auto };
  };

  const items = bundle.items.map(resolveItem).filter((i): i is ResolvedBundleItem => !!i);

  const sizes = bundle.sizes.map((size) => {
    const base = size.base ? resolveRef(size.base) : undefined;
    return {
      ...size,
      base: base && { name: base.name, price: base.price, image: base.image, model3d: base.model3d },
      images: size.images?.length ? size.images : base?.image ? [base.image] : product.images,
    };
  });

  return {
    items,
    sizes,
    allowRepeats: bundle.allowRepeats,
    itemLabel: bundle.itemLabel,
    customizeSlug: bundle.customizeSlug,
    labelOption: bundle.labelOption,
    initial: bundle.initial && {
      sizeId: bundle.initial.sizeId,
      items: bundle.initial.items.map(resolveItem).filter((i): i is ResolvedBundleItem => !!i),
    },
    preset: bundle.preset && {
      sizeId: bundle.preset.sizeId,
      items: bundle.preset.items.map(resolveItem).filter((i): i is ResolvedBundleItem => !!i),
    },
  };
}

/** Precio final del pack: precio del tamaño + recargos de las unidades elegidas */
export function bundlePrice(sizePrice: number, picks: { extraPrice: number }[]) {
  return sizePrice + picks.reduce((sum, p) => sum + p.extraPrice, 0);
}

/** Lugares ocupados por una lista de unidades elegidas */
export function usedSlots(picks: { slots: number }[]) {
  return picks.reduce((sum, p) => sum + p.slots, 0);
}

/** Precio que costaría comprar todo por separado (base + unidades) */
export function bundleRegularPrice(basePrice: number | undefined, itemPrices: number[]) {
  return (basePrice ?? 0) + itemPrices.reduce((a, b) => a + b, 0);
}

/** Agrupa una lista de unidades elegidas: [a, a, b] -> [{a, 2}, {b, 1}] */
export function groupItems<T extends { key: string }>(items: T[]) {
  const map = new Map<string, { item: T; quantity: number }>();
  for (const item of items) {
    const entry = map.get(item.key);
    if (entry) entry.quantity++;
    else map.set(item.key, { item, quantity: 1 });
  }
  return [...map.values()];
}
