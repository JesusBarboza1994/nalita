/**
 * Capa de acceso a datos del catálogo.
 * Hoy lee de la data mock; cuando haya base de datos, sólo hay que cambiar
 * la implementación de estas funciones (las firmas ya son async).
 */
import { categories } from "@/lib/data/categories";
import { products } from "@/lib/data/products";
import type { Category, Product } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  "use cache";
  return [...categories].sort((a, b) => a.order - b.order);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  "use cache";
  return categories.find((c) => c.slug === slug);
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  "use cache";
  return products.find((p) => p.slug === slug);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  "use cache";
  return (await getProducts()).filter((p) => p.categorySlugs.includes(slug));
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
