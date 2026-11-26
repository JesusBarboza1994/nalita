"use client";

import { useEffect, useRef, useState } from "react";
import { ViewerScene, type ViewerSpec } from "./viewer-scene";

export type { ViewerPiece, ViewerSpec } from "./viewer-scene";

function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/**
 * Visor 3D interactivo (arrastrar para girar, pellizcar/rueda para zoom).
 * Cargarlo con next/dynamic para no sumar three.js al resto de las páginas.
 */
export default function ModelViewer({
  spec,
  selectedKey,
  onSelect,
  onMove,
  className = "",
  note,
}: {
  spec: ViewerSpec;
  selectedKey?: string;
  onSelect?: (key: string) => void;
  /** Al soltar una pieza movida sobre la base: posición [x, z] */
  onMove?: (key: string, position: [number, number]) => void;
  className?: string;
  /** Texto chico sobre el visor, ej. "Vista referencial" */
  note?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ViewerScene | null>(null);
  const onSelectRef = useRef(onSelect);
  const onMoveRef = useRef(onMove);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onMoveRef.current = onMove;
  }, [onSelect, onMove]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let scene: ViewerScene;
    try {
      scene = new ViewerScene(container, {
        background: cssVar("--muted", "#f6eef3"),
        accent: cssVar("--primary", "#e85d8a"),
      });
    } catch {
      // WebGL no disponible
      queueMicrotask(() => setFailed(true));
      return;
    }
    scene.onLoading = setLoading;
    scene.onError = () => setFailed(true);
    scene.onSelect = (key) => onSelectRef.current?.(key);
    scene.onMove = (key, position) => onMoveRef.current?.(key, position);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  const specKey = JSON.stringify(spec);
  useEffect(() => {
    sceneRef.current?.update(JSON.parse(specKey) as ViewerSpec, selectedKey);
    // selectedKey se aplica aparte para no recargar al seleccionar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey]);

  useEffect(() => {
    sceneRef.current?.select(selectedKey);
  }, [selectedKey]);

  return (
    <div className={`relative overflow-hidden rounded-brand border border-border bg-muted ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {loading && !failed && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-surface/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">Cargando 3D…</span>
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          No pudimos mostrar la vista 3D en este dispositivo.
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex flex-wrap items-end justify-between gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
        <span className="rounded-full bg-surface/80 px-2 py-0.5">
          <span className="sm:hidden">{spec.base ? "Mueve las piezas · gira con el fondo" : "Arrastra para girar"}</span>
          <span className="hidden sm:inline">
            {spec.base ? "Arrastra una pieza para moverla · el fondo para girar" : "Arrastra para girar · zoom con dos dedos"}
          </span>
        </span>
        {note && <span className="rounded-full bg-surface/80 px-2 py-0.5">{note}</span>}
      </div>
    </div>
  );
}
