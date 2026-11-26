"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ProductGrid } from "@/components/product-card";
import { getPriceRange } from "@/lib/product-utils";
import { searchProducts } from "@/lib/search";
import type { Category, Product } from "@/lib/types";

const SORTS = {
  relevancia: "Relevancia",
  nuevos: "Más nuevos",
  "precio-asc": "Menor precio",
  "precio-desc": "Mayor precio",
} as const;
type SortKey = keyof typeof SORTS;

export function CatalogView({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const q = params.get("q") ?? "";
  const category = params.get("categoria") ?? "";
  const sort = (params.get("orden") as SortKey) in SORTS ? (params.get("orden") as SortKey) : "relevancia";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const results = useMemo(() => {
    let list = searchProducts(products, q, categories);
    if (category) list = list.filter((p) => p.categorySlugs.includes(category));
    if (sort === "nuevos") list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === "precio-asc") list = [...list].sort((a, b) => getPriceRange(a).min - getPriceRange(b).min);
    if (sort === "precio-desc") list = [...list].sort((a, b) => getPriceRange(b).min - getPriceRange(a).min);
    return list;
  }, [products, categories, q, category, sort]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold sm:text-3xl">{q ? `Resultados para “${q}”` : "Catálogo"}</h1>
        <p className="text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "producto" : "productos"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <Chip active={!category} onClick={() => setParam("categoria", "")}>Todas</Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={category === c.slug} onClick={() => setParam("categoria", c.slug)}>
              {c.name}
            </Chip>
          ))}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          Ordenar
          <select
            value={sort}
            onChange={(e) => setParam("orden", e.target.value === "relevancia" ? "" : e.target.value)}
            className="input w-auto py-2"
          >
            {Object.entries(SORTS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {q && (
        <button onClick={() => setParam("q", "")} className="mt-4 text-sm font-medium text-primary hover:underline">
          × Quitar búsqueda “{q}”
        </button>
      )}

      <div className="mt-8">
        {results.length > 0 ? (
          <ProductGrid products={results} />
        ) : (
          <div className="rounded-brand border border-dashed border-border p-12 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 font-semibold">No encontramos productos</p>
            <p className="mt-1 text-sm text-muted-foreground">Prueba con otras palabras o quita los filtros.</p>
          </div>
        )}
      </div>
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
