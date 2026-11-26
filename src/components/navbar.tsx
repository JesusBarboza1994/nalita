import Link from "next/link";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { getCategories } from "@/lib/catalog";
import { CartButton } from "@/components/cart-button";
import { CategoryLinks, StaticCategoryLinks } from "@/components/category-links";
import { SearchBox } from "@/components/search-box";

export async function Navbar() {
  const categories = await getCategories();
  const links = [
    { href: "/productos", label: "Todo" },
    ...categories.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3 sm:gap-6">
        <Link href="/" className="shrink-0 text-xl font-extrabold tracking-tight">
          <span className="text-primary">nalita</span>
          <span className="text-secondary">3d</span>
          <span className="sr-only">{siteConfig.name}</span>
        </Link>
        <SearchBox className="hidden flex-1 sm:flex" />
        <div className="ml-auto">
          <CartButton />
        </div>
      </div>
      <div className="container-page pb-3 sm:hidden">
        <SearchBox className="flex" />
      </div>
      <nav aria-label="Categorías" className="border-t border-border">
        <div className="container-page">
          <Suspense fallback={<StaticCategoryLinks links={links} />}>
            <CategoryLinks links={links} />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
