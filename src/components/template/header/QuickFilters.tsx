//src/components/template/header/QuickFilters.tsx
"use client";

import { useState } from "react";
import { ChevronDown, Filter } from "lucide-react";

export default function QuickFilters() {
  const [isOpen, setIsOpen] = useState(false);

  const filters = {
    categorias: ["Tênis", "Sandálias", "Botas", "Sapatilhas", "Chinelas"],
    marcas: ["Nike", "Adidas", "Puma", "Vans", "Converse"],
    preco: [
      "Até R$ 100",
      "R$ 100 - R$ 200", 
      "R$ 200 - R$ 300",
      "Acima de R$ 300"
    ]
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
      >
        <Filter size={16} className="mr-2" />
        Filtros
        <ChevronDown size={16} className="ml-2" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-6">
          <div className="space-y-6">
            {/* Filtro por Categoria */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Categoria</h3>
              <div className="space-y-2">
                {filters.categorias.map((categoria) => (
                  <label key={categoria} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{categoria}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por Marca */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Marca</h3>
              <div className="space-y-2">
                {filters.marcas.map((marca) => (
                  <label key={marca} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{marca}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por Preço */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Preço</h3>
              <div className="space-y-2">
                {filters.preco.map((faixa) => (
                  <label key={faixa} className="flex items-center">
                    <input
                      type="radio"
                      name="preco"
                      className="border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{faixa}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                Limpar
              </button>
              <button className="flex-1 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors">
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}