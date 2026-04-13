// src/components/ui/CarrinhoModal.tsx
"use client";

import { useState, useEffect } from "react";
import { useCarrinho } from "@/hooks/useCarrinho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Truck, Check, AlertCircle } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage";
import Swal from "sweetalert2";

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
    verificarEstoqueItem, // NOVO: método para verificar estoque
  } = useCarrinho();

  const [isClient, setIsClient] = useState(false);
  const [cep, setCep] = useState("");
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [estoqueInsuficiente, setEstoqueInsuficiente] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsClient(true);
    if (frete?.cep) {
      setCep(frete.cep);
    }
  }, [frete]);

  // NOVO: Verificar estoque de todos os itens ao abrir o modal
  useEffect(() => {
    if (isOpen && carrinho.length > 0) {
      const verificarEstoque = async () => {
        const estoqueStatus: Record<string, boolean> = {};
        
        for (const item of carrinho) {
          const chave = `${item.produto_id}-${item.variacao_id || "default"}`;
          try {
            const temEstoque = await verificarEstoqueItem(
              item.produto_id, 
              item.variacao_id, 
              item.quantidade
            );
            estoqueStatus[chave] = !temEstoque;
          } catch {
            estoqueStatus[chave] = true;
          }
        }
        
        setEstoqueInsuficiente(estoqueStatus);
      };
      
      verificarEstoque();
    }
  }, [isOpen, carrinho, verificarEstoqueItem]);

  if (!isOpen || !isClient) return null;

  const handleQuantidadeChange = async (
    produtoId: string,
    variacaoId: string | undefined,
    novaQuantidade: number
  ) => {
    if (novaQuantidade < 1) return;
    
    const chave = `${produtoId}-${variacaoId || "default"}`;
    
    // NOVO: Verificar estoque antes de atualizar
    const temEstoque = await verificarEstoqueItem(produtoId, variacaoId, novaQuantidade);
    
    if (!temEstoque) {
      setEstoqueInsuficiente(prev => ({ ...prev, [chave]: true }));
      
      await Swal.fire({
        icon: "warning",
        title: "Estoque insuficiente",
        text: "A quantidade solicitada não está disponível em estoque.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    
    setEstoqueInsuficiente(prev => ({ ...prev, [chave]: false }));
    atualizarQuantidade(produtoId, variacaoId, novaQuantidade);
  };

  // NOVO: Verificar se pode finalizar compra
  const podeFinalizar = () => {
    // Verificar se tem itens no carrinho
    if (carrinho.length === 0) return false;
    
    // Verificar se há itens com estoque insuficiente
    if (Object.values(estoqueInsuficiente).some(v => v)) return false;
    
    // Verificar se o frete foi calculado
    if (!frete?.opcao_selecionada && !frete?.frete_gratis) return false;
    
    return true;
  };

  const handleFinalizarCompra = async (e: React.MouseEvent) => {
    if (!podeFinalizar()) {
      e.preventDefault();
      
      let mensagem = "";
      if (!frete?.opcao_selecionada && !frete?.frete_gratis) {
        mensagem = "Por favor, calcule o frete antes de finalizar a compra.";
      } else if (Object.values(estoqueInsuficiente).some(v => v)) {
        mensagem = "Alguns itens no carrinho não possuem estoque suficiente.";
      }
      
      await Swal.fire({
        icon: "warning",
        title: "Ação necessária",
        text: mensagem,
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    
    onClose();
  };

  const handleCalcularFrete = async () => {
    if (!cep || cep.replace(/\D/g, "").length !== 8) {
      await Swal.fire({
        icon: "warning",
        title: "CEP inválido",
        text: "Por favor, digite um CEP válido com 8 dígitos.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

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
                {carrinho.map((item) => {
                  const chave = `${item.produto_id}-${item.variacao_id || "default"}`;
                  const temErroEstoque = estoqueInsuficiente[chave];
                  
                  return (
                    <div
                      key={chave}
                      className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg bg-white ${
                        temErroEstoque ? "border-red-300 bg-red-50" : ""
                      }`}
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
                          {/* NOVO: Exibir variação selecionada */}
                          {item.variacao && (
                            <div className="text-xs text-gray-600 mt-1">
                              {item.variacao.cor && (
                                <span>Cor: {item.variacao.cor}</span>
                              )}
                              {item.variacao.tamanho && (
                                <span> | Tamanho: {item.variacao.tamanho}</span>
                              )}
                            </div>
                          )}
                          <p className="text-green-600 font-semibold text-sm">
                            R$ {item.preco_unitario.toFixed(2)}
                          </p>
                          
                          {/* NOVO: Aviso de estoque insuficiente */}
                          {temErroEstoque && (
                            <p className="text-red-600 text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              Estoque insuficiente
                            </p>
                          )}
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
                  );
                })}
              </div>
            )}
          </div>

          {carrinho.length > 0 && (
            <div className="border-t pt-4 space-y-4">
              {/* Seção de Frete */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Calcular Frete
                    <span className="text-red-500 text-xs font-normal">
                      (obrigatório para finalizar)
                    </span>
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
                
                {/* NOVO: Aviso quando frete não calculado */}
                {!frete?.opcao_selecionada && !frete?.frete_gratis && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Calcule o frete para continuar
                    </p>
                  </div>
                )}
              </div>

              {/* Totais */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {totalPreco.toFixed(2)}</span>
                </div>

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
                  className={`flex-1 ${
                    podeFinalizar() 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleFinalizarCompra}
                  disabled={!podeFinalizar()}
                >
                  <Link 
                    href={podeFinalizar() ? "/checkout" : "#"} 
                    onClick={handleFinalizarCompra}
                    className={!podeFinalizar() ? "pointer-events-none" : ""}
                  >
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