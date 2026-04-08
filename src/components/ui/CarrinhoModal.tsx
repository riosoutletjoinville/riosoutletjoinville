// src/components/ui/CarrinhoModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useCarrinho } from "@/hooks/useCarrinho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { Truck, Check, Calculator } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
interface CarrinhoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CarrinhoModal({ isOpen, onClose }: CarrinhoModalProps) {
  const {
    carrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    totalPreco,
    totalItens,
    frete,
    calcularFrete,
    selecionarOpcaoFrete,
    valorFrete,
    totalComFrete,
  } = useCarrinho();

  const [isClient, setIsClient] = useState(false);
  const [cep, setCep] = useState("");
  const [calculandoFrete, setCalculandoFrete] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (frete?.cep) {
      setCep(frete.cep);
    }
  }, [frete]);

  if (!isOpen || !isClient) return null;

  const handleQuantidadeChange = (
    produtoId: string,
    variacaoId: string,
    novaQuantidade: number
  ) => {
    if (novaQuantidade < 1) return;
    atualizarQuantidade(produtoId, variacaoId || undefined, novaQuantidade);
  };

  const handleCalcularFrete = async () => {
    if (!cep || cep.replace(/\D/g, "").length !== 8) return;

    setCalculandoFrete(true);
    try {
      await calcularFrete(cep);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
    } finally {
      setCalculandoFrete(false);
    }
  };

  const formatarCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCEP(e.target.value);
    setCep(formatted);
  };

  const valorParaFreteGratis = frete?.valor_minimo_frete_gratis || 500;
  const faltaParaFreteGratis = valorParaFreteGratis - totalPreco;
  const percentualProgresso = Math.min(
    (totalPreco / valorParaFreteGratis) * 100,
    100
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block w-full max-w-2xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Meu Carrinho ({totalItens} {totalItens === 1 ? "item" : "itens"})
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto mb-4">
            {carrinho.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">Seu carrinho está vazio</p>
                <Button onClick={onClose}>Continuar Comprando</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {carrinho.map((item) => (
                  <div
                    key={`${item.produto_id}-${item.variacao_id || "default"}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-white"
                  >
                    <div className="flex items-center gap-4">
                      {item.imagem_url && (
                        <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          <ProductImage
                            src={item.imagem_url}
                            alt={item.titulo}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 break-words">
                          {item.titulo}
                        </h4>
                        <p className="text-green-600 font-semibold text-sm">
                          R$ {item.preco_unitario.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantidadeChange(
                              item.produto_id,
                              item.variacao_id || "",
                              item.quantidade - 1
                            )
                          }
                          disabled={item.quantidade <= 1}
                          className="w-8 h-8 p-0"
                        >
                          -
                        </Button>

                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantidade}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleQuantidadeChange(
                              item.produto_id,
                              item.variacao_id || "",
                              item.quantidade + 1
                            )
                          }
                          className="w-8 h-8 p-0"
                        >
                          +
                        </Button>
                      </div>

                      <div className="text-right min-w-20">
                        <p className="font-semibold text-sm">
                          R${" "}
                          {(item.preco_unitario * item.quantidade).toFixed(2)}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removerDoCarrinho(item.produto_id, item.variacao_id)
                        }
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {carrinho.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              {/* Seção de Frete */}
              <div className="space-y-3">
                {/* Campo CEP */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Calcular Frete
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="00000-000"
                      value={cep}
                      onChange={handleCepChange}
                      maxLength={9}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleCalcularFrete}
                      disabled={calculandoFrete || cep.length !== 9}
                      size="sm"
                    >
                      {calculandoFrete ? "..." : "OK"}
                    </Button>
                  </div>
                </div>

                {/* Barra de Progresso Frete Grátis */}
                {totalPreco < valorParaFreteGratis && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-blue-800">
                        {faltaParaFreteGratis > 0
                          ? `Faltam R$ ${faltaParaFreteGratis.toFixed(
                              2
                            )} para frete grátis`
                          : "Frete grátis ativado!"}
                      </span>
                      <span className="text-blue-600">
                        R$ {totalPreco.toFixed(2)} / R${" "}
                        {valorParaFreteGratis.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentualProgresso}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Opções de Frete */}
                {frete && frete.opcao_selecionada && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Frete:</span>
                      <span className="font-semibold">
                        {frete.frete_gratis ||
                        totalPreco >= frete.valor_minimo_frete_gratis ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Grátis
                          </span>
                        ) : (
                          `R$ ${frete.opcao_selecionada.valor.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Totais */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {totalPreco.toFixed(2)}</span>
                </div>

                {/* CORREÇÃO: Mostrar valor do frete apenas se não for grátis */}
                {!frete?.frete_gratis &&
                  totalPreco < (frete?.valor_minimo_frete_gratis || 500) && (
                    <div className="flex justify-between items-center text-sm">
                      <span>Frete:</span>
                      <span>R$ {valorFrete.toFixed(2)}</span>
                    </div>
                  )}

                {frete?.frete_gratis && (
                  <div className="flex justify-between items-center text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Frete Grátis
                    </span>
                    <span>R$ 0,00</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                  <span>Total:</span>
                  {/* CORREÇÃO: Usar totalComFrete que já está correto no hook */}
                  <span className="text-green-600">
                    R$ {totalComFrete.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Continuar Comprando
                </Button>

                <Button
                  asChild
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Link href="/checkout" onClick={onClose}>
                    Finalizar Compra
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
