// src/app/checkout/sucesso/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// Componente interno que usa useSearchParams
function SucessoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cliente } = useClienteAuth();
  const [redirecionando, setRedirecionando] = useState(false);

  const pedidoId = searchParams.get('pedido_id');
  const criouConta = searchParams.get('criou_conta') === 'true';

  useEffect(() => {
    // Se o cliente criou conta durante o checkout, redirecionar para área logada
    if (criouConta && cliente) {
      const timer = setTimeout(() => {
        setRedirecionando(true);
        router.push('/minha-conta/pedidos');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [criouConta, cliente, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-green-600">
            ✅ Pagamento Aprovado!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Seu pedido foi processado com sucesso!
          </p>

          {pedidoId && (
            <p className="text-sm text-gray-600 mb-2">
              Nº do pedido: <strong>{pedidoId.slice(-8).toUpperCase()}</strong>
            </p>
          )}

          {criouConta && cliente ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Sua conta foi criada e você já está logado.
                {redirecionando ? (
                  <span className="block mt-2">Redirecionando para sua área de cliente...</span>
                ) : (
                  <span className="block mt-2">Você será redirecionado automaticamente em alguns segundos.</span>
                )}
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/minha-conta/pedidos">
                    Ir para Meus Pedidos
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    Continuar Comprando
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  Continuar Comprando
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/minha-conta/login">
                  Acessar Minha Conta
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Loading component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Carregando...</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente principal com Suspense
export default function CheckoutSucessoContent() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SucessoContent />
    </Suspense>
  );
}