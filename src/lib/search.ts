import type { Category, Product } from "@/lib/types";

/** Minúsculas y sin acentos: "Lámpara" -> "lampara" */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/**
 * Busca productos por nombre, palabras clave, descripción, categoría y variantes.
 * Todas las palabras de la búsqueda deben aparecer en algún campo.
 * Devuelve los productos ordenados por relevancia.
 */
export function searchProducts(products: Product[], query: string, categories: Category[] = []): Product[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return products;

  const categoryNames = new Map(categories.map((c) => [c.slug, c.name]));

  const scored = products.map((p) => {
    const fields: [string, number][] = [
      [p.name, 10],
      [p.keywords.join(" "), 8],
      [p.variants.flatMap((v) => [v.name, ...(v.keywords ?? []), v.sku]).join(" "), 5],
      [p.categorySlugs.map((s) => categoryNames.get(s) ?? s).join(" "), 4],
      [p.shortDescription, 3],
      [p.description, 1],
    ];
    const normalized = fields.map(([text, weight]) => [normalize(text), weight] as const);

    let score = 0;
    for (const term of terms) {
      let termScore = 0;
      for (const [text, weight] of normalized) {
        if (text.includes(term)) termScore = Math.max(termScore, weight);
      }
      if (termScore === 0) return { p, score: 0 }; // todas las palabras deben matchear
      score += termScore;
    }
    return { p, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.p);
}
