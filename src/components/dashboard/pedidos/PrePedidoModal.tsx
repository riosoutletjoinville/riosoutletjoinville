// components/dashboard/pedidos/PrePedidoModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Edit } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import SelecionarClienteModal from "../SelecionarClienteModal";
import AdicionarProdutoModal from "../AdicionarProdutoModal";
import PrePedidoPreview from "./PrePedidoPreview";
import SelecionarCondicaoPagamentoModal from "@/components/dashboard/SelecionarCondicaoPagamentoModal";
import VincularPedidoAnteriorModal from "@/components/dashboard/VincularPedidoAnteriorModal";

// Adicionar interface Usuario
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  local_trabalho?: string;
  phone?: string;
}

export interface PedidoParaVincularModal {
  id: string;
  total: number;
  saldo_restante?: number;
  cliente: {
    id: string;
    tipo_cliente: "juridica" | "fisica";
    razao_social?: string;
    nome_fantasia?: string;
    cnpj?: string;
    nome?: string;
    sobrenome?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    cidade?: string;
    estado?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
  };
}

export interface Cliente {
  id: string;
  tipo_cliente: "juridica" | "fisica";
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  nome?: string;
  sobrenome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  local_trabalho?: string;
}

export interface ProdutoImagem {
  id: string;
  produto_id: string;
  url: string;
  principal: boolean;
  ordem: number;
  created_at: string;
}

export interface Produto {
  id: string;
  titulo: string;
  preco_prod: number;
  codigo: string;
  ncm: string;
  imagem_principal?: string;
  estoque: number;
  produto_imagens?: ProdutoImagem[];
}

export interface ItemPedido {
  produto: Produto;
  quantidade: number;
  preco_unitario: number;
  tamanhos: { [tamanho: string]: number };
  subtotal: number;
  desconto: number;
  filial: string;
  embargue: string;
  variacoes?: { 
    id: string;        // ID da variação no banco
    tamanho: string;   // Nome do tamanho (para exibição)
    cor?: string;      // Nome da cor (opcional)
    quantidade: number; // Quantidade desta variação
  }[];
}

export interface PedidoAnterior {
  id: string;
  total: number;
  saldo_restante: number;
  cliente: Cliente;
}

// Adicionar interface CondicaoPagamento
export interface CondicaoPagamento {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
}

export interface PrePedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pedidoData: {
    cliente: Cliente;
    itens: ItemPedido[];
    total: number;
    observacoes: string;
    condicaoPagamento: string;
    clienteId: string;
    usuarioId: string;
    localTrabalho?: string;
    condicaoPagamentoId?: string;
    parcelas?: Parcela[];
    pedidoAnterior?: PedidoAnterior;
    saldoPedidoAnterior?: number;
    valorProdutosNovos?: number;
    naoBaixarEstoque?: boolean; // 👈 ADICIONE ESTA LINHA
  }) => Promise<void>;
  usuarioSelecionado: Usuario | null;
  onUsuarioChange: (usuario: Usuario) => void;
  usuarios: Usuario[];
}

export interface Parcela {
  numero: number;
  valor: number;
  data_vencimento: string;
}

export interface CondicaoPagamentoSelecionada {
  condicaoId: string;
  parcelas: Parcela[];
  descricao: string;
}

// Interface para compatibilidade com VincularPedidoAnteriorModal
interface PedidoParaVincular {
  id: string;
  total: number;
  saldo_restante?: number;
  cliente: Cliente;
}

export default function PrePedidoModal({
  isOpen,
  onClose,
  onSave,
  usuarioSelecionado,
  onUsuarioChange,
  usuarios,
}: PrePedidoModalProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [showSelecionarCliente, setShowSelecionarCliente] = useState(false);
  const [showAdicionarProduto, setShowAdicionarProduto] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [condicaoPagamento, setCondicaoPagamento] = useState("À vista");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [localTrabalho, setLocalTrabalho] = useState("");

  const [localTrabalhoManual, setLocalTrabalhoManual] = useState("");

  const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] =
    useState<CondicaoPagamentoSelecionada | null>(null);
  const [showSelecionarCondicao, setShowSelecionarCondicao] = useState(false);

  // Adicione este estado com as outras declarações de estado
  const [condicoes, setCondicoes] = useState<CondicaoPagamento[]>([]);

  const [pedidoAnterior, setPedidoAnterior] = useState<PedidoAnterior | null>(
    null
  );
  const [showVincularPedido, setShowVincularPedido] = useState(false);
  const [saldoPedidoAnterior, setSaldoPedidoAnterior] = useState(0);

  
