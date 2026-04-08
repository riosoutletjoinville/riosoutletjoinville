// app/dashboard/contador/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Calendar,
  RefreshCw,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Receipt,
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  Download
} from "lucide-react";

// Components específicos do contador
import { FiscalSummary } from "@/components/contador/FiscalSummary";
import { FinancialSummary } from "@/components/contador/FinancialSummary";
import { OrdersSummary } from "@/components/contador/OrdersSummary";
import { InstallmentsReport } from "@/components/contador/InstallmentsReport";
import { NFList } from "@/components/contador/NFList";
import { DateRangePicker } from "@/components/contador/DateRangePicker";
import { FiscalReport } from "@/components/contador/FiscalReport";

interface ContadorStats {
  // Fiscal
  totalNFEmitidas: number;
  totalNFAutorizadas: number;
  totalNFCanceladas: number;
  totalNFPendentes: number;
  totalXMLGerados: number;
  valorTotalNF: number;
  
  // Financeiro
  totalReceber: number;
  totalReceberVencido: number;
  totalReceberAberto: number;
  totalReceberPago: number;
  totalPagar: number;
  totalPagarVencido: number;
  totalPagarAberto: number;
  totalPagarPago: number;
  saldoFinanceiro: number;
  
  // Pedidos
  totalPedidosMes: number;
  totalVendasMes: number;
  ticketMedio: number;
  pedidosCancelados: number;
}

type TabType = 'dashboard' | 'fiscal' | 'parcelas' | 'notas';

