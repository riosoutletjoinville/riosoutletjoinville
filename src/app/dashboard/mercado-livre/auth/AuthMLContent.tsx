// src/app/dashboard/mercado-livre/auth/AuthMLContent.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { mercadoLivreService } from "@/lib/mercadolibre";
import { createClient } from "@/lib/supabase-client"; // ← Use o cliente browser
import { useMercadoLivreConfig } from "@/hooks/useMercadoLivreConfig";

export default function AuthMLContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [configStatus, setConfigStatus] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { config } = useMercadoLivreConfig();

  // ✅ Crie o cliente browser
  const supabase = createClient();

  // Verificar autenticação e conexão
  useEffect(() => {
    const checkAuthAndConnection = async () => {
      setIsLoading(true);

      // Verificar sessão do usuário
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      setUser(session.user);

      // Verificar conexão com ML
      const connected = await mercadoLivreService.isUserConnected(supabase);
      setIsConnected(connected);

      if (connected) {
        const info = await mercadoLivreService.getConnectionInfo(supabase);
        setConnectionInfo(info);
      }

      setIsLoading(false);
    };

    checkAuthAndConnection();
    checkConfig();
  }, []);

  // Verificar parâmetros da URL ao montar
  useEffect(() => {
    const mlSuccess = searchParams.get("ml_success");
    const mlError = searchParams.get("ml_error");

    if (mlSuccess === "connected") {
      setSuccessMessage("✅ Conexão com Mercado Livre realizada com sucesso!");
      // Limpar o parâmetro da URL sem recarregar a página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    if (mlError) {
      switch (mlError) {
        case "auth_failed":
          setError("Falha na autenticação com o Mercado Livre");
          break;
        case "no_code":
          setError("Código de autorização não recebido");
          break;
        case "internal_error":
          setError("Erro interno ao processar a conexão");
          break;
        default:
          setError("Erro desconhecido na conexão");
      }
      // Limpar o parâmetro da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

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
    if (!user) {
      console.log("Usuário não autenticado");
      return;
    }

    try {
      const connected = await mercadoLivreService.isUserConnected();
      setIsConnected(connected);

      if (connected) {
        const info = await mercadoLivreService.getConnectionInfo();
        setConnectionInfo(info);
      }
    } catch (err) {
      console.error("Erro ao verificar status da conexão:", err);
    }
  };

  const handleConnect = () => {
    console.log("=== DEBUG CONNECT ===");
    console.log("Config:", config);
    console.log("Usuário:", user);

    if (!user) {
      setError("Usuário não autenticado. Faça login primeiro.");
      return;
    }

    if (!config.appId || !config.redirectUri) {
      setError("Configuração do Mercado Livre incompleta.");
      return;
    }

    const state = Math.random().toString(36).substring(2, 15);

    // Salvar state
    localStorage.setItem("ml_auth_state", state);
    document.cookie = `ml_auth_state=${state}; path=/; max-age=300; SameSite=Lax`;

    const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${config.appId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&scope=offline_access%20read%20write&state=${state}`;

    console.log("Redirecionando para:", authUrl);
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      const { error: disconnectError } = await supabase
        .from("mercado_livre_tokens")
        .delete()
        .eq("user_id", user.id);

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
        setSuccessMessage(""); // Limpar mensagem de sucesso
      }
    } catch (err) {
      console.error("Erro ao desconectar:", err);
      setError(
        "Erro ao desconectar: " +
          (err instanceof Error ? err.message : "Erro desconhecido"),
      );
    }
  };
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

        {/* Mensagem de sucesso */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {/* Botão de limpar config (debug) */}
        <button
          onClick={() => {
            localStorage.removeItem("ml_config");
            alert("Configuração limpa! Recarregando...");
            window.location.reload();
          }}
          className="bg-red-500 text-white p-2 rounded mb-4 text-sm"
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
              href="/dashboard/mercado-livre"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 block text-center"
            >
              Ir para Dashboard do Mercado Livre
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
