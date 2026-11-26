import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/catalog";
import { CatalogView } from "./catalog-view";

export const metadata: Metadata = {
  title: "Catálogo",
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div className="container-page py-6 sm:py-10">
      <Suspense
        fallback={
          <>
            <h1 className="text-3xl font-bold">Catálogo</h1>
            <div className="mt-8">
              <ProductGrid products={products} />
            </div>
          </>
        }
      >
        <CatalogView products={products} categories={categories} />
      </Suspense>
    </div>
  );
}
