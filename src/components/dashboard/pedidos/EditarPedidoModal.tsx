// components/dashboard/EditarPedidoModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save } from "lucide-react"; // Removidos FileText e Calendar
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import AdicionarProdutoModal from "../AdicionarProdutoModal";
import { Cliente, ItemPedido, Produto, Parcela } from "./PrePedidoModal";
import SelecionarCondicaoPagamentoModal from "../SelecionarCondicaoPagamentoModal";
import VincularPedidoAnteriorModal from "../VincularPedidoAnteriorModal";

export interface PedidoBase {
  id: string;
  total: number;
  observacoes?: string;
  condicao_pagamento?: string;
  itens?: ItemPedido[];
  pedido_itens?: ItemPedido[];
  pedido_anterior_id?: string;
  saldo_pedido_anterior?: number;
  valor_produtos_novos?: number;
  condicao_pagamento_id?: string;
}

export interface PedidoAnterior {
  id: string;
  total: number;
  saldo_restante: number;
  cliente: Cliente;
}

export interface CondicaoPagamentoSelecionada {
  condicaoId: string;
  parcelas: Parcela[];
  descricao: string;
}

export interface EditarPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pedidoData: {
    itens: ItemPedido[];
    total: number;
    observacoes: string;
    condicaoPagamento: string;
    condicaoPagamentoId?: string;
    parcelas?: Parcela[];
    pedidoAnterior?: PedidoAnterior;
    saldoPedidoAnterior?: number;
    valorProdutosNovos?: number;
  }) => Promise<void>;
  pedido: PedidoBase & {
    cliente:
      | (Cliente & { tipo_cliente: "juridica" | "fisica" })
      | {
          razao_social?: string;
          nome_fantasia?: string;
          cnpj?: string;
          nome?: string;
          sobrenome?: string;
          cpf?: string;
          tipo_cliente?: "juridica" | "fisica";
        }
      | null;
  };
}

