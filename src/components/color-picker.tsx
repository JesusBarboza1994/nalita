"use client";

import { getFilament } from "@/config/filaments";
import { editableParts, paletteFor } from "@/lib/model3d";
import type { Model3D, PartColors } from "@/lib/types";

/** Muestras de color por cada parte editable de un modelo 3D */
export function ColorPicker({
  model,
  colors,
  onChange,
  onReset,
}: {
  model: Model3D;
  colors: PartColors;
  onChange: (partId: string, filamentId: string) => void;
  onReset?: () => void;
}) {
  const parts = editableParts(model);
  if (parts.length === 0) return null;
  const changed = parts.some((p) => colors[p.id] !== p.defaultColor);

  return (
    <div className="flex flex-col gap-3">
      {parts.map((part) => {
        const selected = colors[part.id] ?? part.defaultColor;
        return (
          <div key={part.id}>
            <p className="text-sm">
              <span className="font-semibold">{part.label}:</span>{" "}
              <span className="text-muted-foreground">{getFilament(selected)?.name ?? selected}</span>
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1 sm:gap-1.5">
              {paletteFor(part).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  title={f.name}
                  aria-label={`${part.label}: ${f.name}`}
                  aria-pressed={selected === f.id}
                  onClick={() => onChange(part.id, f.id)}
                  className={`h-[26px] w-[26px] rounded-full border border-black/10 transition-transform hover:scale-110 sm:h-7 sm:w-7 ${
                    selected === f.id ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : ""
                  }`}
                  style={{ backgroundColor: f.hex }}
                />
              ))}
            </div>
          </div>
        );
      })}
      {changed && onReset && (
        <button type="button" onClick={onReset} className="self-start text-xs font-medium text-primary hover:underline">
          Volver a los colores originales
        </button>
      )}
    </div>
  );
}

/** Pestañas Fotos / 3D */
export function ViewTabs({ view, onChange }: { view: "fotos" | "3d"; onChange: (v: "fotos" | "3d") => void }) {
  return (
    <div className="mb-3 inline-flex rounded-full border border-border bg-surface p-1 text-sm font-medium">
      {(["3d", "fotos"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={view === v}
          className={`rounded-full px-4 py-1.5 transition-colors ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          {v === "3d" ? "Ver en 3D" : "Fotos"}
        </button>
      ))}
    </div>
  );
}
