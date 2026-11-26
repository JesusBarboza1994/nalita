import { siteConfig } from "@/config/site";

const formatter = new Intl.NumberFormat(siteConfig.locale, {
  style: "currency",
  currency: siteConfig.currency,
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number) {
  return formatter.format(value);
}
