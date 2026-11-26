import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CashIcon, SparkIcon, TruckIcon, WhatsAppIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-card";
import { getCategories, getFeaturedProducts, getProducts } from "@/lib/catalog";

export default async function HomePage() {
  const [categories, featured, all] = await Promise.all([getCategories(), getFeaturedProducts(), getProducts()]);
  const newest = all.filter((p) => p.isNew).slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-secondary/15">
        <div className="container-page grid items-center gap-10 py-16 sm:py-24 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              <SparkIcon width={14} height={14} /> Hecho a pedido, capa por capa
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Objetos impresos en 3D que <span className="text-primary">alegran</span> tus espacios
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">{siteConfig.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/productos" className="btn-primary px-7 py-3 text-base">Ver catálogo</Link>
              <Link href="/categoria/llaveros" className="btn-outline px-7 py-3 text-base">Personalizados</Link>
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
      <section className="container-page -mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: CashIcon, title: "Pago contra entrega", text: "Pagás cuando recibís tu pedido." },
          { icon: WhatsAppIcon, title: "Atención por WhatsApp", text: "Confirmamos cada pedido con vos." },
          { icon: TruckIcon, title: "Envíos coordinados", text: "Acordamos día y zona de entrega." },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3 rounded-brand border border-border bg-surface p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon />
            </span>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categorías */}
      <section className="container-page mt-16">
        <h2 className="text-2xl font-bold">Categorías</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categoria/${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-brand border border-border bg-surface p-5 text-center transition hover:border-primary hover:bg-primary/5"
            >
              <span className="text-4xl">{c.icon}</span>
              <span className="text-sm font-semibold">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="container-page mt-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Destacados</h2>
          <Link href="/productos" className="text-sm font-semibold text-primary hover:underline">Ver todo →</Link>
        </div>
        <div className="mt-5">
          <ProductGrid products={featured} />
        </div>
      </section>

      {newest.length > 0 && (
        <section className="container-page mt-16">
          <h2 className="text-2xl font-bold">Novedades</h2>
          <div className="mt-5">
            <ProductGrid products={newest} />
          </div>
        </section>
      )}
    </>
  );
}
