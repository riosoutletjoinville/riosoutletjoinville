// app/dashboard/finance/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ParcelasManagement from "@/components/dashboard/ParcelasManagement";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  Download,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";

interface MovimentoFinanceiro {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  categoria: string;
  data_movimento: string;
  created_at: string;
  pedido_id?: string;
}

// Categorias atualizadas baseadas nos tipos de pedido
const CATEGORIAS_PADRAO = [
  // Entradas
  { value: "vendas", label: "Vendas", tipo: "entrada" },
  { value: "orcamentos", label: "Orçamentos", tipo: "entrada" },
  { value: "trocas_entrada", label: "Trocas (Entrada)", tipo: "entrada" },
  { value: "recebimentos", label: "Recebimentos", tipo: "entrada" },
  { value: "investimentos", label: "Investimentos", tipo: "entrada" },
  { value: "outras_entradas", label: "Outras Entradas", tipo: "entrada" },

  // Saídas
  { value: "compras", label: "Compras", tipo: "saida" },
  {
    value: "despesas_operacionais",
    label: "Despesas Operacionais",
    tipo: "saida",
  },
  { value: "folha_pagamento", label: "Folha de Pagamento", tipo: "saida" },
  { value: "impostos", label: "Impostos", tipo: "saida" },
  { value: "estornos", label: "Estornos", tipo: "saida" },
  { value: "garantias", label: "Garantias", tipo: "saida" },
  { value: "bonificacoes", label: "Bonificações", tipo: "saida" },
  { value: "doacoes", label: "Doações", tipo: "saida" },
  { value: "trocas_saida", label: "Trocas (Saída)", tipo: "saida" },
  { value: "outras_saidas", label: "Outras Saídas", tipo: "saida" },
];

