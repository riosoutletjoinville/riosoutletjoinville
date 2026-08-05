// src/hooks/useCarrinho.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface ItemCarrinho {
  id: string;
  produto_id: string;
  titulo: string;
  preco_unitario: number;
  quantidade: number;
  imagem_url: string;
  variacao?: {
    cor?: string;
    tamanho?: string;
  };
  variacao_id?: string;
}

export interface OpcaoFrete {
  nome: string;
  prazo: string;
  valor: number;
  valor_formatado: string;
}

export interface DadosFrete {
  cep: string;
  opcao_selecionada?: OpcaoFrete;
  opcoes_disponiveis?: OpcaoFrete[];
  endereco?: {
    cep: string;
    logradouro: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  frete_gratis: boolean;
  valor_minimo_frete_gratis: number;
}

// Estado global
let carrinhoGlobal: ItemCarrinho[] = [];
let freteGlobal: DadosFrete | null = null;
let listeners: Array<() => void> = [];

function emitChange() {
  listeners.forEach((listener) => listener());
}

function atualizarCarrinho(novoCarrinho: ItemCarrinho[]) {
  carrinhoGlobal = novoCarrinho;
  localStorage.setItem("carrinho", JSON.stringify(novoCarrinho));
  emitChange();
}

function atualizarFrete(novoFrete: DadosFrete | null) {
  freteGlobal = novoFrete;
  localStorage.setItem("frete", JSON.stringify(novoFrete));
  emitChange();
}

export function useCarrinho() {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>(carrinhoGlobal);
  const [frete, setFrete] = useState<DadosFrete | null>(freteGlobal);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      // Carregar do localStorage
      const carrinhoSalvo = localStorage.getItem("carrinho");
      if (carrinhoSalvo) {
        try {
          carrinhoGlobal = JSON.parse(carrinhoSalvo);
          setCarrinho(carrinhoGlobal);
        } catch (error) {
          carrinhoGlobal = [];
          setCarrinho([]);
        }
      }

      const freteSalvo = localStorage.getItem("frete");
      if (freteSalvo) {
        try {
          freteGlobal = JSON.parse(freteSalvo);
          setFrete(freteGlobal);
        } catch (error) {
          freteGlobal = null;
          setFrete(null);
        }
      }

      setIsLoaded(true);
    }

