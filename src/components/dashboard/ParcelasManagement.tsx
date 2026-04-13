// components/dashboard/ParcelasManagement.tsx
"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ModalPagamentoParcial } from "./ModalPagamentoParcial";
import { ModalPagamentoTotal } from "./ModalPagamentoTotal";
import { ModalNegociarParcela } from "./ModalNegociarParcela";
import {
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import VisualizarParcelasModal from "./VisualizarParcelasModal";

export interface Cliente {
  id?: string;
  razao_social?: string;
  nome_fantasia?: string;
  nome?: string;
  sobrenome?: string;
}

export interface PrePedido {
  id: string;
  cliente: Cliente;
  total: number;
}

export interface Parcela {
  id: string;
  pre_pedido_id: string;
  numero_parcela: number;
  valor_parcela: number;
  valor_original?: number;
  saldo_restante?: number;
  data_vencimento: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado" | "parcial";
  data_pagamento?: string;
  valor_pago?: number;
  observacao?: string;
  negociado?: boolean;
  observacao_negociacao?: string;
  pre_pedido?: PrePedido;
}

export interface ClienteResumo {
  cliente: Cliente;
  parcelas: Parcela[];
  totalPendente: number;
  totalAtrasado: number;
  totalPago: number;
  quantidadeParcelas: number;
}

// Props para o modal de visualização
interface VisualizarParcelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcelas: Parcela[];
  prePedidoId: string;
  total: number;
  cliente: Cliente | null;
  onMarcarComoPago: (parcela: Parcela) => Promise<void>;
  onPagamentoParcial?: (parcela: Parcela) => Promise<void>;
  onNegociarParcela?: (parcela: Parcela) => Promise<void>;
  onVerHistorico?: (parcela: Parcela) => Promise<void>;
  onParcelasAtualizadas: () => void;
}

