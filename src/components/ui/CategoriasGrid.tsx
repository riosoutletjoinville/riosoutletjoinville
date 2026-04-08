// src/components/ui/CategoriasGrid.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Package, Shirt, Watch, ShoppingBag, BaggageClaim, Gem, Sparkles } from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  icone?: string;
}

interface CategoriasGridProps {
  categorias: Categoria[];
  showViewAll?: boolean;
  variant?: "large" | "medium" | "small";
  columns?: 3 | 4 | 5;
}

// Mapeamento de ícones baseado no nome da categoria
const getIcon = (nome: string) => {
  const nomeLower = nome.toLowerCase();
  
  if (nomeLower.includes("calçado") || nomeLower.includes("tenis") || nomeLower.includes("sapato")) {
    return <ShoppingBag className="w-8 h-8" />;
  }
  if (nomeLower.includes("roupa") || nomeLower.includes("camisa") || nomeLower.includes("blusa")) {
    return <Shirt className="w-8 h-8" />;
  }
  if (nomeLower.includes("acessório") || nomeLower.includes("bolsa") || nomeLower.includes("cinto")) {
    return <BaggageClaim className="w-8 h-8" />;
  }
  if (nomeLower.includes("relógio") || nomeLower.includes("joia")) {
    return <Watch className="w-8 h-8" />;
  }
  if (nomeLower.includes("perfume") || nomeLower.includes("beleza")) {
    return <Gem className="w-8 h-8" />;
  }
  
  return <Package className="w-8 h-8" />;
};

export function CategoriasGrid({ 
  categorias, 
  showViewAll = true,
  variant = "large",
  columns = 4
}: CategoriasGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getSizeClasses = () => {
    switch (variant) {
      case "large":
        return {
          container: "p-8",
          title: "text-2xl",
          icon: "w-12 h-12",
          padding: "py-12"
        };
      case "medium":
        return {
          container: "p-6",
          title: "text-xl",
          icon: "w-10 h-10",
          padding: "py-8"
        };
      case "small":
        return {
          container: "p-4",
          title: "text-lg",
          icon: "w-8 h-8",
          padding: "py-6"
        };
      default:
        return {
          container: "p-6",
          title: "text-xl",
          icon: "w-10 h-10",
          padding: "py-8"
        };
    }
  };

  const sizeClasses = getSizeClasses();
  
  const colClasses = {
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
  };

  return (
    <div className={`grid ${colClasses[columns]} gap-6`}>
      {categorias.map((categoria) => (
        <Link
          key={categoria.id}
          href={`/categoria/${categoria.slug}`}
          className={`group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden ${sizeClasses.padding}`}
          onMouseEnter={() => setHoveredId(categoria.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          {/* Efeito de gradiente no hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative z-10 text-center">
            {/* Ícone com animação */}
            <div className={`${sizeClasses.icon} mx-auto mb-4 text-gray-400 group-hover:text-amber-500 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              {getIcon(categoria.nome)}
            </div>
            
            {/* Nome da categoria */}
            <h3 className={`${sizeClasses.title} font-bold text-gray-900 mb-2 group-hover:text-amber-600 transition-colors`}>
              {categoria.nome}
            </h3>
            
            {/* Descrição */}
            {categoria.descricao && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                {categoria.descricao}
              </p>
            )}
            
            {/* Botão Ver Mais */}
            {showViewAll && (
              <div className={`flex items-center justify-center gap-1 text-amber-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 ${hoveredId === categoria.id ? 'translate-y-0' : 'translate-y-2'}`}>
                <span>Explorar</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            )}
          </div>
          
          {/* Decoração de fundo */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </Link>
      ))}
    </div>
  );
}