// hooks/useImageZoom.ts
'use client';

import { useState, useCallback, useRef } from 'react';

interface ZoomState {
  isZoomed: boolean;
  position: { x: number; y: number };
}

export function useImageZoom() {
  const [zoomState, setZoomState] = useState<ZoomState>({
    isZoomed: false,
    position: { x: 0, y: 0 },
  });

  const imageRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    setZoomState(prev => ({ ...prev, isZoomed: true }));
  }, []);

  const handleMouseLeave = useCallback(() => {
    setZoomState({ isZoomed: false, position: { x: 0, y: 0 } });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;

    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    
    // Calcular posição relativa do mouse (0 a 1)
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;

    // Limitar entre 0 e 1
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    setZoomState({
      isZoomed: true,
      position: { x: clampedX, y: clampedY },
    });
  }, []);

  return {
    zoomState,
    imageRef,
    handlers: {
      handleMouseEnter,
      handleMouseLeave,
      handleMouseMove,
    },
  };
}