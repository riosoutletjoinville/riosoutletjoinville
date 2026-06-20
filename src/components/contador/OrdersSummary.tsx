// components/contador/OrdersSummary.tsx
"use client";

import { ShoppingCart, TrendingUp, TrendingDown, Package, AlertCircle } from "lucide-react";

interface OrdersSummaryProps {
  stats: {
    totalPedidosMes: number;
    totalVendasMes: number;
    ticketMedio: number;
    pedidosCancelados: number;
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export function OrdersSummary({ stats, dateRange }: OrdersSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const taxaCancelamento = stats.totalPedidosMes > 0 
    ? (stats.pedidosCancelados / stats.totalPedidosMes) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
          Resumo de Pedidos
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Período: {dateRange.startDate.toLocaleDateString('pt-BR')} - {dateRange.endDate.toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="p-6">
        {/* Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <Package className="h-10 w-10 text-blue-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-blue-900">{stats.totalPedidosMes}</p>
            <p className="text-sm text-blue-600">Total de Pedidos</p>
          </div>

          <div className="bg-green-50 rounded-lg p-6 text-center">
            <TrendingUp className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-green-900">{formatCurrency(stats.totalVendasMes)}</p>
            <p className="text-sm text-green-600">Total de Vendas</p>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-purple-50 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-purple-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-purple-900">{formatCurrency(stats.ticketMedio)}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-500" />
          </div>
          <div className="mt-3 text-sm text-purple-600">
            Valor médio por pedido no período
          </div>
        </div>

        {/* Cancelamentos */}
        <div className="bg-red-50 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-red-600">Cancelamentos</p>
              <p className="text-2xl font-bold text-red-900">{stats.pedidosCancelados}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Taxa de Cancelamento:</span>
              <span className="font-semibold text-red-900">{taxaCancelamento.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-red-200 rounded-full h-2 mt-2">
              <div 
                className="bg-red-600 h-2 rounded-full" 
                style={{ width: `${Math.min(taxaCancelamento, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Comparativo com Período Anterior */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Indicadores</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Pedidos por dia (média):</p>
              <p className="font-semibold text-gray-900">
                {(stats.totalPedidosMes / Math.max(1, (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Vendas por dia (média):</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(stats.totalVendasMes / Math.max(1, (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}