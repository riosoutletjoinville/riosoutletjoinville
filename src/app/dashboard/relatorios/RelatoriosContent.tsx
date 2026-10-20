// app/dashboard/reports/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  Users,
  Calendar,
  DollarSign,
  User,
  FileText
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interfaces para os tipos de dados
interface ReportData {
  vendasMes: number;
  vendasMesAnterior: number;
  crescimentoVendas: number;
  produtosMaisVendidos: Array<{
    nome: string;
    quantidade: number;
    total: number;
  }>;
  clientesAtivos: number;
  ticketMedio: number;
  movimentosFinanceiros: Array<{
    mes: string;
    entrada: number;
    saida: number;
    saldo: number;
  }>;
}

interface PrePedidoItem {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  produtos?: {
    titulo: string;
  };
}

interface Cliente {
  id: string;
  tipo_cliente: 'juridica' | 'fisica';
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
}

interface PrePedido {
  id: string;
  cliente_id: string;
  total: number;
  status: string;
  created_at: string;
  observacoes: string;
  condicao_pagamento: string;
  itens: PrePedidoItem[];
  cliente: Cliente | null;
}

interface ProdutoVendidoDB {
  quantidade: number;
  preco_unitario: number;
  produtos: { titulo: string } | null;
  pedidos: { data_pedido: string; status: string };
}

interface PrePedidoDB {
  id: string;
  total: number;
  status: string;
  created_at: string;
  observacoes: string;
  condicao_pagamento: string;
  cliente: Cliente[] | null;
}

interface MovimentoFinanceiroDB {
  valor: number;
  tipo_movimento: 'entrada' | 'saida';
  data_movimento: string;
}

