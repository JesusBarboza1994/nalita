import type { CategorySeason } from "@/lib/types";

/** ¿El mes (1-12) cae dentro de la temporada? Soporta temporadas que cruzan el año. */
export function isInSeason(season: CategorySeason | undefined, month: number) {
  if (!season) return false;
  const { fromMonth, toMonth } = season;
  return fromMonth <= toMonth ? month >= fromMonth && month <= toMonth : month >= fromMonth || month <= toMonth;
}

/** Mes actual (1-12) en la zona horaria indicada */
export function currentMonth(timeZone: string, date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone }).format(date));
}
