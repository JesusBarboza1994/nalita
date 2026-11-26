"use client";

import Link from "next/link";
import { useState } from "react";
import { ColorPicker, ViewTabs } from "@/components/color-picker";
import { CartIcon } from "@/components/icons";
import { LabelEditor, describeLabel } from "@/components/label-editor";
import { LazyModelViewer } from "@/components/model-viewer/lazy";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { bundlePrice, bundleRegularPrice, groupItems, usedSlots } from "@/lib/bundle";
import { cart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { colorsSummary, defaultColors, describeColors, editableParts } from "@/lib/model3d";
import type { Category, LabelValue, PartColors, Product, ResolvedBundle, ResolvedBundleItem, ResolvedBundleSize } from "@/lib/types";
import { Gallery } from "./product-detail";
import { AddedToCartLink, CashOnDeliveryNote, MobileBuyBar, ProductHeader, QuantityStepper, WhatsAppInquiry } from "./purchase-parts";

/** Una unidad elegida dentro del pack, con sus colores propios */
interface Pick {
  uid: string;
  item: ResolvedBundleItem;
  colors: PartColors;
  /** Posición elegida sobre la base en la vista 3D (si no, se acomoda sola) */
  position?: [number, number];
}

let uidCounter = 0;
const newPick = (item: ResolvedBundleItem): Pick => ({ uid: `u${++uidCounter}`, item, colors: {} });

const BASE_KEY = "base";
const fullColors = (pick: Pick) => ({ ...defaultColors(pick.item.model3d), ...pick.colors });

/**
 * Ficha de un producto tipo pack.
 *  - Prearmado (bundle.preset): muestra el contenido fijo.
 *  - Personalizable: el cliente elige tamaño y completa los espacios.
 * En ambos casos, si hay modelos 3D, se ve el pack armado y se pueden cambiar colores.
 */
export function BundleDetail({ product, categories, bundle }: { product: Product; categories: Category[]; bundle: ResolvedBundle }) {
  const preset = bundle.preset;
  const start = preset ?? bundle.initial;
  const [sizeId, setSizeId] = useState(start?.sizeId ?? bundle.sizes[0].id);
  const [picks, setPicks] = useState<Pick[]>(() => (start?.items ?? []).map(newPick));
  const [baseColors, setBaseColors] = useState<PartColors>({});
  const [label, setLabel] = useState<LabelValue | null>(null);
  const [editing, setEditing] = useState<string>(BASE_KEY);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const size = bundle.sizes.find((s) => s.id === sizeId) ?? bundle.sizes[0];
  const baseModel = size.base?.model3d;
  const has3D = !!baseModel || picks.some((p) => p.item.model3d);
  const [view, setView] = useState<"fotos" | "3d">(baseModel ? "3d" : "fotos");

  const { singular, plural } = bundle.itemLabel;
  // Hay piezas que ocupan más de un lugar: se cuentan lugares, no unidades
  const bigItems = bundle.items.some((i) => i.slots > 1);
  const used = usedSlots(picks.map((p) => p.item));
  const missing = size.slots - used;
  const complete = missing === 0;
  // Etiqueta personalizada: sólo si la base (bandeja) tiene dónde montarla
  const labelOption = baseModel?.labelMount ? bundle.labelOption : undefined;
  const activeLabel = labelOption ? label : null;
  const labelPrice = activeLabel && labelOption ? labelOption.price : 0;
  const labelMissing = !!activeLabel && !activeLabel.text.trim();

  const piecesTotal = bundlePrice(size.price, picks.map((p) => p.item));
  const extras = piecesTotal - size.price;
  const total = piecesTotal + labelPrice;
  const regular = complete ? bundleRegularPrice(size.base?.price, picks.map((p) => p.item.price)) + labelPrice : undefined;

  const hasAddOns = bundle.items.some((i) => i.extraPrice > 0) || !!labelOption;

  const countOf = (key: string) => picks.filter((p) => p.item.key === key).length;
  const canAdd = (item: ResolvedBundleItem) =>
    item.available && item.slots <= missing && (bundle.allowRepeats || countOf(item.key) === 0);

  const chooseSize = (s: ResolvedBundleSize) => {
    setSizeId(s.id);
    // Si la bandeja es más chica se quitan los últimos; las posiciones se reacomodan
    setPicks((prev) => {
      let room = s.slots;
      return prev.filter((p) => (room -= p.item.slots) >= 0).map((p) => ({ ...p, position: undefined }));
    });
  };
  const addItem = (item: ResolvedBundleItem) => {
    if (!canAdd(item)) return;
    const pick = newPick(item);
    setPicks((prev) => [...prev, pick]);
    if (editableParts(item.model3d).length) setEditing(pick.uid);
  };
  const removeItem = (key: string) =>
    setPicks((prev) => {
      const i = prev.findLastIndex((p) => p.item.key === key);
      return i === -1 ? prev : prev.filter((_, idx) => idx !== i);
    });
  const removePick = (uid: string) => setPicks((prev) => prev.filter((p) => p.uid !== uid));
  const movePick = (uid: string, position: [number, number]) =>
    setPicks((prev) => prev.map((p) => (p.uid === uid ? { ...p, position } : p)));
  const resetPositions = () => setPicks((prev) => prev.map((p) => ({ ...p, position: undefined })));
  const anyMoved = picks.some((p) => p.position);

  // Partes personalizables: la base + cada unidad con modelo 3D editable
  const colorTargets = [
    ...(editableParts(baseModel).length ? [{ key: BASE_KEY, label: size.base!.name.split(" –")[0], model: baseModel! }] : []),
    ...picks
      .filter((p) => editableParts(p.item.model3d).length)
      .map((p) => {
        const sameBefore = picks.filter((q) => q.item.key === p.item.key);
        const n = sameBefore.length > 1 ? ` ${sameBefore.indexOf(p) + 1}` : "";
        return { key: p.uid, label: `${p.item.name}${n}`, model: p.item.model3d! };
      }),
  ];
  const target = colorTargets.find((t) => t.key === editing) ?? colorTargets[0];
  const targetColors =
    target?.key === BASE_KEY
      ? { ...defaultColors(baseModel), ...baseColors }
      : target && fullColors(picks.find((p) => p.uid === target.key)!);
  const setTargetColor = (partId: string, filamentId: string) => {
    if (!target) return;
    if (target.key === BASE_KEY) setBaseColors((prev) => ({ ...prev, [partId]: filamentId }));
    else setPicks((prev) => prev.map((p) => (p.uid === target.key ? { ...p, colors: { ...p.colors, [partId]: filamentId } } : p)));
    setView("3d");
  };
  const resetTargetColors = () => {
    if (!target) return;
    if (target.key === BASE_KEY) setBaseColors({});
    else setPicks((prev) => prev.map((p) => (p.uid === target.key ? { ...p, colors: {} } : p)));
  };

  // Contenido para carrito / WhatsApp: agrupa unidades iguales con los mismos colores
  const contents = [
    ...picks
      .reduce((map, p) => {
        const details = colorsSummary(p.item.model3d, fullColors(p));
        const k = `${p.item.key}|${details}`;
        const entry = map.get(k) ?? { name: p.item.name, quantity: 0, details: details || undefined };
        entry.quantity++;
        return map.set(k, entry);
      }, new Map<string, { name: string; quantity: number; details?: string }>())
      .values(),
  ];
  const baseCustomizations = describeColors(baseModel, { ...defaultColors(baseModel), ...baseColors }).map((c) => ({
    label: baseModel!.parts.length > 1 ? `${size.base!.name} – ${c.label}` : c.label,
    value: c.value,
  }));
  baseCustomizations.push(...describeLabel(activeLabel));

  const addToCart = () => {
    if (!complete || labelMissing) return;
    cart.add(
      {
        productId: product.id,
        productSlug: product.slug,
        variantId: size.id,
        name: product.name,
        variantName: `${size.name} · ${size.slots} ${size.slots === 1 ? singular : plural}`,
        price: total,
        image: preset ? product.images[0] : (picks[0]?.item.image ?? product.images[0]),
        bundleItems: contents,
        customizations: baseCustomizations.length ? baseCustomizations : undefined,
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const buyLabel = !complete
    ? bigItems
      ? `Completa ${missing} ${missing === 1 ? "lugar" : "lugares"} más`
      : `Elige ${missing} ${missing === 1 ? singular : plural} más`
    : labelMissing
      ? "Escribe el texto de la etiqueta"
      : added
        ? "¡Agregado! ✓"
        : "Agregar al carrito";

  const inquiryDetail = [
    `${size.name}${contents.length ? `: ${contents.map((c) => `${c.quantity} ${c.name}${c.details ? ` (${c.details})` : ""}`).join(", ")}` : ""}`,
    ...baseCustomizations.map((c) => `${c.label}: ${c.value}`),
  ].join(" · ");

  const viewerNote = [
    baseModel?.approximate && "Bandeja referencial",
    picks.some((p) => !p.item.model3d) && "Algunas piezas se ven en foto",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:gap-14">
      {/* Columna izquierda: vista 3D / fotos + espacios del pack */}
      <div className="flex flex-col gap-4 md:sticky md:top-36 md:self-start">
        <div>
          {has3D && <ViewTabs view={view} onChange={setView} />}
          {has3D && view === "3d" ? (
            <LazyModelViewer
              className="aspect-square sm:aspect-[4/3]"
              spec={{
                base: baseModel && {
                  key: BASE_KEY,
                  model: baseModel,
                  colors: { ...defaultColors(baseModel), ...baseColors },
                  label: activeLabel ?? undefined,
                },
                pieces: picks.map((p) => ({
                  key: p.uid,
                  model: p.item.model3d,
                  colors: fullColors(p),
                  image: p.item.image,
                  position: p.position,
                  slots: p.item.slots,
                })),
                slots: size.slots,
              }}
              selectedKey={target?.key}
              onSelect={(key) => colorTargets.some((t) => t.key === key) && setEditing(key)}
              onMove={movePick}
              note={viewerNote || undefined}
            />
          ) : preset ? (
            <Gallery images={product.images} />
          ) : null}
          {view === "3d" && anyMoved && (
            <button type="button" onClick={resetPositions} className="mt-2 text-xs font-medium text-primary hover:underline">
              ↺ Reacomodar piezas
            </button>
          )}
        </div>
        {!preset && (
          <PackPreview size={size} picks={picks} itemLabel={singular} onRemove={removePick} selected={target?.key} onSelect={setEditing} />
        )}
      </div>

      {/* Columna derecha */}
      <div className="flex flex-col gap-6">
        <ProductHeader product={product} categories={categories} />

        <div>
          <Price price={total} compareAtPrice={regular} size="lg" />
          {regular !== undefined && regular > total && (
            <p className="mt-1 text-sm font-semibold text-success">
              Ahorras {formatPrice(regular - total)} frente a comprar por separado
            </p>
          )}
          {/* Desglose: sólo si el total no es directamente el precio del pack */}
          {(extras > 0 || labelPrice > 0) && (
            <dl className="mt-3 max-w-xs space-y-1 rounded-brand border border-border bg-surface p-3 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Pack {size.name.toLowerCase()}</dt>
                <dd>{formatPrice(size.price)}</dd>
              </div>
              {extras > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Piezas especiales</dt>
                  <dd>+{formatPrice(extras)}</dd>
                </div>
              )}
              {labelPrice > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Etiqueta</dt>
                  <dd>+{formatPrice(labelPrice)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-border pt-1 font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
          )}
        </div>

        {preset ? (
          <PresetContents size={size} picks={picks.map((p) => p.item)} customizeSlug={bundle.customizeSlug} />
        ) : (
          <>
            {/* Paso 1: tamaño */}
            <div>
              <p className="text-sm font-semibold">1. Elige el tamaño</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {bundle.sizes.map((s) => {
                  const active = s.id === size.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => chooseSize(s)}
                      aria-pressed={active}
                      className={`flex flex-col items-center rounded-brand border-2 p-2 text-center transition-colors sm:p-3 ${
                        active ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-foreground/30"
                      }`}
                    >
                      <span className="text-xs font-semibold sm:text-sm">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.slots} {s.slots === 1 ? singular : plural}</span>
                      {/* Precio base del pack: las piezas especiales o la etiqueta pueden sumar */}
                      <span className="mt-1 text-[11px] text-muted-foreground">{hasAddOns ? "desde" : "\u00a0"}</span>
                      <span className="font-bold leading-tight">{formatPrice(s.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paso 2: unidades */}
            <div>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold">2. Elige tus {plural}</p>
                <p className={`text-sm font-semibold ${complete ? "text-success" : "text-muted-foreground"}`}>
                  {used}/{size.slots}{bigItems && " lugares"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {bundle.allowRepeats && `Puedes repetir ${plural}. `}
                {bigItems && "Algunas piezas grandes ocupan 2 lugares. "}
                {bundle.items.some((i) => i.extraPrice > 0) && "Las piezas especiales suman un recargo al precio del pack."}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                {bundle.items.map((item) => {
                  const count = countOf(item.key);
                  return (
                    <div
                      key={item.key}
                      className={`overflow-hidden rounded-brand border-2 bg-surface transition-colors ${count > 0 ? "border-primary" : "border-border"} ${item.available ? "" : "opacity-50"}`}
                    >
                      <button type="button" onClick={() => addItem(item)} disabled={!canAdd(item)} className="relative block w-full disabled:cursor-not-allowed" aria-label={`Agregar ${item.name}`}>
                        <ProductImage image={item.image} sizes="(min-width: 640px) 160px, 45vw" />
                        {item.extraPrice > 0 && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                            +{formatPrice(item.extraPrice)}
                          </span>
                        )}
                        {item.slots > 1 && (
                          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-foreground/80 px-2 py-0.5 text-[10px] font-bold text-background">
                            Ocupa {item.slots} lugares
                          </span>
                        )}
                      </button>
                      <div className="p-1.5 sm:p-2">
                        <p className="line-clamp-2 min-h-[2lh] text-[11px] font-semibold leading-tight sm:line-clamp-1 sm:min-h-0 sm:text-xs">{item.name}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <button type="button" onClick={() => removeItem(item.key)} disabled={count === 0} className="h-8 w-8 rounded-full border border-border disabled:opacity-30 sm:h-7 sm:w-7" aria-label={`Quitar ${item.name}`}>−</button>
                          <span className="text-sm font-bold">{count}</span>
                          <button type="button" onClick={() => addItem(item)} disabled={!canAdd(item)} className="h-8 w-8 rounded-full bg-primary text-primary-foreground disabled:opacity-30 sm:h-7 sm:w-7" aria-label={`Agregar ${item.name}`}>+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Tipo de bandeja: clásica o con etiqueta personalizada */}
        {labelOption && (
          <LabelEditor
            option={labelOption}
            value={activeLabel}
            onChange={(v) => {
              setLabel(v);
              setView("3d");
            }}
            title={preset ? "Tipo de bandeja" : "3. Tipo de bandeja"}
          />
        )}

        {/* Colores */}
        {colorTargets.length > 0 && target && targetColors && (
          <div className="rounded-brand border border-border bg-surface p-4">
            <p className="text-sm font-semibold">{preset ? "🎨 Personaliza los colores" : `${labelOption ? 4 : 3}. Personaliza los colores (opcional)`}</p>
            <p className="text-xs text-muted-foreground">Elige qué pieza editar (también puedes tocarla en la vista 3D).</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {colorTargets.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setEditing(t.key)}
                  aria-pressed={t.key === target.key}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    t.key === target.key ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <ColorPicker key={target.key} model={target.model} colors={targetColors} onChange={setTargetColor} onReset={resetTargetColors} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <button type="button" onClick={addToCart} disabled={!complete || labelMissing} className="btn-primary hidden h-11 flex-1 px-6 md:inline-flex">
            <CartIcon width={18} height={18} />
            {buyLabel}
          </button>
        </div>

        <AddedToCartLink show={added} />
        <WhatsAppInquiry productName={product.name} detail={inquiryDetail} />
        <CashOnDeliveryNote />
      </div>

      <MobileBuyBar
        price={formatPrice(total * quantity)}
        note={regular !== undefined && regular > total ? `Ahorras ${formatPrice((regular - total) * quantity)}` : undefined}
        label={buyLabel}
        disabled={!complete || labelMissing}
        onClick={addToCart}
      />
    </div>
  );
}

/** Espacios del pack: un lugar por unidad (tocar para editar colores, × para quitar) */
function PackPreview({
  size,
  picks,
  itemLabel,
  onRemove,
  selected,
  onSelect,
}: {
  size: ResolvedBundleSize;
  picks: Pick[];
  itemLabel: string;
  onRemove: (uid: string) => void;
  selected?: string;
  onSelect: (uid: string) => void;
}) {
  const used = usedSlots(picks.map((p) => p.item));
  return (
    <div className="rounded-brand border border-border bg-muted/60 p-3 sm:p-4">
      <p className="text-center text-xs font-semibold text-muted-foreground">
        Tu pack · {size.name} · {used}/{size.slots}
      </p>
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(size.slots, 3)}, minmax(0, 1fr))` }}>
        {picks.map((pick) => {
          const editable = editableParts(pick.item.model3d).length > 0;
          const span = Math.min(pick.item.slots, size.slots);
          return (
            <div
              key={pick.uid}
              style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
              className={`relative overflow-hidden rounded-xl border-2 bg-surface ${selected === pick.uid ? "border-primary" : "border-transparent"}`}
            >
              <button type="button" onClick={() => editable && onSelect(pick.uid)} className={`block w-full ${span > 1 ? "h-full" : ""}`} aria-label={pick.item.name}>
                <ProductImage image={pick.item.image} sizes={span > 1 ? "240px" : "120px"} className={span > 1 ? "h-full aspect-auto!" : undefined} />
              </button>
              {editable && <span className="absolute bottom-1 left-1 rounded-full bg-surface/90 px-1.5 text-[10px]">🎨</span>}
              <button
                type="button"
                onClick={() => onRemove(pick.uid)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface/90 text-xs font-bold shadow hover:bg-danger hover:text-white"
                aria-label={`Quitar ${pick.item.name}`}
              >
                ×
              </button>
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, size.slots - used) }, (_, i) => (
          <div key={`empty-${i}`} className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground">
            <span className="text-lg leading-none">+</span>
            <span className="text-[10px]">{itemLabel} {used + i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Contenido fijo de un pack prearmado */
function PresetContents({ size, picks, customizeSlug }: { size: ResolvedBundleSize; picks: ResolvedBundleItem[]; customizeSlug?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold">Incluye</p>
      <ul className="mt-2 divide-y divide-border rounded-brand border border-border bg-surface">
        {size.base && (
          <li className="flex items-center gap-3 p-2.5">
            <div className="w-12 shrink-0 overflow-hidden rounded-lg"><ProductImage image={size.base.image} sizes="48px" /></div>
            <span className="flex-1 text-sm">{size.base.name}</span>
          </li>
        )}
        {groupItems(picks).map(({ item, quantity }) => (
          <li key={item.key} className="flex items-center gap-3 p-2.5">
            <div className="w-12 shrink-0 overflow-hidden rounded-lg"><ProductImage image={item.image} sizes="48px" /></div>
            <span className="flex-1 text-sm">{item.name}</span>
            {item.extraPrice > 0 && <span className="text-xs text-muted-foreground">+{formatPrice(item.extraPrice * quantity)}</span>}
            <span className="text-sm font-semibold text-muted-foreground">× {quantity}</span>
          </li>
        ))}
      </ul>
      {customizeSlug && (
        <Link href={`/producto/${customizeSlug}`} className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          ¿Prefieres otra combinación? Arma tu propio pack →
        </Link>
      )}
    </div>
  );
}
