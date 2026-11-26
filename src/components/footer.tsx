import Link from "next/link";
import { siteConfig } from "@/config/site";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappLink } from "@/lib/whatsapp";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold">
            <span className="text-primary">nalita</span>
            <span className="text-secondary">3d</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{siteConfig.tagline}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Cómo comprar</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
            <li>Elige tus productos y variantes</li>
            <li>Completa tus datos de entrega</li>
            <li>Confirma el pedido por WhatsApp</li>
            <li>Pagas cuando lo recibes</li>
          </ol>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Contacto</p>
          <div className="mt-2 flex flex-col gap-2 text-muted-foreground">
            <a href={whatsappLink(`¡Hola ${siteConfig.name}! 👋`)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-foreground">
              <WhatsAppIcon width={16} height={16} /> WhatsApp
            </a>
            <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              Instagram
            </a>
            <Link href="/productos" className="hover:text-foreground">Ver catálogo</Link>
          </div>
        </div>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {siteConfig.name} · Pago contra entrega
      </p>
    </footer>
  );
}
