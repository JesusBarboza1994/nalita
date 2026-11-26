import Link from "next/link";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { discountPercent, getPriceRange, isProductAvailable } from "@/lib/product-utils";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const { min, max } = getPriceRange(product);
  const compareAt = min === product.price ? product.compareAtPrice : undefined;
  const discount = discountPercent(min, compareAt);
  const available = isProductAvailable(product);
  const colorOption = product.options.find((o) => o.name.toLowerCase() === "color");

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-brand border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="relative">
        <ProductImage image={product.images[0]} className="transition duration-300 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.isNew && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">Nuevo</span>
          )}
          {discount > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">-{discount}%</span>
          )}
          {!available && (
            <span className="rounded-full bg-foreground/80 px-2.5 py-0.5 text-xs font-semibold text-background">Agotado</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-semibold leading-snug group-hover:text-primary">{product.name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.shortDescription}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <Price price={min} compareAtPrice={compareAt} from={min !== max} />
          {colorOption && colorOption.values.length > 1 && (
            <span className="shrink-0 text-xs text-muted-foreground">{colorOption.values.length} colores</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
