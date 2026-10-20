// src/components/ui/ProductGrid.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Grid, List } from "lucide-react";
import ProductImage from "./ProductImage";

interface Product {
  id: string;
  titulo: string;
  slug: string;
  preco: number;
  preco_original?: number;
  imagem_url?: string;
  imagens?: Array<{ url: string; principal?: boolean }>;
  marca?: { nome: string };
  marca_nome?: string;
}

interface ProductGridProps {
  products: Product[];
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  showViewToggle?: boolean;
  className?: string;
}

export function ProductGrid({
  products,
  viewMode: externalViewMode,
  onViewModeChange,
  showViewToggle = true,
  className = "",
}: ProductGridProps) {
  const [internalViewMode, setInternalViewMode] = useState<"grid" | "list">("grid");
  
  const viewMode = externalViewMode || internalViewMode;
  
  const handleViewModeChange = (mode: "grid" | "list") => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getProductImage = (product: Product) => {
    if (product.imagem_url) return product.imagem_url;
    if (product.imagens) {
      const principal = product.imagens.find(img => img.principal);
      return principal?.url || product.imagens[0]?.url;
    }
    return null;
  };

  const getProductBrand = (product: Product) => {
    return product.marca?.nome || product.marca_nome;
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
      </div>
    );
  }

  return (
    <div>
      {showViewToggle && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid" 
                  ? "bg-amber-100 text-amber-600" 
                  : "text-gray-400 hover:text-gray-600"
              }`}
              aria-label="Visualização em grade"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleViewModeChange("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list" 
                  ? "bg-amber-100 text-amber-600" 
                  : "text-gray-400 hover:text-gray-600"
              }`}
              aria-label="Visualização em lista"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className={viewMode === "grid" 
        ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`
        : `space-y-4 ${className}`
      }>
        {products.map((product) => {
          const imageUrl = getProductImage(product);
          const brandName = getProductBrand(product);
          const discount = product.preco_original && product.preco_original > product.preco
            ? Math.round(((product.preco_original - product.preco) / product.preco_original) * 100)
            : null;

          return (
            <Link
              key={product.id}
              href={`/produto/${product.slug}`}
              className={`group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden ${
                viewMode === "list" ? "flex gap-4" : ""
              }`}
            >
              <div className={`relative ${viewMode === "list" ? "w-48 h-48 flex-shrink-0" : "aspect-square"}`}>
                {imageUrl ? (
                  <ProductImage
                    src={imageUrl}
                    alt={product.titulo}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-300 p-2"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {discount && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                    -{discount}%
                  </div>
                )}
              </div>
              
              <div className={`p-4 flex-1 ${viewMode === "list" ? "flex flex-col justify-center" : ""}`}>
                {brandName && (
                  <p className="text-xs text-gray-500 mb-1">{brandName}</p>
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
          );
        })}
      </div>
    </div>
  );
}