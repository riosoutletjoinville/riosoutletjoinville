// src/components/template/header/HeaderMain.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCarrinho } from "@/hooks/useCarrinho";
import CarrinhoModal from "@/components/ui/CarrinhoModal";
import SearchModal from "./SearchModal";
import MobileMenu from "@/components/ui/MobileMenu";
import Header from ".";
import HeaderBottom from "./HeaderBottom";

export default function HeaderMain() {
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [searchModalAberto, setSearchModalAberto] = useState(false);
  const { totalItens } = useCarrinho();

  return (
    <>
      <div className="bg-white py-1 md:py-1.5">
        {" "}
        {/* Altura reduzida */}
        <div className="container mx-auto px-4 flex items-center justify-between gap-4">
          {/* Menu Mobile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <MobileMenu />
          </div>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="relative w-28 h-10 md:w-32 md:h-12">
              <Image
                src="/logomarca/logo.png"
                alt="Rios Outlet - Loja de Calçados em Joinville - SC"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          {/* HeaderBottom visível apenas em desktop */}
          <div className="hidden md:block">
            <HeaderBottom />
          </div>
          {/* BOTÃO DE BUSCA - abre modal */}
          <button
            onClick={() => setSearchModalAberto(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 border border-gray-200 rounded-full hover:bg-amber-50 hover:border-amber-300 hover:text-amber-600 transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-sm hidden sm:inline">Buscar</span>
          </button>

          {/* Botão do Carrinho */}
          <button
            onClick={() => setCarrinhoAberto(true)}
            className="p-2 rounded-full hover:bg-gray-100 relative transition-all duration-200 flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {totalItens}
            </span>
          </button>
        </div>
      </div>
      <SearchModal
        isOpen={searchModalAberto}
        onClose={() => setSearchModalAberto(false)}
      />
      <CarrinhoModal
        isOpen={carrinhoAberto}
        onClose={() => setCarrinhoAberto(false)}
      />
    </>
  );
}
