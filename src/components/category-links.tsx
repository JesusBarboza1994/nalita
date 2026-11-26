"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

function List({ links, active }: { links: NavLink[]; active?: string | null }) {
  return (
    <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
      {links.map((l) => {
        const isActive = active === l.href;
        return (
          <li key={l.href} className="shrink-0">
            <Link
              href={l.href}
              aria-current={isActive ? "page" : undefined}
              className={`block rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function CategoryLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return <List links={links} active={pathname} />;
}

export function StaticCategoryLinks({ links }: { links: NavLink[] }) {
  return <List links={links} />;
}
