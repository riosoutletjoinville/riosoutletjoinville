//src/app/dashboard/mercado-livre/auth
"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mercadoLivreService } from "@/lib/mercadolibre";
import { supabase } from "@/lib/supabase";
import { useMercadoLivreConfig } from "@/hooks/useMercadoLivreConfig";
import { useUsuario } from "@/hooks/useUsuario"; // <-- NOVO HOOK

interface ConnectionInfo {
  ml_nickname?: string;
  ml_user_id?: string;
  [key: string]: unknown;
}

export default function AuthMLContent() {
  const router = useRouter();
  const { usuario, loading: usuarioLoading } = useUsuario(); // <-- USAR O HOOK
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [configStatus, setConfigStatus] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(
    null
  );
  const { config } = useMercadoLivreConfig();

  // Aguardar carregamento do usuário
  useEffect(() => {
    if (!usuarioLoading && usuario) {
      checkConnectionStatus();
    }
    checkConfig();
  }, [usuario, usuarioLoading]);

  const checkConfig = async () => {
    try {
      const status = await mercadoLivreService.checkConfig();
      setConfigStatus(status);

      if (!status.isValid) {
        setError(`Configuração incompleta: ${status.errors.join(", ")}`);
      }
    } catch (err) {
      console.error("Erro ao verificar configuração:", err);
      setError("Erro ao verificar configuração");
    }
  };

  const checkConnectionStatus = async () => {
    // SÓ EXECUTA SE TIVER USUÁRIO
    if (!usuario) {
      console.log("Usuário não autenticado");
      return;
    }

    try {
      const connected = await mercadoLivreService.isUserConnected();
      setIsConnected(connected);

      // Buscar informações completas da conexão
      const info = await mercadoLivreService.getConnectionInfo();
      setConnectionInfo(info);

      // Verificar consistência entre as tabelas - AGORA COM SEGURANÇA
      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuarios")
        .select("ml_user_id")
        .eq("id", usuario.id)  // <-- USAR usuario.id que já temos
        .maybeSingle();  // <-- USAR maybeSingle

      if (usuarioError) {
        console.error("Erro ao buscar usuário:", usuarioError);
        return;
      }

      const { data: tokens, error: tokensError } = await supabase
        .from("mercado_livre_tokens")
        .select("ml_user_id")
        .eq("user_id", usuario.id)  // <-- USAR usuario.id
        .maybeSingle();  // <-- USAR maybeSingle

      if (tokensError) {
        console.error("Erro ao buscar tokens:", tokensError);
        return;
      }

      // Se há inconsistência, forçar limpeza
      if (
        (usuarioData?.ml_user_id && !tokens) ||
        (!usuarioData?.ml_user_id && tokens)
      ) {
        console.warn("Inconsistência detectada, limpando dados...");
        await handleDisconnect();
      }
    } catch (err) {
      console.error("Erro ao verificar status da conexão:", err);
    }
  };

  const handleConnect = () => {
    if (!usuario) {
      setError("Usuário não autenticado. Faça login primeiro.");
      return;
    }

    const state = Math.random().toString(36).substring(2, 15);
    document.cookie = `ml_auth_state=${state}; path=/; max-age=300; SameSite=Lax`;

    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${
      config.appId
    }&redirect_uri=${encodeURIComponent(
      config.redirectUri
    )}&scope=offline_access%20read%20write&state=${state}`;

    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!usuario) return;

    try {
      // Limpar token do Mercado Livre
      const { error: disconnectError } = await supabase
        .from("mercado_livre_tokens")
        .delete()
        .eq("user_id", usuario.id);

      // Limpar localStorage
      localStorage.removeItem("ml_auth_state");
      localStorage.removeItem("ml_config");

      if (disconnectError) {
        console.error("Erro ao desconectar:", disconnectError);
        setError("Erro ao desconectar: " + disconnectError.message);
      } else {
        console.log("Desconectado do Mercado Livre");
        setIsConnected(false);
        setConnectionInfo(null);
        setError("");
        router.push("/dashboard/mercado-livre/auth");
      }
    } catch (err) {
      console.error("Erro ao desconectar:", err);
      setError(
        "Erro ao desconectar: " +
          (err instanceof Error ? err.message : "Erro desconhecido")
      );
    }
  };

  // Loading enquanto verifica usuário
  if (usuarioLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não tem usuário, mostrar mensagem
  if (!usuario) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">
            Usuário não autenticado
          </h1>
          <p className="text-gray-600 mb-4">
            Você precisa estar logado para acessar esta página.
          </p>
          <Link
            href="/login"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded block text-center"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  if (configStatus && !configStatus.isValid) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-600">
            Erro de Configuração
          </h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">
              Configuração do Mercado Livre incompleta:
            </p>
            <ul className="list-disc list-inside mt-2">
              {configStatus.errors.map((errorMsg, index) => (
                <li key={index}>{errorMsg}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-gray-600">
            Verifique suas variáveis de ambiente no arquivo .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">
          Integração com Mercado Livre
        </h1>
        <button
          onClick={() => {
            localStorage.removeItem("ml_config");
            alert("Configuração limpa! Recarregando...");
            window.location.reload();
          }}
          className="bg-red-500 text-white p-2 rounded mb-4"
        >
          🗑️ Limpar Config
        </button>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isConnected ? (
          <div>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p>✅ Conectado ao Mercado Livre</p>
              {connectionInfo && (
                <div className="mt-2 text-sm">
                  <p>
                    <strong>Usuário:</strong> {connectionInfo.ml_nickname}
                  </p>
                  <p>
                    <strong>ID:</strong> {connectionInfo.ml_user_id}
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/mercado-livre/products"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 block text-center"
            >
              Ver Produtos no Mercado Livre
            </Link>

            <button
              onClick={handleDisconnect}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-4">
              Conecte sua conta do Mercado Livre para gerenciar seus produtos e
              pedidos.
            </p>
            <button
              onClick={handleConnect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Conectar com Mercado Livre
            </button>
            <button
              onClick={() => router.push("/dashboard/mercado-livre/debug")}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-4"
            >
              Página de Debug
            </button>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <h2 className="font-semibold mb-2">Benefícios da integração:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Sincronização de produtos</li>
            <li>Gestão de pedidos</li>
            <li>Atualização de estoque</li>
            <li>Notificações em tempo real</li>
          </ul>
        </div>
      </div>
    </div>
  );
}