// src/app/checkout/logado/page.tsx
import { Metadata } from "next";
import CheckoutLogadoContent from "./CheckoutLogadoContent";

export const metadata: Metadata = {
  title: "Finalizar Compra | Rios Outlet",
  description: "Finalize sua compra de forma rápida e segura",
};

export const dynamic = "force-dynamic";

export default function CheckoutLogadoPage() {
  return <CheckoutLogadoContent />;
}
