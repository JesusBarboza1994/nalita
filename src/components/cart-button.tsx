"use client";

import Link from "next/link";
import { CartIcon } from "@/components/icons";
import { useCart } from "@/lib/cart-store";

export function CartButton() {
  const { count } = useCart();
  return (
    <Link
      href="/carrito"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface hover:bg-muted"
      aria-label={`Carrito (${count} productos)`}
    >
      <CartIcon />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </Link>
  );
}