export default function ContadorContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showFiscalReport, setShowFiscalReport] = useState(false);
  const [stats, setStats] = useState<ContadorStats>({
    totalNFEmitidas: 0,
    totalNFAutorizadas: 0,
    totalNFCanceladas: 0,
    totalNFPendentes: 0,
    totalXMLGerados: 0,
    valorTotalNF: 0,
    totalReceber: 0,
    totalReceberVencido: 0,
    totalReceberAberto: 0,
    totalReceberPago: 0,
    totalPagar: 0,
    totalPagarVencido: 0,
    totalPagarAberto: 0,
    totalPagarPago: 0,
    saldoFinanceiro: 0,
    totalPedidosMes: 0,
    totalVendasMes: 0,
    ticketMedio: 0,
    pedidosCancelados: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'dashboard' as TabType, name: 'Dashboard', icon: LayoutDashboard },
    { id: 'fiscal' as TabType, name: 'Resumo Fiscal', icon: BarChart3 },
    { id: 'parcelas' as TabType, name: 'Controle de Parcelas', icon: CreditCard },
    { id: 'notas' as TabType, name: 'Notas Fiscais', icon: FileSpreadsheet },
  ];

  // Verificar permissão - apenas contador ou admin
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadContadorData = useCallback(async () => {
    setLoadingStats(true);
    setRefreshing(true);

    try {
      const startDateStr = dateRange.startDate.toISOString().split('T')[0];
      const endDateStr = dateRange.endDate.toISOString().split('T')[0];

      // 1. Dados de Notas Fiscais
      const { data: notasFiscais, count: totalNF } = await supabase
        .from("notas_fiscais")
        .select("*", { count: "exact" })
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr);

      const nfAutorizadas = notasFiscais?.filter(nf => nf.status === 'autorizada') || [];
      const nfCanceladas = notasFiscais?.filter(nf => nf.status === 'cancelada') || [];
      const nfPendentes = notasFiscais?.filter(nf => nf.status === 'pendente') || [];
      
      const valorTotalNF = notasFiscais?.reduce((sum, nf) => sum + (nf.valor_total || 0), 0) || 0;

      // 2. Dados de Parcelas (pre_pedido_parcelas)
      const { data: parcelas } = await supabase
        .from("pre_pedido_parcelas")
        .select(`
          *,
          pre_pedidos (
            id,
            total,
            cliente_id
          )
        `)
        .gte("data_vencimento", startDateStr)
        .lte("data_vencimento", endDateStr);

      const totalReceber = parcelas?.reduce((sum, p) => sum + (p.valor_parcela || 0), 0) || 0;
      const totalReceberVencido = parcelas?.filter(p => 
        p.status === 'pendente' && new Date(p.data_vencimento) < new Date()
      ).reduce((sum, p) => sum + (p.valor_parcela || 0), 0) || 0;
      
      const totalReceberAberto = parcelas?.filter(p => 
        p.status === 'pendente' && new Date(p.data_vencimento) >= new Date()
      ).reduce((sum, p) => sum + (p.valor_parcela || 0), 0) || 0;
      
      const totalReceberPago = parcelas?.filter(p => 
        p.status === 'pago'
      ).reduce((sum, p) => sum + (p.valor_pago || p.valor_parcela || 0), 0) || 0;

      // 3. Dados de Movimentos Financeiros
      const { data: movimentosFinanceiros } = await supabase
        .from("movimentos_financeiros")
        .select("*")
        .gte("data_movimento", startDateStr)
        .lte("data_movimento", endDateStr);

      const receitas = movimentosFinanceiros?.filter(m => m.tipo === 'receita') || [];
      const despesas = movimentosFinanceiros?.filter(m => m.tipo === 'despesa') || [];
      
      const totalReceitas = receitas.reduce((sum, r) => sum + (r.valor || 0), 0);
      const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);
      const saldoFinanceiro = totalReceitas - totalDespesas;

      // 4. Dados de Pedidos
      const { data: pedidos } = await supabase
        .from("pedidos")
        .select("*")
        .gte("data_pedido", startDateStr)
        .lte("data_pedido", endDateStr);

      const totalPedidosMes = pedidos?.length || 0;
      const totalVendasMes = pedidos?.reduce((sum, p) => sum + (p.total || 0), 0) || 0;
      const ticketMedio = totalPedidosMes > 0 ? totalVendasMes / totalPedidosMes : 0;
      const pedidosCancelados = pedidos?.filter(p => p.status === 'cancelado').length || 0;

      // 5. Atualizar stats
      setStats({
        totalNFEmitidas: totalNF || 0,
        totalNFAutorizadas: nfAutorizadas.length,
        totalNFCanceladas: nfCanceladas.length,
        totalNFPendentes: nfPendentes.length,
        totalXMLGerados: notasFiscais?.filter(nf => nf.xml).length || 0,
        valorTotalNF,
        totalReceber,
        totalReceberVencido,
        totalReceberAberto,
        totalReceberPago,
        totalPagar: totalDespesas,
        totalPagarVencido: 0,
        totalPagarAberto: 0,
        totalPagarPago: 0,
        saldoFinanceiro,
        totalPedidosMes,
        totalVendasMes,
        ticketMedio,
        pedidosCancelados,
      });

    } catch (error) {
      console.error("Erro ao carregar dados do contador:", error);
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (user) {
      loadContadorData();
    }
  }, [user, loadContadorData]);

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados fiscais...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard do Contador
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Visão completa das informações fiscais e financeiras
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onChange={setDateRange}
              />
              <button
                onClick={loadContadorData}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </div>
          </div>

          {/* Abas */}
          <div className="flex space-x-2 mt-4 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setShowFiscalReport(false);
                  }}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-all
                    ${activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Cards de Resumo - Visíveis apenas na aba Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de NF-e</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalNFEmitidas}</p>
                </div>
                <FileText className="h-10 w-10 text-blue-500" />
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-green-600">Autorizadas: {stats.totalNFAutorizadas}</span>
                <span className="text-red-600">Canceladas: {stats.totalNFCanceladas}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor Total NF-e</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.valorTotalNF)}
                  </p>
                </div>
                <Receipt className="h-10 w-10 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Contas a Receber</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalReceber)}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-500" />
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-orange-600">Vencido: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalReceberVencido)}</span>
                <span className="text-blue-600">Aberto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalReceberAberto)}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saldo Financeiro</p>
                  <p className={`text-2xl font-bold ${stats.saldoFinanceiro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.saldoFinanceiro)}
                  </p>
                </div>
                {stats.saldoFinanceiro >= 0 ? (
                  <TrendingUp className="h-10 w-10 text-green-500" />
                ) : (
                  <TrendingDown className="h-10 w-10 text-red-500" />
                )}
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-green-600">Receitas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalReceberPago)}</span>
                <span className="text-red-600">Despesas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalPagar)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo das Abas */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FiscalSummary stats={stats} dateRange={dateRange} />
            <FinancialSummary stats={stats} dateRange={dateRange} />
            <OrdersSummary stats={stats} dateRange={dateRange} />
            <InstallmentsReport dateRange={dateRange} />
          </div>
        )}

        {activeTab === 'fiscal' && (
          <div>
            {/* Botão para gerar relatório consolidado */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowFiscalReport(!showFiscalReport)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                {showFiscalReport ? 'Ocultar Relatório Consolidado' : 'Gerar Relatório Consolidado'}
              </button>
            </div>

            {/* Resumos individuais sempre visíveis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <FiscalSummary stats={stats} dateRange={dateRange} />
              <FinancialSummary stats={stats} dateRange={dateRange} />
              <OrdersSummary stats={stats} dateRange={dateRange} />
            </div>

            {/* Relatório Consolidado - aparece ao clicar no botão */}
            {showFiscalReport && (
              <div className="mt-8">
                <FiscalReport stats={stats} dateRange={dateRange} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'parcelas' && (
          <InstallmentsReport dateRange={dateRange} />
        )}

        {activeTab === 'notas' && (
          <NFList dateRange={dateRange} />
        )}
      </div>
    </div>
  );
}