// src/components/template/search/SearchResults.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSearch } from "@/hooks/useSearch";
import { Filter, SlidersHorizontal, Grid, List, ChevronDown, X } from "lucide-react";
import { PriceRangeSlider } from "@/components/ui/PriceRangeSlider";

interface Filters {
  minPrice?: number;
  maxPrice?: number;
  categoria?: string;
  marca?: string;
  orderBy: "relevance" | "price_asc" | "price_desc" | "newest";
}

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const [filters, setFilters] = useState<Filters>({
    orderBy: "relevance",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [globalMinPrice, setGlobalMinPrice] = useState(0);
  const [globalMaxPrice, setGlobalMaxPrice] = useState(1000);
  
  const { results, isLoading, search } = useSearch();

  useEffect(() => {
    if (query) {
      search(query, 50);
    }
  }, [query, search]);

  // Calcular faixa de preço global dos resultados
  useEffect(() => {
    if (results.products.length > 0) {
      const prices = results.products.map(p => p.preco);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setGlobalMinPrice(min);
      setGlobalMaxPrice(max);
      
      // Inicializar filtros com a faixa completa
      if (!filters.minPrice && !filters.maxPrice) {
        setFilters(prev => ({
          ...prev,
          minPrice: min,
          maxPrice: max
        }));
      }
    }
  }, [results.products]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Ordenar resultados
  const sortedProducts = [...results.products];
  if (filters.orderBy === "price_asc") {
    sortedProducts.sort((a, b) => a.preco - b.preco);
  } else if (filters.orderBy === "price_desc") {
    sortedProducts.sort((a, b) => b.preco - a.preco);
  }

  // Filtrar por preço
  const filteredProducts = sortedProducts.filter(product => {
    if (filters.minPrice !== undefined && product.preco < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && product.preco > filters.maxPrice) return false;
    return true;
  });

  const handlePriceChange = (min: number, max: number) => {
    setFilters({ ...filters, minPrice: min, maxPrice: max });
  };

  const handleClearPriceFilter = () => {
    setFilters({ ...filters, minPrice: globalMinPrice, maxPrice: globalMaxPrice });
  };

  const hasActivePriceFilter = filters.minPrice !== globalMinPrice || filters.maxPrice !== globalMaxPrice;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Digite algo para buscar</h2>
        <p className="text-gray-500">Use a barra de busca no topo da página</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum resultado encontrado</h2>
          <p className="text-gray-600 mb-6">
            Não encontramos produtos para {query}. Tente usar palavras diferentes ou verifique a ortografia.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Sugestões:</p>
            <ul className="text-sm text-gray-500 list-disc list-inside">
              <li>Verifique se todas as palavras estão escritas corretamente</li>
              <li>Tente usar termos mais genéricos</li>
              <li>Tente usar menos palavras</li>
              <li>Navegue pelas categorias para encontrar produtos similares</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho com quantidade de resultados */}
      <div className="mb-6">
        <p className="text-gray-600">
          <span className="font-semibold">{filteredProducts.length}</span> resultados para <span className="font-medium text-amber-600">{query}</span>
          {results.total > filteredProducts.length && ` (${results.total} no total)`}
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActivePriceFilter && (
                <span className="ml-1 w-2 h-2 bg-amber-500 rounded-full"></span>
              )}
            </button>
            
            <div className="relative">
              <select
                value={filters.orderBy}
                onChange={(e) => setFilters({ ...filters, orderBy: e.target.value as any })}
                className="appearance-none pl-4 pr-8 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <option value="relevance">Relevância</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-amber-100 text-amber-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-amber-100 text-amber-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Painel de filtros expandido - MODERNIZADO */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {/* Filtro de Preço - Range Slider Moderno */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                  <h3 className="font-medium text-gray-900">Faixa de Preço</h3>
                </div>
                {hasActivePriceFilter && (
                  <button
                    onClick={handleClearPriceFilter}
                    className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Limpar
                  </button>
                )}
              </div>
              
              <PriceRangeSlider
                minPrice={globalMinPrice}
                maxPrice={globalMaxPrice}
                currentMin={filters.minPrice}
                currentMax={filters.maxPrice}
                onPriceChange={handlePriceChange}
              />
            </div>

            {/* Demais filtros podem ser adicionados aqui */}
            <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
              Mais filtros em breve
            </div>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className={viewMode === "grid" 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4"
      }>
        {filteredProducts.map((product) => (
          <Link
            key={product.id}
            href={`/produto/${product.slug}`}
            className={`group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden ${
              viewMode === "list" ? "flex gap-4" : ""
            }`}
          >
            <div className={`relative ${viewMode === "list" ? "w-48 h-48 flex-shrink-0" : "aspect-square"}`}>
              {product.imagem_url ? (
                <Image
                  src={product.imagem_url}
                  alt={product.titulo}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {product.preco_original && product.preco_original > product.preco && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                  -{Math.round(((product.preco_original - product.preco) / product.preco_original) * 100)}%
                </div>
              )}
            </div>
            
            <div className={`p-4 flex-1 ${viewMode === "list" ? "flex flex-col justify-center" : ""}`}>
              {product.marca_nome && (
                <p className="text-xs text-gray-500 mb-1">{product.marca_nome}</p>
              )}
              <h3 className={`font-semibold text-gray-900 group-hover:text-amber-600 transition-colors ${
                viewMode === "list" ? "text-lg mb-2" : "text-sm mb-2 line-clamp-2"
              }`}>
                {product.titulo}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-amber-600">
                  {formatPrice(product.preco)}
                </span>
                {product.preco_original && product.preco_original > product.preco && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(product.preco_original)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}