export default function ParcelasManagement() {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [clientesResumo, setClientesResumo] = useState<ClienteResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [modalAberto, setModalAberto] = useState(false);
  const [parcelasClienteSelecionado, setParcelasClienteSelecionado] = useState<
    Parcela[]
  >([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null,
  );
  const [prePedidoId, setPrePedidoId] = useState<string>("");
  const [totalPedido, setTotalPedido] = useState<number>(0);
  const [filtroCliente, setFiltroCliente] = useState("");

  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(
    null,
  );
  const [modalPagamentoTotalAberto, setModalPagamentoTotalAberto] =
    useState(false);
  const [modalNegociacaoAberto, setModalNegociacaoAberto] = useState(false);

  // Estados de paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  // Função para obter nome do cliente
  const getClienteNome = useCallback((cliente: Cliente) => {
    if (!cliente) return "Cliente não encontrado";

    if (cliente.razao_social) return cliente.razao_social;
    if (cliente.nome_fantasia) return cliente.nome_fantasia;
    return `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim();
  }, []);

  // Filtrar clientes
  const clientesFiltrados = clientesResumo.filter((clienteResumo) =>
    getClienteNome(clienteResumo.cliente)
      .toLowerCase()
      .includes(filtroCliente.toLowerCase()),
  );

  // Calcular clientes paginados
  const indiceUltimoCliente = paginaAtual * itensPorPagina;
  const indicePrimeiroCliente = indiceUltimoCliente - itensPorPagina;
  const clientesPaginados = clientesFiltrados.slice(
    indicePrimeiroCliente,
    indiceUltimoCliente,
  );
  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina);

  // Funções de paginação
  const mudarPagina = (numeroPagina: number) => {
    setPaginaAtual(numeroPagina);
  };

  const irParaProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  const irParaPaginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  // Método para registrar pagamento parcial
  const handlePagamentoParcial = async (parcela: Parcela) => {
    setModalAberto(false);
    setParcelaSelecionada(parcela);
    setModalPagamentoAberto(true);
  };

  const handleConfirmarPagamentoParcial = async (data: {
    valorPagamento: number;
    formaPagamento: string;
    dataPagamento: string;
    observacao: string;
  }) => {
    if (!parcelaSelecionada) return;

    try {
      // Buscar dados atuais da parcela
      const { data: parcelaAtual, error: fetchError } = await supabase
        .from("pre_pedido_parcelas")
        .select("valor_parcela, saldo_restante, valor_pago, status")
        .eq("id", parcelaSelecionada.id)
        .single();

      if (fetchError) {
        console.error("Erro ao buscar parcela:", fetchError);
        throw fetchError;
      }

      const saldoAtual =
        parcelaAtual.saldo_restante ?? parcelaAtual.valor_parcela;
      const novoValorPago =
        (parcelaAtual.valor_pago || 0) + data.valorPagamento;
      const novoSaldoRestante = saldoAtual - data.valorPagamento;
      const novoStatus = novoSaldoRestante <= 0 ? "pago" : "parcial";

      // Registrar o pagamento na tabela parcela_pagamentos
      const { error: pagamentoError } = await supabase
        .from("parcela_pagamentos")
        .insert([
          {
            parcela_id: parcelaSelecionada.id,
            valor_pago: data.valorPagamento,
            data_pagamento: data.dataPagamento,
            forma_pagamento: data.formaPagamento,
            observacao: data.observacao,
            tipo_movimento: "parcial",
          },
        ]);

      if (pagamentoError) {
        console.error("Erro ao inserir pagamento:", pagamentoError);
        throw pagamentoError;
      }

      // Atualizar a parcela
      const { error: updateError } = await supabase
        .from("pre_pedido_parcelas")
        .update({
          valor_pago: novoValorPago,
          saldo_restante: Math.max(novoSaldoRestante, 0),
          status: novoStatus,
          data_pagamento: data.dataPagamento,
        })
        .eq("id", parcelaSelecionada.id);

      if (updateError) {
        console.error("Erro ao atualizar parcela:", updateError);
        throw updateError;
      }

      // Registrar no financeiro
      const { error: financeiroError } = await supabase
        .from("financeiro")
        .insert([
          {
            tipo: "entrada",
            descricao: `Pagamento parcial - Parcela ${parcelaSelecionada.numero_parcela} do pedido ${parcelaSelecionada.pre_pedido_id}`,
            valor: data.valorPagamento,
            categoria: "recebimentos",
            data_movimento: data.dataPagamento,
          },
        ]);

      if (financeiroError) {
        console.error("Erro ao registrar no financeiro:", financeiroError);
        throw financeiroError;
      }

      // Mostrar mensagem de sucesso
      await Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: `Pagamento parcial de ${formatarMoeda(data.valorPagamento)} registrado com sucesso.`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Recarregar os dados
      await loadParcelas();
      setModalAberto(false);
    } catch (error) {
      console.error("Erro detalhado ao registrar pagamento:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: `Não foi possível registrar o pagamento: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      });
      throw error;
    }
  };

  // Método para negociar parcela
  const handleNegociarParcela = async (parcela: Parcela) => {
    setModalAberto(false);
    setParcelaSelecionada(parcela);
    setModalNegociacaoAberto(true);
  };

  const handleConfirmarNegociacao = async (data: {
    valorNegociado: number;
    novoVencimento: string;
    observacao: string;
  }) => {
    if (!parcelaSelecionada) return;

    try {
      const desconto = parcelaSelecionada.valor_parcela - data.valorNegociado;

      // Registrar negociação
      const { error: negociacaoError } = await supabase
        .from("parcela_negociacoes")
        .insert([
          {
            parcela_id: parcelaSelecionada.id,
            valor_original: parcelaSelecionada.valor_parcela,
            valor_negociado: data.valorNegociado,
            desconto_concedido: desconto,
            novo_vencimento: data.novoVencimento || null,
            observacao: data.observacao,
            status: "ativo",
          },
        ]);

      if (negociacaoError) throw negociacaoError;

      // Atualizar a parcela
      const updateData: any = {
        valor_original: parcelaSelecionada.valor_parcela,
        valor_parcela: data.valorNegociado,
        saldo_restante: data.valorNegociado,
        negociado: true,
        observacao_negociacao: data.observacao,
      };

      if (data.novoVencimento) {
        updateData.data_vencimento = data.novoVencimento;
      }

      const { error: updateError } = await supabase
        .from("pre_pedido_parcelas")
        .update(updateData)
        .eq("id", parcelaSelecionada.id);

      if (updateError) throw updateError;

      Swal.fire(
        "Negociação Registrada!",
        `Desconto concedido: ${formatarMoeda(desconto)}\nNovo valor: ${formatarMoeda(data.valorNegociado)}`,
        "success",
      );

      await loadParcelas();
    } catch (error) {
      console.error("Erro ao registrar negociação:", error);
      Swal.fire("Erro", "Não foi possível registrar a negociação.", "error");
      throw error;
    }
  };

  // Método para visualizar histórico de pagamentos
  const verHistoricoPagamentos = async (parcela: Parcela) => {
    try {
      const { data: pagamentos, error } = await supabase
        .from("parcela_pagamentos")
        .select("*")
        .eq("parcela_id", parcela.id)
        .order("data_pagamento", { ascending: false });

      if (error) throw error;

      const totalPago =
        pagamentos?.reduce((sum, p) => sum + p.valor_pago, 0) || 0;
      const saldoRestante = parcela.valor_parcela - totalPago;

      let htmlContent = `
      <div class="text-left">
        <p class="font-semibold mb-2">Resumo da Parcela ${parcela.numero_parcela}</p>
        <p>Valor Original: R$ ${parcela.valor_parcela.toFixed(2)}</p>
        <p>Total Pago: R$ ${totalPago.toFixed(2)}</p>
        <p>Saldo Restante: R$ ${saldoRestante.toFixed(2)}</p>
    `;

      if (pagamentos && pagamentos.length > 0) {
        htmlContent += `
        <hr class="my-3">
        <p class="font-semibold mb-2">Histórico de Pagamentos:</p>
        <div class="space-y-2 max-h-60 overflow-y-auto">
      `;

        pagamentos.forEach((pag) => {
          htmlContent += `
          <div class="border p-2 rounded text-sm">
            <p><strong>Data:</strong> ${new Date(pag.data_pagamento).toLocaleDateString("pt-BR")}</p>
            <p><strong>Valor:</strong> R$ ${pag.valor_pago.toFixed(2)}</p>
            <p><strong>Forma:</strong> ${pag.forma_pagamento}</p>
            ${pag.observacao ? `<p><strong>Obs:</strong> ${pag.observacao}</p>` : ""}
          </div>
        `;
        });

        htmlContent += `</div>`;
      } else {
        htmlContent += `<p class="text-gray-500 mt-2">Nenhum pagamento registrado</p>`;
      }

      htmlContent += `</div>`;

      await Swal.fire({
        title: `Histórico - Parcela ${parcela.numero_parcela}`,
        html: htmlContent,
        width: 500,
        confirmButtonText: "Fechar",
      });
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      Swal.fire("Erro", "Não foi possível carregar o histórico.", "error");
    }
  };

  // Função para agrupar por cliente
  const agruparPorCliente = useCallback(() => {
    const clientesMap = new Map<string, ClienteResumo>();

    parcelas.forEach((parcela) => {
      if (!parcela.pre_pedido?.cliente) return;

      const cliente = parcela.pre_pedido.cliente;
      const clienteKey = JSON.stringify(cliente);

      if (!clientesMap.has(clienteKey)) {
        clientesMap.set(clienteKey, {
          cliente,
          parcelas: [],
          totalPendente: 0,
          totalAtrasado: 0,
          totalPago: 0,
          quantidadeParcelas: 0,
        });
      }

      const clienteResumo = clientesMap.get(clienteKey)!;
      clienteResumo.parcelas.push(parcela);
      clienteResumo.quantidadeParcelas++;

      // Calcular totais
      if (parcela.status === "pendente" || parcela.status === "parcial") {
        const saldo = parcela.saldo_restante ?? parcela.valor_parcela;
        if (new Date(parcela.data_vencimento) < new Date()) {
          clienteResumo.totalAtrasado += saldo;
        } else {
          clienteResumo.totalPendente += saldo;
        }
      } else if (parcela.status === "pago") {
        clienteResumo.totalPago += parcela.valor_pago || parcela.valor_parcela;
      }
    });

    setClientesResumo(Array.from(clientesMap.values()));
  }, [parcelas]);

  // Função para carregar parcelas
  const loadParcelas = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("pre_pedido_parcelas")
        .select(
          `
          *,
          pre_pedido:pre_pedidos(
            id,
            cliente:clientes(
              id,
              razao_social,
              nome_fantasia,
              nome,
              sobrenome
            ),
            total
          )
        `,
        )
        .order("data_vencimento", { ascending: true });

      // Aplicar filtros corretamente
      if (filtroStatus !== "todos") {
        if (filtroStatus === "atrasadas") {
          query = query
            .eq("status", "pendente")
            .lt("data_vencimento", new Date().toISOString().split("T")[0]);
        } else if (filtroStatus === "parcial") {
          query = query.eq("status", "parcial");
        } else {
          query = query.eq("status", filtroStatus);
        }
      }

      if (dataInicio) {
        query = query.gte("data_vencimento", dataInicio);
      }

      if (dataFim) {
        query = query.lte("data_vencimento", dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      setParcelas(data || []);
    } catch (error) {
      console.error("Erro ao carregar parcelas:", error);
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, dataInicio, dataFim]);

  useEffect(() => {
    loadParcelas();
  }, [loadParcelas]);

  useEffect(() => {
    if (parcelas.length > 0) {
      agruparPorCliente();
    }
  }, [parcelas, agruparPorCliente]);

  // Resetar página quando filtrar
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroStatus, dataInicio, dataFim, filtroCliente]);

  const abrirModalParcelas = (cliente: Cliente, parcelasCliente: Parcela[]) => {
    const primeiraParcela = parcelasCliente[0];
    setClienteSelecionado(cliente);
    setParcelasClienteSelecionado(parcelasCliente);
    setPrePedidoId(primeiraParcela.pre_pedido_id);
    setTotalPedido(primeiraParcela.pre_pedido?.total || 0);
    setModalAberto(true);
  };

  const handleMarcarComoPago = async (parcela: Parcela) => {
    setModalAberto(false);
    setParcelaSelecionada(parcela);
    setModalPagamentoTotalAberto(true);
  };

  // Adicione a função de confirmação do pagamento total
  const handleConfirmarPagamentoTotal = async (data: {
    valorPago: number;
    dataPagamento: string;
    formaPagamento: string;
  }) => {
    if (!parcelaSelecionada) return;

    try {
      // Buscar dados atuais da parcela
      const { data: parcelaAtual, error: fetchError } = await supabase
        .from("pre_pedido_parcelas")
        .select("valor_parcela, saldo_restante, valor_pago, status")
        .eq("id", parcelaSelecionada.id)
        .single();

      if (fetchError) throw fetchError;

      const valorPagoTotal = Math.min(
        data.valorPago,
        parcelaAtual.valor_parcela,
      );
      const isPagamentoTotal = valorPagoTotal >= parcelaAtual.valor_parcela;
      const novoValorPago = (parcelaAtual.valor_pago || 0) + valorPagoTotal;
      const novoSaldoRestante = parcelaAtual.valor_parcela - novoValorPago;
      const novoStatus = isPagamentoTotal
        ? "pago"
        : novoSaldoRestante > 0
          ? "parcial"
          : "pago";

      // Registrar pagamento no histórico
      const { error: pagamentoError } = await supabase
        .from("parcela_pagamentos")
        .insert([
          {
            parcela_id: parcelaSelecionada.id,
            valor_pago: valorPagoTotal,
            data_pagamento: data.dataPagamento,
            forma_pagamento: data.formaPagamento,
            tipo_movimento: isPagamentoTotal ? "total" : "parcial",
          },
        ]);

      if (pagamentoError) throw pagamentoError;

      // Atualizar a parcela
      const { error: updateError } = await supabase
        .from("pre_pedido_parcelas")
        .update({
          status: novoStatus,
          valor_pago: novoValorPago,
          data_pagamento: data.dataPagamento,
          saldo_restante: Math.max(novoSaldoRestante, 0),
        })
        .eq("id", parcelaSelecionada.id);

      if (updateError) throw updateError;

      // Registrar no financeiro
      const { error: financeiroError } = await supabase
        .from("financeiro")
        .insert([
          {
            tipo: "entrada",
            descricao: `Pagamento - Parcela ${parcelaSelecionada.numero_parcela} do pedido ${parcelaSelecionada.pre_pedido_id}`,
            valor: valorPagoTotal,
            categoria: "recebimentos",
            data_movimento: data.dataPagamento,
          },
        ]);

      if (financeiroError) throw financeiroError;

      await Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: `Pagamento de ${formatarMoeda(valorPagoTotal)} registrado com sucesso.`,
        timer: 2000,
        showConfirmButton: false,
      });

      await loadParcelas();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível registrar o pagamento.",
      });
      throw error;
    }
  };

  // Função para atualizar as parcelas após alterações
  const handleParcelasAtualizadas = () => {
    loadParcelas();
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Totais gerais (para os cards de resumo)
  const totalPendente = parcelas
    .filter(
      (p) =>
        (p.status === "pendente" || p.status === "parcial") &&
        new Date(p.data_vencimento) >= new Date(),
    )
    .reduce((sum, p) => sum + (p.saldo_restante ?? p.valor_parcela), 0);

  const totalAtrasado = parcelas
    .filter(
      (p) =>
        (p.status === "pendente" || p.status === "parcial") &&
        new Date(p.data_vencimento) < new Date(),
    )
    .reduce((sum, p) => sum + (p.saldo_restante ?? p.valor_parcela), 0);

  const totalPago = parcelas
    .filter((p) => p.status === "pago")
    .reduce((sum, p) => sum + (p.valor_pago || p.valor_parcela), 0);

  if (loading) {
    return <div className="p-6">Carregando parcelas...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestão de Parcelas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Acompanhe e gerencie as parcelas dos seus clientes
          </p>
        </div>
      </div>

      {/* Resumo modernizado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clientes
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {clientesResumo.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Users className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pendentes
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatarMoeda(totalPendente)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <Calendar
                className="text-yellow-600 dark:text-yellow-400"
                size={24}
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Atrasadas
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatarMoeda(totalAtrasado)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <XCircle className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pagas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatarMoeda(totalPago)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle
                className="text-green-600 dark:text-green-400"
                size={24}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros modernizados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="parcial">Pagamento Parcial</option>
              <option value="atrasadas">Atrasadas</option>
              <option value="pago">Pagas</option>
              <option value="cancelado">Canceladas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cliente
            </label>
            <input
              type="text"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDataInicio("");
                setDataFim("");
                setFiltroStatus("todos");
                setFiltroCliente("");
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="text-sm text-gray-600">
            Mostrando {indicePrimeiroCliente + 1}-
            {Math.min(indiceUltimoCliente, clientesFiltrados.length)} de{" "}
            {clientesFiltrados.length} clientes
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">
              Clientes por página:
            </label>
            <select
              value={itensPorPagina}
              onChange={(e) => {
                setItensPorPagina(Number(e.target.value));
                setPaginaAtual(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Parcelas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Pendente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Atrasado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Pago
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clientesPaginados.map((clienteResumo, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {getClienteNome(clienteResumo.cliente)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {clienteResumo.quantidadeParcelas}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatarMoeda(clienteResumo.totalPendente)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatarMoeda(clienteResumo.totalAtrasado)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatarMoeda(clienteResumo.totalPago)}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <button
                    onClick={() =>
                      abrirModalParcelas(
                        clienteResumo.cliente,
                        clienteResumo.parcelas,
                      )
                    }
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    <Eye size={14} className="mr-1" />
                    Ver Parcelas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Controles de paginação */}
        {clientesFiltrados.length > 0 && (
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Página {paginaAtual} de {totalPaginas}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={irParaPaginaAnterior}
                disabled={paginaAtual === 1}
                className={`p-2 rounded-md ${
                  paginaAtual === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Números das páginas */}
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let numeroPagina;
                if (totalPaginas <= 5) {
                  numeroPagina = i + 1;
                } else if (paginaAtual <= 3) {
                  numeroPagina = i + 1;
                } else if (paginaAtual >= totalPaginas - 2) {
                  numeroPagina = totalPaginas - 4 + i;
                } else {
                  numeroPagina = paginaAtual - 2 + i;
                }

                return (
                  <button
                    key={numeroPagina}
                    onClick={() => mudarPagina(numeroPagina)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      paginaAtual === numeroPagina
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {numeroPagina}
                  </button>
                );
              })}

              <button
                onClick={irParaProximaPagina}
                disabled={paginaAtual === totalPaginas}
                className={`p-2 rounded-md ${
                  paginaAtual === totalPaginas
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {clientesFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {filtroCliente || filtroStatus !== "todos" || dataInicio || dataFim
              ? "Nenhum cliente encontrado com os filtros aplicados."
              : "Nenhuma parcela encontrada."}
          </div>
        )}
      </div>
      {/* Modal de Pagamento Total */}
      {parcelaSelecionada && (
        <ModalPagamentoTotal
          isOpen={modalPagamentoTotalAberto}
          onClose={() => {
            setModalPagamentoTotalAberto(false);
            setParcelaSelecionada(null);
            setModalAberto(true);
          }}
          parcela={parcelaSelecionada}
          onConfirm={handleConfirmarPagamentoTotal}
        />
      )}

      {/* Modal de Negociação */}
      {parcelaSelecionada && (
        <ModalNegociarParcela
          isOpen={modalNegociacaoAberto}
          onClose={() => {
            setModalNegociacaoAberto(false);
            setParcelaSelecionada(null);
            setModalAberto(true);
          }}
          parcela={parcelaSelecionada}
          onConfirm={handleConfirmarNegociacao}
        />
      )}

      {/* Modal de Pagamento Parcial (já existente) */}
      {parcelaSelecionada && (
        <ModalPagamentoParcial
          isOpen={modalPagamentoAberto}
          onClose={() => {
            setModalPagamentoAberto(false);
            setParcelaSelecionada(null);
            setModalAberto(true);
          }}
          parcela={parcelaSelecionada}
          onConfirm={handleConfirmarPagamentoParcial}
        />
      )}
      {/* Modal de Visualização de Parcelas */}
      <VisualizarParcelasModal
        key={prePedidoId}
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        parcelas={parcelasClienteSelecionado}
        prePedidoId={prePedidoId}
        total={totalPedido}
        cliente={clienteSelecionado}
        onMarcarComoPago={handleMarcarComoPago}
        onPagamentoParcial={handlePagamentoParcial}
        onNegociarParcela={handleNegociarParcela}
        onVerHistorico={verHistoricoPagamentos}
        onParcelasAtualizadas={handleParcelasAtualizadas}
      />
    </div>
  );
}
