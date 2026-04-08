// components/dashboard/ParcelasManagement.tsx
"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
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
  data_vencimento: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  data_pagamento?: string;
  valor_pago?: number;
  observacao?: string;
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
    null
  );
  const [prePedidoId, setPrePedidoId] = useState<string>("");
  const [totalPedido, setTotalPedido] = useState<number>(0);
  const [filtroCliente, setFiltroCliente] = useState("");

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
      .includes(filtroCliente.toLowerCase())
  );

  // Calcular clientes paginados
  const indiceUltimoCliente = paginaAtual * itensPorPagina;
  const indicePrimeiroCliente = indiceUltimoCliente - itensPorPagina;
  const clientesPaginados = clientesFiltrados.slice(
    indicePrimeiroCliente,
    indiceUltimoCliente
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
      if (parcela.status === "pendente") {
        if (new Date(parcela.data_vencimento) < new Date()) {
          clienteResumo.totalAtrasado += parcela.valor_parcela;
        } else {
          clienteResumo.totalPendente += parcela.valor_parcela;
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
              razao_social,
              nome_fantasia,
              nome,
              sobrenome
            ),
            total
          )
        `
        )
        .order("data_vencimento", { ascending: true });

      // CORREÇÃO: Aplicar filtros corretamente
      if (filtroStatus !== "todos") {
        if (filtroStatus === "atrasadas") {
          // Filtrar parcelas pendentes com data de vencimento passada
          query = query
            .eq("status", "pendente")
            .lt("data_vencimento", new Date().toISOString().split('T')[0]);
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
    try {
      const { value: formValues } = await Swal.fire({
        title: "Marcar Parcela como Paga",
        html: `
          <div class="text-left">
            <label class="block text-sm font-medium text-gray-700 mb-2">Valor Pago</label>
            <input 
              type="number" 
              id="valorPago" 
              value="${parcela.valor_parcela}" 
              step="0.01"
              class="w-full border border-gray-300 rounded-md px-3 py-2 mb-3"
            >
            <label class="block text-sm font-medium text-gray-700 mb-2">Data do Pagamento</label>
            <input 
              type="date" 
              id="dataPagamento" 
              value="${new Date().toISOString().split("T")[0]}" 
              class="w-full border border-gray-300 rounded-md px-3 py-2"
            >
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Confirmar Pagamento",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          const valorPago = parseFloat(
            (document.getElementById("valorPago") as HTMLInputElement).value
          );
          const dataPagamento = (
            document.getElementById("dataPagamento") as HTMLInputElement
          ).value;

          if (!valorPago || valorPago <= 0) {
            Swal.showValidationMessage("Por favor, insira um valor válido");
            return false;
          }

          if (!dataPagamento) {
            Swal.showValidationMessage(
              "Por favor, insira uma data de pagamento"
            );
            return false;
          }

          return { valorPago, dataPagamento };
        },
      });

      if (!formValues) return;

      const { error } = await supabase
        .from("pre_pedido_parcelas")
        .update({
          status: "pago",
          valor_pago: formValues.valorPago,
          data_pagamento: formValues.dataPagamento,
        })
        .eq("id", parcela.id);

      if (error) throw error;

      Swal.fire("Sucesso!", "Parcela marcada como paga.", "success");
      loadParcelas();
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao marcar parcela como paga:", error);
      Swal.fire(
        "Erro",
        "Não foi possível marcar a parcela como paga.",
        "error"
      );
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
        p.status === "pendente" && new Date(p.data_vencimento) >= new Date()
    )
    .reduce((sum, p) => sum + p.valor_parcela, 0);

  const totalAtrasado = parcelas
    .filter(
      (p) => p.status === "pendente" && new Date(p.data_vencimento) < new Date()
    )
    .reduce((sum, p) => sum + p.valor_parcela, 0);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Parcelas</h1>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Clientes</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {formatarMoeda(totalPendente)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <Calendar className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Atrasadas</p>
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
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
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
                  R$ {clienteResumo.totalPendente.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  R$ {clienteResumo.totalAtrasado.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  R$ {clienteResumo.totalPago.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <button
                    onClick={() =>
                      abrirModalParcelas(
                        clienteResumo.cliente,
                        clienteResumo.parcelas
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
        onParcelasAtualizadas={handleParcelasAtualizadas}
      />
    </div>
  );
}
