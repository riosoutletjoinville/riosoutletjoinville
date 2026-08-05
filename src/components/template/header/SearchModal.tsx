// src/components/template/header/SearchModal.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSearch } from "@/hooks/useSearch";
import { Search, X, TrendingUp, Clock, ArrowRight } from "lucide-react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    results, 
    isLoading, 
    debouncedSearch, 
    searchHistory, 
    loadSearchHistory,
    clearSearchHistory 
  } = useSearch();

  useEffect(() => {
    if (isOpen) {
      loadSearchHistory();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, loadSearchHistory]);

  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query, 400);
    }
  }, [query, debouncedSearch]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query)}`);
      setQuery("");
      onClose();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    router.push(`/busca?q=${encodeURIComponent(suggestion)}`);
    onClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-xl animate-slideDown">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            
            <input
              ref={inputRef}
              type="text"
              placeholder="O que você está procurando? Sandálias, tênis, botas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-24 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-700 placeholder-gray-400"
            />
            
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <button 
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-amber-600 text-white px-4 py-1.5 rounded-xl hover:bg-amber-700 transition-all text-sm font-medium"
            >
              Buscar
            </button>

            <button
              type="button"
              onClick={onClose}
              className="absolute right-[-40px] top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </form>

          {/* Resultados */}
          {(query || isLoading || results.products.length > 0 || searchHistory.length > 0) && (
            <div className="mt-4 max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="px-6 py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-3"></div>
                  <p className="text-gray-500">Buscando produtos...</p>
                </div>
              ) : (
                <>
                  {results.suggestions.length > 0 && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-medium text-gray-500 uppercase">Sugestões</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {results.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-700 rounded-full transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchHistory.length > 0 && !query && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-medium text-gray-500 uppercase">Buscas recentes</span>
                        </div>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Limpar
                        </button>
                      </div>
                      <div className="space-y-1">
                        {searchHistory.slice(0, 5).map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(item)}
                            className="flex items-center justify-between w-full px-2 py-1.5 hover:bg-gray-50 rounded-lg group"
                          >
                            <span className="text-sm text-gray-600">{item}</span>
                            <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.products.length > 0 && (
                    <div className="px-2 py-2">
                      <div className="px-2 py-2">
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {results.total} produtos encontrados
                        </span>
                      </div>
                      {results.products.map((product) => (
                        <Link
                          key={product.id}
                          href={`/produto/${product.slug}`}
                          onClick={onClose}
                          className="flex items-start gap-3 px-3 py-3 hover:bg-amber-50 rounded-xl transition-colors group"
                        >
                          <div className="flex-shrink-0 w-14 h-14 bg-gray-100 rounded-lg overflow-hidden">
                            {product.imagem_url ? (
                              <Image
                                src={product.imagem_url}
                                alt={product.titulo}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Search className="w-6 h-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-amber-600">
                              {product.titulo}
                            </p>
                            {product.marca_nome && (
                              <p className="text-xs text-gray-500 mt-0.5">{product.marca_nome}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-amber-600">
                                {formatPrice(product.preco)}
                              </span>
                              {product.preco_original && product.preco_original > product.preco && (
                                <>
                                  <span className="text-xs text-gray-400 line-through">
                                    {formatPrice(product.preco_original)}
                                  </span>
                                  <span className="text-xs text-green-600 font-medium">
                                    -{Math.round(((product.preco_original - product.preco) / product.preco_original) * 100)}%
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                      
                      <div className="px-3 pt-2 pb-3">
                        <button
                          onClick={handleSearch}
                          className="w-full py-2 text-center text-sm font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                        >
                          Ver todos os {results.total} resultados
                        </button>
                      </div>
                    </div>
                  )}

                  {!isLoading && query && results.products.length === 0 && (
                    <div className="px-6 py-8 text-center">
                      <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">Nenhum produto encontrado</p>
                      <p className="text-sm text-gray-400">Tente usar palavras diferentes</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
}