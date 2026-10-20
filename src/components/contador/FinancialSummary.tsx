// components/contador/FinancialSummary.tsx
"use client";

import { TrendingUp, TrendingDown, DollarSign, CreditCard, Calendar, Wallet } from "lucide-react";

interface FinancialSummaryProps {
  stats: {
    totalReceber: number;
    totalReceberVencido: number;
    totalReceberAberto: number;
    totalReceberPago: number;
    totalPagar: number;
    totalPagarVencido: number;
    totalPagarAberto: number;
    totalPagarPago: number;
    saldoFinanceiro: number;
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export function FinancialSummary({ stats, dateRange }: FinancialSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Resumo Financeiro</h2>
        <p className="text-sm text-gray-500 mt-1">
          Período: {dateRange.startDate.toLocaleDateString('pt-BR')} - {dateRange.endDate.toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="p-6">
        {/* Saldo Geral */}
        <div className={`rounded-lg p-6 mb-6 ${stats.saldoFinanceiro >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white text-sm opacity-90">Saldo Financeiro</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(stats.saldoFinanceiro)}</p>
            </div>
            {stats.saldoFinanceiro >= 0 ? (
              <TrendingUp className="h-12 w-12 text-white opacity-80" />
            ) : (
              <TrendingDown className="h-12 w-12 text-white opacity-80" />
            )}
          </div>
        </div>

        {/* Contas a Receber */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            Contas a Receber
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Total a Receber</p>
              <p className="text-xl font-bold text-green-900">{formatCurrency(stats.totalReceber)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Vencido</p>
              <p className="text-xl font-bold text-red-900">{formatCurrency(stats.totalReceberVencido)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Aberto</p>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(stats.totalReceberAberto)}</p>
            </div>
          </div>
          <div className="mt-3 text-right">
            <p className="text-sm text-gray-600">
              Recebido no período: <span className="font-semibold text-green-600">{formatCurrency(stats.totalReceberPago)}</span>
            </p>
          </div>
        </div>

        {/* Contas a Pagar */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 text-red-600 mr-2" />
            Contas a Pagar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Total a Pagar</p>
              <p className="text-xl font-bold text-red-900">{formatCurrency(stats.totalPagar)}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600">Vencido</p>
              <p className="text-xl font-bold text-orange-900">{formatCurrency(stats.totalPagarVencido)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600">Aberto</p>
              <p className="text-xl font-bold text-yellow-900">{formatCurrency(stats.totalPagarAberto)}</p>
            </div>
          </div>
          <div className="mt-3 text-right">
            <p className="text-sm text-gray-600">
              Pago no período: <span className="font-semibold text-green-600">{formatCurrency(stats.totalPagarPago)}</span>
            </p>
          </div>
        </div>

        {/* Indicadores */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Índice de Inadimplência:</span>
              <span className="font-semibold text-red-600">
                {stats.totalReceber > 0 ? ((stats.totalReceberVencido / stats.totalReceber) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taxa de Recebimento:</span>
              <span className="font-semibold text-green-600">
                {stats.totalReceber > 0 ? ((stats.totalReceberPago / stats.totalReceber) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}