// components/contador/FiscalReport.tsx - Novo componente para relatório consolidado
"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FiscalReportProps {
  stats: {
    totalNFEmitidas: number;
    totalNFAutorizadas: number;
    totalNFCanceladas: number;
    totalNFPendentes: number;
    totalXMLGerados: number;
    valorTotalNF: number;
    totalReceber: number;
    totalReceberVencido: number;
    totalReceberAberto: number;
    totalReceberPago: number;
    totalPagar: number;
    saldoFinanceiro: number;
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

export function FiscalReport({ stats, dateRange }: FiscalReportProps) {
  const [showExportOptions, setShowExportOptions] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const taxaCancelamento = stats.totalPedidosMes > 0 
    ? (stats.pedidosCancelados / stats.totalPedidosMes) * 100 
    : 0;

  const exportToExcel = () => {
    // Dados Fiscais
    const fiscalData = [{
      'Indicador': 'Total de NF-e Emitidas',
      'Valor': stats.totalNFEmitidas,
      'Detalhes': `Autorizadas: ${stats.totalNFAutorizadas} | Canceladas: ${stats.totalNFCanceladas} | Pendentes: ${stats.totalNFPendentes}`
    }, {
      'Indicador': 'Valor Total NF-e',
      'Valor': stats.valorTotalNF,
      'Detalhes': formatCurrency(stats.valorTotalNF)
    }, {
      'Indicador': 'XML Gerados',
      'Valor': stats.totalXMLGerados,
      'Detalhes': `${stats.totalXMLGerados} arquivos`
    }];

    // Dados Financeiros
    const financialData = [{
      'Indicador': 'Saldo Financeiro',
      'Valor': stats.saldoFinanceiro,
      'Detalhes': formatCurrency(stats.saldoFinanceiro)
    }, {
      'Indicador': 'Total a Receber',
      'Valor': stats.totalReceber,
      'Detalhes': `Vencido: ${formatCurrency(stats.totalReceberVencido)} | Aberto: ${formatCurrency(stats.totalReceberAberto)}`
    }, {
      'Indicador': 'Recebido no Período',
      'Valor': stats.totalReceberPago,
      'Detalhes': formatCurrency(stats.totalReceberPago)
    }, {
      'Indicador': 'Total a Pagar',
      'Valor': stats.totalPagar,
      'Detalhes': formatCurrency(stats.totalPagar)
    }];

    // Dados de Pedidos
    const ordersData = [{
      'Indicador': 'Total de Pedidos',
      'Valor': stats.totalPedidosMes,
      'Detalhes': `${stats.totalPedidosMes} pedidos`
    }, {
      'Indicador': 'Total de Vendas',
      'Valor': stats.totalVendasMes,
      'Detalhes': formatCurrency(stats.totalVendasMes)
    }, {
      'Indicador': 'Ticket Médio',
      'Valor': stats.ticketMedio,
      'Detalhes': formatCurrency(stats.ticketMedio)
    }, {
      'Indicador': 'Cancelamentos',
      'Valor': stats.pedidosCancelados,
      'Detalhes': `Taxa: ${taxaCancelamento.toFixed(1)}%`
    }];

    const wsFiscal = XLSX.utils.json_to_sheet(fiscalData);
    const wsFinancial = XLSX.utils.json_to_sheet(financialData);
    const wsOrders = XLSX.utils.json_to_sheet(ordersData);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsFiscal, 'Resumo Fiscal');
    XLSX.utils.book_append_sheet(wb, wsFinancial, 'Resumo Financeiro');
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Resumo de Pedidos');
    
    XLSX.writeFile(wb, `relatorio_fiscal_${dateRange.startDate.toISOString().split('T')[0]}_a_${dateRange.endDate.toISOString().split('T')[0]}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    const logoUrl = '/logomarca.jpg';
    const img = new Image();
    img.src = logoUrl;
    await new Promise((resolve) => { img.onload = resolve; });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const imgX = margin + 2;
    const imgY = margin + 2;
    const imgWidth = 40;
    const imgHeight = 15;
    const textX = pageWidth - margin - 2;
    
    // Cabeçalho
    doc.addImage(img, 'JPEG', imgX, imgY, imgWidth, imgHeight);
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Relatório Fiscal Consolidado', textX - 45, imgY + 5, { align: 'right' });
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Período: ${dateRange.startDate.toLocaleDateString('pt-BR')} - ${dateRange.endDate.toLocaleDateString('pt-BR')}`, textX - 55, imgY + 15, { align: 'right' });
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, textX, imgY + 20, { align: 'right' });
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, imgY + imgHeight + 8, pageWidth - margin, imgY + imgHeight + 8);
    
    let currentY = imgY + imgHeight + 15;
    
    // Resumo Fiscal
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumo Fiscal', margin, currentY);
    currentY += 6;
    
    const fiscalTable = [
      ['Total de NF-e Emitidas', stats.totalNFEmitidas.toString(), `Autorizadas: ${stats.totalNFAutorizadas} | Canceladas: ${stats.totalNFCanceladas} | Pendentes: ${stats.totalNFPendentes}`],
      ['Valor Total NF-e', formatCurrency(stats.valorTotalNF), ''],
      ['XML Gerados', stats.totalXMLGerados.toString(), '']
    ];
    
    autoTable(doc, {
      body: fiscalTable,
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 35 }, 2: { cellWidth: 90 } }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Resumo Financeiro
    doc.setFontSize(12);
    doc.text('Resumo Financeiro', margin, currentY);
    currentY += 6;
    
    const financialTable = [
      ['Saldo Financeiro', formatCurrency(stats.saldoFinanceiro), ''],
      ['Total a Receber', formatCurrency(stats.totalReceber), `Vencido: ${formatCurrency(stats.totalReceberVencido)} | Aberto: ${formatCurrency(stats.totalReceberAberto)}`],
      ['Recebido no Período', formatCurrency(stats.totalReceberPago), ''],
      ['Total a Pagar', formatCurrency(stats.totalPagar), '']
    ];
    
    autoTable(doc, {
      body: financialTable,
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 35 }, 2: { cellWidth: 90 } }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
    
    // Resumo de Pedidos
    doc.setFontSize(12);
    doc.text('Resumo de Pedidos', margin, currentY);
    currentY += 6;
    
    const ordersTable = [
      ['Total de Pedidos', stats.totalPedidosMes.toString(), `${stats.totalPedidosMes} pedidos`],
      ['Total de Vendas', formatCurrency(stats.totalVendasMes), ''],
      ['Ticket Médio', formatCurrency(stats.ticketMedio), ''],
      ['Cancelamentos', stats.pedidosCancelados.toString(), `Taxa: ${taxaCancelamento.toFixed(1)}%`]
    ];
    
    autoTable(doc, {
      body: ordersTable,
      startY: currentY,
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 35 }, 2: { cellWidth: 90 } }
    });
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Rios Outlet - Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - margin, { align: 'center' });
    }
    
    doc.save(`relatorio_fiscal_${dateRange.startDate.toISOString().split('T')[0]}_a_${dateRange.endDate.toISOString().split('T')[0]}.pdf`);
    setShowExportOptions(false);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Relatório Fiscal Consolidado</h2>
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <button onClick={exportToExcel} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Exportar Excel
                </button>
                <button onClick={exportToPDF} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md">
                  <FileText className="h-4 w-4 mr-2 text-red-600" /> Exportar PDF
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Período: {dateRange.startDate.toLocaleDateString('pt-BR')} - {dateRange.endDate.toLocaleDateString('pt-BR')}
        </p>

        {/* Resumo Fiscal */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Fiscal</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Total NF-e</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalNFEmitidas}</p>
              <p className="text-xs text-blue-600 mt-1">Autorizadas: {stats.totalNFAutorizadas}</p>
              <p className="text-xs text-blue-600">Canceladas: {stats.totalNFCanceladas}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Valor Total NF-e</p>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.valorTotalNF)}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600">XML Gerados</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalXMLGerados}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Ticket Médio NF</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalNFEmitidas > 0 ? stats.valorTotalNF / stats.totalNFEmitidas : 0)}</p>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`rounded-lg p-4 ${stats.saldoFinanceiro >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-sm ${stats.saldoFinanceiro >= 0 ? 'text-green-600' : 'text-red-600'}`}>Saldo Financeiro</p>
              <p className={`text-2xl font-bold ${stats.saldoFinanceiro >= 0 ? 'text-green-900' : 'text-red-900'}`}>{formatCurrency(stats.saldoFinanceiro)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-600">Total a Receber</p>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(stats.totalReceber)}</p>
              <p className="text-xs text-yellow-600 mt-1">Vencido: {formatCurrency(stats.totalReceberVencido)}</p>
              <p className="text-xs text-yellow-600">Recebido: {formatCurrency(stats.totalReceberPago)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Total a Pagar</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.totalPagar)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600">Índice de Inadimplência</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalReceber > 0 ? ((stats.totalReceberVencido / stats.totalReceber) * 100).toFixed(1) : 0}%</p>
            </div>
          </div>
        </div>

        {/* Resumo de Pedidos */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Pedidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-sm text-indigo-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-indigo-900">{stats.totalPedidosMes}</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm text-emerald-600">Total de Vendas</p>
              <p className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.totalVendasMes)}</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4">
              <p className="text-sm text-cyan-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-cyan-900">{formatCurrency(stats.ticketMedio)}</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-4">
              <p className="text-sm text-rose-600">Cancelamentos</p>
              <p className="text-2xl font-bold text-rose-900">{stats.pedidosCancelados}</p>
              <p className="text-xs text-rose-600">Taxa: {taxaCancelamento.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Indicadores Gerais */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Indicadores Gerais</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Média Pedidos/Dia</p>
              <p className="text-lg font-bold text-gray-900">
                {(stats.totalPedidosMes / Math.max(1, (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Média Vendas/Dia</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(stats.totalVendasMes / Math.max(1, (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Taxa de Recebimento</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.totalReceber > 0 ? ((stats.totalReceberPago / stats.totalReceber) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Eficiência Operacional</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.totalPedidosMes > 0 ? ((stats.totalPedidosMes - stats.pedidosCancelados) / stats.totalPedidosMes * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}