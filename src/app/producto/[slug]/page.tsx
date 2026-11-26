import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product-card";
import { getBundle, getBundlesContaining, getCategories, getProductBySlug, getProducts, getRelatedProducts } from "@/lib/catalog";
import { getPriceRange } from "@/lib/product-utils";
import { formatPrice } from "@/lib/format";
import { BundleDetail } from "./bundle-detail";
import { ProductDetail } from "./product-detail";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    keywords: product.keywords,
    openGraph: { images: product.images.map((i) => ({ url: i.src, alt: i.alt })) },
  };
}

export default async function ProductPage({ params }: PageProps<"/producto/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categories, related, bundle, packs] = await Promise.all([
    getCategories(),
    getRelatedProducts(product),
    getBundle(product),
    getBundlesContaining(product.slug),
  ]);
  const productCategories = categories.filter((c) => product.categorySlugs.includes(c.slug));
  const mainCategory = productCategories[0];

  return (
    <div className="container-page py-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Inicio</Link> /{" "}
        {mainCategory && (
          <>
            <Link href={`/categoria/${mainCategory.slug}`} className="hover:text-foreground">{mainCategory.name}</Link> /{" "}
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-6">
        {bundle ? (
          <BundleDetail product={product} categories={productCategories} bundle={bundle} />
        ) : (
          <ProductDetail product={product} categories={productCategories} />
        )}
      </div>

      {packs.length > 0 && (
        <section className="mt-10 rounded-brand border border-primary/30 bg-primary/5 p-5">
          <p className="font-semibold">🎁 También disponible en packs</p>
          <p className="text-sm text-muted-foreground">Combínalo con otros productos y ahorra.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {packs.map((p) => (
              <Link key={p.id} href={`/producto/${p.slug}`} className="btn-outline">
                {p.name} · desde {formatPrice(getPriceRange(p).min)}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold">Descripción</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
        </div>
        {(!!product.specs?.length || !!product.leadTimeDays) && (
          <div>
            <h2 className="text-xl font-bold">Detalles</h2>
            <dl className="mt-3 divide-y divide-border rounded-brand border border-border bg-surface text-sm">
              {product.specs?.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 p-3">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="text-right font-medium">{s.value}</dd>
                </div>
              ))}
              {!!product.leadTimeDays && (
                <div className="flex justify-between gap-4 p-3">
                  <dt className="text-muted-foreground">Producción</dt>
                  <dd className="text-right font-medium">{product.leadTimeDays} días hábiles</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold">También te puede gustar</h2>
          <div className="mt-5">
            <ProductGrid products={related} />
          </div>
        </section>
      )}
    </div>
  );
}
