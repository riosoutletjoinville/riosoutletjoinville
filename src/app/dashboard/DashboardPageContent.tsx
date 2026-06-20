// app/dashboard/page.tsx
"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Calendar, RefreshCw } from "lucide-react";

// Components
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DragDropDashboard } from "@/components/dashboard/DragDropDashboard";

interface DashboardStats {
  totalProdutos: number;
  totalPedidos: number;
  totalClientes: number;
  receitaMes: number;
  despesaMes: number;
  produtosML: number;
  pedidosPendentes: number;
  produtosBaixoEstoque: number;
  produtosSemEstoque: number;
  produtosDesativados: number;
  vendasMes: number;
}

interface ChartData {
  vendasMensais: { mes: string; total: number }[];
  performanceML: { mes: string; vendas: number; visualizacoes: number }[];
  distribuicaoEstoque: { categoria: string; quantidade: number }[];
  evolucaoFinanceira: { mes: string; receita: number; despesa: number }[];
}

export default function DashboardPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProdutos: 0,
    totalPedidos: 0,
    totalClientes: 0,
    receitaMes: 0,
    despesaMes: 0,
    produtosML: 0,
    pedidosPendentes: 0,
    produtosBaixoEstoque: 0,
    produtosSemEstoque: 0,
    produtosDesativados: 0,
    vendasMes: 0,
  });

  const [activeTab, setActiveTab] = useState<"visao-geral" | "graficos">(
    "visao-geral",
  );
  const [chartData, setChartData] = useState<ChartData>({
    vendasMensais: [],
    performanceML: [],
    distribuicaoEstoque: [],
    evolucaoFinanceira: [],
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const getMonthStartEnd = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      monthStart: monthStart.toISOString().split("T")[0],
      monthEnd: monthEnd.toISOString().split("T")[0],
    };
  };

  const loadStats = useCallback(async () => {
    // Total de produtos
    const { count: produtosCount } = await supabase
      .from("produtos")
      .select("*", { count: "exact" });

    // Total de pedidos
    const { count: pedidosCount } = await supabase
      .from("pedidos")
      .select("*", { count: "exact" });

    // Total de clientes
    const { count: clientesCount } = await supabase
      .from("clientes")
      .select("*", { count: "exact" });

    // Produtos no Mercado Livre
    const { count: produtosMLCount } = await supabase
      .from("produtos")
      .select("*", { count: "exact" })
      .eq("publicar_ml", true)
      .not("ml_item_id", "is", null);

    const { count: produtosDesativadosCount } = await supabase
      .from("produtos")
      .select("*", { count: "exact" })
      .eq("ativo", false);

    // Pedidos pendentes
    const { count: pedidosPendentesCount } = await supabase
      .from("pedidos")
      .select("*", { count: "exact" })
      .eq("status", "pendente");

    // Produtos com baixo estoque
    const { count: produtosBaixoEstoqueCount } = await supabase
      .from("produtos")
      .select("*", { count: "exact" })
      .lt("estoque", 10)
      .gt("estoque", 0);

    // Produtos sem estoque
    const { count: produtosSemEstoqueCount } = await supabase
      .from("produtos")
      .select("*", { count: "exact" })
      .eq("estoque", 0);

    // Receita e despesa do mês
    const { monthStart, monthEnd } = getMonthStartEnd();
    const { data: receitaFinanceiroData } = await supabase
      .from("financeiro")
      .select("valor, tipo_movimento, tipo")
      .eq("tipo_movimento", "entrada")
      .neq("tipo", "estorno")
      .gte("data_movimento", monthStart)
      .lte("data_movimento", monthEnd);

    const { data: despesaFinanceiroData } = await supabase
      .from("financeiro")
      .select("valor, tipo_movimento")
      .eq("tipo_movimento", "saida")
      .gte("data_movimento", monthStart)
      .lte("data_movimento", monthEnd);

    // Vendas do mês
    const { data: vendasMesData } = await supabase
      .from("pedidos")
      .select("total")
      .gte("data_pedido", monthStart)
      .lte("data_pedido", monthEnd)
      .neq("status", "cancelado");

    const receitaMes =
      receitaFinanceiroData?.reduce(
        (sum, item) => sum + Number(item.valor),
        0,
      ) || 0;
    const despesaMes =
      despesaFinanceiroData?.reduce(
        (sum, item) => sum + Number(item.valor),
        0,
      ) || 0;
    const vendasMes =
      vendasMesData?.reduce((sum, item) => sum + Number(item.total), 0) || 0;

    setStats({
      totalProdutos: produtosCount || 0,
      totalPedidos: pedidosCount || 0,
      totalClientes: clientesCount || 0,
      receitaMes,
      despesaMes,
      produtosML: produtosMLCount || 0,
      pedidosPendentes: pedidosPendentesCount || 0,
      produtosBaixoEstoque: produtosBaixoEstoqueCount || 0,
      produtosSemEstoque: produtosSemEstoqueCount || 0,
      vendasMes,
      produtosDesativados: produtosDesativadosCount || 0,
    });
  }, []);

  const loadChartData = useCallback(async () => {
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const twelveMonthsAgoStr = twelveMonthsAgo.toISOString();

      const { data: pedidosData } = await supabase
        .from("pedidos")
        .select("total, data_pedido")
        .gte("data_pedido", twelveMonthsAgoStr)
        .neq("status", "cancelado");
      const meses = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      const vendasMensais = meses.map((mes) => ({ mes, total: 0 }));
      pedidosData?.forEach((pedido) => {
        const mesIndex = new Date(pedido.data_pedido).getMonth();
        if (mesIndex >= 0 && mesIndex < 12)
          vendasMensais[mesIndex].total += Number(pedido.total) || 0;
      });

      const { data: produtosML } = await supabase
        .from("produtos")
        .select("ml_status, created_at")
        .eq("publicar_ml", true)
        .not("ml_item_id", "is", null);
      const performanceML = meses.map((mes, index) => ({
        mes,
        vendas:
          produtosML?.filter(
            (p) =>
              new Date(p.created_at).getMonth() === index &&
              p.ml_status === "active",
          ).length || 0,
        visualizacoes: 0,
      }));

      const { data: produtosEstoque } = await supabase
        .from("produtos")
        .select(`estoque, categoria_id, categorias!left(nome)`)
        .gt("estoque", 0)
        .eq("ativo", true);
      const distribuicaoEstoque: Record<string, number> = {};
      produtosEstoque?.forEach((produto) => {
        // Se categorias é um array, pegue o primeiro item
        const categoriasArray = produto.categorias as { nome: string }[] | null;
        const catNome = categoriasArray?.[0]?.nome || "Sem Categoria";
        distribuicaoEstoque[catNome] =
          (distribuicaoEstoque[catNome] || 0) + (produto.estoque || 0);
      });
      const distribuicaoArray = Object.entries(distribuicaoEstoque)
        .map(([categoria, quantidade]) => ({
          categoria,
          quantidade: Number(quantidade),
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      const { data: movimentosFinanceiros } = await supabase
        .from("financeiro")
        .select("valor, tipo_movimento, data_movimento")
        .gte("data_movimento", twelveMonthsAgoStr);
      const evolucaoFinanceira = meses.map((mes) => ({
        mes,
        receita: 0,
        despesa: 0,
      }));
      movimentosFinanceiros?.forEach((movimento) => {
        const mesIndex = new Date(movimento.data_movimento).getMonth();
        if (mesIndex >= 0 && mesIndex < 12) {
          if (movimento.tipo_movimento === "entrada")
            evolucaoFinanceira[mesIndex].receita +=
              Number(movimento.valor) || 0;
          else if (movimento.tipo_movimento === "saida")
            evolucaoFinanceira[mesIndex].despesa +=
              Number(movimento.valor) || 0;
        }
      });

      setChartData({
        vendasMensais,
        performanceML,
        distribuicaoEstoque: distribuicaoArray,
        evolucaoFinanceira,
      });
    } catch (error) {
      const meses = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      setChartData({
        vendasMensais: meses.map((mes) => ({ mes, total: 0 })),
        performanceML: meses.map((mes) => ({
          mes,
          vendas: 0,
          visualizacoes: 0,
        })),
        distribuicaoEstoque: [{ categoria: "Sem dados", quantidade: 0 }],
        evolucaoFinanceira: meses.map((mes) => ({
          mes,
          receita: 0,
          despesa: 0,
        })),
      });
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    setLoadingStats(true);
    setRefreshing(true);
    try {
      await Promise.all([loadStats(), loadChartData()]);
      setDataLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  }, [loadStats, loadChartData]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !dataLoaded) {
      loadDashboardData();
    }
  }, [user, dataLoaded, loadDashboardData]);

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const saldoMes = stats.receitaMes - stats.despesaMes;
  const lucroPercentual =
    stats.receitaMes > 0 ? (saldoMes / stats.receitaMes) * 100 : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo de volta! Aqui está o resumo do seu negócio.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <NotificationBell />
            <ThemeToggle />
            <button
              onClick={loadDashboardData}
              disabled={refreshing}
              className="inline-flex items-center px-4 py-2 border border-border rounded-lg bg-card text-sm font-medium text-card-foreground hover:bg-accent transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>
            <div className="text-sm text-muted-foreground">
              <Calendar className="inline h-4 w-4 mr-1" />
              {new Date().toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>
      </div>
      <SystemStatus
        produtosDesativados={stats.produtosDesativados}
        pedidosPendentes={stats.pedidosPendentes}
        produtosBaixoEstoque={stats.produtosBaixoEstoque}
        produtosSemEstoque={stats.produtosSemEstoque}
      />
      {/* Abas */}
      <div className="border-b border-border mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("visao-geral")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === "visao-geral" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => setActiveTab("graficos")}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${activeTab === "graficos" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Gráficos
          </button>
        </div>
      </div>
      {/* Quick Actions - fixo em ambas as abas */}
      <div className="mb-8">
        <QuickActions />
      </div>
      {/* aba visão geral */}
      {activeTab === "visao-geral" && (
        <>
          {/* Drag & Drop Dashboard */}
          <DragDropDashboard stats={stats} />

          {/* Traditional Layout Fallback */}
          <div className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Coluna principal */}
              <div className="lg:col-span-3 space-y-8">
                <FinancialSummary
                  receitaMes={stats.receitaMes}
                  despesaMes={stats.despesaMes}
                  saldoMes={saldoMes}
                  lucroPercentual={lucroPercentual}
                />
              </div>

              {/* Coluna lateral com atividades recentes */}
              <div className="space-y-8">
                <RecentActivities />
              </div>
            </div>
          </div>
        </>
      )}
      {/* aba gráficos */}
      {activeTab === "graficos" && <ChartsSection data={chartData} />}
    </div>
  );
}
