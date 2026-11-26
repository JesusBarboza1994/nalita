import type { Category } from "@/lib/types";

/** Data mock — reemplazar por consulta a base de datos más adelante */
export const categories: Category[] = [
  {
    id: "cat-deco",
    slug: "decoracion",
    name: "Decoración",
    description: "Piezas para darle personalidad a cada rincón.",
    icon: "🏺",
    order: 1,
  },
  {
    id: "cat-macetas",
    slug: "macetas",
    name: "Macetas",
    description: "Macetas geométricas y divertidas para tus plantas.",
    icon: "🪴",
    order: 2,
  },
  {
    id: "cat-llaveros",
    slug: "llaveros",
    name: "Llaveros",
    description: "Llaveros livianos, resistentes y personalizables.",
    icon: "🔑",
    order: 3,
  },
  {
    id: "cat-figuras",
    slug: "figuras",
    name: "Figuras",
    description: "Figuras y coleccionables impresos en alta definición.",
    icon: "🐉",
    order: 4,
  },
  {
    id: "cat-organizadores",
    slug: "organizadores",
    name: "Organizadores",
    description: "Orden para tu escritorio, cocina o taller.",
    icon: "🗂️",
    order: 5,
  },
  {
    id: "cat-lamparas",
    slug: "lamparas",
    name: "Lámparas",
    description: "Lámparas y veladores con texturas únicas.",
    icon: "💡",
    order: 6,
  },
  {
    id: "cat-navidad",
    slug: "navidad",
    name: "Navidad",
    description: "Muñecos tejidos navideños, bandejas y packs para armar tu propia escena.",
    icon: "🎄",
    order: 7,
    // Se ve todo el año, pero se resalta de octubre a diciembre
    season: { fromMonth: 10, toMonth: 12, label: "Temporada navideña" },
  },
];
