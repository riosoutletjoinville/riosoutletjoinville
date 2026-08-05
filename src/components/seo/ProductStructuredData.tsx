// src/components/seo/ProductStructuredData.tsx
"use client";

import { useEffect } from "react";

interface ProductStructuredDataProps {
  produto: {
    id: string;
    titulo: string;
    preco: number;
    preco_original?: number;
    slug?: string;
    sku?: string;
    descricao?: string;
    imagens: Array<{ url: string; principal: boolean }>;
    marca?: { nome: string; slug?: string };
    categoria?: { nome: string; slug?: string };
    estoque?: number;
  };
}

export function ProductStructuredData({ produto }: ProductStructuredDataProps) {
  useEffect(() => {
    const hasStock = (produto.estoque ?? 0) > 0;
    const productUrl = `${window.location.origin}/produto/${produto.slug}`;
    const imagemPrincipal = produto.imagens?.find(img => img.principal) || produto.imagens?.[0];
    
    const structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: produto.titulo,
      description: produto.descricao || `${produto.titulo} - ${produto.marca?.nome || ''}`,
      sku: produto.sku || produto.id,
      mpn: produto.sku || produto.id,
      
      ...(imagemPrincipal?.url && {
        image: imagemPrincipal.url,
      }),
      
      ...(produto.marca?.nome && {
        brand: {
          '@type': 'Brand',
          name: produto.marca.nome,
        },
      }),
      
      ...(produto.categoria?.nome && {
        category: produto.categoria.nome,
      }),
      
      offers: {
        '@type': 'Offer',
        price: produto.preco,
        priceCurrency: 'BRL',
        availability: hasStock 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
        url: productUrl,
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-product-id', produto.id);
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      const scriptToRemove = document.querySelector(`script[data-product-id="${produto.id}"]`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [produto]);
  
  return null;
}