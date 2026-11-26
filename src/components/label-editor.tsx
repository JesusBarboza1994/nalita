"use client";

import { getFilament } from "@/config/filaments";
import { ColorPicker } from "@/components/color-picker";
import { formatPrice } from "@/lib/format";
import type { LabelValue, Model3D, TextLabelOption } from "@/lib/types";

/** Caracteres permitidos en la etiqueta: letras (con tildes/ñ), números, espacios y signos comunes */
const NOT_ALLOWED = /[^\p{L}\p{N} .,:;!¡?¿'"&()\-+#@♥❤★]/gu;

export function sanitizeLabelText(text: string, max: number) {
  return text.replace(NOT_ALLOWED, "").slice(0, max);
}

export function defaultLabel(option: TextLabelOption): LabelValue {
  return { text: "", plateColor: option.plateColor, textColor: option.textColor };
}

/** Datos de la etiqueta para carrito / WhatsApp */
export function describeLabel(label: LabelValue | null) {
  if (!label) return [];
  return [
    { label: "Etiqueta", value: `“${label.text.trim()}”` },
    { label: "Color etiqueta", value: getFilament(label.plateColor)?.name ?? label.plateColor },
    { label: "Color texto", value: getFilament(label.textColor)?.name ?? label.textColor },
  ];
}

/**
 * Selector "Clásica / Con etiqueta" + texto y colores de la etiqueta.
 * `value = null` significa sin etiqueta.
 */
export function LabelEditor({
  option,
  value,
  onChange,
  title = "Tipo de bandeja",
}: {
  option: TextLabelOption;
  value: LabelValue | null;
  onChange: (value: LabelValue | null) => void;
  title?: string;
}) {
  // ColorPicker trabaja con "partes": usamos dos partes virtuales (etiqueta y texto)
  const pseudoModel: Model3D = {
    src: "",
    parts: [
      { id: "plate", label: "Color de la etiqueta", defaultColor: option.plateColor, editable: true },
      { id: "text", label: "Color del texto", defaultColor: option.textColor, editable: true },
    ],
  };

  return (
    <div>
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[
          { active: !value, title: "Clásica", subtitle: "Sin etiqueta", onClick: () => onChange(null) },
          {
            active: !!value,
            title: option.name,
            subtitle: `+${formatPrice(option.price)}`,
            onClick: () => !value && onChange(defaultLabel(option)),
          },
        ].map((o) => (
          <button
            key={o.title}
            type="button"
            onClick={o.onClick}
            aria-pressed={o.active}
            className={`rounded-brand border-2 p-3 text-left transition-colors ${
              o.active ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-foreground/30"
            }`}
          >
            <span className="block text-sm font-semibold">{o.title}</span>
            <span className="text-xs text-muted-foreground">{o.subtitle}</span>
          </button>
        ))}
      </div>

      {value && (
        <div className="mt-3 flex flex-col gap-4 rounded-brand border border-border bg-surface p-4">
          {option.description && <p className="text-xs text-muted-foreground">{option.description}</p>}
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Texto de la etiqueta
            <input
              className="input"
              value={value.text}
              maxLength={option.maxLength}
              placeholder={option.placeholder}
              onChange={(e) => onChange({ ...value, text: sanitizeLabelText(e.target.value, option.maxLength) })}
            />
            <span className="text-right text-xs text-muted-foreground">
              {value.text.length}/{option.maxLength}
            </span>
          </label>
          <ColorPicker
            model={pseudoModel}
            colors={{ plate: value.plateColor, text: value.textColor }}
            onChange={(part, filament) =>
              onChange(part === "plate" ? { ...value, plateColor: filament } : { ...value, textColor: filament })
            }
          />
        </div>
      )}
    </div>
  );
}
