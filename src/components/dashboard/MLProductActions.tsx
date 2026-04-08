// src/components/dashboard/MLProductActions.tsx - ATUALIZADO
"use client";

import { useState } from "react";
import { mercadoLivreProductsService } from "@/lib/products";

interface MLProductActionsProps {
  productId: string;
  mlStatus?: string;
  mlItemId?: string;
  onStatusChange: () => void;
}

export default function MLProductActions({
  productId,
  mlStatus,
  mlItemId,
  onStatusChange,
}: MLProductActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  type ProductAction =
    | "pause"
    | "activate"
    | "delete"
    | "close"
    | "update"
    | "updateStock";

  const handleAction = async (action: ProductAction) => {
    try {
      setLoading(action);
      setError("");

      type SuccessMessages = {
        [key in ProductAction]: string;
      };

      const successMessages: SuccessMessages = {
        update: "Produto atualizado com sucesso",
        updateStock: "Estoque sincronizado com sucesso",
        pause: "Produto pausado com sucesso",
        activate: "Produto reativado com sucesso",
        close: "Anúncio finalizado com sucesso",
        delete: "Produto excluído com sucesso",
      };

      let result;
      switch (action) {
        case "pause":
          result = await mercadoLivreProductsService.pauseProduct(productId);
          break;
        case "activate":
          result = await mercadoLivreProductsService.activateProduct(productId);
          break;
        case "delete":
          if (
            confirm(
              "Tem certeza que deseja excluir este produto do Mercado Livre?"
            )
          ) {
            result = await mercadoLivreProductsService.deleteProduct(productId);
            // ✅ Mensagem mais específica
            setError(`✅ Produto removido do Mercado Livre com sucesso`);
          } else {
            return;
          }
          break;
        case "close":
          if (confirm("Tem certeza que deseja finalizar este anúncio?")) {
            result = await mercadoLivreProductsService.closeProduct(productId);
          } else {
            return;
          }
          break;
        case "update":
          result = await mercadoLivreProductsService.updateProduct(productId);
          break;
        case "updateStock":
          result = await mercadoLivreProductsService.updateStock(productId);
          break;
      }

      setError(`✅ ${successMessages[action]}`);
      setTimeout(() => setError(""), 3000);
      onStatusChange();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao executar ação";

      if (
        errorMessage.includes("field_not_updatable") ||
        errorMessage.includes("not_modifiable")
      ) {
        setError(
          "⚠️ Alguns campos não podem ser atualizados para este produto"
        );
      } else if (errorMessage.includes("closed")) {
        setError("❌ Produto finalizado não pode ser modificado");
      } else if (errorMessage.includes("not_found")) {
        setError("❌ Produto não encontrado no Mercado Livre");
      } else if (errorMessage.includes("Nenhuma alteração")) {
        setError("ℹ️ " + errorMessage);
      } else {
        setError("❌ " + errorMessage);
      }
    } finally {
      setLoading(null);
    }
  };

  if (!mlItemId) {
    return null;
  }

  // ✅ CORREÇÃO: Verificar se o produto está finalizado (closed)
  const isClosed = mlStatus === "closed";

  return (
    <div className="w-full">
      {error && (
        <div
          className={`text-xs mb-2 p-2 rounded ${
            error.includes("Nenhuma alteração detectada")
              ? "bg-blue-50 text-blue-600 border border-blue-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {/* ✅ CORREÇÃO: Ação para produtos FINALIZADOS - mostrar opção de reativar */}
        {isClosed && (
          <button
            onClick={() => handleAction("activate")}
            disabled={loading !== null}
            className="col-span-2 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            title="Reativar produto finalizado no Mercado Livre"
          >
            {loading === "activate" ? (
              <svg
                className="animate-spin h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            Reativar Anúncio
          </button>
        )}
        {isClosed && (
          <button
            onClick={() => handleAction("delete")}
            disabled={loading !== null}
            className="col-span-2 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            title="Excluir produto finalizado do Mercado Livre"
          >
            {loading === "delete" ? (
              <svg
                className="animate-spin h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
            Excluir do ML
          </button>
        )}

        {/* Ação principal baseada no status - apenas se NÃO estiver finalizado */}
        {!isClosed && mlStatus === "active" && (
          <button
            onClick={() => handleAction("pause")}
            disabled={loading !== null}
            className="col-span-2 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            title="Pausar produto no Mercado Livre"
          >
            {loading === "pause" ? (
              <svg
                className="animate-spin h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            Pausar Anúncio
          </button>
        )}

        {!isClosed && mlStatus === "paused" && (
          <button
            onClick={() => handleAction("activate")}
            disabled={loading !== null}
            className="col-span-2 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            title="Reativar produto no Mercado Livre"
          >
            {loading === "activate" ? (
              <svg
                className="animate-spin h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            Reativar Anúncio
          </button>
        )}

        {/* Ações secundárias - mostrar apenas se NÃO estiver finalizado */}
        {!isClosed && (
          <>
            <button
              onClick={() => handleAction("update")}
              disabled={loading !== null}
              className="inline-flex items-center justify-center px-2 py-2 border border-gray-300 text-xs rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50"
              title="Atualizar dados do produto"
            >
              {loading === "update" ? (
                <svg
                  className="animate-spin h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={() => handleAction("updateStock")}
              disabled={loading !== null}
              className="inline-flex items-center justify-center px-2 py-2 border border-gray-300 text-xs rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 disabled:opacity-50"
              title="Sincronizar estoque"
            >
              {loading === "updateStock" ? (
                <svg
                  className="animate-spin h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </>
        )}

        {/* Ações destrutivas - sempre visíveis */}
        {!isClosed && (
          <button
            onClick={() => {
              if (confirm("Tem certeza que deseja finalizar este anúncio?")) {
                handleAction("close");
              }
            }}
            disabled={loading !== null}
            className="inline-flex items-center justify-center px-2 py-2 border border-gray-300 text-xs rounded-md text-orange-600 bg-white hover:bg-orange-50 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
            title="Finalizar anúncio"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        <button
          onClick={() => {
            if (
              confirm(
                "Tem certeza que deseja excluir este produto do Mercado Livre?"
              )
            ) {
              handleAction("delete");
            }
          }}
          disabled={loading !== null}
          className="inline-flex items-center justify-center px-2 py-2 border border-gray-300 text-xs rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
          title="Excluir do Mercado Livre"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
      {/* Labels para telas maiores */}
      <div className="hidden sm:grid grid-cols-4 gap-2 mt-2 text-xs text-center text-gray-500">
        {!isClosed && (
          <>
            <span>Atualizar</span>
            <span>Estoque</span>
            <span>Finalizar</span>
          </>
        )}
        <span>Excluir</span>
      </div>
    </div>
  );
}
