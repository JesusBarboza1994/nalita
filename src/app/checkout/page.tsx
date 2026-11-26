import type { Metadata } from "next";
import { CheckoutView } from "./checkout-view";

export const metadata: Metadata = { title: "Finalizar compra" };

export default function CheckoutPage() {
  return (
    <div className="container-page py-6 sm:py-10">
      <CheckoutView />
    </div>
  );
}
