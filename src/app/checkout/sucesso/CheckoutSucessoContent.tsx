// src/app/checkout/sucesso/CheckoutSucessoContent.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle, Package, Home, User } from 'lucide-react';

// Componente interno que usa useSearchParams
function SucessoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirecionando, setRedirecionando] = useState(false);

  const pedidoId = searchParams.get('pedido_id');
  const tipo = searchParams.get('tipo'); // 'logado', 'cadastro', 'guest'
  const criouConta = searchParams.get('criou_conta') === 'true';

  // Verificar se cliente está logado
  useEffect(() => {
    const verificarCliente = async () => {
      const token = localStorage.getItem("cliente_token");
      
      if (token) {
        try {
          const response = await fetch("/api/clientes/auth/me", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (data.success && data.user) {
            console.log("✅ Cliente autenticado na página de sucesso");
            setCliente(data.user);
          }
        } catch (error) {
          console.error("Erro ao verificar cliente:", error);
        }
      }
      
      setLoading(false);
    };

    verificarCliente();
  }, []);

  // Redirecionar automaticamente se for cliente logado ou criou conta
  useEffect(() => {
    // Se o cliente está logado (seja por login existente ou conta recém-criada)
    if (cliente && !redirecionando) {
      console.log("🔄 Cliente logado, agendando redirecionamento...");
      setRedirecionando(true);
      
      const timer = setTimeout(() => {
        console.log("🚀 Redirecionando para /minha-conta/pedidos");
        window.location.href = '/minha-conta/pedidos';
      }, 5000); // 5 segundos para o cliente ler a mensagem

      return () => clearTimeout(timer);
    }
  }, [cliente, redirecionando]);

  // Formatar número do pedido
  const pedidoFormatado = pedidoId ? pedidoId.slice(-8).toUpperCase() : 'N/A';

  // Determinar mensagem baseada no tipo
  const getMensagem = () => {
    if (tipo === 'logado') {
      return {
        titulo: '✅ Pagamento Aprovado!',
        subtitulo: 'Seu pedido foi processado com sucesso!',
        descricao: 'Você será redirecionado para sua área de cliente em alguns segundos.'
      };
    } else if (tipo === 'cadastro' || criouConta) {
      return {
        titulo: '🎉 Conta Criada e Pagamento Aprovado!',
        subtitulo: 'Seu pedido foi processado e sua conta foi criada com sucesso!',
        descricao: 'Você já está logado e será redirecionado para sua área de cliente.'
      };
    } else {
      return {
        titulo: '✅ Pagamento Aprovado!',
        subtitulo: 'Seu pedido foi processado com sucesso!',
        descricao: 'Obrigado por comprar conosco!'
      };
    }
  };

  const mensagem = getMensagem();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Verificando sua conta...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600">
            {mensagem.titulo}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg text-gray-700">
            {mensagem.subtitulo}
          </p>

          {pedidoId && (
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Número do Pedido</p>
              <p className="text-2xl font-mono font-bold text-gray-800">
                #{pedidoFormatado}
              </p>
            </div>
          )}

          {(cliente || tipo === 'logado' || tipo === 'cadastro' || criouConta) && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                <User className="w-5 h-5" />
                <span className="font-medium">
                  {cliente ? `Olá, ${cliente.nome || cliente.razao_social?.split(' ')[0] || 'Cliente'}!` : 'Conta criada com sucesso!'}
                </span>
              </div>
              <p className="text-sm text-blue-600">
                {mensagem.descricao}
              </p>
              {redirecionando && (
                <div className="mt-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 pt-4">
            {cliente ? (
              <>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link href="/minha-conta/pedidos">
                    <Package className="w-4 h-4 mr-2" />
                    Ver Meus Pedidos
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/minha-conta/dados">
                    <User className="w-4 h-4 mr-2" />
                    Meus Dados
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Continuar Comprando
                  </Link>
                </Button>
                {!cliente && tipo !== 'guest' && (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/login">
                      <User className="w-4 h-4 mr-2" />
                      Acessar Minha Conta
                    </Link>
                  </Button>
                )}
              </>
            )}
          </div>

          <p className="text-xs text-gray-500 pt-4">
            Um e-mail de confirmação foi enviado com os detalhes do seu pedido.
          </p>
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