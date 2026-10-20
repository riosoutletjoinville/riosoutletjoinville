// src/app/produto/[slug]/ProductViewTracker.tsx
"use client";

import { useEffect } from "react";
import { usePixelEvents } from "@/hooks/usePixelEvents";

interface ProductViewTrackerProps {
  product: {
    id: string;
    titulo: string;
    preco: number;
    categoria?: { nome: string };
    marca?: { nome: string };
  };
}

export function ProductViewTracker({ product }: ProductViewTrackerProps) {
  const { trackProductView } = usePixelEvents();

  useEffect(() => {
    if (product) {
      trackProductView({
        id: product.id,
        titulo: product.titulo,
        name: product.titulo,
        preco: product.preco,
        price: product.preco,
        categoria: product.categoria,
        marca: product.marca,
      });
    }
  }, [product, trackProductView]);

  return null;
}