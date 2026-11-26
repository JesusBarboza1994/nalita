/**
 * Colores de filamento disponibles para personalizar piezas en 3D.
 * Editá esta lista según los filamentos que tengas en stock.
 * Los modelos 3D pueden limitar qué colores se ofrecen en cada parte (`palette`).
 */
export interface Filament {
  id: string;
  name: string;
  hex: string;
}

export const filaments: Filament[] = [
  { id: "negro", name: "Negro", hex: "#1A1A1A" },
  { id: "blanco", name: "Blanco", hex: "#F5F2EA" },
  { id: "blanco-frio", name: "Blanco frío", hex: "#EAF1F6" },
  { id: "beige-claro", name: "Beige claro", hex: "#F1D9C4" },
  { id: "marron-madera", name: "Marrón madera", hex: "#B5865B" },
  { id: "marron-oscuro", name: "Marrón oscuro", hex: "#6F5034" },
  { id: "gris", name: "Gris", hex: "#5E6673" },
  { id: "rojo", name: "Rojo", hex: "#C12E1F" },
  { id: "naranja", name: "Naranja", hex: "#FF6A13" },
  { id: "dorado", name: "Dorado", hex: "#E4BD68" },
  { id: "rosado-pastel", name: "Rosado pastel", hex: "#F4B8CB" },
  { id: "verde-oscuro", name: "Verde oscuro", hex: "#2E5E3E" },
];

export function getFilament(id: string) {
  return filaments.find((f) => f.id === id);
}
