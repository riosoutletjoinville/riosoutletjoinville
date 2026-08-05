// components/contador/FiscalSummary.tsx
"use client";

import { FileText, CheckCircle, XCircle, Clock, Download } from "lucide-react";

interface FiscalSummaryProps {
  stats: {
    totalNFEmitidas: number;
    totalNFAutorizadas: number;
    totalNFCanceladas: number;
    totalNFPendentes: number;
    totalXMLGerados: number;
    valorTotalNF: number;
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export function FiscalSummary({ stats, dateRange }: FiscalSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Resumo Fiscal</h2>
        <p className="text-sm text-gray-500 mt-1">
          Período: {dateRange.startDate.toLocaleDateString('pt-BR')} - {dateRange.endDate.toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="p-6">
        {/* Cards de Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Autorizadas</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalNFAutorizadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.totalNFPendentes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Canceladas</p>
                <p className="text-2xl font-bold text-red-900">{stats.totalNFCanceladas}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">XML Gerados</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalXMLGerados}</p>
              </div>
              <Download className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Totais */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total de NF-e Emitidas</p>
              <p className="text-sm text-gray-900">{stats.totalNFEmitidas} notas</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.valorTotalNF)}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ticket Médio por NF:</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(stats.totalNFEmitidas > 0 ? stats.valorTotalNF / stats.totalNFEmitidas : 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}