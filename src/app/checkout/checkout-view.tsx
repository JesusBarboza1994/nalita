"use client";

import Link from "next/link";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import { CashIcon, WhatsAppIcon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";
import { cart, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import type { CheckoutCustomer } from "@/lib/types";
import { buildOrderMessage, generateOrderCode, whatsappLink } from "@/lib/whatsapp";

type Placed = { code: string; link: string };

const FIELDS: { name: keyof CheckoutCustomer; label: string; type?: string; required?: boolean; placeholder?: string; full?: boolean; autoComplete?: string }[] = [
  { name: "name", label: "Nombre y apellido", required: true, autoComplete: "name" },
  { name: "phone", label: "Teléfono / WhatsApp", type: "tel", required: true, autoComplete: "tel" },
  { name: "address", label: "Dirección de entrega", required: true, full: true, placeholder: "Calle, número, piso/depto", autoComplete: "street-address" },
  { name: "city", label: "Ciudad / Barrio", required: true, autoComplete: "address-level2" },
  { name: "reference", label: "Referencia (opcional)", placeholder: "Entre calles, color de la casa..." },
  { name: "notes", label: "Notas del pedido (opcional)", full: true, placeholder: "Texto para personalizar, horario de entrega, etc." },
];

export function CheckoutView() {
  const { items, subtotal } = useCart();
  const [placed, setPlaced] = useState<Placed | null>(null);

  if (placed) {
    return (
      <div className="mx-auto max-w-lg rounded-brand border border-border bg-surface p-8 text-center">
        <p className="text-5xl">🎉</p>
        <h1 className="mt-3 text-2xl font-bold">¡Pedido {placed.code} listo!</h1>
        <p className="mt-2 text-muted-foreground">
          Para confirmarlo, enviá el mensaje que preparamos por WhatsApp. Ahí coordinamos el envío y pagás al recibir.
        </p>
        <a href={placed.link} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-6 w-full py-3 text-base">
          <WhatsAppIcon /> Enviar pedido por WhatsApp
        </a>
        <Link href="/productos" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Seguir comprando
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-brand border border-dashed border-border p-12 text-center">
        <p className="font-semibold">No hay productos en tu carrito</p>
        <Link href="/productos" className="btn-primary mt-6">Ver catálogo</Link>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const customer: CheckoutCustomer = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      reference: data.reference?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
    };
    const code = generateOrderCode();
    const link = whatsappLink(buildOrderMessage(code, items, customer));
    // TODO: cuando haya base de datos, guardar el pedido acá antes de redirigir.
    window.open(link, "_blank", "noopener,noreferrer");
    cart.clear();
    setPlaced({ code, link });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form onSubmit={onSubmit} className="lg:col-span-3">
        <h1 className="text-3xl font-bold">Finalizar compra</h1>

        <div className="mt-6 flex items-start gap-3 rounded-brand border border-primary/30 bg-primary/5 p-4">
          <CashIcon className="mt-0.5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-semibold">Pago contra entrega</p>
            <p className="text-muted-foreground">
              No pagás nada ahora. Al confirmar se abre WhatsApp con tu pedido para coordinar la entrega y abonás al recibir.
            </p>
          </div>
        </div>

        <fieldset className="mt-6 grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-lg font-bold">Datos de entrega</legend>
          {FIELDS.map((f) => (
            <label key={f.name} className={`flex flex-col gap-1.5 text-sm font-medium ${f.full ? "sm:col-span-2" : ""}`}>
              {f.label}
              {f.name === "notes" ? (
                <textarea name={f.name} rows={3} placeholder={f.placeholder} className="input resize-none" />
              ) : (
                <input
                  name={f.name}
                  type={f.type ?? "text"}
                  required={f.required}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  className="input"
                />
              )}
            </label>
          ))}
        </fieldset>

        <button type="submit" className="btn-whatsapp mt-8 w-full py-3.5 text-base">
          <WhatsAppIcon /> Confirmar pedido por WhatsApp
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">{siteConfig.shippingNote}</p>
      </form>

      <aside className="h-fit rounded-brand border border-border bg-surface p-5 lg:col-span-2 lg:sticky lg:top-36">
        <h2 className="text-lg font-bold">Tu pedido</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3">
              <div className="relative w-14 shrink-0 overflow-hidden rounded-lg">
                <ProductImage image={item.image} sizes="56px" />
                <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-bold text-background">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium leading-tight">{item.name}</p>
                {item.variantName && <p className="text-muted-foreground">{item.variantName}</p>}
              </div>
              <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd>A coordinar</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
        </dl>
        <Link href="/carrito" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">← Editar carrito</Link>
      </aside>
    </div>
  );
}
