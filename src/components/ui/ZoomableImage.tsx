// components/ui/ZoomableImage.tsx
'use client';

import Image from 'next/image';
import { useImageZoom } from '@/hooks/useImageZoom';

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  zoomScale?: number;
  priority?: boolean;
}

export default function ZoomableImage({ 
  src, 
  alt, 
  className = '', 
  zoomScale = 2.5,
  priority = false 
}: ZoomableImageProps) {
  const { zoomState, imageRef, handlers } = useImageZoom();

  return (
    <div
      ref={imageRef}
      className={`relative w-full h-full overflow-hidden cursor-zoom-in ${className}`}
      onMouseEnter={handlers.handleMouseEnter}
      onMouseLeave={handlers.handleMouseLeave}
      onMouseMove={handlers.handleMouseMove}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={`
          object-contain transition-transform duration-200
          ${zoomState.isZoomed ? `scale-${zoomScale}` : 'scale-100'}
        `}
        style={{
          transformOrigin: zoomState.isZoomed
            ? `${zoomState.position.x * 100}% ${zoomState.position.y * 100}%`
            : 'center',
        }}
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      
      {/* Overlay de zoom (opcional) */}
      {zoomState.isZoomed && (
        <div className="absolute inset-0 pointer-events-none bg-black bg-opacity-5" />
      )}
    </div>
  );
}