export default function EditarPedidoModal({
  isOpen,
  onClose,
  onSave,
  pedido,
}: EditarPedidoModalProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [showAdicionarProduto, setShowAdicionarProduto] = useState(false);
  const [condicaoPagamento, setCondicaoPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  // Novos estados para parcelas e pedido anterior
  const [condicaoPagamentoSelecionada, setCondicaoPagamentoSelecionada] =
    useState<CondicaoPagamentoSelecionada | null>(null);
  const [showSelecionarCondicao, setShowSelecionarCondicao] = useState(false);
  const [pedidoAnterior, setPedidoAnterior] = useState<PedidoAnterior | null>(
    null
  );
  const [showVincularPedido, setShowVincularPedido] = useState(false);
  const [saldoPedidoAnterior, setSaldoPedidoAnterior] = useState(0);
  const [parcelasExistentes, setParcelasExistentes] = useState<Parcela[]>([]);

  // Função para carregar parcelas existentes
  const loadParcelasExistentes = async (prePedidoId: string) => {
    try {
      const { data, error } = await supabase
        .from("pre_pedido_parcelas")
        .select("*")
        .eq("pre_pedido_id", prePedidoId)
        .order("numero_parcela", { ascending: true });

      if (error) throw error;

      const parcelas: Parcela[] = (data || []).map((parcela) => ({
        numero: parcela.numero_parcela,
        valor: parcela.valor_parcela,
        data_vencimento: parcela.data_vencimento,
      }));

      setParcelasExistentes(parcelas);
    } catch (error) {
      console.error("Erro ao carregar parcelas:", error);
    }
  };

  // Função para carregar dados do pedido anterior
  const loadPedidoAnterior = async (pedidoAnteriorId: string) => {
    try {
      const { data, error } = await supabase
        .from("pre_pedidos")
        .select(
          `
          *,
          cliente:clientes(*)
        `
        )
        .eq("id", pedidoAnteriorId)
        .single();

      if (error) throw error;

      if (data) {
        setPedidoAnterior({
          id: data.id,
          total: data.total,
          saldo_restante: data.saldo_restante || 0,
          cliente: data.cliente,
        });
        setSaldoPedidoAnterior(data.saldo_restante || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar pedido anterior:", error);
    }
  };

  const formatarItensPedido = (itensOriginais: ItemPedido[]) => {
    const itensFormatados: ItemPedido[] = [];

    itensOriginais.forEach((item) => {
      if (item.tamanhos && Object.keys(item.tamanhos).length > 0) {
        Object.entries(item.tamanhos).forEach(([tamanho, quantidade]) => {
          if (quantidade > 0) {
            itensFormatados.push({
              ...item,
              quantidade: quantidade,
              tamanhos: { [tamanho]: quantidade },
              subtotal: item.preco_unitario * quantidade,
            });
          }
        });
      } else {
        itensFormatados.push(item);
      }
    });

    return itensFormatados;
  };

  const agruparItensParaSalvar = (itens: ItemPedido[]) => {
    const itensAgrupados: { [key: string]: ItemPedido } = {};

    itens.forEach((item) => {
      const produtoId = item.produto.id;

      if (!itensAgrupados[produtoId]) {
        itensAgrupados[produtoId] = {
          ...item,
          tamanhos: { ...item.tamanhos },
        };
      } else {
        const itemExistente = itensAgrupados[produtoId];

        Object.entries(item.tamanhos).forEach(([tamanho, quantidade]) => {
          itemExistente.tamanhos[tamanho] =
            (itemExistente.tamanhos[tamanho] || 0) + quantidade;
        });

        const quantidadeTotal = Object.values(itemExistente.tamanhos).reduce(
          (sum, qtd) => sum + qtd,
          0
        );
        itemExistente.quantidade = quantidadeTotal;
        itemExistente.subtotal = itemExistente.preco_unitario * quantidadeTotal;
      }
    });

    return Object.values(itensAgrupados);
  };

  useEffect(() => {
    const loadCondicaoPagamento = async (condicaoPagamentoId?: string) => {
      if (!condicaoPagamentoId) return;

      try {
        const { data, error } = await supabase
          .from("condicoes_pagamento")
          .select("*")
          .eq("id", condicaoPagamentoId)
          .single();

        if (error) throw error;

        if (data) {
          setCondicaoPagamentoSelecionada({
            condicaoId: data.id,
            parcelas: parcelasExistentes,
            descricao: data.nome,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar condição de pagamento:", error);
      }
    };

    if (isOpen && pedido) {
      loadProdutosComEstoque();

      let itensOriginais: ItemPedido[] = [];

      if ("itens" in pedido) {
        // É um PrePedido
        itensOriginais = pedido.itens || [];

        // Carregar dados adicionais do pré-pedido
        if (pedido.id) {
          loadParcelasExistentes(pedido.id);
        }
        if (pedido.pedido_anterior_id) {
          loadPedidoAnterior(pedido.pedido_anterior_id);
        }
        if (pedido.condicao_pagamento_id) {
          loadCondicaoPagamento(pedido.condicao_pagamento_id);
        }
        if (pedido.saldo_pedido_anterior) {
          setSaldoPedidoAnterior(pedido.saldo_pedido_anterior);
        }
      } else {
        // É um Pedido
        itensOriginais = pedido.pedido_itens || [];
      }

      setItensPedido(formatarItensPedido(itensOriginais));
      setCondicaoPagamento(pedido.condicao_pagamento || "À vista");
      setObservacoes(pedido.observacoes || "");
    }
  }, [isOpen, pedido, parcelasExistentes]); // Adicionada dependência parcelasExistentes

  const loadProdutosComEstoque = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .order("titulo");

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      Swal.fire("Erro", "Não foi possível carregar os produtos", "error");
    }
  };

  const calcularTotalProdutos = (): number => {
    return itensPedido.reduce(
      (total: number, item: ItemPedido) => total + item.subtotal,
      0
    );
  };

  const calcularTotalComSaldoAnterior = (): number => {
    const totalProdutos = calcularTotalProdutos();
    return totalProdutos + saldoPedidoAnterior;
  };

  const handleAdicionarProduto = (
    produto: Produto,
    quantidades: { [tamanho: string]: number },
    desconto: number = 0,
    filial: string = "Matriz",
    embargue: string = "30 dias"
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
    };

    setItensPedido([...itensPedido, novoItem]);
    setShowAdicionarProduto(false);
  };

  const handleRemoverItem = (index: number) => {
    const novosItens = [...itensPedido];
    novosItens.splice(index, 1);
    setItensPedido(novosItens);
  };

  const handleSelectCondicaoPagamento = (
    condicaoId: string,
    parcelas: Parcela[]
  ) => {
    setCondicaoPagamentoSelecionada({
      condicaoId,
      parcelas,
      descricao:
        condicaoId === "custom"
          ? `Personalizado - ${parcelas.length}x`
          : "Condição Selecionada",
    });
    setCondicaoPagamento(
      condicaoId === "custom"
        ? `Personalizado - ${parcelas.length}x`
        : "Condição Selecionada"
    );
    setShowSelecionarCondicao(false);
  };

  const handleRemoverCondicaoPagamento = () => {
    setCondicaoPagamentoSelecionada(null);
    setCondicaoPagamento("À vista");
    setParcelasExistentes([]);
  };

  const handleSelectPedidoAnterior = async (
    pedido: PedidoAnterior,
    saldoRestante: number
  ) => {
    try {
      setPedidoAnterior({
        id: pedido.id,
        total: pedido.total,
        saldo_restante: saldoRestante,
        cliente: pedido.cliente,
      });
      setSaldoPedidoAnterior(saldoRestante);
      setShowVincularPedido(false);
    } catch (error) {
      console.error("Erro ao vincular pedido anterior:", error);
    }
  };

  const handleRemoverPedidoAnterior = () => {
    setPedidoAnterior(null);
    setSaldoPedidoAnterior(0);
  };

  const handleSalvar = async () => {
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
      // Agrupa os itens por produto antes de salvar
      const itensAgrupados = agruparItensParaSalvar(itensPedido);
      const totalProdutos = calcularTotalProdutos();

      await onSave({
        itens: itensAgrupados,
        total: calcularTotalComSaldoAnterior(),
        observacoes,
        condicaoPagamento,
        condicaoPagamentoId:
          condicaoPagamentoSelecionada?.condicaoId === "custom"
            ? undefined
            : condicaoPagamentoSelecionada?.condicaoId,
        parcelas: condicaoPagamentoSelecionada?.parcelas || parcelasExistentes,
        pedidoAnterior: pedidoAnterior || undefined,
        saldoPedidoAnterior: saldoPedidoAnterior,
        valorProdutosNovos: totalProdutos,
      });
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      Swal.fire("Erro", "Não foi possível salvar as alterações", "error");
    } finally {
      setLoading(false);
    }
  };

  const getNomeCliente = (
    cliente: EditarPedidoModalProps["pedido"]["cliente"]
  ) => {
    if (!cliente) return "Cliente não encontrado";

    if (cliente.tipo_cliente === "juridica") {
      return cliente.razao_social || cliente.nome_fantasia || "Cliente PJ";
    } else {
      return (
        `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim() ||
        "Cliente PF"
      );
    }
  };

  if (!isOpen || !pedido) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Editar Pedido #{pedido.id}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Informações do Cliente */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Cliente</h3>
          {pedido.cliente ? (
            <div>
              <p className="font-semibold">{getNomeCliente(pedido.cliente)}</p>
              <p className="text-sm text-gray-600">
                {pedido.cliente.tipo_cliente === "juridica"
                  ? pedido.cliente.cnpj
                  : pedido.cliente.cpf}
              </p>
            </div>
          ) : (
            <p className="text-red-600">Cliente não encontrado</p>
          )}
        </div>

        {/* Pedido Anterior Vinculado */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Vincular Pedido Anterior</h3>
          {pedidoAnterior ? (
            <div className="p-3 bg-blue-50 rounded-md mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">Pedido: {pedidoAnterior.id}</p>
                  <p className="text-sm text-gray-600">
                    Saldo a incluir: R${" "}
                    {pedidoAnterior.saldo_restante.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Total original: R$ {pedidoAnterior.total.toFixed(2)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowVincularPedido(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Alterar
                  </button>
                  <button
                    onClick={handleRemoverPedidoAnterior}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowVincularPedido(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Vincular Pedido Anterior
            </button>
          )}
        </div>

        {/* Condição de Pagamento */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Condição de Pagamento</h3>
          {condicaoPagamentoSelecionada || parcelasExistentes.length > 0 ? (
            <div className="p-3 bg-gray-50 rounded-md mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {condicaoPagamentoSelecionada?.descricao ||
                      condicaoPagamento}
                  </p>
                  <p className="text-sm text-gray-600">
                    {condicaoPagamentoSelecionada?.parcelas.length ||
                      parcelasExistentes.length}{" "}
                    parcela(s)
                  </p>

                  {/* Exibir parcelas */}
                  {(condicaoPagamentoSelecionada?.parcelas.length ||
                    parcelasExistentes.length) > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium mb-1">Parcelas:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {(
                          condicaoPagamentoSelecionada?.parcelas ||
                          parcelasExistentes
                        ).map((parcela, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm bg-white p-2 rounded border"
                          >
                            <span>Parcela {parcela.numero}</span>
                            <span>R$ {parcela.valor.toFixed(2)}</span>
                            <span>
                              {new Date(
                                parcela.data_vencimento
                              ).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowSelecionarCondicao(true)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Alterar
                  </button>
                  <button
                    onClick={handleRemoverCondicaoPagamento}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSelecionarCondicao(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Selecionar Condição de Pagamento
            </button>
          )}
        </div>

        {/* Observações */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 resize-vertical"
            placeholder="Digite as observações do pedido"
          />
        </div>

        {/* Seção Produtos */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Produtos</h3>
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
                      <p className="font-semibold">{item.produto.titulo}</p>
                      <p className="text-sm text-gray-600">
                        {Object.entries(item.tamanhos)
                          .filter(([_, qtd]) => qtd > 0) 
                          .map(([tamanho, qtd]) => `${tamanho}: ${qtd}`)
                          .join(", ")}
                      </p>
                      <p className="text-sm">
                        R$ {item.preco_unitario.toFixed(2)} × {item.quantidade}
                        {item.desconto > 0 && ` (${item.desconto}% desc.)`}
                      </p>
                      {item.filial && (
                        <p className="text-xs text-gray-500">
                          Filial: {item.filial}
                        </p>
                      )}
                      {item.embargue && (
                        <p className="text-xs text-gray-500">
                          Embargue: {item.embargue}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold">
                        R$ {item.subtotal.toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoverItem(index)}
                        className="text-red-600 hover:text-red-800 p-1 rounded-md transition-colors"
                        title="Remover item"
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

        {/* Resumo Financeiro */}
        <div className="border-t pt-4 mb-6">
          <div className="space-y-2">
            {/* Valor dos Produtos Novos */}
            <div className="flex justify-between text-sm">
              <span>Valor dos Produtos:</span>
              <span>R$ {calcularTotalProdutos().toFixed(2)}</span>
            </div>

            {/* Saldo do Pedido Anterior (se houver) */}
            {saldoPedidoAnterior > 0 && (
              <div className="flex justify-between text-sm">
                <span>Saldo do Pedido Anterior:</span>
                <span className="text-blue-600">
                  R$ {saldoPedidoAnterior.toFixed(2)}
                </span>
              </div>
            )}

            {/* Linha divisória se houver pedido anterior */}
            {saldoPedidoAnterior > 0 && <div className="border-t pt-2"></div>}

            {/* Total Geral */}
            <div className="flex justify-between items-center text-lg font-semibold pt-2">
              <span>Total a Parcelar:</span>
              <span className="text-xl">
                R$ {calcularTotalComSaldoAnterior().toFixed(2)}
              </span>
            </div>

            {/* Informação sobre a composição */}
            {saldoPedidoAnterior > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                * O total inclui {calcularTotalProdutos().toFixed(2)} em
                produtos novos + {saldoPedidoAnterior.toFixed(2)} de saldo do
                pedido anterior
              </p>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={loading || itensPedido.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            <Save size={20} className="mr-2" />
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {/* Modal de Adicionar Produto */}
      {showAdicionarProduto && (
        <AdicionarProdutoModal
          isOpen={showAdicionarProduto}
          produtos={produtos}
          onAdd={handleAdicionarProduto}
          onClose={() => setShowAdicionarProduto(false)}
        />
      )}

      {/* Modal de Condição de Pagamento */}
      {showSelecionarCondicao && (
        <SelecionarCondicaoPagamentoModal
          isOpen={showSelecionarCondicao}
          onClose={() => setShowSelecionarCondicao(false)}
          onSelect={handleSelectCondicaoPagamento}
          valorTotal={calcularTotalComSaldoAnterior()}
        />
      )}

      {/* Modal de Vincular Pedido Anterior */}
      {showVincularPedido && pedido.cliente && (
        <VincularPedidoAnteriorModal
          isOpen={showVincularPedido}
          onClose={() => setShowVincularPedido(false)}
          onSelect={handleSelectPedidoAnterior}
          clienteId={(pedido.cliente as Cliente).id}
          pedidoAtualId={pedido.id}
        />
      )}
    </div>
  );
}
