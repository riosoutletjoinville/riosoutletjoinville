// src/app/layout.tsx
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClienteAuthProvider } from "@/contexts/ClienteAuthContext";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import PixelProvider from "@/components/pixel/PixelProvider";
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
        <PixelProvider>
          <ThemeProvider>
            <AuthProvider>
              <ClienteAuthProvider>
                <LoadingBar />
                {children}
                <Toaster position="top-right" />
              </ClienteAuthProvider>
            </AuthProvider>
          </ThemeProvider>
        </PixelProvider>

        {/* MERCADOPAGO - MUDAR PARA lazyOnload */}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="lazyOnload"
        />

        {/* Google Analytics - MUDAR PARA lazyOnload */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QZSREQ90Y0"
          strategy="lazyOnload" 
        />
        <Script
          id="google-analytics"
          strategy="lazyOnload" 
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-QZSREQ90Y0');
            `,
          }}
        />
      </body>
    </html>
  );
}