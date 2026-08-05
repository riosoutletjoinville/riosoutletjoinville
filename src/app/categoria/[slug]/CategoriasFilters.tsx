// app/categoria/[slug]/CategoriaFilters.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductFilters } from "@/components/ui/ProductFilters";

interface CategoriaFiltersProps {
  categoryId: string;
  subCategoryId?: string;
  globalMinPrice: number;
  globalMaxPrice: number;
  currentMinPrice?: number;
  currentMaxPrice?: number;
  currentOrderBy: string;
  currentCores: string[];
  currentTamanhos: string[];
  coresDisponiveis: Array<{ id: string; nome: string; codigo_hex?: string }>;
  tamanhosDisponiveis: Array<{ id: string; nome: string; tipo: string; ordem?: number }>;
}

export function CategoriaFilters({
  globalMinPrice,
  globalMaxPrice,
  currentMinPrice,
  currentMaxPrice,
  currentOrderBy,
  currentCores,
  currentTamanhos,
  coresDisponiveis,
  tamanhosDisponiveis,
}: CategoriaFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    minPrice: currentMinPrice || globalMinPrice,
    maxPrice: currentMaxPrice || globalMaxPrice,
    orderBy: currentOrderBy as any,
    cores: currentCores,
    tamanhos: currentTamanhos,
  });

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    
    // Atualizar URL com os novos filtros
    const params = new URLSearchParams(searchParams.toString());
    
    if (newFilters.minPrice !== globalMinPrice) {
      params.set("minPrice", newFilters.minPrice.toString());
    } else {
      params.delete("minPrice");
    }
    
    if (newFilters.maxPrice !== globalMaxPrice) {
      params.set("maxPrice", newFilters.maxPrice.toString());
    } else {
      params.delete("maxPrice");
    }
    
    if (newFilters.orderBy !== "relevance") {
      params.set("orderBy", newFilters.orderBy);
    } else {
      params.delete("orderBy");
    }
    
    if (newFilters.cores && newFilters.cores.length > 0) {
      params.set("cor", newFilters.cores.join(","));
    } else {
      params.delete("cor");
    }
    
    if (newFilters.tamanhos && newFilters.tamanhos.length > 0) {
      params.set("tamanho", newFilters.tamanhos.join(","));
    } else {
      params.delete("tamanho");
    }
    
    params.delete("page"); // Resetar página quando filtros mudam
    
    const slug = searchParams.get("slug") || window.location.pathname.split("/").pop();
    router.push(`/categoria/${slug}?${params.toString()}`);
  };

  return (
    <ProductFilters
      filters={filters}
      onFiltersChange={handleFiltersChange}
      priceRange={{ min: globalMinPrice, max: globalMaxPrice }}
      cores={coresDisponiveis}
      tamanhos={tamanhosDisponiveis}
      selectedCores={currentCores}
      selectedTamanhos={currentTamanhos}
      showColorFilter={coresDisponiveis.length > 0}
      showSizeFilter={tamanhosDisponiveis.length > 0}
    />
  );
}