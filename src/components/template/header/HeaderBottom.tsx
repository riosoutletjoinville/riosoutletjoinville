// src/components/template/header/HeaderBottom.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import CategoriasDropdown from "./CategoriasDropdown";
import MarcasList from "./MarcasList";
import MarcasTodas from "./MarcasTodas";

interface SessaoEspecial {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  ordem: number;
  cor_fundo: string;
  cor_texto: string;
  produto_sessoes: { produto_id: string }[];
}

export default function HeaderBottom() {
  const [sessoesEspeciais, setSessoesEspeciais] = useState<SessaoEspecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchSessoesEspeciais() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("sessoes_especiais")
          .select(`
            id, nome, slug, ativo, ordem, cor_fundo, cor_texto,
            produto_sessoes ( produto_id )
          `)
          .eq("ativo", true);

        if (error) throw error;

        const comProdutos = data.filter(s => s.produto_sessoes?.length > 0);
        const ordenadas = comProdutos.sort((a, b) => a.ordem - b.ordem);
        setSessoesEspeciais(ordenadas);
      } catch (error) {
        console.error("Erro ao carregar sessões:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSessoesEspeciais();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 py-4 justify-center">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-200 rounded-lg animate-pulse w-28" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // MENU COLAPSADO (quando rola a página)
  if (isScrolled) {
    return (
      <div className="bg-white border-t border-gray-100 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 py-6 z-40">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-lg font-semibold text-gray-800 hover:text-amber-600 transition-colors duration-200">
                Home
              </Link>

              <CategoriasDropdown sessoesEspeciais={sessoesEspeciais} />

              <MarcasTodas />

              {/* Exibir marcas no modo colapsado */}
              <MarcasList limit={3} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MENU EXPANDIDO - Exibir marcas em vez dos botões dinâmicos
  return (
    <div className="bg-white border-t border-gray-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-4 py-6 z-40">
          {/* Home */}
          <Link
            href="/"
            className="px-3 py-1 text-base font-semibold text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:border-amber-300 hover:text-amber-600"
          >
            Home
          </Link>

          {/* Dropdown de Categorias - com sessões especiais passadas como prop */}
          <CategoriasDropdown sessoesEspeciais={sessoesEspeciais} />
              
              <MarcasTodas />

          {/* MARCAS ALEATÓRIAS - em vez dos botões dinâmicos */}
          <MarcasList limit={3} />
        </div>
      </div>
    </div>
  );
}