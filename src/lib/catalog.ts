/**
 * Capa de acceso a datos del catálogo.
 * Hoy lee de la data mock; cuando haya base de datos, sólo hay que cambiar
 * la implementación de estas funciones (las firmas ya son async).
 */
import { cacheLife } from "next/cache";
import { siteConfig } from "@/config/site";
import { resolveBundle } from "@/lib/bundle";
import { categories } from "@/lib/data/categories";
import { products } from "@/lib/data/products";
import { currentMonth, isInSeason } from "@/lib/season";
import type { Category, NavCategory, Product, ResolvedBundle } from "@/lib/types";

const published = () => products.filter((p) => p.published !== false);

export async function getCategories(): Promise<Category[]> {
  "use cache";
  return [...categories].sort((a, b) => a.order - b.order);
}

/**
 * Categorías con su estado de temporada. Las que están en temporada se marcan
 * como destacadas y van primero. Se recalcula cada pocas horas.
 */
export async function getNavCategories(): Promise<NavCategory[]> {
  "use cache";
  cacheLife("hours");
  const month = currentMonth(siteConfig.timeZone);
  return (await getCategories())
    .map((c) => ({ ...c, highlighted: isInSeason(c.season, month) }))
    .sort((a, b) => Number(b.highlighted) - Number(a.highlighted));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  "use cache";
  return categories.find((c) => c.slug === slug);
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  return published().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  "use cache";
  return published().find((p) => p.slug === slug);
}

/** En cada categoría, los packs se muestran primero */
export async function getProductsByCategory(slug: string): Promise<Product[]> {
  "use cache";
  return (await getProducts())
    .filter((p) => p.categorySlugs.includes(slug))
    .sort((a, b) => Number(!!b.bundle) - Number(!!a.bundle));
}

export async function getFeaturedProducts(): Promise<Product[]> {
  "use cache";
  return (await getProducts()).filter((p) => p.featured);
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  "use cache";
  return (await getProducts())
    .filter((p) => p.id !== product.id && p.categorySlugs.some((c) => product.categorySlugs.includes(c)))
    .slice(0, limit);
}

/** Datos del pack resueltos contra el catálogo (nombres, precios, fotos) */
export async function getBundle(product: Product): Promise<ResolvedBundle | undefined> {
  "use cache";
  return resolveBundle(product, await getProducts());
}

/** Packs que incluyen este producto (como unidad elegible o como base) */
export async function getBundlesContaining(slug: string): Promise<Product[]> {
  "use cache";
  return (await getProducts()).filter(
    (p) =>
      p.bundle &&
      (p.bundle.items.some((i) => i.productSlug === slug) || p.bundle.sizes.some((s) => s.base?.productSlug === slug)),
  );
}
