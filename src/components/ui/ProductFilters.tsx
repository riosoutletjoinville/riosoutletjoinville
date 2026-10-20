// src/components/ui/ProductFilters.tsx
"use client";

import { useState, useEffect } from "react";
import { Filter, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { PriceRangeSlider } from "./PriceRangeSlider";

interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  cores?: string[];
  tamanhos?: string[];
  orderBy: "relevance" | "price_asc" | "price_desc" | "newest";
}

interface ProductFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  priceRange: { min: number; max: number };
  cores?: Array<{ id: string; nome: string; codigo_hex?: string }>;
  tamanhos?: Array<{ id: string; nome: string; tipo: string }>;
  selectedCores?: string[];
  selectedTamanhos?: string[];
  showColorFilter?: boolean;
  showSizeFilter?: boolean;
}

export function ProductFilters({
  filters,
  onFiltersChange,
  priceRange,
  cores = [],
  tamanhos = [],
  selectedCores = [],
  selectedTamanhos = [],
  showColorFilter = true,
  showSizeFilter = true,
}: ProductFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [localCores, setLocalCores] = useState<string[]>(selectedCores);
  const [localTamanhos, setLocalTamanhos] = useState<string[]>(selectedTamanhos);

  const hasActiveFilters = 
    filters.minPrice !== priceRange.min || 
    filters.maxPrice !== priceRange.max ||
    localCores.length > 0 ||
    localTamanhos.length > 0;

  const handlePriceChange = (min: number, max: number) => {
    onFiltersChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const handleClearPriceFilter = () => {
    onFiltersChange({ ...filters, minPrice: priceRange.min, maxPrice: priceRange.max });
  };

  const handleColorToggle = (corId: string) => {
    const newCores = localCores.includes(corId)
      ? localCores.filter(id => id !== corId)
      : [...localCores, corId];
    setLocalCores(newCores);
    onFiltersChange({ ...filters, cores: newCores });
  };

  const handleSizeToggle = (tamanhoId: string) => {
    const newTamanhos = localTamanhos.includes(tamanhoId)
      ? localTamanhos.filter(id => id !== tamanhoId)
      : [...localTamanhos, tamanhoId];
    setLocalTamanhos(newTamanhos);
    onFiltersChange({ ...filters, tamanhos: newTamanhos });
  };

  const handleClearAllFilters = () => {
    setLocalCores([]);
    setLocalTamanhos([]);
    onFiltersChange({
      ...filters,
      minPrice: priceRange.min,
      maxPrice: priceRange.max,
      cores: [],
      tamanhos: [],
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 bg-amber-500 rounded-full"></span>
            )}
          </button>
          
          <div className="relative">
            <select
              value={filters.orderBy}
              onChange={(e) => onFiltersChange({ ...filters, orderBy: e.target.value as any })}
              className="appearance-none pl-4 pr-8 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <option value="relevance">Relevância</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="newest">Mais recentes</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="text-sm text-amber-600 hover:text-amber-800 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Limpar todos os filtros
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-6">
          {/* Filtro de Preço */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <h3 className="font-medium text-gray-900">Faixa de Preço</h3>
              </div>
              {(filters.minPrice !== priceRange.min || filters.maxPrice !== priceRange.max) && (
                <button
                  onClick={handleClearPriceFilter}
                  className="text-xs text-amber-600 hover:text-amber-800"
                >
                  Limpar
                </button>
              )}
            </div>
            
            <PriceRangeSlider
              minPrice={priceRange.min}
              maxPrice={priceRange.max}
              currentMin={filters.minPrice}
              currentMax={filters.maxPrice}
              onPriceChange={handlePriceChange}
            />
          </div>

          {/* Filtro de Cores */}
          {showColorFilter && cores.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Cores</h3>
              <div className="flex flex-wrap gap-2">
                {cores.map((cor) => (
                  <button
                    key={cor.id}
                    onClick={() => handleColorToggle(cor.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      localCores.includes(cor.id)
                        ? "bg-amber-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cor.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtro de Tamanhos */}
          {showSizeFilter && tamanhos.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Tamanhos</h3>
              <div className="flex flex-wrap gap-2">
                {tamanhos.map((tamanho) => (
                  <button
                    key={tamanho.id}
                    onClick={() => handleSizeToggle(tamanho.id)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      localTamanhos.includes(tamanho.id)
                        ? "bg-amber-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tamanho.nome}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}