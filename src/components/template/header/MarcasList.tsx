// src/components/template/header/MarcasList.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";

interface Marca {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
}

interface MarcasListProps {
  limit?: number;
}

export default function MarcasList({ limit = 5 }: MarcasListProps) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMarcas() {
      try {
        const supabase = createClient();
        
        // Buscar todas as marcas
        const { data: todasMarcas, error } = await supabase
          .from("marcas")
          .select("id, nome, slug, logo_url")
          .order("nome");

        if (error) throw error;

        // Selecionar marcas aleatórias
        if (todasMarcas && todasMarcas.length > 0) {
          const shuffled = [...todasMarcas];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          const marcasAleatorias = shuffled.slice(0, limit);
          setMarcas(marcasAleatorias);
        }
      } catch (error) {
        console.error("Erro ao carregar marcas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMarcas();
  }, [limit]);

  if (loading) {
    return (
      <div className="flex gap-4">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="h-12 w-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (marcas.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-600"></span>
      <div className="flex flex-wrap gap-3">
        {marcas.map((marca) => (
          <Link
            key={marca.id}
            href={`/marca/${marca.slug}`}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-amber-300 hover:text-amber-600 transition-all duration-200"
          >
            {marca.logo_url ? (
              <div className="relative w-16 h-8">
                <Image
                  src={marca.logo_url}
                  alt={marca.nome}
                  fill
                  className="object-fill contain"
                />
              </div>
            ) : (
              <span>{marca.nome}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
