// src/app/dashboard/mercadolibre/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { mercadoLivreService } from "@/lib/mercadolibre";
import Link from "next/link";

interface ConnectionInfo {
  ml_nickname: string;
  ml_user_id: string;
  user_id: string;
  updated_at: string;
}

export default function MercadoLivreContent() {
  const router = useRouter();
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConnection = async () => {
      try {
        const configCheck = await mercadoLivreService.checkConfig();
        console.log('Verificação de configuração:', configCheck);
        if (!configCheck.isValid) {
          setError(`Configuração inválida: ${configCheck.errors.join(', ')}`);
          setLoading(false);
          return;
        }

        const connected = await mercadoLivreService.isUserConnected();
        setIsConnected(connected);
        console.log('Status de conexão:', connected);

        if (!connected) {
          setError('Usuário não conectado ao Mercado Livre. Tente reconectar.');
          setLoading(false);
          return;
        }

        const info = await mercadoLivreService.getConnectionInfo();
        console.log('Informações de conexão:', info);
        setConnectionInfo(info as ConnectionInfo);

        if (!info) {
          setError('Falha ao obter informações de conexão. Verifique o Supabase.');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('Erro ao carregar conexão:', err);
        setError(`Erro ao verificar conexão: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    loadConnection();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Integração com Mercado Livre</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={() => router.push('/dashboard/mercadolibre/auth')}
            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Tentar Conectar
          </button>
        </div>
      )}

      {isConnected && connectionInfo ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">✅ Conectado com sucesso!</p>
            <p className="text-sm mt-1">
              Bem-vindo de volta, <strong>{connectionInfo.ml_nickname}</strong> (ID: {connectionInfo.ml_user_id})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/mercadolibre/products"
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium text-center"
            >
              📦 Produtos
            </Link>
            <button
              onClick={() => {
                const confirm = window.confirm("Tem certeza que deseja desconectar?");
                if (confirm) {
                  localStorage.removeItem("ml_auth_state");
                  localStorage.removeItem("ml_config");
                  router.push("/dashboard/mercadolibre/auth");
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded font-medium"
            >
              🔌 Desconectar
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="text-red-600 font-semibold">Não conectado ao Mercado Livre.</p>
          <Link
            href="/dashboard/mercadolibre/auth"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-medium text-center mt-4 inline-block"
          >
            Tentar conectar novamente
          </Link>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="font-semibold mb-3">Próximos passos</h2>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Sincronize seus produtos automaticamente</li>
          <li>Configure notificações de pedidos</li>
          <li>Acompanhe relatórios de vendas em tempo real</li>
        </ul>
      </div>
    </div>
  );
}