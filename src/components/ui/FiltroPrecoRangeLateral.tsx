// components/ui/FiltroLateral.tsx (versão melhorada)
"use client";

import { useState } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { Button } from "./button";

interface FiltroLateralProps {
  minPrice: number;
  maxPrice: number;
  currentMinPrice?: number;
  currentMaxPrice?: number;
  onPriceChange: (min: number, max: number) => void;
  onSortChange: (sort: string) => void;
  currentSort: string;
  onClearFilters: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const sortOptions = [
  { value: "relevancia", label: "Relevância" },
  { value: "maior-preco", label: "Maior Preço" },
  { value: "menor-preco", label: "Menor Preço" },
  { value: "mais-vendidos", label: "Mais Vendidos" },
  { value: "lancamentos", label: "Lançamentos" },
  { value: "maiores-descontos", label: "Maiores Descontos" },
];

export default function FiltroLateral({
  minPrice,
  maxPrice,
  currentMinPrice,
  currentMaxPrice,
  onPriceChange,
  onSortChange,
  currentSort,
  onClearFilters,
  isOpen = true,
  onClose,
}: FiltroLateralProps) {
  const [priceOpen, setPriceOpen] = useState(true);
  const [sortOpen, setSortOpen] = useState(true);
  
  const hasActiveFilters = currentMinPrice !== minPrice || currentMaxPrice !== maxPrice;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      
      <div className={`
        fixed lg:sticky top-0 lg:top-24 h-full lg:h-auto
        w-80 lg:w-full bg-white lg:bg-transparent
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:transform-none
        shadow-lg lg:shadow-none
      `}>
        <div className="p-4 lg:p-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h3 className="font-semibold text-lg">Filtros</h3>
            <button onClick={onClose} className="p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Sort section */}
          <div className="mb-6 border-b border-gray-100 pb-4">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center justify-between w-full py-2"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Ordenar por</span>
              </div>
              {sortOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {sortOpen && (
              <div className="mt-2 space-y-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => onSortChange(option.value)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                      ${currentSort === option.value 
                        ? 'bg-amber-50 text-amber-600 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Price section */}
          <div className="mb-6 border-b border-gray-100 pb-4">
            <button
              onClick={() => setPriceOpen(!priceOpen)}
              className="flex items-center justify-between w-full py-2"
            >
              <span className="font-medium text-gray-700">Faixa de preço</span>
              {priceOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {priceOpen && (
              <div className="mt-4">
                <PriceRangeSlider
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  currentMin={currentMinPrice}
                  currentMax={currentMaxPrice}
                  onPriceChange={onPriceChange}
                />
              </div>
            )}
          </div>
          
          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="w-full text-sm"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
    </>
  );
}