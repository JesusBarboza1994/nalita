"use client";

import { useMemo, useState } from "react";
import { ColorPicker, ViewTabs } from "@/components/color-picker";
import { CartIcon } from "@/components/icons";
import { LabelEditor, describeLabel } from "@/components/label-editor";
import { LazyModelViewer } from "@/components/model-viewer/lazy";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { cart } from "@/lib/cart-store";
import { colorsSummary, defaultColors, describeColors, editableParts } from "@/lib/model3d";
import { getDefaultVariant, resolveVariants } from "@/lib/product-utils";
import type { Category, LabelValue, PartColors, Product, ProductImage as ProductImageType, ResolvedVariant } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { AddedToCartLink, CashOnDeliveryNote, MobileBuyBar, ProductHeader, QuantityStepper, WhatsAppInquiry } from "./purchase-parts";

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
  const [view, setView] = useState<"fotos" | "3d">("fotos");
  const [chosenColors, setChosenColors] = useState<PartColors>({});

  const variant =
    variants.find((v) => Object.entries(selected).every(([k, val]) => v.options[k] === val)) ?? variants[0];

  // Modelo 3D de la variante o del producto; colores = originales + los elegidos
  const model = variant.model3d ?? product.model3d;
  const colors = { ...defaultColors(model), ...chosenColors };
  // Etiqueta con texto (ej. bandeja con etiqueta), si el modelo admite montarla
  const [label, setLabel] = useState<LabelValue | null>(null);
  const labelOption = model?.labelMount ? product.labelOption : undefined;
  const activeLabel = labelOption ? label : null;
  const labelMissing = !!activeLabel && !activeLabel.text.trim();
  const price = variant.price + (activeLabel && labelOption ? labelOption.price : 0);
  const customizations = [...describeColors(model, colors), ...describeLabel(activeLabel)];
  const pickColor = (partId: string, filamentId: string) => {
    setChosenColors((prev) => ({ ...prev, [partId]: filamentId }));
    setView("3d");
  };

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

  const buyLabel = !variant.available
    ? "Sin stock"
    : labelMissing
      ? "Escribe el texto de la etiqueta"
      : added
        ? "¡Agregado! ✓"
        : "Agregar al carrito";

  const addToCart = () => {
    if (labelMissing) return;
    cart.add(
      {
        productId: product.id,
        productSlug: product.slug,
        variantId: variant.id,
        name: product.name,
        variantName: variant.name,
        price,
        image: variant.images[0],
        customizations: customizations.length ? customizations : undefined,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
      <div>
        {model && <ViewTabs view={view} onChange={setView} />}
        {model && view === "3d" ? (
          <LazyModelViewer
            className="aspect-square"
            spec={{ pieces: [{ key: "pieza", model, colors, label: activeLabel ?? undefined }] }}
            note={model.approximate ? "Vista referencial" : undefined}
          />
        ) : (
          <Gallery key={variant.id} images={variant.images} />
        )}
      </div>

      <div className="flex flex-col gap-5">
        <ProductHeader product={product} categories={categories} />

        <Price price={price} compareAtPrice={variant.compareAtPrice} size="lg" />

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

        {labelOption && (
          <LabelEditor
            option={labelOption}
            value={activeLabel}
            onChange={(v) => {
              setLabel(v);
              setView("3d");
            }}
          />
        )}

        {model && editableParts(model).length > 0 && (
          <div className="rounded-brand border border-border bg-surface p-4">
            <p className="mb-3 text-sm font-semibold">🎨 Personaliza los colores</p>
            <ColorPicker model={model} colors={colors} onChange={pickColor} onReset={() => setChosenColors({})} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <button type="button" onClick={addToCart} disabled={!variant.available || labelMissing} className="btn-primary hidden h-11 flex-1 px-6 md:inline-flex">
            <CartIcon width={18} height={18} />
            {buyLabel}
          </button>
        </div>

        <AddedToCartLink show={added} />

        <WhatsAppInquiry
          productName={product.name}
          detail={[variant.name, colorsSummary(model, colors)].filter(Boolean).join(" · ") || undefined}
        />

        <CashOnDeliveryNote extra={product.customizable ? "La personalización la coordinamos por chat." : undefined} />

        {variant.sku && <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>}
      </div>

      <MobileBuyBar
        price={formatPrice(price * quantity)}
        label={buyLabel}
        disabled={!variant.available || labelMissing}
        onClick={addToCart}
      />
    </div>
  );
}

export function Gallery({ images }: { images: ProductImageType[] }) {
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