    const listener = () => {
      setCarrinho([...carrinhoGlobal]);
      setFrete(freteGlobal);
    };

    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, [isLoaded]);

  // NOVO: Verificar estoque de um item específico
  const verificarEstoqueItem = useCallback(async (
    produtoId: string,
    variacaoId?: string | null,
    quantidadeDesejada?: number
  ): Promise<boolean> => {
    try {
      // Buscar produto com variações
      const { data: produto, error } = await supabase
        .from("produtos")
        .select(`
          id,
          estoque,
          variacoes:produto_variacoes(
            id,
            estoque
          )
        `)
        .eq("id", produtoId)
        .single();

      if (error || !produto) {
        console.error("Erro ao buscar produto:", error);
        return false;
      }

      let estoqueDisponivel: number;

      if (variacaoId) {
        // Produto com variação - verificar estoque da variação específica
        const variacao = produto.variacoes?.find((v: any) => v.id === variacaoId);
        estoqueDisponivel = variacao?.estoque || 0;
      } else {
        // Produto sem variação
        estoqueDisponivel = produto.estoque || 0;
      }

      // Se quantidade desejada foi fornecida, verificar se é suficiente
      if (quantidadeDesejada !== undefined) {
        return estoqueDisponivel >= quantidadeDesejada;
      }

      return estoqueDisponivel > 0;
    } catch (error) {
      console.error("Erro ao verificar estoque:", error);
      return false;
    }
  }, []);

  // NOVO: Verificar estoque de todos os itens do carrinho
  const verificarEstoqueCarrinho = useCallback(async (): Promise<{
    todosComEstoque: boolean;
    itensSemEstoque: Array<{ produto_id: string; variacao_id?: string }>;
  }> => {
    const itensSemEstoque: Array<{ produto_id: string; variacao_id?: string }> = [];
    
    for (const item of carrinhoGlobal) {
      const temEstoque = await verificarEstoqueItem(
        item.produto_id,
        item.variacao_id || null,
        item.quantidade
      );
      
      if (!temEstoque) {
        itensSemEstoque.push({
          produto_id: item.produto_id,
          variacao_id: item.variacao_id,
        });
      }
    }
    
    return {
      todosComEstoque: itensSemEstoque.length === 0,
      itensSemEstoque,
    };
  }, [verificarEstoqueItem]);

  // Funções do carrinho
  const adicionarAoCarrinho = (produto: ItemCarrinho) => {
    const produtoIdParaComparar = produto.produto_id || produto.id;

    const itemExistente = carrinhoGlobal.find((item) =>
      item.produto_id === produtoIdParaComparar &&
      item.variacao_id === produto.variacao_id
    );

    let novoCarrinho;
    if (itemExistente) {
      novoCarrinho = carrinhoGlobal.map((item) =>
        item.produto_id === produtoIdParaComparar &&
          item.variacao_id === produto.variacao_id
          ? { ...item, quantidade: item.quantidade + (produto.quantidade || 1) }
          : item
      );
    } else {
      novoCarrinho = [...carrinhoGlobal, {
        ...produto,
        quantidade: produto.quantidade || 1,
        produto_id: produtoIdParaComparar,
      }];
    }

    atualizarCarrinho(novoCarrinho);
  };

  const removerDoCarrinho = (produtoId: string, variacaoId?: string) => {
    const novoCarrinho = carrinhoGlobal.filter((item) =>
      !(item.produto_id === produtoId && item.variacao_id === variacaoId)
    );
    atualizarCarrinho(novoCarrinho);
  };

  // MODIFICADO: Agora retorna um booleano indicando se a atualização foi bem-sucedida
  const atualizarQuantidade = async (
    produtoId: string,
    variacaoId?: string,
    quantidade?: number,
  ): Promise<boolean> => {
    if (quantidade !== undefined && quantidade <= 0) {
      removerDoCarrinho(produtoId, variacaoId);
      return true;
    }

    // Verificar estoque antes de atualizar
    const temEstoque = await verificarEstoqueItem(
      produtoId,
      variacaoId || null,
      quantidade
    );

    if (!temEstoque) {
      console.warn("Estoque insuficiente para:", { produtoId, variacaoId, quantidade });
      return false;
    }

    const novoCarrinho = carrinhoGlobal.map((item) =>
      item.produto_id === produtoId && item.variacao_id === variacaoId
        ? { ...item, quantidade: quantidade || item.quantidade }
        : item
    );

    atualizarCarrinho(novoCarrinho);
    return true;
  };

  const limparCarrinho = () => {
    atualizarCarrinho([]);
    atualizarFrete(null);
  };
  
  const salvarDadosFreteNoPedido = async (
    pedidoId: string,
    dadosFrete: DadosFrete,
  ) => {
    try {
      const response = await fetch("/api/pedidos/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: pedidoId,
          frete_valor: dadosFrete.opcao_selecionada?.valor || 0,
          frete_gratis: dadosFrete.frete_gratis,
          cep_entrega: dadosFrete.cep,
          opcao_frete: dadosFrete.opcao_selecionada?.nome,
          prazo_entrega: dadosFrete.opcao_selecionada?.prazo,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error("Erro ao salvar frete:", error);
      throw error;
    }
  };

  // FUNÇÃO DE FRETE ATUALIZADA
  const calcularFrete = async (cep: string) => {
    try {
      console.log('🔄 Iniciando cálculo de frete para CEP:', cep);
      console.log('📦 Itens no carrinho:', carrinhoGlobal);
      console.log('💰 Subtotal:', totalPreco);
      
      const response = await fetch("/api/frete/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep,
          itens: carrinhoGlobal,
          subtotal: totalPreco,
        }),
      });

      const data = await response.json();
      console.log('📨 Resposta da API de frete:', data);

      if (data.success) {
        const novoFrete: DadosFrete = {
          cep,
          frete_gratis: data.frete_gratis,
          valor_minimo_frete_gratis: data.valor_minimo_frete_gratis,
          endereco: data.endereco,
          opcoes_disponiveis: data.opcoes || [],
        };

        // Selecionar a opção mais barata como padrão
        if (data.opcoes && data.opcoes.length > 0) {
          const opcoesOrdenadas = [...data.opcoes].sort((a, b) => a.valor - b.valor);
          novoFrete.opcao_selecionada = opcoesOrdenadas[0];
        }

        atualizarFrete(novoFrete);
        return data;
      } else {
        throw new Error(data.error || "Erro ao calcular frete");
      }
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      throw error;
    }
  };

  const selecionarOpcaoFrete = (opcao: OpcaoFrete) => {
    if (!freteGlobal) return;

    const freteAtualizado: DadosFrete = {
      ...freteGlobal,
      opcao_selecionada: opcao,
    };

    atualizarFrete(freteAtualizado);
  };

  const limparFrete = () => {
    atualizarFrete(null);
  };

  // NOVO: Verificar se o carrinho está válido para finalizar compra
  const podeFinalizarCompra = useCallback((): boolean => {
    // Precisa ter itens no carrinho
    if (carrinhoGlobal.length === 0) return false;
    
    // Precisa ter frete calculado (com opção selecionada OU frete grátis ativo)
    if (!freteGlobal) return false;
    if (!freteGlobal.opcao_selecionada && !freteGlobal.frete_gratis) return false;
    
    return true;
  }, []);

  // Cálculos
  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const totalPreco = carrinho.reduce(
    (acc, item) => acc + (item.preco_unitario * item.quantidade),
    0,
  );

  const valorFrete = frete?.frete_gratis
    ? 0
    : (frete?.opcao_selecionada?.valor || 0);
  const totalComFrete = totalPreco + valorFrete;

  return {
    carrinho,
    frete,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    limparCarrinho,
    calcularFrete,
    selecionarOpcaoFrete,
    salvarDadosFreteNoPedido,
    limparFrete,
    totalItens,
    totalPreco,
    valorFrete,
    totalComFrete,
    isLoaded,
    // Novos métodos
    verificarEstoqueItem,
    verificarEstoqueCarrinho,
    podeFinalizarCompra,
  };
}