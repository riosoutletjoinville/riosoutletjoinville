// src/components/template/header/CategoriasDropdown.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { ChevronDown, Menu, X, Zap, TrendingUp } from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
  slug: string;
}

interface Genero {
  id: string;
  nome: string;
  slug: string;
}

interface Produto {
  id: string;
  titulo: string;
  categoria_id: string;
  genero_id: string | null;
  slug: string;
}

interface SessaoEspecial {
  id: string;
  nome: string;
  slug: string;
  ativo: boolean;
  ordem: number;
}

interface CategoriaAgrupada {
  genero: string;
  generoId: string | null;
  categorias: Categoria[];
}

interface CategoriasDropdownProps {
  sessoesEspeciais?: SessaoEspecial[];
}

const BotaoSessaoRodape = ({ sessao }: { sessao: SessaoEspecial }) => {
  const isDourado = sessao.slug.includes("lancamentos") || 
                    sessao.slug.includes("ofertas") || 
                    sessao.slug.includes("promocoes") || 
                    sessao.slug.includes("mais-vendidos");

  const getIcon = () => {
    if (sessao.slug.includes("lancamentos")) return <Zap size={14} className="mr-1" />;
    if (sessao.slug.includes("ofertas") || sessao.slug.includes("promocoes")) return (
      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    );
    if (sessao.slug.includes("mais-vendidos") || sessao.slug.includes("tendencias")) return <TrendingUp size={14} className="mr-1" />;
    return null;
  };

  const classes = isDourado
    ? "text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
    : "text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200";

  return (
    <Link
      href={`/sessao/${sessao.slug}`}
      className={`px-3 py-1.5 text-xs font-medium ${classes} rounded-lg transition-all duration-200 hover:shadow-md inline-flex items-center`}
    >
      {getIcon()}
      {sessao.nome}
    </Link>
  );
};

export default function CategoriasDropdown({ sessoesEspeciais = [] }: CategoriasDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoriasAgrupadas, setCategoriasAgrupadas] = useState<CategoriaAgrupada[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function fetchCategoriasComGeneros() {
      try {
        const supabase = createClient();
        const { data: generos, error: generosError } = await supabase
          .from("generos")
          .select("id, nome, slug")
          .order("nome");

        if (generosError) throw generosError;

        const { data: categorias, error: categoriasError } = await supabase
          .from("categorias")
          .select("id, nome, slug")
          .eq("exibir_no_site", true)
          .order("nome");

        if (categoriasError) throw categoriasError;

        const { data: produtos, error: produtosError } = await supabase
          .from("produtos")
          .select("categoria_id, genero_id")
          .eq("ativo", true);

        if (produtosError) throw produtosError;

        // Criar mapa de categorias por gênero
        const categoriasPorGenero = new Map<string | null, Set<string>>();
        
        categoriasPorGenero.set(null, new Set());
        
        generos?.forEach(genero => {
          categoriasPorGenero.set(genero.id, new Set());
        });

        produtos?.forEach(produto => {
          if (produto.categoria_id) {
            const generoId = produto.genero_id || null;
            if (!categoriasPorGenero.has(generoId)) {
              categoriasPorGenero.set(generoId, new Set());
            }
            categoriasPorGenero.get(generoId)?.add(produto.categoria_id);
          }
        });

        categorias.forEach(categoria => {
          let encontrou = false;
          for (const [_, categoriaSet] of categoriasPorGenero) {
            if (categoriaSet.has(categoria.id)) {
              encontrou = true;
              break;
            }
          }
          if (!encontrou) {
            categoriasPorGenero.get(null)?.add(categoria.id);
          }
        });

        const agrupado: CategoriaAgrupada[] = [];

        const categoriasSemGenero = Array.from(categoriasPorGenero.get(null) || [])
          .map(id => categorias.find(c => c.id === id))
          .filter((c): c is Categoria => c !== undefined);

        if (categoriasSemGenero.length > 0) {
          agrupado.push({
            genero: "Todas as Categorias",
            generoId: null,
            categorias: categoriasSemGenero
          });
        }

        generos?.forEach(genero => {
          const categoriaIds = categoriasPorGenero.get(genero.id);
          if (categoriaIds && categoriaIds.size > 0) {
            const categoriasDoGenero = Array.from(categoriaIds)
              .map(id => categorias.find(c => c.id === id))
              .filter((c): c is Categoria => c !== undefined);

            agrupado.push({
              genero: genero.nome,
              generoId: genero.id,
              categorias: categoriasDoGenero
            });
          }
        });

        setCategoriasAgrupadas(agrupado);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategoriasComGeneros();

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fechar com tecla ESC
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  // Filtrar sessões para exibir no rodapé (apenas algumas)
  const sessoesRodape = sessoesEspeciais.slice(0, 6);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 group relative z-40 ${
          isOpen 
            ? 'bg-amber-600 text-white border-amber-600' 
            : 'text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100'
        } rounded-lg`}
      >
        <Menu size={18} className={`mr-2 ${isOpen ? 'text-white' : 'text-amber-600'}`} />
        <span>Todas as categorias</span>
        <ChevronDown 
          size={16} 
          className={`ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Overlay com blur quando o menu está aberto */}
      {isOpen && (
        <>
          {/* Overlay escuro com blur */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsOpen(false)}
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          />
          
          {/* Menu dropdown - centralizado e com largura de 80% */}
          <div 
            ref={dropdownRef}
            className="fixed left-1/2 transform -translate-x-1/2 top-24 w-[80vw] max-w-7xl bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-6 max-h-[80vh] overflow-y-auto"
            style={{ 
              animation: 'slideDown 0.2s ease-out',
            }}
          >
            {/* Cabeçalho do menu com botão fechar */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Todas as Categorias</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categoriasAgrupadas.map((grupo, idx) => (
                  <div key={idx} className="space-y-3">
                    <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2 text-amber-600">
                      {grupo.genero}
                    </h3>
                    <ul className="space-y-2">
                      {grupo.categorias.map((categoria) => (
                        <li key={categoria.id}>
                          <Link
                            href={grupo.generoId 
                              ? `/categoria/${categoria.slug}?genero=${grupo.generoId}`
                              : `/categoria/${categoria.slug}`
                            }
                            className="text-sm text-gray-600 hover:text-amber-600 hover:pl-1 transition-all block"
                            onClick={() => setIsOpen(false)}
                          >
                            {categoria.nome}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            
            {/* Rodapé com links rápidos - AGORA COM SESSÕES ESPECIAIS DINÂMICAS */}
            {sessoesRodape.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 justify-center">
                  {sessoesRodape.map((sessao) => (
                    <BotaoSessaoRodape key={sessao.id} sessao={sessao} />
                  ))}
                </div>
              </div>
            )}
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