// src/components/ui/ProductImage.tsx (VERSÃO MODIFICADA)
"use client";

import Image from "next/image";
import { useState, useMemo } from "react";

const SUPABASE_STORAGE_URL = 'https://oithqkjlvdgwlaumcibf.supabase.co/storage/v1/object/public/produtos';
const PROXY_URL = '/api/image-proxy'; // Nossa API proxy

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
  
  // IMPORTANTE: Usar useMemo para evitar recálculos desnecessários
  const imageUrl = useMemo(() => {
    if (!src || error) return '';
    
    try {
      // Se já for uma URL do nosso proxy, retorna como está
      if (src.startsWith(PROXY_URL)) {
        return src;
      }
      
      // Se for URL do Supabase, converte para usar o proxy
      if (src.includes('supabase.co')) {
        // Extrai o caminho da imagem da URL original
        let path = src;
        
        // Tenta extrair o caminho após /produtos/
        const match = src.match(/\/produtos\/(.+)$/);
        if (match && match[1]) {
          path = match[1];
        } else {
          // Se for uma URL completa, usa como está mas remove parâmetros de token
          path = src.split('?')[0];
        }
        
        // Retorna URL do proxy com o path codificado
        return `${PROXY_URL}?path=${encodeURIComponent(path)}`;
      }
      
      // Para URLs que não são do Supabase (ex: Mercado Livre, Facebook)
      // Opção: também passar pelo proxy ou retornar diretamente
      if (src.includes('mlstatic.com') || src.includes('facebook.com')) {
        // Terceiros - podemos optar por não otimizar ou também usar proxy
        // Para não gastar cota, recomendamos unoptimized
        return src;
      }
      
      return src;
    } catch (e) {
      console.error('Erro ao processar URL da imagem:', e);
      return '';
    }
  }, [src, error]);

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

  // Para imagens de terceiros (Mercado Livre, etc), podemos usar unoptimized
  //const shouldOptimize = !imageUrl.includes('mlstatic.com') && 
                        // !imageUrl.includes('facebook.com');

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
      //unoptimized={!shouldOptimize} 
      unoptimized={false} 
    />
  );
}