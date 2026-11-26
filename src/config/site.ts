/**
 * Configuración general de la tienda.
 * Edita estos valores para adaptar la tienda sin tocar los componentes.
 */
export const siteConfig = {
  name: "nalita3d",
  tagline: "Objetos impresos en 3D, hechos con amor",
  description:
    "Tienda de objetos impresos en 3D: decoración, macetas, llaveros, figuras y piezas personalizadas. Pagas cuando lo recibes.",

  /** URL pública del sitio (para metadatos / Open Graph) */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /**
   * Número de WhatsApp en formato internacional, sin "+", espacios ni guiones.
   * Se puede sobreescribir con la variable de entorno NEXT_PUBLIC_WHATSAPP_NUMBER.
   */
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "51900000000",

  /** Formato de precios */
  locale: "es-PE",
  currency: "PEN",
  /** Zona horaria de la tienda (para temporadas destacadas) */
  timeZone: "America/Lima",

  /** Texto que se muestra sobre el envío en carrito y checkout */
  shippingNote: "El costo de envío se coordina por WhatsApp según tu zona.",

  /** Prefijo para los códigos de pedido */
  orderPrefix: "N3D",

  social: {
    instagram: "https://instagram.com/nalita3d",
  },
} as const;
