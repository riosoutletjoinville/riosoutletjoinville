// src/components/ui/ProductCard.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import ProductImage from "./ProductImage";
import { useState } from "react";

interface Produto {
  id: string;
  titulo: string;
  preco: number;
  preco_original?: number;
  slug?: string;
  imagens: Array<{
    url: string;
    principal: boolean;
  }>;
  categoria?: {
    nome: string;
  };
  marca?: {
    nome: string;
  };
}

interface ProductCardProps {
  produto: Produto;
  onComprar?: (produto: Produto) => void;
  showCategory?: boolean;
  showBrand?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

export default function ProductCard({ 
  produto, 
  onComprar,
  showCategory = false,
  showBrand = true,
  variant = 'default'
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const imagemPrincipal = produto.imagens?.find(img => img.principal) || produto.imagens?.[0];
  
  // Calcular desconto
  const desconto = produto.preco_original && produto.preco_original > produto.preco
    ? Math.round(((produto.preco_original - produto.preco) / produto.preco_original) * 100)
    : 0;

  // Calcular parcelamento
  const parcelas = 6;
  const valorParcela = produto.preco / parcelas;

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const cardContent = (
    <div 
      className={`
        group bg-white rounded-lg border border-gray-200 
        overflow-hidden hover:shadow-lg hover:border-gray-300
        transition-all duration-200 h-full flex flex-col
        ${variant === 'compact' ? 'max-w-[280px]' : ''}
        ${variant === 'featured' ? 'shadow-md' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Imagem */}
      <div className="relative aspect-square bg-white p-4">
        {imagemPrincipal ? (
          <ProductImage
            src={imagemPrincipal.url}
            alt={produto.titulo}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`
              object-contain transition-transform duration-300
              ${isHovered ? 'scale-110' : 'scale-100'}
            `}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Sem imagem</span>
          </div>
        )}

        {/* Selo de desconto */}
        {desconto > 0 && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{desconto}%
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-3 flex flex-col flex-grow">
        {/* Marca e Categoria */}
        {(showBrand || showCategory) && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            {showBrand && produto.marca?.nome && (
              <span className="truncate">{produto.marca.nome}</span>
            )}
            {showCategory && produto.categoria?.nome && (
              <>
                {showBrand && produto.marca?.nome && <span>•</span>}
                <span className="truncate">{produto.categoria.nome}</span>
              </>
            )}
          </div>
        )}

        {/* Título */}
        <h3 className="text-sm text-gray-800 line-clamp-2 mb-2 min-h-[40px] hover:text-blue-600 transition-colors">
          {produto.titulo}
        </h3>

        {/* Preços */}
        <div className="mt-auto">
          {produto.preco_original && produto.preco_original > produto.preco && (
            <span className="text-xs text-gray-400 line-through block">
              R$ {formatPrice(produto.preco_original)}
            </span>
          )}
          
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-gray-500">R$</span>
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(produto.preco).split(',')[0]}
            </span>
            <span className="text-xs text-gray-500">
              ,{formatPrice(produto.preco).split(',')[1]}
            </span>
          </div>

          {/* Parcelamento */}
          <span className="text-xs text-gray-500 block mt-1">
            em até {parcelas}x de R$ {formatPrice(valorParcela)} sem juros
          </span>
        </div>

        {/* Botão (opcional) */}
        {onComprar && (
          <button
            onClick={() => onComprar(produto)}
            className="
              w-full mt-3 py-2 px-4 bg-blue-600 text-white text-sm font-medium
              rounded-md hover:bg-blue-700 transition-colors
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            "
          >
            Adicionar ao carrinho
          </button>
        )}
      </div>
    </div>
  );

  // Se tiver slug, envolve em Link
  if (produto.slug) {
    return (
      <Link href={`/produto/${produto.slug}`} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}