export default function FinancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [movimentos, setMovimentos] = useState<MovimentoFinanceiro[]>([]);
  const [loadingMovimentos, setLoadingMovimentos] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "entrada" | "saida">("todos");
  const [editingMovimento, setEditingMovimento] = useState<MovimentoFinanceiro | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCleanupAlert, setShowCleanupAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<"movimentos" | "parcelas">("movimentos");
  const [valorFormatado, setValorFormatado] = useState("");

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Função para formatar moeda
  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  // Função para obter descrição padrão
  const getDescricaoPadrao = (
    tipo: string,
    categoria: string,
    pedidoId?: string
  ): string => {
    if (pedidoId) {
      return `Venda - Pedido ${pedidoId}`;
    }

    const descricoes: Record<string, string> = {
      vendas: "Venda de produtos",
      recebimentos: "Recebimento",
      investimentos: "Aporte de capital",
      compras: "Compra de insumos",
      despesas_operacionais: "Despesa operacional",
      folha_pagamento: "Folha de pagamento",
      impostos: "Pagamento de impostos",
      estornos: "Estorno de valores",
    };

    return (
      descricoes[categoria] ||
      `${tipo === "entrada" ? "Receita" : "Despesa"} diversas`
    );
  };

  // Função para carregar movimentos
  const loadMovimentos = useCallback(async () => {
    try {
      setLoadingMovimentos(true);

      // Query para contar o total
      let countQuery = supabase
        .from("financeiro")
        .select("*", { count: "exact", head: true });

      if (filtroTipo !== "todos") {
        countQuery = countQuery.eq("tipo", filtroTipo);
      }

      if (searchTerm) {
        countQuery = countQuery.or(`descricao.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotalItems(count || 0);

      // Query para buscar dados
      let query = supabase
        .from("financeiro")
        .select("*")
        .order("data_movimento", { ascending: false });

      if (filtroTipo !== "todos") {
        query = query.eq("tipo", filtroTipo);
      }

      if (searchTerm) {
        query = query.or(`descricao.ilike.%${searchTerm}%,categoria.ilike.%${searchTerm}%`);
      }

      // Aplicar paginação CORRETAMENTE
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error } = await query.range(from, to);

      if (error) throw error;

      const hasDuplicates = checkForDuplicates(data || []);
      setShowCleanupAlert(hasDuplicates);
      setMovimentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar movimentos:", error);
    } finally {
      setLoadingMovimentos(false);
    }
  }, [filtroTipo, currentPage, itemsPerPage, searchTerm]);

  // Função para manipular mudança no valor (máscara monetária)
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "");
    const valorNumerico = Number(valor) / 100;

    if (!isNaN(valorNumerico)) {
      setValorFormatado(formatarMoeda(valorNumerico));
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadMovimentos();
    }
  }, [user, loadMovimentos]);

  // Função para buscar quando o usuário digitar no search
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setCurrentPage(1);
        loadMovimentos();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchTerm, filtroTipo, user]);

  // Função para exportar relatório
  const exportarRelatorio = () => {
    // Cabeçalho com BOM para UTF-8
    const BOM = "\uFEFF";
    const csvContent = [
      ["Data", "Descrição", "Categoria", "Tipo", "Valor", "ID Pedido"],
      ...movimentos.map((m) => [
        new Date(m.data_movimento).toLocaleDateString("pt-BR"),
        m.descricao,
        m.categoria,
        m.tipo === "entrada" ? "Entrada" : "Saída",
        m.valor.toFixed(2).replace(".", ","),
        m.pedido_id || "",
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(";"))
      .join("\n");

    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `relatorio-financeiro-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const checkForDuplicates = (movimentos: MovimentoFinanceiro[]): boolean => {
    const pedidoIds = new Set();
    for (const movimento of movimentos) {
      if (movimento.pedido_id) {
        if (pedidoIds.has(movimento.pedido_id)) {
          return true;
        }
        pedidoIds.add(movimento.pedido_id);
      }
    }
    return false;
  };

  const cleanDuplicateRecords = async () => {
    if (
      !confirm(
        "Esta ação removerá registros duplicados mantendo apenas o mais recente. Continuar?"
      )
    )
      return;

    try {
      // Buscar todos os registros com pedido_id duplicado
      const { data: duplicates, error: dupError } = await supabase
        .from("financeiro")
        .select("*")
        .not("pedido_id", "is", null);

      if (dupError) throw dupError;

      // Agrupar por pedido_id e manter apenas o mais recente
      const recordsToKeep = new Map();
      const recordsToDelete: string[] = [];

      duplicates?.forEach((record) => {
        if (!record.pedido_id) return;

        const existing = recordsToKeep.get(record.pedido_id);
        if (
          !existing ||
          new Date(record.created_at) > new Date(existing.created_at)
        ) {
          if (existing) {
            recordsToDelete.push(existing.id);
          }
          recordsToKeep.set(record.pedido_id, record);
        } else {
          recordsToDelete.push(record.id);
        }
      });

      // Deletar registros duplicados
      if (recordsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("financeiro")
          .delete()
          .in("id", recordsToDelete);

        if (deleteError) throw deleteError;
      }

      alert(`${recordsToDelete.length} registros duplicados foram removidos.`);
      setShowCleanupAlert(false);
      loadMovimentos();
    } catch (error) {
      console.error("Erro ao limpar registros duplicados:", error);
      alert("Erro ao limpar registros duplicados.");
    }
  };

  const checkPedidoExists = async (pedidoId: string): Promise<boolean> => {
    if (!pedidoId) return false;

    const { data, error } = await supabase
      .from("financeiro")
      .select("id")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao verificar pedido:", error);
      return false;
    }

    return !!data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const pedidoId = formData.get("pedido_id") as string;
    const tipo = formData.get("tipo") as string;
    const categoria = formData.get("categoria") as string;

    // Verificar se o pedido_id já existe (apenas para novos registros)
    if (!editingMovimento && pedidoId) {
      const pedidoExists = await checkPedidoExists(pedidoId);
      if (pedidoExists) {
        alert("Já existe um movimento financeiro para este pedido!");
        setSaving(false);
        return;
      }
    }

    // Obter valor numérico (remover formatação de moeda)
    const valorInput = valorFormatado || (formData.get("valor") as string);
    const valorNumerico = parseFloat(
      valorInput.replace(/[^\d,-]/g, "").replace(",", ".")
    );

    const movimentoData = {
      tipo: tipo,
      descricao:
        (formData.get("descricao") as string) ||
        getDescricaoPadrao(tipo, categoria, pedidoId),
      valor: valorNumerico,
      categoria: categoria,
      data_movimento: formData.get("data_movimento") as string,
      pedido_id: pedidoId || null,
    };

    try {
      let error;

      if (editingMovimento) {
        ({ error } = await supabase
          .from("financeiro")
          .update(movimentoData)
          .eq("id", editingMovimento.id));
      } else {
        ({ error } = await supabase.from("financeiro").insert([movimentoData]));
      }

      if (error) throw error;

      setShowModal(false);
      setEditingMovimento(null);
      setValorFormatado("");
      loadMovimentos();
    } catch (error) {
      console.error("Erro ao salvar movimento:", error);
      alert(
        "Erro ao salvar movimento. Verifique o console para mais detalhes."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este movimento?")) return;

    try {
      const { error } = await supabase.from("financeiro").delete().eq("id", id);

      if (error) throw error;

      loadMovimentos();
    } catch (error) {
      console.error("Erro ao excluir movimento:", error);
    }
  };

  const handleEdit = (movimento: MovimentoFinanceiro) => {
    setEditingMovimento(movimento);
    setValorFormatado(formatarMoeda(movimento.valor));
    setShowModal(true);
  };

  const handleNewMovimento = () => {
    setEditingMovimento(null);
    setValorFormatado("");
    setShowModal(true);
  };

  const movimentosEntrada = movimentos.filter((m) => m.tipo === "entrada");
  const movimentosSaida = movimentos.filter(
    (m) => m.tipo === "saida" && !m.categoria.toLowerCase().includes("estorno")
  );
  const movimentosEstorno = movimentos.filter((m) =>
    m.categoria.toLowerCase().includes("estorno")
  );

  // Para o total de saídas, some apenas as saídas que NÃO são estornos
  const totalEntradas = movimentosEntrada.reduce((sum, m) => sum + m.valor, 0);
  const totalSaidas = movimentosSaida.reduce((sum, m) => sum + m.valor, 0);
  const totalEstornos = movimentosEstorno.reduce((sum, m) => sum + m.valor, 0);

  // O saldo deve considerar: entradas - (saídas normais + estornos)
  const saldo = totalEntradas - (totalSaidas + totalEstornos);

  // Componente de Paginação 
  const Pagination = () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Mostrando {startItem} a {endItem} de {totalItems} registros
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>

          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Próxima
          </button>
        </div>
      </div>
    );
  };

  if (loading || loadingMovimentos)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <DollarSign className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie suas finanças e acompanhe o fluxo de caixa
            </p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={exportarRelatorio}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
            >
              <Download size={20} className="mr-2" />
              Exportar
            </button>
            <button
              onClick={handleNewMovimento}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Plus size={20} className="mr-2" />
              Novo Movimento
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de registros duplicados */}
      {showCleanupAlert && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 animate-fade-in">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Registros duplicados detectados!</strong> Existem
                múltiplos registros com o mesmo ID de pedido.
              </p>
              <button
                onClick={cleanDuplicateRecords}
                className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                Limpar Registros Duplicados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Entradas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatarMoeda(totalEntradas)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <ArrowUpCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Saídas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatarMoeda(totalSaidas)}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <ArrowDownCircle size={24} className="text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Estornos</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatarMoeda(totalEstornos)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <RotateCcw size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Saldo</p>
              <p
                className={`text-2xl font-bold ${
                  saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {formatarMoeda(saldo)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              saldo >= 0 
                ? "bg-green-100 dark:bg-green-900/30" 
                : "bg-red-100 dark:bg-red-900/30"
            }`}>
              <DollarSign size={24} className={
                saldo >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              } />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("movimentos")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "movimentos"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              Movimentos Financeiros
            </button>
            <button
              onClick={() => setActiveTab("parcelas")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "parcelas"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              Gestão de Parcelas
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === "movimentos" ? (
        <>
          {/* Filtros */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={filtroTipo}
                  onChange={(e) => {
                    setFiltroTipo(e.target.value as "todos" | "entrada" | "saida");
                    setCurrentPage(1);
                  }}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="todos">Todos os tipos</option>
                  <option value="entrada">Entradas</option>
                  <option value="saida">Saídas</option>
                </select>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFiltroTipo("todos");
                    setCurrentPage(1);
                  }}
                  className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Filter size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de Movimentos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {movimentos.length > 0 ? (
                    movimentos.map((movimento) => (
                      <tr 
                        key={movimento.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {new Date(movimento.data_movimento).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {movimento.descricao}
                          </div>
                          {movimento.pedido_id && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Pedido: {movimento.pedido_id}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {movimento.categoria}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              movimento.tipo === "entrada"
                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                            }`}
                          >
                            {movimento.tipo === "entrada" ? "Entrada" : "Saída"}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 text-sm font-semibold ${
                            movimento.tipo === "entrada"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {formatarMoeda(movimento.valor)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(movimento)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Editar movimento"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(movimento.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Excluir movimento"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <div className="text-gray-500 dark:text-gray-400">
                          <DollarSign className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p>Nenhum movimento encontrado</p>
                          <button
                            onClick={handleNewMovimento}
                            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            Criar primeiro movimento
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination />
          </div>

          {/* Modal para novo movimento/edição */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  {editingMovimento ? "Editar Movimento" : "Novo Movimento"}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo
                      </label>
                      <select
                        name="tipo"
                        required
                        defaultValue={editingMovimento?.tipo || ""}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="entrada">Entrada</option>
                        <option value="saida">Saída</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descrição
                      </label>
                      <input
                        type="text"
                        name="descricao"
                        required
                        defaultValue={editingMovimento?.descricao || ""}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descrição do movimento"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor
                      </label>
                      <input
                        type="text"
                        name="valor"
                        required
                        value={valorFormatado}
                        onChange={handleValorChange}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="R$ 0,00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categoria
                      </label>
                      <select
                        name="categoria"
                        required
                        defaultValue={editingMovimento?.categoria || ""}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Selecione uma categoria</option>
                        {CATEGORIAS_PADRAO.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data
                      </label>
                      <input
                        type="date"
                        name="data_movimento"
                        required
                        defaultValue={editingMovimento?.data_movimento || ""}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ID do Pedido (opcional)
                      </label>
                      <input
                        type="text"
                        name="pedido_id"
                        defaultValue={editingMovimento?.pedido_id || ""}
                        disabled={!!editingMovimento}
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Deixe vazio para movimento manual"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {editingMovimento
                          ? "ID do pedido não pode ser alterado após criação"
                          : "Informe o ID do pedido para vincular automaticamente"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingMovimento(null);
                        setValorFormatado("");
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <ParcelasManagement />
      )}
    </div>
  );
}