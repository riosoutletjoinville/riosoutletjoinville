// src/components/checkout/CheckoutHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function CheckoutHeader() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Voltar para loja</span>
          </Link>

          <Link href="/">
            <div className="relative w-32 h-12">
              <Image
                src="/logomarca/logo.png"
                alt="Rios Outlet"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}