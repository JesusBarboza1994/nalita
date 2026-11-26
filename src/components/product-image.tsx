import Image from "next/image";
import type { ProductImage as ProductImageType } from "@/lib/types";

/** Imagen de producto cuadrada. Los SVG (placeholders) se sirven sin optimizar. */
export function ProductImage({
  image,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
  className = "",
}: {
  image?: ProductImageType;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!image) {
    return <div className={`aspect-square w-full bg-muted ${className}`} />;
  }
  return (
    <div className={`relative aspect-square w-full overflow-hidden bg-muted ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={image.src.endsWith(".svg")}
        className="object-cover"
      />
    </div>
  );
}
