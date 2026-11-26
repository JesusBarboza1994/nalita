"use client";

import Link from "next/link";
import { siteConfig } from "@/config/site";
import { CashIcon, TrashIcon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";
import { cart, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";

export function CartView() {
  const { items, subtotal, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-brand border border-dashed border-border p-12 text-center">
        <p className="text-5xl">🛒</p>
        <p className="mt-3 font-semibold">Tu carrito está vacío</p>
        <p className="mt-1 text-sm text-muted-foreground">Descubrí nuestros productos impresos en 3D.</p>
        <Link href="/productos" className="btn-primary mt-6">Ver catálogo</Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-3">
      <ul className="divide-y divide-border rounded-brand border border-border bg-surface lg:col-span-2">
        {items.map((item) => (
          <li key={item.key} className="flex gap-4 p-4">
            <Link href={`/producto/${item.productSlug}`} className="w-20 shrink-0 overflow-hidden rounded-xl sm:w-24">
              <ProductImage image={item.image} sizes="96px" />
            </Link>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/producto/${item.productSlug}`} className="font-semibold hover:text-primary">{item.name}</Link>
                  {item.variantName && <p className="text-sm text-muted-foreground">{item.variantName}</p>}
                </div>
                <button
                  onClick={() => cart.remove(item.key)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-danger"
                  aria-label={`Quitar ${item.name}`}
                >
                  <TrashIcon width={18} height={18} />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <div className="flex items-center rounded-full border border-border">
                  <button className="h-8 w-8" onClick={() => cart.setQuantity(item.key, item.quantity - 1)} aria-label="Restar">−</button>
                  <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                  <button className="h-8 w-8" onClick={() => cart.setQuantity(item.key, item.quantity + 1)} aria-label="Sumar">+</button>
                </div>
                <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-brand border border-border bg-surface p-5 lg:sticky lg:top-36">
        <h2 className="text-lg font-bold">Resumen</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Productos ({count})</dt>
            <dd className="font-medium">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd className="font-medium">A coordinar</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-bold">{formatPrice(subtotal)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">{siteConfig.shippingNote}</p>
        <Link href="/checkout" className="btn-primary mt-5 w-full py-3">Finalizar compra</Link>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <CashIcon width={16} height={16} className="text-primary" /> Pago contra entrega
        </div>
      </aside>
    </div>
  );
}
