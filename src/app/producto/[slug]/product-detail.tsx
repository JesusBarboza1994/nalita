"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CashIcon, CartIcon, WhatsAppIcon } from "@/components/icons";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { cart } from "@/lib/cart-store";
import { getDefaultVariant, resolveVariants } from "@/lib/product-utils";
import { buildProductInquiryMessage, whatsappLink } from "@/lib/whatsapp";
import type { Category, Product, ProductImage as ProductImageType, ResolvedVariant } from "@/lib/types";

export function ProductDetail({ product, categories }: { product: Product; categories: Category[] }) {
  const variants = useMemo<ResolvedVariant[]>(
    () =>
      product.variants.length > 0
        ? resolveVariants(product)
        : [{ id: "default", sku: product.id, name: "", options: {}, price: product.price, compareAtPrice: product.compareAtPrice, images: product.images, available: true }],
    [product],
  );

  const [selected, setSelected] = useState<Record<string, string>>(
    () => (getDefaultVariant(product) ?? variants[0]).options,
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant =
    variants.find((v) => Object.entries(selected).every(([k, val]) => v.options[k] === val)) ?? variants[0];

  const selectValue = (option: string, value: string) => {
    const wanted = { ...selected, [option]: value };
    const exact = variants.find((v) => Object.entries(wanted).every(([k, val]) => v.options[k] === val));
    if (exact) return setSelected(wanted);
    // Si la combinación no existe, saltar a la mejor variante que tenga ese valor
    const fallback =
      variants.find((v) => v.options[option] === value && v.available) ?? variants.find((v) => v.options[option] === value);
    if (fallback) setSelected(fallback.options);
  };

  /** ¿Existe una variante disponible con este valor y el resto de la selección actual? */
  const isValueAvailable = (option: string, value: string) =>
    variants.some(
      (v) =>
        v.available &&
        v.options[option] === value &&
        Object.entries(selected).every(([k, val]) => k === option || v.options[k] === val),
    );

  const addToCart = () => {
    cart.add(
      {
        productId: product.id,
        productSlug: product.slug,
        variantId: variant.id,
        name: product.name,
        variantName: variant.name,
        price: variant.price,
        image: variant.images[0],
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
      <Gallery key={variant.id} images={variant.images} />

      <div className="flex flex-col gap-5">
        <div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link key={c.id} href={`/categoria/${c.slug}`} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                {c.name}
              </Link>
            ))}
            {product.isNew && <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">Nuevo</span>}
            {product.customizable && <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary">Personalizable</span>}
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{product.name}</h1>
          <p className="mt-2 text-muted-foreground">{product.shortDescription}</p>
        </div>

        <Price price={variant.price} compareAtPrice={variant.compareAtPrice} size="lg" />

        {product.options.map((option) => (
          <div key={option.name}>
            <p className="text-sm font-semibold">
              {option.name}: <span className="font-normal text-muted-foreground">{selected[option.name]}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {option.values.map((value) => {
                const active = selected[option.name] === value;
                const available = isValueAvailable(option.name, value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectValue(option.name, value)}
                    aria-pressed={active}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      active ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface hover:border-foreground/30"
                    } ${available ? "" : "text-muted-foreground line-through opacity-60"}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-border bg-surface">
            <button type="button" className="h-11 w-11 text-lg" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Restar">−</button>
            <span className="w-8 text-center font-semibold" aria-live="polite">{quantity}</span>
            <button type="button" className="h-11 w-11 text-lg" onClick={() => setQuantity((q) => q + 1)} aria-label="Sumar">+</button>
          </div>
          <button type="button" onClick={addToCart} disabled={!variant.available} className="btn-primary h-11 flex-1 px-6">
            <CartIcon width={18} height={18} />
            {!variant.available ? "Sin stock" : added ? "¡Agregado! ✓" : "Agregar al carrito"}
          </button>
        </div>

        {added && (
          <Link href="/carrito" className="-mt-2 text-sm font-semibold text-primary hover:underline">
            Ver carrito y finalizar compra →
          </Link>
        )}

        <a
          href={whatsappLink(buildProductInquiryMessage(product.name, variant.name))}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline h-11"
          onClick={(e) => {
            e.currentTarget.href = whatsappLink(buildProductInquiryMessage(product.name, variant.name, window.location.href));
          }}
        >
          <WhatsAppIcon width={18} height={18} className="text-whatsapp" /> Consultar por WhatsApp
        </a>

        <div className="flex items-start gap-3 rounded-brand bg-muted p-4 text-sm">
          <CashIcon className="mt-0.5 shrink-0 text-primary" />
          <p>
            <span className="font-semibold">Pagás al recibir.</span>{" "}
            <span className="text-muted-foreground">
              Confirmamos tu pedido por WhatsApp y abonás contra entrega.
              {product.customizable && " La personalización la coordinamos por chat."}
            </span>
          </p>
        </div>

        {variant.sku && <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>}
      </div>
    </div>
  );
}

function Gallery({ images }: { images: ProductImageType[] }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <ProductImage image={current} priority sizes="(min-width: 768px) 50vw, 100vw" className="rounded-brand border border-border" />
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver imagen ${i + 1}`}
              className={`overflow-hidden rounded-xl border-2 ${i === index ? "border-primary" : "border-transparent"}`}
            >
              <ProductImage image={img} sizes="100px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
