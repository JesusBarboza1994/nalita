import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-card";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/catalog";

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/categoria/[slug]">): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  return category ? { title: category.name, description: category.description } : {};
}

export default async function CategoryPage({ params }: PageProps<"/categoria/[slug]">) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const products = await getProductsByCategory(slug);

  return (
    <div className="container-page py-10">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Inicio</Link> /{" "}
        <Link href="/productos" className="hover:text-foreground">Catálogo</Link> / {category.name}
      </nav>
      <div className="mt-4 flex items-center gap-4">
        <span className="text-5xl">{category.icon}</span>
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          <p className="text-muted-foreground">{category.description}</p>
        </div>
      </div>
      <div className="mt-8">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="text-muted-foreground">Pronto vamos a sumar productos a esta categoría.</p>
        )}
      </div>
    </div>
  );
}
