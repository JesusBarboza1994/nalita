import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CashIcon, SparkIcon, TruckIcon, WhatsAppIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { SeasonBanner } from "@/components/season-banner";
import { getFeaturedProducts, getNavCategories, getProducts, getProductsByCategory } from "@/lib/catalog";

export default async function HomePage() {
  const [categories, featured, all] = await Promise.all([getNavCategories(), getFeaturedProducts(), getProducts()]);
  const newest = all.filter((p) => p.isNew).slice(0, 4);

  // Categorías en temporada (ej. Navidad oct-dic): banner + sus productos al inicio
  const seasonal = await Promise.all(
    categories
      .filter((c) => c.highlighted)
      .map(async (category) => {
        const products = await getProductsByCategory(category.slug);
        const builder = products.find((p) => p.bundle && !p.bundle.preset);
        return { category, products: products.slice(0, 4), builder };
      }),
  );
  const seasonalSlugs = new Set(seasonal.flatMap((s) => s.products.map((p) => p.slug)));
  const featuredRest = featured.filter((p) => !seasonalSlugs.has(p.slug));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-secondary/15">
        <div className="container-page grid items-center gap-10 py-10 sm:py-24 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              <SparkIcon width={14} height={14} /> Hecho a pedido, capa por capa
            </span>
            <h1 className="mt-4 text-[2rem] font-extrabold leading-tight tracking-tight sm:text-5xl">
              Objetos impresos en 3D que <span className="text-primary">alegran</span> tus espacios
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">{siteConfig.description}</p>
            <div className="mt-6 flex gap-3 sm:mt-8">
              <Link href="/productos" className="btn-primary flex-1 px-7 py-3 text-base sm:flex-none">Ver catálogo</Link>
              <Link href="/categoria/llaveros" className="btn-outline flex-1 px-7 py-3 text-base sm:flex-none">Personalizados</Link>
            </div>
          </div>
          <div className="relative hidden aspect-square md:block">
            <div className="absolute inset-8 rotate-6 rounded-[3rem] bg-primary/25" />
            <div className="absolute inset-8 -rotate-3 rounded-[3rem] bg-secondary/25" />
            <div className="absolute inset-8 flex items-center justify-center rounded-[3rem] bg-surface text-8xl shadow-xl">
              🪴🐉💡
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="container-page -mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { icon: CashIcon, title: "Pago contra entrega", text: "Pagas cuando recibes tu pedido." },
          { icon: WhatsAppIcon, title: "Atención por WhatsApp", text: "Confirmamos cada pedido contigo." },
          { icon: TruckIcon, title: "Envíos coordinados", text: "Acordamos día y zona de entrega." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col items-center gap-1.5 rounded-brand border border-border bg-surface p-3 text-center shadow-sm sm:flex-row sm:gap-3 sm:p-4 sm:text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon />
            </span>
            <div>
              <p className="text-xs font-semibold leading-tight sm:text-sm">{title}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Temporada destacada */}
      {seasonal.map(({ category, products, builder }) => (
        <section key={category.id} className="container-page mt-10 sm:mt-16">
          <SeasonBanner
            category={category}
            cta={builder ? { href: `/producto/${builder.slug}`, label: builder.name } : undefined}
          />
          <div className="mt-5">
            <ProductGrid products={products} />
          </div>
        </section>
      ))}

      {/* Categorías */}
      <section className="container-page mt-10 sm:mt-16">
        <h2 className="text-2xl font-bold">Categorías</h2>
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:mt-5 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categoria/${c.slug}`}
              className={`flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-brand border bg-surface p-3 text-center transition hover:border-primary hover:bg-primary/5 sm:w-auto sm:gap-2 sm:p-5 ${
                c.highlighted ? "border-highlight/40" : "border-border"
              }`}
            >
              <span className="text-3xl sm:text-4xl">{c.icon}</span>
              <span className="text-xs font-semibold sm:text-sm">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="container-page mt-10 sm:mt-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Destacados</h2>
          <Link href="/productos" className="text-sm font-semibold text-primary hover:underline">Ver todo →</Link>
        </div>
        <div className="mt-5">
          <ProductGrid products={featuredRest} />
        </div>
      </section>

      {newest.length > 0 && (
        <section className="container-page mt-10 sm:mt-16">
          <h2 className="text-2xl font-bold">Novedades</h2>
          <div className="mt-5">
            <ProductGrid products={newest} />
          </div>
        </section>
      )}
    </>
  );
}
