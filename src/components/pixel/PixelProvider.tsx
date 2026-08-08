// src/components/pixel/PixelProvider.tsx
'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pixelManager } from '@/lib/pixel-manager';
import Script from 'next/script';

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();

    if (previousPathRef.current!== currentPath) {
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
  return 'home';
}

export default function PixelProvider({ children }: { children: React.ReactNode }) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || '2705596896524633';

  useEffect(() => {
    console.log('[Pixel] ID configurado:', pixelId);
  }, [pixelId]);

  if (!pixelId) {
    console.warn('[Pixel] ID não configurado');
    return <>{children}</>;
  }

  return (
    <>
      <Script
        id="facebook-pixel-base"
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

      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>

      {children}

      {/* Necessário para o Helper validar */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}