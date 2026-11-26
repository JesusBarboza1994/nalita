"use client";

import dynamic from "next/dynamic";

/** Visor 3D cargado bajo demanda (three.js no entra en el bundle general) */
export const LazyModelViewer = dynamic(() => import("./model-viewer"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-square items-center justify-center rounded-brand border border-border bg-muted text-xs text-muted-foreground">
      Cargando 3D…
    </div>
  ),
});
