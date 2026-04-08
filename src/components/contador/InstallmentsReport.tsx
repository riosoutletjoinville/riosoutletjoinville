// components/contador/InstallmentsReport.tsx - Versão com paginação e exportação
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, CreditCard, Calendar, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, FileSpreadsheet, File as FilePdf, X } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InstallmentsReportProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startDate: Date, endDate: Date) => void;
  type: 'excel' | 'pdf';
}

function ExportModal({ isOpen, onClose, onConfirm, type }: ExportModalProps) {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Exportar para {type === 'excel' ? 'Excel' : 'PDF'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Selecione o período para exportar as parcelas:
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancelar
          </button>
          <button onClick={() => onConfirm(startDate, endDate)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}

export function InstallmentsReport({ dateRange: initialDateRange }: InstallmentsReportProps) {
  const [parcelas, setParcelas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPorStatus, setTotalPorStatus] = useState({
    pendente: 0,
    pago: 0,
    atrasado: 0,
    cancelado: 0,
  });

  useEffect(() => {
    loadParcelas();
  }, [initialDateRange, currentPage, filterStatus, searchTerm]);

  const loadParcelas = async () => {
    setLoading(true);
    try {
      const startDateStr = initialDateRange.startDate.toISOString().split('T')[0];
      const endDateStr = initialDateRange.endDate.toISOString().split('T')[0];

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from("pre_pedido_parcelas")
        .select(`
          *,
          pre_pedidos (
            id,
            total,
            cliente_id,
            clientes (nome, razao_social, cpf, cnpj)
          )
        `, { count: "exact" })
        .gte("data_vencimento", startDateStr)
        .lte("data_vencimento", endDateStr)
        .order("data_vencimento", { ascending: true })
        .range(from, to);

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (searchTerm) {
        query = query.or(`pre_pedidos.clientes.nome.ilike.%${searchTerm}%,pre_pedidos.clientes.razao_social.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      setParcelas(data || []);
      setTotalItems(count || 0);

      // Calcular totais por status (buscar todos para os totais)
      const allQuery = supabase
        .from("pre_pedido_parcelas")
        .select(`*, pre_pedidos (id, total, cliente_id, clientes (nome, razao_social, cpf, cnpj))`)
        .gte("data_vencimento", startDateStr)
        .lte("data_vencimento", endDateStr);

      if (filterStatus !== "all") {
        allQuery.eq("status", filterStatus);
      }

      const { data: allData } = await allQuery;
      
      const totals = { pendente: 0, pago: 0, atrasado: 0, cancelado: 0 };
      (allData || []).forEach(parcela => {
        const valor = parcela.valor_parcela || 0;
        if (parcela.status === 'pendente') {
          if (new Date(parcela.data_vencimento) < new Date()) {
            totals.atrasado += valor;
          } else {
            totals.pendente += valor;
          }
        } else if (parcela.status === 'pago') {
          totals.pago += parcela.valor_pago || valor;
        } else if (parcela.status === 'cancelado') {
          totals.cancelado += valor;
        }
      });
      setTotalPorStatus(totals);
      
    } catch (error) {
      console.error("Erro ao carregar parcelas:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAllParcelasForExport = async (startDate: Date, endDate: Date) => {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      let query = supabase
        .from("pre_pedido_parcelas")
        .select(`
          *,
          pre_pedidos (
            id,
            total,
            cliente_id,
            clientes (nome, razao_social, cpf, cnpj)
          )
        `)
        .gte("data_vencimento", startDateStr)
        .lte("data_vencimento", endDateStr)
        .order("data_vencimento", { ascending: true });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (searchTerm) {
        query = query.or(`pre_pedidos.clientes.nome.ilike.%${searchTerm}%,pre_pedidos.clientes.razao_social.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar parcelas para exportação:", error);
      return [];
    }
  };

  const handleExportClick = (type: 'excel' | 'pdf') => {
    setExportType(type);
    setShowExportModal(true);
    setShowExportOptions(false);
  };

  const handleExportConfirm = async (startDate: Date, endDate: Date) => {
    setShowExportModal(false);
    if (exportType === 'excel') {
      await exportToExcel(startDate, endDate);
    } else {
      await exportToPDF(startDate, endDate);
    }
  };

  const exportToExcel = async (startDate: Date, endDate: Date) => {
    try {
      const allParcelas = await getAllParcelasForExport(startDate, endDate);
      
      const exportData = allParcelas.map(parcela => ({
        'Vencimento': new Date(parcela.data_vencimento).toLocaleDateString('pt-BR'),
        'Cliente': parcela.pre_pedidos?.clientes?.razao_social || parcela.pre_pedidos?.clientes?.nome || '-',
        'CPF/CNPJ': parcela.pre_pedidos?.clientes?.cnpj || parcela.pre_pedidos?.clientes?.cpf || '-',
        'Valor Parcela': parcela.valor_parcela,
        'Status': getStatusText(parcela.status),
        'Valor Pago': parcela.valor_pago || 0,
        'Data Pagamento': parcela.data_pagamento ? new Date(parcela.data_pagamento).toLocaleDateString('pt-BR') : '-',
        'Nº Parcela': parcela.numero_parcela,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const colWidths = [
        { wch: 12 }, { wch: 40 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 10 }
      ];
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Parcelas');
      XLSX.writeFile(wb, `parcelas_${startDate.toISOString().split('T')[0]}_a_${endDate.toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
    }
  };

  const exportToPDF = async (startDate: Date, endDate: Date) => {
    try {
      const allParcelas = await getAllParcelasForExport(startDate, endDate);
      
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
      
      const addHeader = (pageNumber: number) => {
        doc.addImage(img, 'JPEG', imgX, imgY, imgWidth, imgHeight);
        
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Relatório de Parcelas', textX - 50, imgY + 4, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        
        let currentY = imgY + 18;
        doc.text(`Período: ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`, textX - 60, currentY - 6, { align: 'right' });
        currentY += 5;
        doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, textX, currentY - 6, { align: 'right' });
        currentY += 5;
        doc.text(`Total: ${allParcelas.length} parcelas`, textX - 85, currentY - 11, { align: 'right' });
        
        if (filterStatus !== "all") {
          currentY += 5;
          doc.text(`Status: ${getStatusText(filterStatus)}`, textX, currentY, { align: 'right' });
        }
        if (searchTerm) {
          currentY += 5;
          doc.text(`Busca: "${searchTerm}"`, textX, currentY, { align: 'right' });
        }
        
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, imgY + imgHeight + 5, pageWidth - margin, imgY + imgHeight + 5);
        
        return imgY + imgHeight + 8;
      };
      
      const tableData = allParcelas.map(parcela => [
        new Date(parcela.data_vencimento).toLocaleDateString('pt-BR'),
        parcela.pre_pedidos?.clientes?.razao_social || parcela.pre_pedidos?.clientes?.nome || '-',
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valor_parcela),
        getStatusText(parcela.status),
        parcela.data_pagamento ? new Date(parcela.data_pagamento).toLocaleDateString('pt-BR') : '-'
      ]);
      
      const startY = addHeader(1);
      
      autoTable(doc, {
        head: [['Vencimento', 'Cliente', 'Valor', 'Status', 'Data Pagamento']],
        body: tableData,
        startY: startY,
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: margin, right: margin, top: startY, bottom: margin },
        didDrawPage: (data) => {
          if (data.pageNumber > 1) {
            const headerY = addHeader(data.pageNumber);
            data.cursor.y = headerY;
          }
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Rios Outlet - Página ${data.pageNumber} de ${pageCount}`, pageWidth / 2, pageHeight - margin, { align: 'center' });
        }
      });
      
      doc.save(`parcelas_${startDate.toISOString().split('T')[0]}_a_${endDate.toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Erro ao gerar PDF");
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'cancelado': return 'Cancelado';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  const getStatusBadge = (status: string, vencimento: string) => {
    if (status === 'pago') return { text: 'Pago', className: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (status === 'cancelado') return { text: 'Cancelado', className: 'bg-gray-100 text-gray-800', icon: XCircle };
    if (new Date(vencimento) < new Date()) return { text: 'Atrasado', className: 'bg-red-100 text-red-800', icon: XCircle };
    return { text: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: CreditCard };
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Controle de Parcelas</h2>
            <div className="relative">
              <button onClick={() => setShowExportOptions(!showExportOptions)} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" /> Exportar
              </button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button onClick={() => handleExportClick('excel')} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md">
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" /> Exportar Excel
                  </button>
                  <button onClick={() => handleExportClick('pdf')} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md">
                    <FilePdf className="h-4 w-4 mr-2 text-red-600" /> Exportar PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cards Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4"><p className="text-sm text-blue-600">A Pagar</p><p className="text-2xl font-bold text-blue-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPorStatus.pendente)}</p></div>
            <div className="bg-red-50 rounded-lg p-4"><p className="text-sm text-red-600">Vencidas</p><p className="text-2xl font-bold text-red-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPorStatus.atrasado)}</p></div>
            <div className="bg-green-50 rounded-lg p-4"><p className="text-sm text-green-600">Pagas</p><p className="text-2xl font-bold text-green-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPorStatus.pago)}</p></div>
            <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600">Canceladas</p><p className="text-2xl font-bold text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPorStatus.cancelado)}</p></div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" placeholder="Buscar por cliente..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
            </div>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="all">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="mt-4 text-sm text-gray-600">Total de registros: {totalItems}</div>
        </div>

        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p className="mt-2 text-gray-600">Carregando parcelas...</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Vencimento</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Cliente</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Valor</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Data Pagamento</th></tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parcelas.map((parcela) => {
                    const statusInfo = getStatusBadge(parcela.status, parcela.data_vencimento);
                    const StatusIcon = statusInfo.icon;
                    return (<tr key={parcela.id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><div className="flex items-center"><Calendar className="h-4 w-4 text-gray-400 mr-2" />{new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}</div></td><td className="px-6 py-4 text-sm text-gray-900">{parcela.pre_pedidos?.clientes?.razao_social || parcela.pre_pedidos?.clientes?.nome || '-'}<div className="text-xs text-gray-500">{parcela.pre_pedidos?.clientes?.cnpj || parcela.pre_pedidos?.clientes?.cpf}</div></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valor_parcela)}</td><td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}><StatusIcon className="h-3 w-3 mr-1" />{statusInfo.text}</span></td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{parcela.data_pagamento ? new Date(parcela.data_pagamento).toLocaleDateString('pt-BR') : '-'}</td></tr>);
                  })}
                </tbody>
              </table>
              {parcelas.length === 0 && (<div className="p-8 text-center text-gray-500"><CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" /><p>Nenhuma parcela encontrada.</p></div>)}
            </div>
            {totalPages > 1 && (<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between"><div className="text-sm text-gray-700">Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} resultados</div><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button><span className="px-3 py-1 text-sm">Página {currentPage} de {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button></div></div>)}
          </>
        )}
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onConfirm={handleExportConfirm} type={exportType} />
    </>
  );
}