// src/components/ui/PriceRangeSlider.tsx
"use client";

import { useState, useEffect } from "react";

interface PriceRangeSliderProps {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
  currentMin?: number;
  currentMax?: number;
}

export function PriceRangeSlider({ 
  minPrice, 
  maxPrice, 
  onPriceChange,
  currentMin,
  currentMax 
}: PriceRangeSliderProps) {
  const [minValue, setMinValue] = useState(currentMin || minPrice);
  const [maxValue, setMaxValue] = useState(currentMax || maxPrice);

  useEffect(() => {
    setMinValue(currentMin || minPrice);
    setMaxValue(currentMax || maxPrice);
  }, [currentMin, currentMax, minPrice, maxPrice]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    // Garantir que o valor mínimo não ultrapasse o máximo
    const newMin = Math.min(value, maxValue - 1);
    setMinValue(newMin);
    onPriceChange(newMin, maxValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    // Garantir que o valor máximo não seja menor que o mínimo
    const newMax = Math.max(value, minValue + 1);
    setMaxValue(newMax);
    onPriceChange(minValue, newMax);
  };

  // Calcular porcentagens CORRETAMENTE
  const range = maxPrice - minPrice;
  const minPercent = ((minValue - minPrice) / range) * 100;
  const maxPercent = ((maxValue - minPrice) / range) * 100;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Dual Range Slider */}
      <div className="relative pt-2 pb-2">
        {/* Track de fundo */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-200 rounded-full transform -translate-y-1/2" />
        
        {/* Track selecionado (entre os dois thumbs) */}
        <div 
          className="absolute top-1/2 h-1.5 bg-amber-600 rounded-full transform -translate-y-1/2"
          style={{ 
            left: `${minPercent}%`, 
            right: `${100 - maxPercent}%` 
          }}
        />
        
        {/* Thumb do valor mínimo */}
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={1}
          value={minValue}
          onChange={handleMinChange}
          className="absolute top-1/2 w-full h-1.5 bg-transparent appearance-none pointer-events-auto transform -translate-y-1/2
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-amber-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:focus:outline-none
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-amber-600
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:hover:scale-110"
          style={{ zIndex: minValue === maxPrice ? 3 : 2 }}
        />
        
        {/* Thumb do valor máximo */}
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={1}
          value={maxValue}
          onChange={handleMaxChange}
          className="absolute top-1/2 w-full h-1.5 bg-transparent appearance-none pointer-events-auto transform -translate-y-1/2
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-amber-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:focus:outline-none
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-amber-600
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:hover:scale-110"
          style={{ zIndex: 3 }}
        />
      </div>
      
      {/* Valores exibidos */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl px-4 py-3 text-center">
          <span className="text-xs text-gray-500 block mb-1">Mínimo</span>
          <span className="text-base font-bold text-gray-900">{formatPrice(minValue)}</span>
        </div>
        <span className="text-gray-400 text-sm">até</span>
        <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl px-4 py-3 text-center">
          <span className="text-xs text-gray-500 block mb-1">Máximo</span>
          <span className="text-base font-bold text-gray-900">{formatPrice(maxValue)}</span>
        </div>
      </div>
      
      {/* Valores de referência */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatPrice(minPrice)}</span>
        <span>{formatPrice(maxPrice)}</span>
      </div>
    </div>
  );
}