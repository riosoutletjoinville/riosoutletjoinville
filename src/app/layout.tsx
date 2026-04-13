// src/app/layout.tsx - VERSÃO CORRIGIDA
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClienteAuthProvider } from "@/contexts/ClienteAuthContext";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import Image from "next/image"; // ADICIONAR ESTA LINHA
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>
          Rios Outlet - A loja de calçados mais completa de Joinville
        </title>
        <meta
          name="description"
          content="Calçados, bolsas e acessórios com os melhores preços de Joinville"
        />
        <meta
          name="google-site-verification"
          content="b5Berdq2P-oqx0ELWk1qdWutrhVcdsUtL3t7VqHxMbM"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ClienteAuthProvider>
              <LoadingBar />
              {children}
              <Toaster position="top-right" />
            </ClienteAuthProvider>
          </AuthProvider>
        </ThemeProvider>

        {/* MERCADOPAGO - MUDAR PARA lazyOnload */}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="lazyOnload"  // ALTERADO de afterInteractive
        />

        {/* Google Analytics - MUDAR PARA lazyOnload */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QZSREQ90Y0"
          strategy="lazyOnload"  // ALTERADO de afterInteractive
        />
        <Script
          id="google-analytics"
          strategy="lazyOnload"  // ALTERADO de afterInteractive
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-QZSREQ90Y0');
            `,
          }}
        />

        {/* Facebook Pixel - MUDAR PARA lazyOnload */}
        <Script
          id="fb-pixel"
          strategy="lazyOnload"  // ALTERADO de afterInteractive
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
              fbq('init', '1190516236345066');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <Image  // TROCADO de <img> para <Image />
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1190516236345066&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}