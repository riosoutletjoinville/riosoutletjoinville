// src/hooks/usePixelTracking.ts
import { useEffect } from 'react';
import { usePixelEvents } from './usePixelEvents';

export function usePixelTracking() {
  const pixelEvents = usePixelEvents();

  return pixelEvents;
}

// Hook para rastrear visualização de produto
export function useProductTracking(product: any) {
  const { trackProductView } = usePixelEvents();

  useEffect(() => {
    if (product && product.id) {
      // Aguarda um pouco para garantir que a página carregou
      const timer = setTimeout(() => {
        trackProductView(product);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [product, trackProductView]);
}