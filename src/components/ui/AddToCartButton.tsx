// components/ui/AddToCartButton.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useCarrinho } from "@/hooks/useCarrinho";
import { ShoppingCart, Check, X } from "lucide-react";
import { Button } from "./button";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  produto: {
    id: string;
    titulo: string;
    preco: number;
    estoque: number;
    imagens?: Array<{ url: string }>;
    variacoes?: Array<{
      id: string;
      estoque: number;
      preco?: number | null;
      cor?: {
        nome: string;
        codigo_hex: string;
      } | null;
      tamanho?: {
        nome: string;
      } | null;
    }>;
  };
}

export function AddToCartButton({ produto }: AddToCartButtonProps) {
  const router = useRouter();
  const [quantidade, setQuantidade] = useState(1);
  const [corSelecionada, setCorSelecionada] = useState<string>("");
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<string>("");
  const [adicionando, setAdicionando] = useState(false);
  const { adicionarAoCarrinho } = useCarrinho();

  const temVariacoes = produto.variacoes && produto.variacoes.length > 0;

  // Agrupar variações por cor de forma correta
  const cores = useMemo(() => {
    if (!temVariacoes) return [];

    const coresMap = new Map();
    produto.variacoes?.forEach((variacao) => {
      if (variacao.cor?.nome) {
        const corNome = variacao.cor.nome;
        if (!coresMap.has(corNome)) {
          coresMap.set(corNome, {
            id: variacao.id,
            nome: variacao.cor.nome,
            codigo_hex: variacao.cor.codigo_hex,
            temEstoque:
              produto.variacoes?.some(
                (v) => v.cor?.nome === corNome && v.estoque > 0,
              ) || false,
          });
        }
      }
    });
    return Array.from(coresMap.values());
  }, [produto.variacoes, temVariacoes]);

  // Obter todas as variações da cor selecionada
  const variacoesDaCor = useMemo(() => {
    if (!corSelecionada || !temVariacoes) return [];

    return (
      produto.variacoes?.filter((v) => v.cor?.nome === corSelecionada) || []
    );
  }, [corSelecionada, produto.variacoes, temVariacoes]);

  // Ordenar tamanhos
  const tamanhosOrdenados = useMemo(() => {
    return [...variacoesDaCor].sort((a, b) => {
      const tamanhoA = a.tamanho?.nome || "";
      const tamanhoB = b.tamanho?.nome || "";

      const numA = parseFloat(tamanhoA);
      const numB = parseFloat(tamanhoB);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      return tamanhoA.localeCompare(tamanhoB);
    });
  }, [variacoesDaCor]);

  // Estoque disponível da variação selecionada - CORRIGIDO
  const variacaoAtual = useMemo(() => {
    if (!variacaoSelecionada) return null;
    return produto.variacoes?.find((v) => v.id === variacaoSelecionada);
  }, [variacaoSelecionada, produto.variacoes]);

  const estoqueDisponivel = variacaoAtual?.estoque || 0;

  // Preço da variação selecionada (se tiver preço específico)
  const precoAtual = useMemo(() => {
    if (variacaoAtual?.preco && variacaoAtual.preco > 0) {
      return variacaoAtual.preco;
    }
    return produto.preco;
  }, [variacaoAtual, produto.preco]);

  // Reset quantidade quando mudar a variação
  useEffect(() => {
    setQuantidade(1);
  }, [variacaoSelecionada]);

  const handleCorClick = (corNome: string) => {
    if (corSelecionada === corNome) {
      setCorSelecionada("");
      setVariacaoSelecionada("");
    } else {
      setCorSelecionada(corNome);
      setVariacaoSelecionada("");
    }
  };

  const handleVariacaoClick = (variacaoId: string) => {
    setVariacaoSelecionada(variacaoId);
  };

  const handleAdicionar = async () => {
    if (temVariacoes) {
      if (!corSelecionada) {
        await Swal.fire({
          icon: "warning",
          title: "Selecione uma cor",
          text: "Por favor, escolha uma cor para este produto.",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        });
        return;
      }
      if (!variacaoSelecionada) {
        await Swal.fire({
          icon: "warning",
          title: "Selecione um tamanho",
          text: "Por favor, escolha um tamanho para este produto.",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "OK",
        });
        return;
      }
    }

    // Verificar estoque novamente antes de adicionar
    if (quantidade > estoqueDisponivel) {
      await Swal.fire({
        icon: "error",
        title: "Estoque insuficiente",
        text: `Apenas ${estoqueDisponivel} unidade(s) disponível(eis) para esta variação.`,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });
      return;
    }

    setAdicionando(true);

    const variacao = variacaoSelecionada
      ? produto.variacoes?.find((v) => v.id === variacaoSelecionada)
      : undefined;

    const itemCarrinho = {
      id: variacaoSelecionada || produto.id,
      produto_id: produto.id,
      titulo: produto.titulo,
      preco_unitario: precoAtual,
      quantidade: quantidade,
      imagem_url: produto.imagens?.[0]?.url || "",
      variacao_id: variacaoSelecionada || undefined,
      variacao: variacao
        ? {
            cor: variacao.cor?.nome,
            tamanho: variacao.tamanho?.nome,
          }
        : undefined,
    };

    adicionarAoCarrinho(itemCarrinho);
    setAdicionando(false);

    // Obter informações da variação para exibir no modal
    const variacaoInfo = variacaoSelecionada
      ? produto.variacoes?.find((v) => v.id === variacaoSelecionada)
      : null;
    
    const tamanhoTexto = variacaoInfo?.tamanho?.nome 
      ? ` - Tamanho ${variacaoInfo.tamanho.nome}` 
      : "";
    
    const corTexto = variacaoInfo?.cor?.nome 
      ? ` - Cor ${variacaoInfo.cor.nome}` 
      : (corSelecionada ? ` - Cor ${corSelecionada}` : "");

    // Exibir SweetAlert2 com opções
    const result = await Swal.fire({
      title: "Produto adicionado!",
      html: `
        <div style="text-align: left; margin: 16px 0;">
          <p style="margin-bottom: 12px; font-size: 16px;">
            <strong>${produto.titulo}</strong>
            ${tamanhoTexto}${corTexto}
          </p>
          <p style="color: #10b981; font-size: 24px; font-weight: bold; margin: 8px 0;">
            ${quantidade}x R$ ${precoAtual.toFixed(2)}
          </p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 8px;">
            Total: R$ ${(quantidade * precoAtual).toFixed(2)}
          </p>
        </div>
      `,
      icon: "success",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ver Carrinho",
      cancelButtonText: "Continuar Comprando",
      backdrop: true,
      allowOutsideClick: false,
      customClass: {
        popup: "rounded-xl",
        title: "text-xl font-bold",
        confirmButton: "bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors",
        cancelButton: "bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors",
      },
    });

    // Redirecionar com base na escolha
    if (result.isConfirmed) {
      router.push("/carrinho");
    } else {
       window.location.reload(); // Recarregar para atualizar estoque
    }
  };

  // Verificar se a variação selecionada está disponível
  const isVariacaoDisponivel = variacaoSelecionada && estoqueDisponivel > 0;
  const isBotaoDisabled = adicionando || 
    (temVariacoes && !isVariacaoDisponivel) ||
    (temVariacoes && !variacaoSelecionada) ||
    (!temVariacoes && produto.estoque <= 0);

  // Texto do botão baseado no estado
  const getButtonText = () => {
    if (adicionando) {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          Adicionando...
        </div>
      );
    }
    
    if (temVariacoes && !corSelecionada) {
      return "Selecione uma cor";
    }
    
    if (temVariacoes && corSelecionada && !variacaoSelecionada) {
      return "Selecione um tamanho";
    }
    
    if (temVariacoes && variacaoSelecionada && estoqueDisponivel <= 0) {
      return "Variação Esgotada";
    }
    
    if (!temVariacoes && produto.estoque <= 0) {
      return "Produto Esgotado";
    }
    
    return (
      <div className="flex items-center justify-center gap-2">
        <ShoppingCart className="w-5 h-5" />
        Adicionar ao Carrinho
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Cores */}
      {cores.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Cor:
            {corSelecionada && (
              <span className="ml-2 text-amber-600 font-semibold">
                {corSelecionada}
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-3">
            {cores.map((cor) => (
              <button
                key={cor.nome}
                onClick={() => handleCorClick(cor.nome)}
                disabled={!cor.temEstoque}
                className={`
                  relative group
                  ${!cor.temEstoque ? "opacity-50 cursor-not-allowed" : ""}
                `}
                title={`${cor.nome}${!cor.temEstoque ? " (esgotado)" : ""}`}
              >
                <div
                  className={`
                    w-10 h-10 rounded-full border-2 transition-all
                    ${
                      corSelecionada === cor.nome
                        ? "ring-2 ring-amber-500 ring-offset-2 border-white"
                        : "border-gray-300 hover:border-amber-300"
                    }
                    ${!cor.temEstoque ? "grayscale" : ""}
                  `}
                  style={{ backgroundColor: cor.codigo_hex }}
                />
                {!cor.temEstoque && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0.5 h-8 bg-red-500 rotate-45 transform origin-center" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seletor de Tamanhos */}
      {corSelecionada && tamanhosOrdenados.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Tamanho:
            {variacaoSelecionada && (
              <span className="ml-2 text-amber-600 font-semibold">
                {
                  tamanhosOrdenados.find((v) => v.id === variacaoSelecionada)
                    ?.tamanho?.nome
                }
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-2">
            {tamanhosOrdenados.map((variacao) => (
              <button
                key={variacao.id}
                onClick={() => handleVariacaoClick(variacao.id)}
                disabled={variacao.estoque <= 0}
                className={`
                  px-4 py-2 border rounded-md text-sm font-medium transition-all min-w-[60px]
                  ${
                    variacaoSelecionada === variacao.id
                      ? "bg-amber-600 text-white border-amber-600"
                      : variacao.estoque > 0
                        ? "border-gray-300 hover:border-amber-300 hover:bg-amber-50"
                        : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                {variacao.tamanho?.nome}
                {variacao.estoque <= 0 && (
                  <span className="ml-1 text-xs">(esgotado)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seletor de Quantidade - Só mostra se tem variação selecionada ou produto sem variação */}
      {((temVariacoes && variacaoSelecionada && estoqueDisponivel > 0) || 
        (!temVariacoes && produto.estoque > 0)) && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Quantidade:
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-lg">
              <button
                type="button"
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                disabled={quantidade <= 1}
                className="px-4 py-2 border-r hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
              >
                -
              </button>
              <span className="px-6 py-2 text-lg font-medium min-w-[80px] text-center">
                {quantidade}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantidade(Math.min(estoqueDisponivel, quantidade + 1))
                }
                disabled={quantidade >= estoqueDisponivel}
                className="px-4 py-2 border-l hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
              >
                +
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {estoqueDisponivel} disponível(eis)
            </span>
          </div>
        </div>
      )}

      {/* Botão Adicionar */}
      <Button
        onClick={handleAdicionar}
        disabled={isBotaoDisabled}
        className="w-full bg-black hover:bg-gray-800 text-white py-3 text-lg font-semibold"
        size="lg"
      >
        {getButtonText()}
      </Button>

      {/* Info de estoque baixo - mostra apenas para variação selecionada */}
      {temVariacoes && variacaoSelecionada && estoqueDisponivel > 0 && estoqueDisponivel <= 3 && (
        <p className="text-sm text-amber-600 text-center animate-pulse">
          ⚡ Apenas {estoqueDisponivel}{" "}
          {estoqueDisponivel === 1 ? "unidade" : "unidades"} em estoque para esta variação!
        </p>
      )}

      {!temVariacoes && produto.estoque > 0 && produto.estoque <= 3 && (
        <p className="text-sm text-amber-600 text-center animate-pulse">
          ⚡ Apenas {produto.estoque}{" "}
          {produto.estoque === 1 ? "unidade" : "unidades"} em estoque!
        </p>
      )}
    </div>
  );
}