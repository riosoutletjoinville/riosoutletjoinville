// src/components/ui/ProductImage.tsx
"use client";

import Image from "next/image";
import { useState } from "react";

const SUPABASE_STORAGE_URL = 'https://oithqkjlvdgwlaumcibf.supabase.co/storage/v1/object/public/produtos';

interface ProductImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export default function ProductImage({ 
  src, 
  alt, 
  fill = false,
  width,
  height,
  className = "",
  priority = false,
  sizes
}: ProductImageProps) {
  const [error, setError] = useState(false);
  
  // Função para construir a URL correta da imagem7
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    
    // Se já for uma URL completa do Supabase, retorna como está
    if (imagePath.startsWith(SUPABASE_STORAGE_URL)) {
      return imagePath;
    }
    
    // Se for caminho relativo (formato: "uuid/numero.jpg")
    if (!imagePath.startsWith('http')) {
      return `${SUPABASE_STORAGE_URL}/${imagePath}`;
    }
    
    // Se for URL completa de outro lugar, tenta extrair o caminho
    try {
      const match = imagePath.match(/\/produtos\/(.+)$/);
      if (match && match[1]) {
        return `${SUPABASE_STORAGE_URL}/${match[1]}`;
      }
    } catch (e) {
      console.error('Erro ao processar URL:', e);
    }
    
    return imagePath;
  };

  const imageUrl = getImageUrl(src);

  // Se não tiver URL ou erro, mostra placeholder
  if (!imageUrl || error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <svg 
          className="w-12 h-12 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
      onError={() => setError(true)}
      unoptimized={process.env.NODE_ENV === 'development'} 
    />
  );
}