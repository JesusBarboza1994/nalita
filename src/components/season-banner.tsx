import Link from "next/link";
import type { NavCategory } from "@/lib/types";

/** Banner para una categoría en temporada (ej. Navidad de octubre a diciembre) */
export function SeasonBanner({ category, cta }: { category: NavCategory; cta?: { href: string; label: string } }) {
  return (
    <div className="relative overflow-hidden rounded-brand bg-highlight p-6 text-highlight-foreground sm:p-10">
      <div className="pointer-events-none absolute -right-6 -top-8 select-none text-[9rem] leading-none opacity-20 sm:text-[12rem]">
        {category.icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest opacity-90">{category.season?.label ?? "Temporada"}</p>
      <h2 className="mt-2 max-w-lg text-3xl font-extrabold sm:text-4xl">{category.name}</h2>
      <p className="mt-2 max-w-lg opacity-90">{category.description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        {cta && (
          <Link href={cta.href} className="btn bg-highlight-foreground px-6 py-2.5 text-highlight hover:opacity-90">
            {cta.label}
          </Link>
        )}
        <Link
          href={`/categoria/${category.slug}`}
          className="btn border border-highlight-foreground/60 px-6 py-2.5 hover:bg-highlight-foreground/10"
        >
          Ver todo {category.name}
        </Link>
      </div>
    </div>
  );
}
