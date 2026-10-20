// src/components/template/header/MarcasList.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import { ChevronDown, Store, X } from "lucide-react";

interface Marca {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
}

export default function MarcasTodas() {
  const [isOpen, setIsOpen] = useState(false);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasFetched = useRef(false); // Controle para evitar múltiplos fetches

  useEffect(() => {
    async function fetchMarcas() {
      // Se já fez o fetch, não faz de novo
      if (hasFetched.current) return;
      
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("marcas")
          .select("id, nome, slug, logo_url")
          .order("nome");

        if (error) throw error;

        setMarcas(data || []);
        hasFetched.current = true; // Marca que o fetch foi executado
      } catch (error) {
        console.error("Erro ao carregar marcas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarcas();

    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // Array de dependências vazio, mas com controle interno

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  if (loading) {
    return (
      <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="animate-pulse w-16 h-5 bg-gray-200 rounded" />
      </button>
    );
  }

  if (marcas.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 group relative z-40 ${
          isOpen
            ? "bg-amber-600 text-white border-amber-600"
            : "text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100"
        } rounded-lg`}
      >
        <Store
          size={18}
          className={`mr-2 ${isOpen ? "text-white" : "text-amber-600"}`}
        />
        <span>Todas as Marcas</span>
        <ChevronDown
          size={16}
          className={`ml-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={dropdownRef}
            className="fixed left-1/2 transform -translate-x-1/2 top-24 w-[80vw] max-w-6xl bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-6 max-h-[80vh] overflow-y-auto"
            style={{
              animation: "slideDown 0.2s ease-out",
            }}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Todas as Marcas
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {marcas.map((marca) => (
                <Link
                  key={marca.id}
                  href={`/marca/${marca.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-amber-300 hover:shadow-md transition-all duration-200 group"
                >
                  {marca.logo_url ? (
                    <div className="relative w-20 h-16 mb-2">
                      <Image
                        src={marca.logo_url}
                        alt={marca.nome}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-16 mb-2 flex items-center justify-center bg-gray-50 rounded">
                      <Store size={32} className="text-gray-400" />
                      <span className="w-full text-center">{marca.nome}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
}