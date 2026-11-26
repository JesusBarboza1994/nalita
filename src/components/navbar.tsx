import Link from "next/link";
import { Suspense } from "react";
import { siteConfig } from "@/config/site";
import { getNavCategories } from "@/lib/catalog";
import { CartButton } from "@/components/cart-button";
import { CategoryLinks, StaticCategoryLinks } from "@/components/category-links";
import { SearchBox } from "@/components/search-box";

export async function Navbar() {
  const categories = await getNavCategories();
  const links = [
    { href: "/productos", label: "Todo" },
    ...categories.map((c) => ({
      href: `/categoria/${c.slug}`,
      label: c.highlighted && c.icon ? `${c.icon} ${c.name}` : c.name,
      highlighted: c.highlighted,
    })),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="container-page flex h-14 items-center gap-2.5 sm:h-16 sm:gap-6">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight sm:text-xl">
          <span className="text-primary">nalita</span>
          <span className="text-secondary">3d</span>
          <span className="sr-only">{siteConfig.name}</span>
        </Link>
        <SearchBox className="flex min-w-0 flex-1" />
        <CartButton />
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
