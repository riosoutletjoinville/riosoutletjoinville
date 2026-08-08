// src/components/pixel/PixelProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pixelManager } from '@/lib/pixel-manager';
import Script from 'next/script';

interface PixelProviderProps {
  children: React.ReactNode;
}

// Componente que rastreia mudanças de página
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    
    if (previousPathRef.current !== currentPath) {
      // Rastrear PageView com informações da página
      const pageTitle = document.title || 'Rios Outlet';
      const pageCategory = getPageCategory(pathname);
      
      pixelManager.trackPageView({
        content_name: pageTitle,
        content_category: pageCategory,
      });
      
      previousPathRef.current = currentPath;
    }
  }, [pathname, searchParams]);

  return null;
}

function getPageCategory(pathname: string): string {
  if (pathname.startsWith('/produto')) return 'produto';
  if (pathname.startsWith('/categoria')) return 'categoria';
  if (pathname.startsWith('/marca')) return 'marca';
  if (pathname.startsWith('/carrinho')) return 'carrinho';
  if (pathname.startsWith('/checkout')) return 'checkout';
  if (pathname.startsWith('/busca')) return 'busca';
  if (pathname.startsWith('/dashboard')) return 'admin';
  if (pathname.startsWith('/minha-conta')) return 'conta';
  return 'home';
}

export default function PixelProvider({ children }: PixelProviderProps) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '2705596896524633'; // Substitua pelo seu Pixel ID real

  // Log de inicialização
  useEffect(() => {
    if (pixelId) {
      console.log('[Pixel] Pixel ID configurado:', pixelId);
    } else {
      console.warn('[Pixel] Nenhum Pixel ID configurado');
    }
  }, [pixelId]);

  return (
    <>
      {/* Pixel Base - usar afterInteractive para garantir que carregue rápido */}
      <Script
        id="facebook-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      
      {/* Tracker de página para SPA */}
      <PageViewTracker />
      
      {children}
    </>
  );
}