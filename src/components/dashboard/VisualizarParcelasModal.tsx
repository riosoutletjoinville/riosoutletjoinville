// components/dashboard/VisualizarParcelasModal.tsx
"use client";
import {
  X,
  CheckCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  Edit,
} from "lucide-react";
import { useState, useEffect } from "react";
import ComprovantePagamento from "./ComprovantePagamento";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

interface Cliente {
  razao_social?: string;
  nome_fantasia?: string;
  nome?: string;
  sobrenome?: string;
}

interface Parcela {
  id: string;
  pre_pedido_id: string;
  numero_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  data_pagamento?: string;
  valor_pago?: number;
  observacao?: string;
}

interface VisualizarParcelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  parcelas: Parcela[];
  prePedidoId: string;
  total: number;
  cliente: Cliente | null;
  onMarcarComoPago: (parcela: Parcela) => void;
  onParcelasAtualizadas?: () => void; // prop para atualizar a lista principal
}

export default function VisualizarParcelasModal({
  isOpen,
  onClose,
  parcelas: parcelasIniciais,
  prePedidoId,
  total,
  cliente,
  onMarcarComoPago,
  onParcelasAtualizadas,
}: VisualizarParcelasModalProps) {
  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  // Estado para filtro de status
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  // Estado para comprovante
  const [comprovanteAberto, setComprovanteAberto] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<Parcela | null>(
    null
  );

  // Estado para edição de data
  const [editandoData, setEditandoData] = useState<string | null>(null);
  const [novaData, setNovaData] = useState<string>("");
  const [salvandoData, setSalvandoData] = useState(false);
  // Estado local para as parcelas (para atualização visual imediata)
  const [parcelas, setParcelas] = useState<Parcela[]>(parcelasIniciais);

  useEffect(() => {
    setParcelas(parcelasIniciais);
  }, [parcelasIniciais]);

  // Resetar estados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setPaginaAtual(1);
      setEditandoData(null);
      setNovaData("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtrar parcelas pelo status selecionado
  const parcelasFiltradas = parcelas.filter((parcela) => {
    if (filtroStatus === "todos") return true;

    if (filtroStatus === "atrasadas") {
      return (
        parcela.status === "pendente" &&
        new Date(parcela.data_vencimento) < new Date()
      );
    }

    return parcela.status === filtroStatus;
  });

  // Cálculos para paginação (agora usando parcelasFiltradas)
  const indiceUltimoItem = paginaAtual * itensPorPagina;
  const indicePrimeiroItem = indiceUltimoItem - itensPorPagina;
  const parcelasPaginadas = parcelasFiltradas.slice(
    indicePrimeiroItem,
    indiceUltimoItem
  );
  const totalPaginas = Math.ceil(parcelasFiltradas.length / itensPorPagina);

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

  const handleAlterarDataVencimento = async (parcelaId: string) => {
    if (!novaData) return;

    setSalvandoData(true);
    try {
      const dataFormatada = `${novaData}T00:00:00.000Z`;

      const { error } = await supabase
        .from("pre_pedido_parcelas")
        .update({
          data_vencimento: dataFormatada,
          updated_at: new Date().toISOString(),
        })
        .eq("id", parcelaId);

      if (error) throw error;

      // ATUALIZAÇÃO DIRETA - sem complicação
      const novasParcelas = [...parcelas];
      const parcelaIndex = novasParcelas.findIndex((p) => p.id === parcelaId);
      if (parcelaIndex !== -1) {
        novasParcelas[parcelaIndex] = {
          ...novasParcelas[parcelaIndex],
          data_vencimento: dataFormatada,
        };
        setParcelas(novasParcelas);
      }

      setEditandoData(null);
      setNovaData("");

      Swal.fire("Sucesso!", "Data alterada com sucesso.", "success");
    } catch (error) {
      console.error("Erro:", error);
      Swal.fire("Erro", "Não foi possível alterar a data.", "error");
    } finally {
      setSalvandoData(false);
    }
  };

  const TimezoneData = (dataString: string): string => {
    // Cria uma data no timezone local a partir da string
    const data = new Date(dataString);

    // Ajusta para compensar o offset do timezone
    const timezoneOffset = data.getTimezoneOffset() * 60000; // offset em milissegundos
    const dataAjustada = new Date(data.getTime() + timezoneOffset);

    // Retorna no formato YYYY-MM-DD
    return dataAjustada.toISOString().split("T")[0];
  };

  // Iniciar edição de data
  const iniciarEdicaoData = (parcela: Parcela) => {
    setEditandoData(parcela.id);

    // Usar a função de correção de timezone
    const dataCorrigida = TimezoneData(parcela.data_vencimento);
    setNovaData(dataCorrigida);
  };

  // Cancelar edição de data
  const cancelarEdicaoData = () => {
    setEditandoData(null);
    setNovaData("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-100 text-green-800";
      case "atrasado":
        return "bg-red-100 text-red-800";
      case "cancelado":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatStatus = (status: string, dataVencimento: string) => {
    if (status === "pendente" && new Date(dataVencimento) < new Date()) {
      return "Atrasada";
    }

    const statusMap: { [key: string]: string } = {
      pendente: "Pendente",
      pago: "Pago",
      atrasado: "Atrasado",
      cancelado: "Cancelado",
    };
    return statusMap[status] || status;
  };

  const getClienteNome = (cliente: Cliente | null) => {
    if (!cliente) return "Cliente não informado";

    if (cliente.razao_social) return cliente.razao_social;
    if (cliente.nome_fantasia) return cliente.nome_fantasia;
    return `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim();
  };

  // Calcular totais para o modal (usando parcelasFiltradas)
  const totalPendente = parcelasFiltradas
    .filter(
      (p) =>
        p.status === "pendente" && new Date(p.data_vencimento) >= new Date()
    )
    .reduce((sum, p) => sum + p.valor_parcela, 0);

  const totalAtrasado = parcelasFiltradas
    .filter(
      (p) => p.status === "pendente" && new Date(p.data_vencimento) < new Date()
    )
    .reduce((sum, p) => sum + p.valor_parcela, 0);

  const totalPago = parcelasFiltradas
    .filter((p) => p.status === "pago")
    .reduce((sum, p) => sum + (p.valor_pago || p.valor_parcela), 0);

  // Função para abrir comprovante
  const abrirComprovante = (parcela: Parcela) => {
    setParcelaSelecionada(parcela);
    setComprovanteAberto(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold">Parcelas do Cliente</h2>
              <p className="text-gray-600">{getClienteNome(cliente)}</p>
              <p className="text-sm text-gray-500">
                ID do Pré-Pedido: {prePedidoId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Resumo do Cliente */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total do Pedido</p>
                <p className="font-semibold">R$ {total.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nº de Parcelas</p>
                <p className="font-semibold">{parcelasFiltradas.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendente</p>
                <p className="font-semibold text-yellow-600">
                  R$ {totalPendente.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Atrasado</p>
                <p className="font-semibold text-red-600">
                  R$ {totalAtrasado.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pago</p>
                <p className="font-semibold text-green-600">
                  R$ {totalPago.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Filtros:
                </span>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">
                    Status:
                  </label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="pendente">Pendentes</option>
                    <option value="atrasadas">Atrasadas</option>
                    <option value="pago">Pagas</option>
                    <option value="cancelado">Canceladas</option>
                  </select>
                </div>
                <button
                  onClick={() => setFiltroStatus("todos")}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm whitespace-nowrap"
                >
                  Limpar Filtro
                </button>
              </div>
            </div>
          </div>

          {/* Controles de Paginação - Topo */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Mostrando {indicePrimeiroItem + 1}-
              {Math.min(indiceUltimoItem, parcelasFiltradas.length)} de{" "}
              {parcelasFiltradas.length} parcelas
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Itens por página:</label>
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

          {/* Tabela de Parcelas */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Parcela
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Pagamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Valor Pago
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parcelasPaginadas.map((parcela) => (
                  <tr
                    key={parcela.id}
                    className={
                      new Date(parcela.data_vencimento) < new Date() &&
                      parcela.status === "pendente"
                        ? "bg-red-50"
                        : ""
                    }
                  >
                    <td className="px-4 py-3 font-medium">
                      {parcela.numero_parcela}ª
                    </td>
                    <td className="px-4 py-3">
                      R$ {parcela.valor_parcela.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {editandoData === parcela.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={novaData}
                            onChange={(e) => {
                              console.log(
                                "Nova data selecionada:",
                                e.target.value
                              );
                              setNovaData(e.target.value);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                            onFocus={(e) => e.target.showPicker()}
                          />
                          <button
                            onClick={() => {
                              console.log(
                                "Clicou em confirmar para parcela:",
                                parcela.id
                              );
                              console.log(
                                "Data atual:",
                                parcela.data_vencimento
                              );
                              console.log("Nova data:", novaData);
                              handleAlterarDataVencimento(parcela.id);
                            }}
                            disabled={salvandoData}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                          >
                            {salvandoData ? "..." : "✓"}
                          </button>
                          <button
                            onClick={cancelarEdicaoData}
                            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span>
                            {parcela.data_vencimento
                              .split("T")[0]
                              .split("-")
                              .reverse()
                              .join("/")}
                          </span>
                          <button
                            onClick={() => {
                              console.log(
                                "Iniciando edição para parcela:",
                                parcela.id
                              );
                              console.log(
                                "Data atual da parcela:",
                                parcela.data_vencimento
                              );
                              iniciarEdicaoData(parcela);
                            }}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <Edit size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          parcela.status
                        )}`}
                      >
                        {formatStatus(parcela.status, parcela.data_vencimento)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {parcela.data_pagamento
                        ? new Date(parcela.data_pagamento).toLocaleDateString(
                            "pt-BR"
                          )
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {parcela.valor_pago
                        ? `R$ ${parcela.valor_pago.toFixed(2)}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => iniciarEdicaoData(parcela)}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                          title="Alterar data de vencimento"
                        >
                          <Edit size={14} className="mr-1" />
                          Editar Data
                        </button>
                        {parcela.status === "pendente" &&
                          editandoData !== parcela.id && (
                            <button
                              onClick={() => onMarcarComoPago(parcela)}
                              className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                              title="Marcar como Pago"
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Pagar
                            </button>
                          )}
                        {parcela.status === "pago" && (
                          <button
                            onClick={() => abrirComprovante(parcela)}
                            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                            title="Emitir Comprovante"
                          >
                            <FileText size={14} className="mr-1" />
                            Comprovante
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginação - Rodapé */}
          {parcelasFiltradas.length > 0 && (
            <div className="flex justify-between items-center">
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

          {parcelasFiltradas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma parcela encontrada com os filtros aplicados.
            </div>
          )}
        </div>
      </div>

      {/* Modal do Comprovante */}
      {comprovanteAberto && parcelaSelecionada && (
        <ComprovantePagamento
          isOpen={comprovanteAberto}
          onClose={() => setComprovanteAberto(false)}
          parcela={parcelaSelecionada}
          cliente={cliente}
          prePedidoId={prePedidoId}
        />
      )}
    </>
  );
}
