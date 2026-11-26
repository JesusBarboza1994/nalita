import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/format";
import type { CartItem, CheckoutCustomer } from "@/lib/types";

export function whatsappLink(message: string, phone: string = siteConfig.whatsappNumber) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function generateOrderCode() {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${siteConfig.orderPrefix}-${random}`;
}

export function buildOrderMessage(orderCode: string, items: CartItem[], customer: CheckoutCustomer) {
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const lines = [
    `¡Hola ${siteConfig.name}! 👋 Quiero confirmar este pedido:`,
    ``,
    `🧾 *Pedido ${orderCode}*`,
    ...items.map(
      (i) => `• ${i.quantity} x ${i.name}${i.variantName ? ` (${i.variantName})` : ""} — ${formatPrice(i.price * i.quantity)}`,
    ),
    ``,
    `*Total productos: ${formatPrice(total)}*`,
    `💵 Pago: contra entrega`,
    ``,
    `📦 *Datos de entrega*`,
    `Nombre: ${customer.name}`,
    `Teléfono: ${customer.phone}`,
    `Dirección: ${customer.address}`,
    `Ciudad: ${customer.city}`,
  ];
  if (customer.reference) lines.push(`Referencia: ${customer.reference}`);
  if (customer.notes) lines.push(``, `📝 Notas: ${customer.notes}`);
  return lines.join("\n");
}

export function buildProductInquiryMessage(productName: string, variantName?: string, url?: string) {
  return [
    `¡Hola ${siteConfig.name}! Tengo una consulta sobre:`,
    `*${productName}*${variantName ? ` (${variantName})` : ""}`,
    url ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}
