"use client";

import Link from "next/link";
import { CashIcon, WhatsAppIcon } from "@/components/icons";
import { buildProductInquiryMessage, whatsappLink } from "@/lib/whatsapp";
import type { Category, Product } from "@/lib/types";

/** Piezas compartidas entre la ficha de producto normal y la de packs */

export function ProductHeader({ product, categories }: { product: Product; categories: Category[] }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link key={c.id} href={`/categoria/${c.slug}`} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            {c.name}
          </Link>
        ))}
        {product.bundle && <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Pack</span>}
        {product.isNew && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">Nuevo</span>}
        {product.customizable && <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary">Personalizable</span>}
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{product.name}</h1>
      <p className="mt-2 text-muted-foreground">{product.shortDescription}</p>
    </div>
  );
}

export function QuantityStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center rounded-full border border-border bg-surface">
      <button type="button" className="h-11 w-11 text-lg" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Restar">−</button>
      <span className="w-8 text-center font-semibold" aria-live="polite">{value}</span>
      <button type="button" className="h-11 w-11 text-lg" onClick={() => onChange(value + 1)} aria-label="Sumar">+</button>
    </div>
  );
}

export function WhatsAppInquiry({ productName, detail }: { productName: string; detail?: string }) {
  return (
    <a
      href={whatsappLink(buildProductInquiryMessage(productName, detail))}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-outline h-11"
      onClick={(e) => {
        e.currentTarget.href = whatsappLink(buildProductInquiryMessage(productName, detail, window.location.href));
      }}
    >
      <WhatsAppIcon width={18} height={18} className="text-whatsapp" /> Consultar por WhatsApp
    </a>
  );
}

export function CashOnDeliveryNote({ extra }: { extra?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-brand bg-muted p-4 text-sm">
      <CashIcon className="mt-0.5 shrink-0 text-primary" />
      <p>
        <span className="font-semibold">Pagas al recibir.</span>{" "}
        <span className="text-muted-foreground">
          Confirmamos tu pedido por WhatsApp y abonas contra entrega.{extra ? ` ${extra}` : ""}
        </span>
      </p>
    </div>
  );
}

export function AddedToCartLink({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <Link href="/carrito" className="-mt-2 text-sm font-semibold text-primary hover:underline">
      Ver carrito y finalizar compra →
    </Link>
  );
}

/**
 * Barra fija inferior en móvil: precio + botón de compra siempre a mano
 * mientras el cliente personaliza. En pantallas grandes no se muestra.
 */
export function MobileBuyBar({
  price,
  note,
  label,
  disabled,
  onClick,
}: {
  price: string;
  note?: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <>
      {/* espacio para que la barra no tape el final de la página */}
      <div className="h-20 md:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-lg font-extrabold leading-tight">{price}</p>
            {note && <p className="truncate text-[11px] font-semibold text-success">{note}</p>}
          </div>
          <button type="button" onClick={onClick} disabled={disabled} className="btn-primary ml-auto h-11 min-w-0 flex-1 px-4">
            <span className="truncate">{label}</span>
          </button>
        </div>
      </div>
    </>
  );
}
