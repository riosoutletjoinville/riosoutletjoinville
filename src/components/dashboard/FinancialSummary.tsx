// components/dashboard/FinancialSummary.tsx
"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, ExternalLink, MinusCircle, Receipt } from "lucide-react";

interface FinancialSummaryProps {
  faturamentoBruto: number;
  estornoMes: number;
  despesaMes: number;
  saldoLiquido: number;
  lucroPercentual: number;
}

export function FinancialSummary({ 
  faturamentoBruto, 
  estornoMes, 
  despesaMes, 
  saldoLiquido, 
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
          href="/dashboard/financeiro"
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
        >
          Ver detalhes
          <ExternalLink className="h-3 w-3 ml-1" />
        </Link>
      </div>
      
      <div className="space-y-4">
        {/* Faturamento Bruto */}
        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <Receipt className="h-5 w-5 text-blue-500 mr-3" />
            <span className="text-gray-700 dark:text-gray-300">Faturamento Bruto</span>
          </div>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">
            {formatCurrency(faturamentoBruto)}
          </span>
        </div>
        
        {/* Estornos */}
        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <MinusCircle className="h-5 w-5 text-orange-500 mr-3" />
            <span className="text-gray-700 dark:text-gray-300">Estornos</span>
          </div>
          <span className="text-orange-600 dark:text-orange-400 font-semibold">
            -{formatCurrency(estornoMes)}
          </span>
        </div>
        
        {/* Despesas */}
        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <TrendingDown className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-gray-700 dark:text-gray-300">Despesas</span>
          </div>
          <span className="text-red-600 dark:text-red-400 font-semibold">
            -{formatCurrency(despesaMes)}
          </span>
        </div>
        
        {/* Subtotal após estornos e despesas */}
        <div className="flex justify-between items-center py-2 px-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal (Bruto - Estornos - Despesas)</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatCurrency(faturamentoBruto - estornoMes - despesaMes)}
          </span>
        </div>
        
        {/* Saldo Líquido */}
        <div className="flex justify-between items-center py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-500 mr-3" />
            <span className="text-gray-900 dark:text-white font-bold">Saldo Líquido</span>
          </div>
          <span className={`text-xl font-bold ${
            saldoLiquido >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(saldoLiquido)}
          </span>
        </div>

        {/* Progress Bar - Margem de Lucro */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Margem de Lucro</span>
            <span>{lucroPercentual.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                lucroPercentual >= 20 ? 'bg-green-500' : 
                lucroPercentual >= 10 ? 'bg-yellow-500' : 
                lucroPercentual >= 0 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(Math.max(lucroPercentual, 0), 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}