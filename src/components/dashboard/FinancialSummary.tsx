// components/dashboard/FinancialSummary.tsx
"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, ExternalLink } from "lucide-react";

interface FinancialSummaryProps {
  receitaMes: number;
  despesaMes: number;
  saldoMes: number;
  lucroPercentual: number;
}

export function FinancialSummary({ 
  receitaMes, 
  despesaMes, 
  saldoMes, 
  lucroPercentual 
}: FinancialSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Resumo Financeiro
        </h2>
        <Link
          href="/dashboard/finance"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
        >
          Ver detalhes
          <ExternalLink className="h-3 w-3 ml-1" />
        </Link>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-gray-700 dark:text-gray-300">Receita do Mês</span>
          </div>
          <span className="text-green-600 dark:text-green-400 font-semibold">
            {formatCurrency(receitaMes)}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <TrendingDown className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-gray-700 dark:text-gray-300">Despesa do Mês</span>
          </div>
          <span className="text-red-600 dark:text-red-400 font-semibold">
            {formatCurrency(despesaMes)}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-4">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-blue-500 mr-3" />
            <span className="text-gray-900 dark:text-white font-semibold">Saldo Final</span>
          </div>
          <span className={`text-lg font-bold ${
            saldoMes >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(saldoMes)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Margem de Lucro</span>
            <span>{lucroPercentual.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                lucroPercentual >= 20 ? 'bg-green-500' : 
                lucroPercentual >= 10 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(lucroPercentual, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}