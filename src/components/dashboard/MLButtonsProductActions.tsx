// src/components/dashboard/MLProductActions.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { mercadoLivreProductsService } from "@/lib/products";

// Aceita HTMLElement ou null
function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, callback]);
}


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
  const [showMoreActions, setShowMoreActions] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => {
    if (showMoreActions) {
      setShowMoreActions(false);
    }
  });

  const handleAction = async (action: string) => {
    try {
      setLoading(action);
      setError("");

      switch (action) {
        case "pause":
          await mercadoLivreProductsService.pauseProduct(productId);
          break;
        case "activate":
          await mercadoLivreProductsService.activateProduct(productId);
          break;
        case "delete":
          await mercadoLivreProductsService.deleteProduct(productId);
          break;
        case "close":
          await mercadoLivreProductsService.closeProduct(productId);
          break;
        case "update":
          await mercadoLivreProductsService.updateProduct(productId);
          break;
        case "updateStock":
          await mercadoLivreProductsService.updateStock(productId);
          break;
        default:
          break;
      }

      onStatusChange();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao executar ação";

      if (
        errorMessage.includes("field_not_updatable") ||
        errorMessage.includes("not_modifiable") ||
        errorMessage.includes("Nenhuma alteração detectada")
      ) {
        setError("Nenhuma alteração detectada para atualizar");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(null);
    }
  };

  if (!mlItemId) {
    return null;
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {error && (
        <div
          className={`text-xs mb-2 p-1 rounded ${
            error.includes("Nenhuma alteração detectada")
              ? "bg-blue-50 text-blue-600 border border-blue-200"
              : "bg-red-50 text-red-600 border border-red-200"
          }`}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col space-y-2">
        {/* Ações principais sempre visíveis */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1 flex gap-2">
            {mlStatus === "active" && (
              <button
                onClick={() => handleAction("pause")}
                disabled={loading !== null}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-1 focus:ring-yellow-500 disabled:opacity-50"
                title="Pausar produto no Mercado Livre"
              >
                {loading === "pause" ? (
                  <svg
                    className="animate-spin h-3 w-3 mr-1"
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
                    className="h-3 w-3 mr-1"
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
                Pausar
              </button>
            )}

            {mlStatus === "paused" && (
              <button
                onClick={() => handleAction("activate")}
                disabled={loading !== null}
                className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
                title="Reativar produto no Mercado Livre"
              >
                {loading === "activate" ? (
                  <svg
                    className="animate-spin h-3 w-3 mr-1"
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
                    className="h-3 w-3 mr-1"
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
                Reativar
              </button>
            )}
          </div>

          <button
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-xs rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500"
            title="Mais ações"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </button>
        </div>

        {/* Menu de ações adicionais (expandível) - POSICIONAMENTO CORRIGIDO */}
        {showMoreActions && (
          <div 
            className="absolute bottom-full right-0 mb-2 z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200"
            style={{ 
              zIndex: 1000,
              // Garante que não fique cortado
              maxHeight: "none",
              overflow: "visible"
            }}
          >
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  handleAction("update");
                  setShowMoreActions(false);
                }}
                disabled={loading !== null}
                className="w-full text-left px-3 py-2 text-xs rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 flex items-center"
              >
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Atualizar dados
              </button>

              <button
                onClick={() => {
                  handleAction("updateStock");
                  setShowMoreActions(false);
                }}
                disabled={loading !== null}
                className="w-full text-left px-3 py-2 text-xs rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 disabled:opacity-50 flex items-center"
              >
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
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
                Sincronizar estoque
              </button>

              <button
                onClick={() => {
                  if (
                    confirm("Tem certeza que deseja finalizar este anúncio?")
                  ) {
                    handleAction("close");
                    setShowMoreActions(false);
                  }
                }}
                disabled={loading !== null}
                className="w-full text-left px-3 py-2 text-xs rounded-md text-orange-700 hover:bg-orange-100 focus:outline-none focus:bg-orange-100 disabled:opacity-50 flex items-center"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Finalizar anúncio
              </button>

              <button
                onClick={() => {
                  if (
                    confirm(
                      "Tem certeza que deseja excluir este produto do Mercado Livre?"
                    )
                  ) {
                    handleAction("delete");
                    setShowMoreActions(false);
                  }
                }}
                disabled={loading !== null}
                className="w-full text-left px-3 py-2 text-xs rounded-md text-red-700 hover:bg-red-100 focus:outline-none focus:bg-red-100 disabled:opacity-50 flex items-center"
              >
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
                Excluir do ML
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}