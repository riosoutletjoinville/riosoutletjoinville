// src/app/carrinho/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useCarrinho } from "@/hooks/useCarrinho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";
import { Truck, Check, Calculator, ArrowLeft, ShoppingBag, RadioIcon, RadioTowerIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CarrinhoContent() {
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

  const router = useRouter();
  const [cep, setCep] = useState("");
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (frete?.cep) {
      setCep(frete.cep);
    }
  }, [frete]);

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleQuantidadeChange = (
    produtoId: string,
    variacaoId: string,
    novaQuantidade: number
  ) => {
    if (novaQuantidade < 1) return;
    atualizarQuantidade(produtoId, variacaoId || undefined, novaQuantidade);
  };

  const handleCalcularFrete = async () => {
    if (!cep || cep.replace(/\D/g, "").length !== 8) {
      alert("Por favor, digite um CEP válido");
      return;
    }

    setCalculandoFrete(true);
    try {
      await calcularFrete(cep);
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      alert("Erro ao calcular frete. Verifique o CEP e tente novamente.");
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Meu Carrinho</h1>
            </div>
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-6 h-6 text-gray-600" />
              <span className="text-lg font-semibold">
                ({totalItens} {totalItens === 1 ? "item" : "itens"})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {carrinho.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Seu carrinho está vazio
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Explore nossos produtos e adicione itens incríveis ao seu
              carrinho.
            </p>
            <div className="space-x-4">
              <Button
                onClick={() => router.push("/")}
                className="bg-black hover:bg-gray-800"
              >
                Continuar Comprando
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/categoria")}
              >
                Ver Categorias
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Itens */}
            <div className="lg:col-span-2 space-y-4">
              {carrinho.map((item) => (
                <div
                  key={`${item.produto_id}-${item.variacao_id || "default"}`}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-6 border rounded-lg bg-white shadow-sm"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {item.imagem_url && (
                      <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={item.imagem_url}
                          alt={item.titulo}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg mb-1">
                        {item.titulo}
                      </h4>
                      {item.variacao && (
                        <div className="text-sm text-gray-600 mb-2">
                          {item.variacao.cor && (
                            <span>Cor: {item.variacao.cor}</span>
                          )}
                          {item.variacao.tamanho && (
                            <span> | Tamanho: {item.variacao.tamanho}</span>
                          )}
                        </div>
                      )}
                      <p className="text-green-600 font-bold text-lg">
                        R$ {item.preco_unitario.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                    <div className="flex items-center space-x-3">
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
                        className="w-10 h-10 p-0"
                      >
                        -
                      </Button>

                      <span className="w-12 text-center text-lg font-semibold">
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
                        className="w-10 h-10 p-0"
                      >
                        +
                      </Button>
                    </div>

                    <div className="text-right min-w-24">
                      <p className="font-bold text-lg">
                        R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
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
                        className="w-5 h-5"
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

            {/* Resumo e Frete */}
            <div className="space-y-6">
              {/* Seção de Frete */}
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Calcular Frete
                </h3>

                <div className="space-y-3">
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
                      className="bg-black hover:bg-gray-800"
                    >
                      {calculandoFrete ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Calculando...
                        </div>
                      ) : (
                        "Calcular"
                      )}
                    </Button>
                  </div>

                  {/* Barra de Progresso Frete Grátis */}
                  {totalPreco < valorParaFreteGratis && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-blue-800 font-medium">
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

                  {/* NOVO: Lista de Opções de Frete - Versão Agrupada */}
{frete && frete.opcoes_disponiveis && frete.opcoes_disponiveis.length > 0 && !frete.frete_gratis && (
  <div className="space-y-4">
    <label className="text-sm font-medium text-gray-700">
      Selecione a opção de frete:
    </label>
    
    {/* Agrupar opções por transportadora */}
    {(() => {
      const grouped = frete.opcoes_disponiveis.reduce((acc, opcao) => {
        if (!acc[opcao.nome]) {
          acc[opcao.nome] = [];
        }
        acc[opcao.nome].push(opcao);
        return acc;
      }, {} as Record<string, typeof frete.opcoes_disponiveis>);
      
      return Object.entries(grouped).map(([transportadora, opcoes]) => {
        // Encontrar a opção mais barata desta transportadora
        const cheapestOfType = [...opcoes].sort((a, b) => a.valor - b.valor)[0];
        
        return (
          <div key={transportadora} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h4 className="font-semibold text-gray-800">{transportadora}</h4>
            </div>
            <div className="divide-y">
              {opcoes.map((opcao, idx) => {
                const isSelected = frete.opcao_selecionada?.nome === opcao.nome && 
                                  frete.opcao_selecionada?.prazo === opcao.prazo &&
                                  frete.opcao_selecionada?.valor === opcao.valor;
                
                const uniqueKey = `${transportadora}-${opcao.prazo}-${opcao.valor}-${idx}`;
                const isCheapestOverall = opcao.valor === Math.min(...frete.opcoes_disponiveis!.map(o => o.valor));
                
                return (
                  <button
                    key={uniqueKey}
                    onClick={() => selecionarOpcaoFrete(opcao)}
                    className={`
                      w-full p-3 transition-all text-left hover:bg-gray-50
                      ${isSelected ? 'bg-green-50' : ''}
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">
                            {opcao.prazo}
                          </span>
                          {isCheapestOverall && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Mais barato geral
                            </span>
                          )}
                          {opcao.valor === cheapestOfType.valor && opcoes.length > 1 && !isCheapestOverall && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Mais barato {transportadora}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${isSelected ? 'text-green-600' : 'text-gray-900'}`}>
                          R$ {opcao.valor.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      });
    })()}
  </div>
)}

                  {/* Opção de Frete Grátis (se aplicável) */}
                  {frete && frete.frete_gratis && (
                    <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-800">
                            Frete Grátis
                          </span>
                        </div>
                        <span className="text-green-600 font-bold text-lg">
                          R$ 0,00
                        </span>
                      </div>
                      <p className="text-green-700 text-sm mt-2">
                        Parabéns! Você atingiu o valor mínimo para frete grátis.
                      </p>
                    </div>
                  )}

                  {/* Resumo do frete selecionado */}
                  {frete && frete.opcao_selecionada && !frete.frete_gratis && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Frete selecionado:</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-900">
                            {frete.opcao_selecionada.nome}
                          </span>
                          <span className="text-green-600 font-bold ml-2">
                            R$ {frete.opcao_selecionada.valor.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumo do Pedido */}
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Resumo do Pedido</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({totalItens} itens):</span>
                    <span>R$ {totalPreco.toFixed(2)}</span>
                  </div>

                  {!frete?.frete_gratis && totalPreco < valorParaFreteGratis && frete?.opcao_selecionada && (
                    <div className="flex justify-between text-sm">
                      <span>Frete ({frete.opcao_selecionada.nome}):</span>
                      <span>R$ {valorFrete.toFixed(2)}</span>
                    </div>
                  )}

                  {frete?.frete_gratis && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Frete Grátis
                      </span>
                      <span>R$ 0,00</span>
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">
                        R$ {totalComFrete.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="space-y-3 mt-6">
                  <Button
                    asChild
                    className="w-full bg-green-600 hover:bg-green-700 py-3 text-lg"
                  >
                    <Link href="/checkout">Finalizar Compra</Link>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="w-full py-3 text-lg"
                  >
                    Continuar Comprando
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}