// Função para formatar moeda brasileira
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Função para formatar data brasileira
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// Função para gerar PDF simples
const generatePDF = (content: string, filename: string) => {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .section { 
              margin-bottom: 30px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 10px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left;
            }
            th { 
              background-color: #f5f5f5; 
            }
            .total { 
              font-weight: bold; 
              background-color: #f9f9f9;
            }
            .positive { color: green; }
            .negative { color: red; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

export default function RelatoriosContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportData, setReportData] = useState<ReportData>({
    vendasMes: 0,
    vendasMesAnterior: 0,
    crescimentoVendas: 0,
    produtosMaisVendidos: [],
    clientesAtivos: 0,
    ticketMedio: 0,
    movimentosFinanceiros: [],
  });
  const [periodo, setPeriodo] = useState<"30dias" | "90dias" | "ano">("30dias");
  const [dataInicio, setDataInicio] = useState<string>(
    format(subDays(new Date(), 30), "yyyy-MM-dd")
  );
  const [dataFim, setDataFim] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [relatorioPrePedidos, setRelatorioPrePedidos] = useState<PrePedido[]>([]);
  const [loadingPrePedidos, setLoadingPrePedidos] = useState(false);
  const [filtroPrePedidos, setFiltroPrePedidos] = useState({
    dataInicio: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    dataFim: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadMovimentosFinanceiros = useCallback(async (startDate: Date, endDate: Date) => {
    try {
      const { data: movimentosData, error } = await supabase
        .from("financeiro")
        .select("valor, tipo_movimento, data_movimento")
        .gte("data_movimento", startDate.toISOString())
        .lte("data_movimento", endDate.toISOString())
        .order("data_movimento", { ascending: true });

      if (error) throw error;

      // Agrupar por mês
      const movimentosPorMes = new Map<string, { entrada: number; saida: number }>();

      (movimentosData as MovimentoFinanceiroDB[]).forEach((movimento) => {
        const mes = format(new Date(movimento.data_movimento), 'MMM/yyyy', { locale: ptBR });
        const current = movimentosPorMes.get(mes) || { entrada: 0, saida: 0 };

        if (movimento.tipo_movimento === 'entrada') {
          current.entrada += movimento.valor;
        } else {
          current.saida += movimento.valor;
        }

        movimentosPorMes.set(mes, current);
      });

      return Array.from(movimentosPorMes.entries()).map(([mes, valores]) => ({
        mes,
        entrada: valores.entrada,
        saida: valores.saida,
        saldo: valores.entrada - valores.saida
      }));
    } catch (error) {
      console.error("Erro ao carregar movimentos financeiros:", error);
      return [];
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setLoadingReports(true);

      const startDate = new Date(dataInicio);
      const endDate = new Date(dataFim);

      // Vendas do período (apenas pedidos confirmados)
      const { data: pedidosData, error: pedidosError } = await supabase
        .from("pedidos")
        .select("id, total, data_pedido, status")
        .gte("data_pedido", startDate.toISOString())
        .lte("data_pedido", endDate.toISOString())
        .eq("status", "confirmado");

      if (pedidosError) throw pedidosError;

      const vendasPeriodo = pedidosData?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

      // Vendas do período anterior para comparação
      const periodoAnteriorStart = new Date(startDate);
      const periodoAnteriorEnd = new Date(endDate);
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      periodoAnteriorStart.setDate(periodoAnteriorStart.getDate() - diffDays);
      periodoAnteriorEnd.setDate(periodoAnteriorEnd.getDate() - diffDays);

      const { data: pedidosAnterioresData } = await supabase
        .from("pedidos")
        .select("total")
        .gte("data_pedido", periodoAnteriorStart.toISOString())
        .lte("data_pedido", periodoAnteriorEnd.toISOString())
        .eq("status", "confirmado");

      const vendasPeriodoAnterior = pedidosAnterioresData?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

      // Crescimento de vendas
      const crescimentoVendas = vendasPeriodoAnterior > 0
        ? ((vendasPeriodo - vendasPeriodoAnterior) / vendasPeriodoAnterior) * 100
        : vendasPeriodo > 0 ? 100 : 0;

      // Produtos mais vendidos (apenas de pedidos confirmados)
      const { data: produtosVendidosData, error: produtosError } = await supabase
        .from("pedido_itens")
        .select(`
          quantidade,
          preco_unitario,
          produtos (titulo),
          pedidos!inner(data_pedido, status)
        `)
        .gte("pedidos.data_pedido", startDate.toISOString())
        .lte("pedidos.data_pedido", endDate.toISOString())
        .eq("pedidos.status", "confirmado");

      if (produtosError) throw produtosError;

      const produtosMap = new Map<string, { quantidade: number; total: number }>();
      
      (produtosVendidosData as unknown as ProdutoVendidoDB[])?.forEach((item) => {
        const nome = item.produtos?.titulo || "Produto Desconhecido";
        const total = item.quantidade * item.preco_unitario;

        if (produtosMap.has(nome)) {
          const dadosAtuais = produtosMap.get(nome)!;
          produtosMap.set(nome, {
            quantidade: dadosAtuais.quantidade + item.quantidade,
            total: dadosAtuais.total + total,
          });
        } else {
          produtosMap.set(nome, {
            quantidade: item.quantidade,
            total: total,
          });
        }
      });

      const produtosMaisVendidos = Array.from(produtosMap.entries())
        .map(([nome, dados]) => ({
          nome,
          quantidade: dados.quantidade,
          total: dados.total,
        }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

      // Clientes ativos (que fizeram pedidos confirmados no período)
      const clientesUnicos = new Set(
        pedidosData?.map((pedido) => pedido.id).filter(Boolean)
      );
      const clientesAtivos = clientesUnicos.size;

      // Ticket médio
      const numeroPedidos = pedidosData?.length || 1;
      const ticketMedio = numeroPedidos > 0 ? vendasPeriodo / numeroPedidos : 0;

      // Movimentos financeiros do período
      const movimentosFinanceiros = await loadMovimentosFinanceiros(startDate, endDate);

      setReportData({
        vendasMes: vendasPeriodo,
        vendasMesAnterior: vendasPeriodoAnterior,
        crescimentoVendas,
        produtosMaisVendidos,
        clientesAtivos,
        ticketMedio,
        movimentosFinanceiros,
      });
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
    } finally {
      setLoadingReports(false);
    }
  }, [dataInicio, dataFim, loadMovimentosFinanceiros]);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user, loadReports, periodo, dataInicio, dataFim]);

  const gerarRelatorioPrePedidos = async () => {
    try {
      setLoadingPrePedidos(true);

      const { data: prePedidosData, error } = await supabase
        .from("pre_pedidos")
        .select(`
          id,
          total,
          status,
          created_at,
          observacoes,
          condicao_pagamento,
          cliente:clientes (
            id,
            tipo_cliente,
            razao_social,
            nome_fantasia,
            nome,
            sobrenome,
            email,
            telefone,
            cidade,
            estado
          )
        `)
        .gte("created_at", filtroPrePedidos.dataInicio + "T00:00:00")
        .lte("created_at", filtroPrePedidos.dataFim + "T23:59:59")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Carregar itens dos pré-pedidos
      const prePedidosComItens = await Promise.all(
        (prePedidosData || []).map(async (prePedido: PrePedidoDB) => {
          const { data: itensData } = await supabase
            .from("pre_pedido_itens")
            .select(`
              id,
              produto_id,
              quantidade,
              preco_unitario,
              produtos (titulo)
            `)
            .eq("pre_pedido_id", prePedido.id);

          const clienteData = Array.isArray(prePedido.cliente) 
            ? prePedido.cliente[0] 
            : prePedido.cliente;

          return {
            id: prePedido.id,
            cliente_id: clienteData?.id || '',
            total: prePedido.total,
            status: prePedido.status,
            created_at: prePedido.created_at,
            observacoes: prePedido.observacoes,
            condicao_pagamento: prePedido.condicao_pagamento,
            itens: (itensData as unknown as PrePedidoItem[]) || [],
            cliente: clienteData || null
          };
        })
      );

      setRelatorioPrePedidos(prePedidosComItens);
    } catch (error) {
      console.error("Erro ao gerar relatório de pré-pedidos:", error);
    } finally {
      setLoadingPrePedidos(false);
    }
  };

  // CSV FORMATADO CORRETAMENTE - COLUNAS SEPARADAS
  const handleExportProdutos = () => {
    const headers = ["Posição", "Produto", "Quantidade Vendida", "Valor Total", "Preço Médio"];
    const rows = reportData.produtosMaisVendidos.map((produto, index) => [
      (index + 1).toString(),
      produto.nome,
      produto.quantidade.toString(),
      formatCurrency(produto.total),
      formatCurrency(produto.total / produto.quantidade)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    
    downloadCSV(csvContent, `produtos-mais-vendidos-${format(new Date(), 'dd-MM-yyyy')}.csv`);
  };

  const handleExportFinanceiro = () => {
    const headers = ["Mês", "Entradas (R$)", "Saídas (R$)", "Saldo (R$)"];
    const rows = reportData.movimentosFinanceiros.map(movimento => [
      movimento.mes,
      movimento.entrada.toFixed(2),
      movimento.saida.toFixed(2),
      movimento.saldo.toFixed(2)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    
    downloadCSV(csvContent, `evolucao-financeira-${format(new Date(), 'dd-MM-yyyy')}.csv`);
  };

  const handleExportPrePedidos = () => {
    if (relatorioPrePedidos.length === 0) {
      alert("Nenhum pré-pedido para exportar");
      return;
    }

    const headers = [
      "ID", 
      "Data", 
      "Status", 
      "Cliente", 
      "Email", 
      "Telefone",
      "Total (R$)", 
      "Condição Pagamento",
      "Observações"
    ];
    
    const rows = relatorioPrePedidos.map(pedido => [
      pedido.id.slice(0, 8),
      formatDate(pedido.created_at),
      pedido.status,
      pedido.cliente?.razao_social || 
      pedido.cliente?.nome_fantasia || 
      `${pedido.cliente?.nome} ${pedido.cliente?.sobrenome}` ||
      'Cliente não informado',
      pedido.cliente?.email || '',
      pedido.cliente?.telefone || '',
      pedido.total.toFixed(2),
      pedido.condicao_pagamento,
      pedido.observacoes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    
    downloadCSV(csvContent, `pre-pedidos-${format(new Date(), 'dd-MM-yyyy')}.csv`);
  };

  // PDF REAL - NÃO CSV
  const handleExportResumoPDF = () => {
    const content = `
      <div class="header">
        <h1>Relatório do Período</h1>
        <p>Período: ${formatDate(dataInicio)} - ${formatDate(dataFim)}</p>
        <p>Data do Relatório: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>

      <div class="section">
        <h2>Métricas Principais</h2>
        <table>
          <tr>
            <th>Indicador</th>
            <th>Valor</th>
          </tr>
          <tr>
            <td>Total de Vendas</td>
            <td>${formatCurrency(reportData.vendasMes)}</td>
          </tr>
          <tr>
            <td>Período Anterior</td>
            <td>${formatCurrency(reportData.vendasMesAnterior)}</td>
          </tr>
          <tr>
            <td>Crescimento</td>
            <td class="${reportData.crescimentoVendas >= 0 ? 'positive' : 'negative'}">
              ${reportData.crescimentoVendas >= 0 ? '+' : ''}${reportData.crescimentoVendas.toFixed(1)}%
            </td>
          </tr>
          <tr>
            <td>Ticket Médio</td>
            <td>${formatCurrency(reportData.ticketMedio)}</td>
          </tr>
          <tr>
            <td>Clientes Ativos</td>
            <td>${reportData.clientesAtivos}</td>
          </tr>
          <tr>
            <td>Produtos Diferentes Vendidos</td>
            <td>${reportData.produtosMaisVendidos.length}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>Produtos Mais Vendidos</h2>
        <table>
          <tr>
            <th>Posição</th>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Total</th>
          </tr>
          ${reportData.produtosMaisVendidos.slice(0, 10).map((produto, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${produto.nome}</td>
              <td>${produto.quantidade}</td>
              <td>${formatCurrency(produto.total)}</td>
            </tr>
          `).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Evolução Financeira</h2>
        <table>
          <tr>
            <th>Mês</th>
            <th>Entradas</th>
            <th>Saídas</th>
            <th>Saldo</th>
          </tr>
          ${reportData.movimentosFinanceiros.map(movimento => `
            <tr>
              <td>${movimento.mes}</td>
              <td>${formatCurrency(movimento.entrada)}</td>
              <td>${formatCurrency(movimento.saida)}</td>
              <td class="${movimento.saldo >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(movimento.saldo)}
              </td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;

    generatePDF(content, `relatorio-periodo-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || loadingReports) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios e Analytics</h1>
            <p className="text-gray-600">Acompanhe o desempenho do seu negócio</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Filter size={20} className="mr-2 text-blue-600" />
            Filtros do Relatório
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={periodo}
                onChange={(e) => {
                  setPeriodo(e.target.value as "30dias" | "90dias" | "ano");
                  const days = e.target.value === "30dias" ? 30 : e.target.value === "90dias" ? 90 : 365;
                  setDataInicio(format(subDays(new Date(), days), "yyyy-MM-dd"));
                  setDataFim(format(new Date(), "yyyy-MM-dd"));
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="30dias">Últimos 30 dias</option>
                <option value="90dias">Últimos 90 dias</option>
                <option value="ano">Último ano</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadReports}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas do Período</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(reportData.vendasMes)}
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp size={16} className={`mr-1 ${
                    reportData.crescimentoVendas >= 0 ? "text-green-500" : "text-red-500"
                  }`} />
                  <span className={`text-sm font-medium ${
                    reportData.crescimentoVendas >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {reportData.crescimentoVendas >= 0 ? "+" : ""}
                    {reportData.crescimentoVendas.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs anterior</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(reportData.ticketMedio)}
                </p>
                <p className="text-sm text-gray-500 mt-2">por pedido</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.clientesAtivos}
                </p>
                <p className="text-sm text-gray-500 mt-2">no período</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produtos em Destaque</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reportData.produtosMaisVendidos.length}
                </p>
                <p className="text-sm text-gray-500 mt-2">mais vendidos</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Package size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos e Tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Produtos Mais Vendidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 size={20} className="mr-2 text-blue-600" />
                Produtos Mais Vendidos
              </h2>
              <button
                onClick={handleExportProdutos}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center transition-colors text-sm"
              >
                <Download size={16} className="mr-2" />
                Exportar CSV
              </button>
            </div>
            <div className="space-y-4">
              {reportData.produtosMaisVendidos.slice(0, 8).map((produto, index) => (
                <div
                  key={produto.nome}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-semibold text-blue-600">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{produto.nome}</p>
                      <p className="text-sm text-gray-600">
                        {produto.quantidade} unidades
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(produto.total)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(produto.total / produto.quantidade)}/un
                    </p>
                  </div>
                </div>
              ))}
              {reportData.produtosMaisVendidos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum produto vendido no período
                </div>
              )}
            </div>
          </div>

          {/* Evolução Financeira */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <TrendingUp size={20} className="mr-2 text-green-600" />
                Evolução Financeira
              </h2>
              <button
                onClick={handleExportFinanceiro}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center transition-colors text-sm"
              >
                <Download size={16} className="mr-2" />
                Exportar CSV
              </button>
            </div>
            <div className="space-y-4">
              {reportData.movimentosFinanceiros.map((movimento, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <p className="font-medium text-gray-900 mb-3">{movimento.mes}</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-green-600 font-semibold">Entradas</div>
                      <div className="font-bold text-green-700 mt-1">
                        {formatCurrency(movimento.entrada)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-semibold">Saídas</div>
                      <div className="font-bold text-red-700 mt-1">
                        {formatCurrency(movimento.saida)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold ${
                        movimento.saldo >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        Saldo
                      </div>
                      <div className={`font-bold mt-1 ${
                        movimento.saldo >= 0 ? "text-green-700" : "text-red-700"
                      }`}>
                        {formatCurrency(movimento.saldo)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {reportData.movimentosFinanceiros.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum movimento financeiro no período
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relatório de Pré-Pedidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText size={20} className="mr-2 text-purple-600" />
              Relatório de Pré-Pedidos
            </h2>
            {relatorioPrePedidos.length > 0 && (
              <button
                onClick={handleExportPrePedidos}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center transition-colors text-sm"
              >
                <Download size={16} className="mr-2" />
                Exportar CSV
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Início
              </label>
              <input
                type="date"
                value={filtroPrePedidos.dataInicio}
                onChange={(e) =>
                  setFiltroPrePedidos((prev) => ({
                    ...prev,
                    dataInicio: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Fim
              </label>
              <input
                type="date"
                value={filtroPrePedidos.dataFim}
                onChange={(e) =>
                  setFiltroPrePedidos((prev) => ({
                    ...prev,
                    dataFim: e.target.value,
                  }))
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={gerarRelatorioPrePedidos}
                disabled={loadingPrePedidos}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                {loadingPrePedidos ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileText size={20} className="mr-2" />
                    Gerar Relatório
                  </>
                )}
              </button>
            </div>
          </div>

          {relatorioPrePedidos.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">
                {relatorioPrePedidos.length} Pré-Pedidos Encontrados
              </h3>
              {relatorioPrePedidos.map((prePedido) => (
                <div key={prePedido.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">ID do Pedido</p>
                      <p className="font-mono text-sm font-semibold">{prePedido.id.slice(0, 8)}...</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Data</p>
                      <p className="font-semibold">{formatDate(prePedido.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        prePedido.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                        prePedido.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {prePedido.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Cliente</p>
                      <p className="font-semibold">
                        {prePedido.cliente?.razao_social || 
                         prePedido.cliente?.nome_fantasia || 
                         `${prePedido.cliente?.nome} ${prePedido.cliente?.sobrenome}` ||
                         'Cliente não informado'}
                      </p>
                      {prePedido.cliente?.email && (
                        <p className="text-sm text-gray-600">{prePedido.cliente.email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatCurrency(prePedido.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo do Período */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Resumo do Período</h2>
              <p className="text-blue-100">
                Período: {formatDate(dataInicio)} - {formatDate(dataFim)}
              </p>
            </div>
            <button
              onClick={handleExportResumoPDF}
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold flex items-center transition-colors"
            >
              <FileText size={20} className="mr-2" />
              Exportar PDF
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm">Total de Vendas</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(reportData.vendasMes)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm">Crescimento</p>
              <p className={`text-2xl font-bold mt-1 ${
                reportData.crescimentoVendas >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {reportData.crescimentoVendas >= 0 ? '+' : ''}{reportData.crescimentoVendas.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm">Ticket Médio</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(reportData.ticketMedio)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <p className="text-blue-100 text-sm">Clientes Ativos</p>
              <p className="text-2xl font-bold mt-1">{reportData.clientesAtivos}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}