const [naoBaixarEstoque, setNaoBaixarEstoque] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProdutos();
      loadCondicoesPagamento();
    }
  }, [isOpen]);

  useEffect(() => {
    if (clienteSelecionado?.local_trabalho) {
      setLocalTrabalho(clienteSelecionado.local_trabalho);
      setLocalTrabalhoManual(""); // Limpar manual quando vier do cliente
    } else {
      setLocalTrabalho(
        localTrabalhoManual || usuarioSelecionado?.local_trabalho || ""
      );
    }
  }, [clienteSelecionado, usuarioSelecionado, localTrabalhoManual]);

  const calcularTotalComSaldoAnterior = () => {
    const totalProdutos = calcularTotal();
    return totalProdutos + saldoPedidoAnterior;
  };

  const handleSelectPedidoAnterior = async (
    pedido: PedidoParaVincularModal,
    saldoRestante: number
  ) => {
    try {
      // Calcular saldo remanescente automaticamente
      const saldoCalculado = await calcularSaldoPedidoAnterior(pedido.id);

      const saldoFinal =
        saldoCalculado > 0 ? saldoCalculado : saldoRestante || 0;

      setPedidoAnterior({
        id: pedido.id,
        total: pedido.total,
        saldo_restante: saldoFinal,
        cliente: pedido.cliente,
      });
      setSaldoPedidoAnterior(saldoFinal);

      console.log(
        `Saldo calculado do pedido anterior: R$ ${saldoFinal.toFixed(2)}`
      );

      Swal.fire({
        icon: "success",
        title: "Pedido vinculado!",
        text: `Saldo do pedido anterior: R$ ${saldoFinal.toFixed(2)}`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Erro ao calcular saldo do pedido anterior:", error);
      // Fallback para o saldo fornecido
      const saldoFallback = saldoRestante || 0;
      setPedidoAnterior({
        id: pedido.id,
        total: pedido.total,
        saldo_restante: saldoFallback,
        cliente: pedido.cliente,
      });
      setSaldoPedidoAnterior(saldoFallback);

      Swal.fire({
        icon: "info",
        title: "Pedido vinculado",
        text: `Saldo do pedido anterior: R$ ${saldoFallback.toFixed(2)}`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Adicione esta função para remover o pedido anterior
  const handleRemoverPedidoAnterior = () => {
    setPedidoAnterior(null);
    setSaldoPedidoAnterior(0);
    Swal.fire({
      icon: "info",
      title: "Pedido anterior removido",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Adicione esta função para carregar as condições de pagamento
  const loadCondicoesPagamento = async () => {
    try {
      const { data, error } = await supabase
        .from("condicoes_pagamento")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setCondicoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar condições de pagamento:", error);
    }
  };

  // Adicione esta função junto com as outras funções do componente
  const handleSelectCondicaoPagamento = (
    condicaoId: string,
    parcelas: Parcela[]
  ) => {
    const condicaoSelecionada = condicoes.find((c) => c.id === condicaoId);

    if (condicaoSelecionada) {
      setCondicaoPagamentoSelecionada({
        condicaoId,
        parcelas,
        descricao: condicaoSelecionada.nome,
      });
      setCondicaoPagamento(condicaoSelecionada.nome);
    } else if (condicaoId === "custom") {
      // Para condições customizadas
      setCondicaoPagamentoSelecionada({
        condicaoId: "custom",
        parcelas,
        descricao: `Personalizado - ${parcelas.length}x`,
      });
      setCondicaoPagamento(`Personalizado - ${parcelas.length}x`);
    }

    setShowSelecionarCondicao(false);
  };

  // Função para remover condição selecionada
  const handleRemoverCondicaoPagamento = () => {
    setCondicaoPagamentoSelecionada(null);
    setCondicaoPagamento("À vista");
  };

  const loadProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          `
        *,
        produto_imagens!left (*)
      `
        )
        .eq("ativo", true)
        .order("titulo");

      if (error) throw error;

      const produtosComEstoque: Produto[] = (data || []).map((produto) => {
        const produtoImagens = produto.produto_imagens as
          | ProdutoImagem[]
          | null;
        const imagemPrincipal = Array.isArray(produtoImagens)
          ? produtoImagens.find((img: ProdutoImagem) => img.principal) ||
            produtoImagens[0]
          : null;

        return {
          ...produto,
          estoque: produto.estoque || 0,
          imagem_principal: imagemPrincipal ? imagemPrincipal.url : null,
          produto_imagens: produtoImagens || [],
        };
      });

      setProdutos(produtosComEstoque);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      Swal.fire(
        "Erro",
        "Não foi possível carregar a lista de produtos",
        "error"
      );
    }
  };

  const getNomeCliente = (cliente: Cliente): string => {
    if (cliente.tipo_cliente === "juridica") {
      return cliente.nome_fantasia || cliente.razao_social || "Cliente PJ";
    } else {
      return (
        `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim() ||
        "Cliente PF"
      );
    }
  };

  const calcularTotal = () => {
    return itensPedido.reduce((total, item) => total + item.subtotal, 0);
  };

  const handleAdicionarProduto = (
  produto: Produto,
  quantidades: { [tamanho: string]: number },
  desconto: number = 0,
  filial: string = "Matriz",
  embargue: string = "Verificar com o vendedor",
  variacoes?: { id: string; tamanho: string; cor?: string; quantidade: number; }[] // 👈 NOVO
) => {
  const quantidadeTotal = Object.values(quantidades).reduce(
    (sum, qtd) => sum + qtd,
    0
  );

  if (quantidadeTotal === 0) {
    Swal.fire(
      "Atenção",
      "Selecione pelo menos uma quantidade para o produto",
      "warning"
    );
    return;
  }

  const precoComDesconto = produto.preco_prod * (1 - desconto / 100);
  const subtotal = quantidadeTotal * precoComDesconto;

  const novoItem: ItemPedido = {
    produto,
    quantidade: quantidadeTotal,
    preco_unitario: precoComDesconto,
    tamanhos: quantidades,
    subtotal,
    desconto,
    filial,
    embargue,
    variacoes: variacoes // 👈 SALVAR AS VARIAÇÕES
  };

  setItensPedido([...itensPedido, novoItem]);
  setShowAdicionarProduto(false);
};

  const handleEditarItem = (index: number) => {
    const itemParaEditar = itensPedido[index];
    setItensPedido(itensPedido.filter((_, i) => i !== index));
    setShowAdicionarProduto(true);
  };

  const handleRemoverItem = (index: number) => {
    const novosItens = [...itensPedido];
    novosItens.splice(index, 1);
    setItensPedido(novosItens);
  };

  const handleConfirmarPedido = async () => {
  if (!clienteSelecionado) {
    Swal.fire("Atenção", "Selecione um cliente para continuar", "warning");
    return;
  }

  if (!usuarioSelecionado) {
    Swal.fire("Atenção", "Selecione um usuário responsável", "warning");
    return;
  }

  if (itensPedido.length === 0) {
    Swal.fire(
      "Atenção",
      "Adicione pelo menos um produto ao pedido",
      "warning"
    );
    return;
  }

  setLoading(true);
  try {
    const localTrabalhoFinal =
      clienteSelecionado.local_trabalho ||
      localTrabalhoManual ||
      usuarioSelecionado.local_trabalho ||
      "";

    const pedidoData = {
      cliente: clienteSelecionado,
      itens: itensPedido,
      total: calcularTotalComSaldoAnterior(),
      observacoes,
      condicaoPagamento,
      clienteId: clienteSelecionado.id,
      usuarioId: usuarioSelecionado.id,
      localTrabalho: localTrabalhoFinal,
      condicaoPagamentoId:
        condicaoPagamentoSelecionada?.condicaoId === "custom"
          ? undefined
          : condicaoPagamentoSelecionada?.condicaoId,
      parcelas: condicaoPagamentoSelecionada?.parcelas || [],
      pedidoAnterior: pedidoAnterior || undefined,
      saldoPedidoAnterior: saldoPedidoAnterior,
      valorProdutosNovos: calcularTotal(),
      naoBaixarEstoque: naoBaixarEstoque, // 👈 ADICIONE ESTA LINHA
    };

    await onSave(pedidoData);

    // Limpar estado após salvar
    setItensPedido([]);
    setClienteSelecionado(null);
    setCondicaoPagamentoSelecionada(null);
    setCondicaoPagamento("À vista");
    setObservacoes("");
    setLocalTrabalho("");
    setLocalTrabalhoManual("");
    setPedidoAnterior(null);
    setSaldoPedidoAnterior(0);
    setNaoBaixarEstoque(false); // 👈 RESETAR A FLAG
    onClose();
  } catch (error) {
    console.error("Erro ao confirmar pedido:", error);
    Swal.fire("Erro", "Não foi possível confirmar o pedido", "error");
  } finally {
    setLoading(false);
  }
};

  const handleCancelPreview = () => {
    setShowPreview(false);
  };

  const calcularSaldoPedidoAnterior = async (
    pedidoAnteriorId: string
  ): Promise<number> => {
    try {
      // Buscar todas as parcelas do pedido anterior
      const { data: parcelas, error } = await supabase
        .from("pre_pedido_parcelas")
        .select("valor_parcela, status")
        .eq("pre_pedido_id", pedidoAnteriorId)
        .eq("status", "pendente");

      if (error) throw error;

      // Calcular saldo remanescente (soma das parcelas pendentes)
      const saldoRemanescente =
        parcelas?.reduce((total, parcela) => {
          return total + (parcela.valor_parcela || 0);
        }, 0) || 0;

      console.log(
        `Saldo calculado para pedido ${pedidoAnteriorId}: R$ ${saldoRemanescente.toFixed(
          2
        )}`
      );
      return saldoRemanescente;
    } catch (error) {
      console.error("Erro ao calcular saldo do pedido anterior:", error);
      return 0;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Criar Pré-Pedido</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seção Cliente */}
          <div className="w-full">
            <div className="mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Cliente
                </h3>
                {clienteSelecionado && (
                  <button
                    onClick={() => setShowSelecionarCliente(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    Alterar
                  </button>
                )}
              </div>

              {clienteSelecionado ? (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {getNomeCliente(clienteSelecionado)}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {clienteSelecionado.tipo_cliente === "juridica"
                        ? clienteSelecionado.cnpj
                        : clienteSelecionado.cpf}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
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
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {clienteSelecionado.email}
                    </p>
                    {clienteSelecionado.cidade && clienteSelecionado.estado && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
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
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {clienteSelecionado.cidade}/{clienteSelecionado.estado}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSelecionarCliente(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-sm"
                >
                  Selecionar Cliente
                </button>
              )}
            </div>
          </div>

          {/* Selecionar Vendedor */}
          <div className="w-full">
            <div className="mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Vendedor
              </h3>

              <div className="space-y-3">
                <select
                  value={usuarioSelecionado?.id || ""}
                  onChange={(e) => {
                    const usuario = usuarios.find(
                      (u) => u.id === e.target.value
                    );
                    if (usuario && onUsuarioChange) {
                      onUsuarioChange(usuario);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Selecione o vendedor</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome || usuario.email} ({usuario.tipo})
                    </option>
                  ))}
                </select>

                {usuarioSelecionado && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Vendedor selecionado:{" "}
                      <strong>
                        {usuarioSelecionado.nome || usuarioSelecionado.email}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Local de Trabalho */}
          <div className="w-full">
            <div className="mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Local de Trabalho
              </h3>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={
                    clienteSelecionado?.local_trabalho
                      ? clienteSelecionado.local_trabalho
                      : "Digite o local de trabalho (opcional)"
                  }
                  value={localTrabalhoManual}
                  onChange={(e) => setLocalTrabalhoManual(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={!!clienteSelecionado?.local_trabalho}
                />

                {clienteSelecionado?.local_trabalho ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Usando local do cadastro do cliente:{" "}
                      <strong>{clienteSelecionado.local_trabalho}</strong>
                    </span>
                  </div>
                ) : usuarioSelecionado?.local_trabalho &&
                  !localTrabalhoManual ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Local padrão do vendedor:{" "}
                      <strong>{usuarioSelecionado.local_trabalho}</strong>
                    </span>
                  </div>
                ) : localTrabalhoManual ? (
                  <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>
                      Local personalizado:{" "}
                      <strong>{localTrabalhoManual}</strong>
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Selecionar Vincular Pedido */}
          <div className="w-full">
            <div className="mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Vincular Pedido Anterior
                </h3>
              </div>

              {pedidoAnterior ? (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 mb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Pedido #{pedidoAnterior.id}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                          <span className="font-medium">Saldo a incluir:</span>
                          R$ {pedidoAnterior.saldo_restante.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="font-medium">Total original:</span>
                          R$ {pedidoAnterior.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowVincularPedido(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-1"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Alterar
                      </button>
                      <button
                        onClick={handleRemoverPedidoAnterior}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1"
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
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowVincularPedido(true)}
                    disabled={!clienteSelecionado}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium shadow-sm flex items-center justify-center gap-2"
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    Vincular Pedido Anterior
                  </button>

                  {!clienteSelecionado && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Selecione um cliente primeiro para ver pedidos anteriores
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seção Produtos */}
        <div className="mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Produtos
            </h3>
            <button
              onClick={() => setShowAdicionarProduto(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-green-700"
            >
              <Plus size={20} className="mr-2" />
              Adicionar Produto
            </button>
          </div>

          {itensPedido.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum produto adicionado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itensPedido.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{item.produto.titulo}</p>
                          <p className="text-sm text-gray-600">
                            Código: {item.produto.codigo} | NCM:{" "}
                            {item.produto.ncm}
                          </p>
                          <p className="text-sm">
                            {Object.entries(item.tamanhos)
                              .filter(([_, qtd]) => qtd > 0)
                              .map(([tamanho, qtd]) => `${tamanho}: ${qtd}`)
                              .join(", ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            R$ {item.subtotal.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            R$ {item.preco_unitario.toFixed(2)} ×{" "}
                            {item.quantidade}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          Desconto: {item.desconto}% | Filial: {item.filial} |
                          Embargue: {item.embargue}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditarItem(index)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoverItem(index)}
                        className="text-red-600 hover:text-red-800"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

<div className="mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-100">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="checkbox"
          id="naoBaixarEstoque"
          checked={naoBaixarEstoque}
          onChange={(e) => setNaoBaixarEstoque(e.target.checked)}
          className="w-5 h-5 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
        />
      </div>
      <label htmlFor="naoBaixarEstoque" className="flex items-center gap-2 cursor-pointer">
        <svg
          className="w-5 h-5 text-amber-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <span className="font-medium text-gray-800">Não baixar estoque</span>
      </label>
    </div>
    <div className="text-sm text-gray-500">
      {naoBaixarEstoque ? (
        <span className="flex items-center gap-1 text-amber-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          O estoque não será baixado
        </span>
      ) : (
        <span className="flex items-center gap-1 text-green-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          O estoque será baixado automaticamente
        </span>
      )}
    </div>
  </div>
  
  {/* Informação adicional */}
  {naoBaixarEstoque && (
    <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
      <p className="text-sm text-amber-800 flex items-start gap-2">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          <strong>Importante:</strong> Ao marcar esta opção, o estoque dos produtos 
          <strong> NÃO será baixado</strong> ao confirmar este pré-pedido. 
          Utilize esta opção para orçamentos, pré-reservas ou pedidos que ainda não estão confirmados.
        </span>
      </p>
    </div>
  )}
</div>
        {/* Condição de Pagamento e Observações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Condição de Pagamento */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Condição de Pagamento
            </label>

            {condicaoPagamentoSelecionada ? (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {condicaoPagamentoSelecionada.parcelas.length}{" "}
                        parcela(s)
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {condicaoPagamentoSelecionada.descricao}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowSelecionarCondicao(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-1"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Alterar
                    </button>
                    <button
                      onClick={handleRemoverCondicaoPagamento}
                      className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1"
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
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSelecionarCondicao(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-sm flex items-center justify-center gap-2"
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
                Selecionar Condição de Pagamento
              </button>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Observações
            </label>

            <div className="relative">
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 h-32 resize-vertical focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                placeholder="Digite as observações do pedido (pressione Enter para nova linha)"
                rows={4}
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                {observacoes.length}/500
              </div>
            </div>

            {/* Dica opcional */}
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Informações adicionais sobre o pedido
            </p>
          </div>
        </div>

        {/* Total */}
        {itensPedido.length > 0 && (
          <div className="border-t pt-4 mb-6">
            <div className="space-y-2">
              {saldoPedidoAnterior > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Total dos produtos:</span>
                    <span>R$ {calcularTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Saldo pedido anterior:</span>
                    <span>R$ {saldoPedidoAnterior.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>R$ {calcularTotalComSaldoAnterior().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={() => setShowPreview(true)}
            disabled={
              !clienteSelecionado ||
              !usuarioSelecionado ||
              itensPedido.length === 0 ||
              loading
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save size={20} className="mr-2" />
            Visualizar Pré-Pedido
          </button>
        </div>
      </div>

      {/* Modais auxiliares */}
      {showSelecionarCliente && (
        <SelecionarClienteModal
          isOpen={showSelecionarCliente}
          onSelect={(cliente) => {
            setClienteSelecionado(cliente);
            setShowSelecionarCliente(false);
          }}
          onClose={() => setShowSelecionarCliente(false)}
        />
      )}

      {showAdicionarProduto && (
        <AdicionarProdutoModal
          isOpen={showAdicionarProduto}
          produtos={produtos}
          onAdd={handleAdicionarProduto}
          onClose={() => setShowAdicionarProduto(false)}
        />
      )}

      {showSelecionarCondicao && (
        <SelecionarCondicaoPagamentoModal
          isOpen={showSelecionarCondicao}
          onClose={() => setShowSelecionarCondicao(false)}
          onSelect={handleSelectCondicaoPagamento}
          valorTotal={calcularTotalComSaldoAnterior()}
        />
      )}

      {showVincularPedido && clienteSelecionado && (
        <VincularPedidoAnteriorModal
          isOpen={showVincularPedido}
          onClose={() => setShowVincularPedido(false)}
          onSelect={handleSelectPedidoAnterior}
          clienteId={clienteSelecionado.id}
        />
      )}

      {showPreview && clienteSelecionado && (
        <PrePedidoPreview
          isOpen={showPreview}
          cliente={clienteSelecionado}
          itens={itensPedido}
          total={calcularTotalComSaldoAnterior()}
          observacoes={observacoes}
          condicaoPagamento={condicaoPagamento}
          usuario={usuarioSelecionado}
          localTrabalho={
            localTrabalho || usuarioSelecionado?.local_trabalho || ""
          }
          pedidoAnterior={
            pedidoAnterior
              ? {
                  id: pedidoAnterior.id,
                  saldo_restante: pedidoAnterior.saldo_restante,
                }
              : undefined
          }
          saldoPedidoAnterior={saldoPedidoAnterior}
          onClose={() => setShowPreview(false)}
          onConfirm={handleConfirmarPedido}
          onEdit={() => setShowPreview(false)}
          onCancel={handleCancelPreview}
        />
      )}
    </div>
  );
}
