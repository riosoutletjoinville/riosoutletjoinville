// components/contador/NFList.tsx - Versão corrigida com autoTable
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Eye, FileText, Search, ChevronLeft, ChevronRight, FileSpreadsheet, File as FilePdf, X, Calendar } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface NFListProps {
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
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Selecione o período para exportar as notas fiscais:
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final
              </label>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                <Calendar className="h-3 w-3 inline mr-1" />
                O relatório incluirá todas as notas fiscais do período selecionado.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(startDate, endDate)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Exportar
          </button>
        </div>
      </div>
    </div>
  );
}

export function NFList({ dateRange: initialDateRange }: NFListProps) {
  const [notas, setNotas] = useState<any[]>([]);
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

  useEffect(() => {
    loadNotas();
  }, [initialDateRange, currentPage, filterStatus, searchTerm]);

  const loadNotas = async () => {
    setLoading(true);
    try {
      const startDateStr = initialDateRange.startDate.toISOString().split('T')[0];
      const endDateStr = initialDateRange.endDate.toISOString().split('T')[0];

      // Calcular offset para paginação
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from("notas_fiscais")
        .select(`
          *,
          pedidos (
            id,
            total,
            cliente_id,
            clientes (nome, razao_social, cpf, cnpj)
          )
        `, { count: "exact" })
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr)
        .order("created_at", { ascending: false })
        .range(from, to);

      // Aplicar filtro de status se necessário
      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      // Aplicar busca se houver termo
      if (searchTerm) {
        query = query.or(`numero_nf.ilike.%${searchTerm}%,chave_acesso.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      setNotas(data || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error("Erro ao carregar notas fiscais:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAllNotasForExport = async (startDate: Date, endDate: Date) => {
  try {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    let query = supabase
      .from("notas_fiscais")
      .select(`
        *,
        pedidos:pedido_id (
          id,
          total,
          cliente_id,
          clientes:cliente_id (
            nome,
            razao_social,
            cpf,
            cnpj
          )
        )
      `)
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr)
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    if (searchTerm) {
      query = query.or(`numero_nf.ilike.%${searchTerm}%,chave_acesso.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Erro na query:", error);
      return [];
    }
    
    // Processar os dados para garantir a estrutura correta
    const processedData = (data || []).map(nota => {
      // Garantir que a estrutura de pedidos esteja correta
      const pedido = nota.pedidos;
      const clientes = pedido?.clientes;
      
      return {
        ...nota,
        pedidos: pedido ? {
          ...pedido,
          clientes: clientes
        } : null
      };
    });
    
    return processedData;
  } catch (error) {
    console.error("Erro ao buscar notas para exportação:", error);
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
      const allNotas = await getAllNotasForExport(startDate, endDate);
      
      const exportData = allNotas.map(nota => ({
        'Número NF': nota.numero_nf || nota.numero || '-',
        'Cliente': nota.pedidos?.clientes?.razao_social || nota.pedidos?.clientes?.nome || nota.destinatario_nome || '-',
        'CPF/CNPJ': nota.pedidos?.clientes?.cnpj || nota.pedidos?.clientes?.cpf || nota.destinatario_cpf_cnpj || '-',
        'Valor (R$)': nota.valor_total || nota.pedidos?.total || 0,
        'Status': getStatusText(nota.status),
        'Data Emissão': new Date(nota.data_emissao || nota.created_at).toLocaleDateString('pt-BR'),
        'Chave Acesso': nota.chave_acesso || '-',
        'XML Gerado': nota.xml ? 'Sim' : 'Não',
        'Protocolo': nota.protocolo || '-'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 15 }, // Número NF
        { wch: 40 }, // Cliente
        { wch: 18 }, // CPF/CNPJ
        { wch: 15 }, // Valor
        { wch: 12 }, // Status
        { wch: 12 }, // Data Emissão
        { wch: 50 }, // Chave Acesso
        { wch: 10 }, // XML Gerado
        { wch: 20 }  // Protocolo
      ];
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Notas Fiscais');
      
      // Abrir o arquivo para o usuário escolher onde salvar
      XLSX.writeFile(wb, `notas_fiscais_${startDate.toISOString().split('T')[0]}_a_${endDate.toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
    }
  };

const exportToPDF = async (startDate: Date, endDate: Date) => {
  try {
    const allNotas = await getAllNotasForExport(startDate, endDate);
    
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4'
    });
    
    const logoUrl = '/logomarca.jpg';
    const img = new Image();
    img.src = logoUrl;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    
    // Margens do documento (10mm em cada lado)
    const margin = 10;
    
    // Posição da imagem: 2mm da margem superior e 2mm da margem esquerda
    const imgX = margin + 2; // 12mm da borda esquerda
    const imgY = margin + 2; // 12mm da borda superior
    const imgWidth = 40;
    const imgHeight = 15;
    
    // Texto alinhado à direita, a 2mm da margem direita
    const textX = pageWidth - margin - 2; // 198mm (210 - 10 - 2)
    
    const addHeader = (pageNumber: number) => {
      // Logo a 2mm da margem esquerda (10mm + 2mm = 12mm)
      doc.addImage(img, 'JPEG', imgX, imgY, imgWidth, imgHeight);
      
      // Título - alinhado à direita, a 2mm da margem direita
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Relatório de Notas Fiscais', textX - 50, imgY + 4, { align: 'right' });
      
      // Informações - alinhadas à direita
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      
      let currentY = imgY + 18;
      doc.text(`Período: ${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`, textX - 60, currentY - 6, { align: 'right' });
      
      currentY += 5;
      doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, textX, currentY - 6, { align: 'right' });
      
      currentY += 5;
      doc.text(`Total: ${allNotas.length} notas`, textX - 85, currentY - 11, { align: 'right' });
      
      if (filterStatus !== "all") {
        currentY += 5;
        doc.text(`Status: ${getStatusText(filterStatus)}`, textX, currentY, { align: 'right' });
      }
      
      if (searchTerm) {
        currentY += 5;
        doc.text(`Busca: "${searchTerm}"`, textX, currentY, { align: 'right' });
      }
      
      // Linha separadora a 2mm da margem esquerda e direita
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, imgY + imgHeight + 5, pageWidth - margin, imgY + imgHeight + 5);
      
      return imgY + imgHeight + 8;
    };
    
    const tableData = allNotas.map(nota => [
      nota.numero_nf || nota.numero || '-',
      nota.pedidos?.clientes?.razao_social || nota.pedidos?.clientes?.nome || nota.destinatario_nome || '-',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valor_total || nota.pedidos?.total || 0),
      getStatusText(nota.status),
      new Date(nota.data_emissao || nota.created_at).toLocaleDateString('pt-BR')
    ]);
    
    const startY = addHeader(1);
    
    autoTable(doc, {
      head: [['Número', 'Cliente', 'Valor', 'Status', 'Emissão']],
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
        doc.text(
          `Rios Outlet - Página ${data.pageNumber} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - margin,
          { align: 'center' }
        );
      }
    });
    
    doc.save(`notas_fiscais_${startDate.toISOString().split('T')[0]}_a_${endDate.toISOString().split('T')[0]}.pdf`);
    
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao gerar PDF");
  }
};
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'autorizada':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'autorizada':
        return 'Autorizada';
      case 'cancelada':
        return 'Cancelada';
      case 'pendente':
        return 'Pendente';
      default:
        return status;
    }
  };

  const downloadXML = async (nota: any) => {
    if (nota.xml) {
      const blob = new Blob([nota.xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NF-${nota.numero_nf || nota.numero}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const viewDANFE = (nota: any) => {
    if (nota.danfe_url) {
      window.open(nota.danfe_url, '_blank');
    }
  };

  // Calcular paginação
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Notas Fiscais Eletrônicas</h2>
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <button
                    onClick={() => handleExportClick('excel')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Exportar para Excel
                  </button>
                  <button
                    onClick={() => handleExportClick('pdf')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                  >
                    <FilePdf className="h-4 w-4 mr-2 text-red-600" />
                    Exportar para PDF
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número NF, chave de acesso ou cliente..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos os status</option>
              <option value="autorizada">Autorizada</option>
              <option value="pendente">Pendente</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          
          {/* Info de total */}
          <div className="mt-4 text-sm text-gray-600">
            Total de registros: {totalItems}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando notas fiscais...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número NF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emissão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notas.map((nota) => (
                    <tr key={nota.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {nota.numero_nf || nota.numero || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {nota.pedidos?.clientes?.razao_social || 
                         nota.pedidos?.clientes?.nome || 
                         nota.destinatario_nome || 
                         '-'}
                        <div className="text-xs text-gray-500">
                          {nota.pedidos?.clientes?.cnpj || nota.pedidos?.clientes?.cpf || nota.destinatario_cpf_cnpj}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(nota.valor_total || nota.pedidos?.total || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(nota.status)}`}>
                          {getStatusText(nota.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(nota.data_emissao || nota.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {nota.xml && (
                            <button
                              onClick={() => downloadXML(nota)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Download XML"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          )}
                          {nota.danfe_url && (
                            <button
                              onClick={() => viewDANFE(nota)}
                              className="text-green-600 hover:text-green-900"
                              title="Visualizar DANFE"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {notas.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p>Nenhuma nota fiscal encontrada para o período selecionado.</p>
                </div>
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> a{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
                  <span className="font-medium">{totalItems}</span> resultados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Seleção de Período */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onConfirm={handleExportConfirm}
        type={exportType}
      />
    </>
  );
}