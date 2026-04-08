// src/app/dashboard/mercadolibre/debug/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { mercadoLivreService } from "@/lib/mercadolibre";

interface ConnectionInfo {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  updated_at: string;
  ml_user_id?: string;
  ml_nickname?: string;
  [key: string]: unknown;
}

interface ConfigStatus {
  isValid: boolean;
  errors: string[];
}

export default function DebugMLContent() {
  const [params, setParams] = useState<Record<string, string>>({});
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extrai parâmetros da URL manualmente
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const allParams: Record<string, string> = {};
      
      urlParams.forEach((value, key) => {
        allParams[key] = value;
      });
      
      setParams(allParams);
    }

    checkConnectionStatus();
    checkConfig();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const connected = await mercadoLivreService.isUserConnected();
      setIsConnected(connected);

      if (connected) {
        const info = await mercadoLivreService.getConnectionInfo();
        setConnectionInfo(info as ConnectionInfo);
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkConfig = async () => {
    const status = await mercadoLivreService.checkConfig();
    setConfigStatus(status as ConfigStatus);
  };

  const handleTestConnection = async () => {
    try {
      const token = await mercadoLivreService.getAccessToken();
      if (token) {
        const userInfo = await mercadoLivreService.getUserInfo(token);
        alert(
          `Conexão testada com sucesso!\nUsuário: ${userInfo.nickname}\nID: ${userInfo.id}`
        );
      } else {
        alert("Nenhum token de acesso disponível");
      }
    } catch (error: unknown) {
      alert("Erro ao testar conexão: " + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Debug - Integração Mercado Livre
        </h1>

        {/* Seção de Status da Conexão */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status da Conexão</h2>
          {loading ? (
            <div className="animate-pulse">Carregando...</div>
          ) : isConnected ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-semibold">✅ CONECTADO AO MERCADO LIVRE</p>
              {connectionInfo && (
                <div className="mt-2">
                  {connectionInfo.ml_nickname && (
                    <p>
                      <strong>Usuário ML:</strong> {connectionInfo.ml_nickname}
                    </p>
                  )}
                  {connectionInfo.ml_user_id && (
                    <p>
                      <strong>ID ML:</strong> {connectionInfo.ml_user_id}
                    </p>
                  )}
                  <p>
                    <strong>User ID:</strong> {connectionInfo.user_id}
                  </p>
                  <p>
                    <strong>Token expira em:</strong>{" "}
                    {new Date(
                      new Date(connectionInfo.updated_at).getTime() +
                        connectionInfo.expires_in * 1000
                    ).toLocaleString()}
                  </p>
                </div>
              )}
              <button
                onClick={handleTestConnection}
                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Testar Conexão
              </button>
            </div>
          ) : (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p className="font-semibold">⚠️ NÃO CONECTADO</p>
              <p>
                Clique em &quot;Conectar com Mercado Livre&quot; na página
                principal
              </p>
            </div>
          )}
        </div>

        {/* Seção de Configuração */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Configuração do Ambiente
          </h2>
          {configStatus ? (
            configStatus.isValid ? (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p className="font-semibold">✅ CONFIGURAÇÃO VÁLIDA</p>
                <div className="mt-2 text-sm">
                  <p>
                    <strong>App ID:</strong>{" "}
                    {process.env.NEXT_PUBLIC_MERCADO_LIVRE_APP_ID
                      ? "Configurado"
                      : "Faltando"}
                  </p>
                  <p>
                    <strong>Redirect URI:</strong>{" "}
                    {process.env.NEXT_PUBLIC_MERCADO_LIVRE_REDIRECT_URI
                      ? "Configurado"
                      : "Faltando"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p className="font-semibold">❌ ERRO DE CONFIGURAÇÃO</p>
                <ul className="list-disc list-inside mt-2">
                  {configStatus.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )
          ) : (
            <div className="animate-pulse">Carregando configuração...</div>
          )}
        </div>

        {/* Seção de Parâmetros da URL */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Parámetros Recebidos</h2>

          <div className="bg-gray-100 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">URL Completa:</h3>
            <code className="break-all text-sm">
              {typeof window !== "undefined" ? window.location.href : ""}
            </code>
          </div>

          {Object.keys(params).length === 0 ? (
            <p>Nenhum parâmetro encontrado na URL</p>
          ) : (
            <div className="bg-blue-100 p-4 rounded">
              <h3 className="font-semibold mb-2">Parâmetros de Query:</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Parâmetro</th>
                    <th className="text-left py-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(params).map(([key, value]) => (
                    <tr key={key} className="border-b">
                      <td className="py-2 font-mono">{key}</td>
                      <td className="py-2 font-mono break-all">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {params.code && (
            <div className="bg-green-100 p-4 rounded mt-4">
              <h3 className="font-semibold mb-2">
                ✅ Código de Autorização Recebido!
              </h3>
              <p>
                O Mercado Livre redirecionou com sucesso e forneceu um código de
                autorização.
              </p>
              <div className="mt-2 p-2 bg-green-200 rounded">
                <strong>Código:</strong>{" "}
                <code className="break-all">{params.code}</code>
              </div>
            </div>
          )}

          {params.ml_error && (
            <div className="bg-red-100 p-4 rounded mt-4">
              <h3 className="font-semibold mb-2">❌ Erro no Processamento</h3>
              <p>Tipo de erro: {params.ml_error}</p>
              {params.ml_error === "state_mismatch" && (
                <p className="mt-2 text-sm">
                  <strong>Problema:</strong> O state do callback não corresponde
                  ao esperado. Verifique se os cookies estão sendo armazenados e
                  recuperados corretamente.
                </p>
              )}
            </div>
          )}

          {params.ml_success && (
            <div className="bg-green-100 p-4 rounded mt-4">
              <h3 className="font-semibold mb-2">✅ Conexão Bem-sucedida!</h3>
              <p>
                A integração com o Mercado Livre foi estabelecida com sucesso.
              </p>
            </div>
          )}
        </div>

        {/* Seção de Ações de Debug */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Ações de Debug</h2>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded mr-2"
            >
              Recarregar Página
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("ml_auth_state");
                alert("State do localStorage limpo");
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded mr-2"
            >
              Limpar State Local
            </button>

            <button
              onClick={checkConnectionStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Verificar Conexão Novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
