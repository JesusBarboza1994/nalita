import { filaments, getFilament } from "@/config/filaments";
import type { Model3D, Model3DPart, PartColors } from "@/lib/types";

export function defaultColors(model?: Model3D): PartColors {
  return Object.fromEntries((model?.parts ?? []).map((p) => [p.id, p.defaultColor]));
}

export function editableParts(model?: Model3D) {
  return (model?.parts ?? []).filter((p) => p.editable);
}

export function paletteFor(part: Model3DPart) {
  return part.palette ? filaments.filter((f) => part.palette!.includes(f.id)) : filaments;
}

export function filamentHex(id: string) {
  return getFilament(id)?.hex ?? "#cccccc";
}

/** Sólo las partes cuyo color cambió respecto al original: [{ label: "Nariz", value: "Dorado" }] */
export function describeColors(model: Model3D | undefined, colors: PartColors | undefined) {
  if (!model || !colors) return [];
  return model.parts
    .filter((p) => colors[p.id] && colors[p.id] !== p.defaultColor)
    .map((p) => ({ label: p.label, value: getFilament(colors[p.id])?.name ?? colors[p.id] }));
}

export function colorsSummary(model: Model3D | undefined, colors: PartColors | undefined) {
  return describeColors(model, colors)
    .map((c) => `${c.label}: ${c.value}`)
    .join(", ");
}
