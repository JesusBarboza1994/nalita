"use client";

import { useRouter } from "next/navigation";
import { SearchIcon } from "@/components/icons";

export function SearchBox({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <form
      role="search"
      className={`relative items-center ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
        router.push(q ? `/productos?q=${encodeURIComponent(q)}` : "/productos");
      }}
    >
      <SearchIcon className="pointer-events-none absolute left-3.5 text-muted-foreground" width={18} height={18} />
      <input
        name="q"
        type="search"
        placeholder="Buscar productos…"
        aria-label="Buscar productos"
        className="input h-10 rounded-full py-2 pl-10 sm:h-auto sm:py-2.5"
      />
    </form>
  );
}
