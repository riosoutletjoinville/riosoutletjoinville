// src/components/template/header/HeaderMain.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCarrinho } from "@/hooks/useCarrinho";
import CarrinhoModal from "@/components/ui/CarrinhoModal";
import SearchBar from "./SearchBar";
import MobileMenu from "@/components/ui/MobileMenu";

export default function HeaderMain() {
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const { totalItens } = useCarrinho();

  return (
    <>
      <div className="bg-white py-4 md:py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo e Menu Mobile */}
          <div className="flex items-center gap-2 md:gap-4">
            <MobileMenu />
            <Link href="/" className="flex-shrink-0">
              <div className="relative w-32 h-12 md:w-40 md:h-20">
                <Image
                  src="/logomarca/logo.png"
                  alt="Rios Outlet - Loja de calçados em Joinville"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Barra de Pesquisa - escondida em mobile, visível em desktop */}
          <div className="hidden md:block flex-1 max-w-2xl mx-8">
            <SearchBar />
          </div>

          {/* Ícones do Carrinho e Login */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <button
              onClick={() => setCarrinhoAberto(true)}
              className="p-2 md:p-3 rounded-full hover:bg-gray-50 relative transition-all duration-200 border border-transparent hover:border-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 md:w-7 md:h-7 text-gray-700"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center font-medium shadow-sm">
                {totalItens}
              </span>
            </button>
          </div>
        </div>

        {/* Barra de Pesquisa Mobile */}
        <div className="md:hidden mt-4 px-4">
          <SearchBar />
        </div>
      </div>

      <CarrinhoModal
        isOpen={carrinhoAberto}
        onClose={() => setCarrinhoAberto(false)}
      />
    </>
  );
}