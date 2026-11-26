import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Carrito" };

export default function CartPage() {
  return (
    <div className="container-page py-6 sm:py-10">
      <h1 className="text-2xl font-bold sm:text-3xl">Tu carrito</h1>
      <CartView />
    </div>
  );
}
