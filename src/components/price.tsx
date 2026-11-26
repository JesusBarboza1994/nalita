import { formatPrice } from "@/lib/format";
import { isOnSale } from "@/lib/product-utils";

export function Price({
  price,
  compareAtPrice,
  from = false,
  size = "md",
}: {
  price: number;
  compareAtPrice?: number;
  /** Muestra "Desde" cuando hay variantes con distintos precios */
  from?: boolean;
  size?: "md" | "lg";
}) {
  const sale = isOnSale(price, compareAtPrice);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      {from && <span className="text-xs text-muted-foreground">Desde</span>}
      <span className={`font-bold ${size === "lg" ? "text-3xl" : "text-base"} ${sale ? "text-primary" : ""}`}>
        {formatPrice(price)}
      </span>
      {sale && (
        <span className={`text-muted-foreground line-through ${size === "lg" ? "text-lg" : "text-sm"}`}>
          {formatPrice(compareAtPrice!)}
        </span>
      )}
    </div>
  );
}
