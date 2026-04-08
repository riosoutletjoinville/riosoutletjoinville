// components/dashboard/ComprovantePagamento.tsx
"use client";
import { useRef } from "react";
import { Download, Printer, X } from "lucide-react";

interface Cliente {
  razao_social?: string;
  nome_fantasia?: string;
  nome?: string;
  sobrenome?: string;
}

interface Parcela {
  id: string;
  pre_pedido_id: string;
  numero_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  data_pagamento?: string;
  valor_pago?: number;
  observacao?: string;
}

interface ComprovantePagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: Parcela;
  cliente: Cliente | null;
  prePedidoId: string;
}

export default function ComprovantePagamento({
  isOpen,
  onClose,
  parcela,
  cliente,
  prePedidoId,
}: ComprovantePagamentoProps) {
  const comprovanteRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const getClienteNome = (cliente: Cliente | null): string => {
    if (!cliente) return "Cliente não informado";
    if (cliente.razao_social) return cliente.razao_social;
    if (cliente.nome_fantasia) return cliente.nome_fantasia;
    return `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim();
  };

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const handleImprimir = () => {
    const comprovanteContent = comprovanteRef.current;
    if (!comprovanteContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante de Pagamento</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #000;
            }
            .comprovante { 
              border: 2px solid #000; 
              padding: 20px; 
              max-width: 600px; 
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              border-bottom: 1px solid #000; 
              padding-bottom: 15px; 
              margin-bottom: 15px;
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
              font-weight: bold;
            }
            .info-section { 
              margin-bottom: 15px;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px;
            }
            .info-label { 
              font-weight: bold; 
              min-width: 150px;
            }
            .assinatura { 
              margin-top: 40px; 
              border-top: 1px solid #000; 
              padding-top: 10px; 
              text-align: center;
            }
            .data-emissao { 
              text-align: right; 
              margin-top: 20px; 
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${comprovanteContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    const comprovanteContent = comprovanteRef.current;
    if (!comprovanteContent) return;

    const originalContent = comprovanteContent.innerHTML;
    
    // Criar conteúdo para PDF/impressão
    const printContent = `
      <div class="comprovante">
        <div class="header">
          <h1>COMPROVANTE DE PAGAMENTO</h1>
        </div>
        
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span>${getClienteNome(cliente)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Nº do Pedido:</span>
            <span>${prePedidoId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Parcela:</span>
            <span>${parcela.numero_parcela}ª parcela</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Valor Original:</span>
            <span>${formatarMoeda(parcela.valor_parcela)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valor Pago:</span>
            <span><strong>${formatarMoeda(parcela.valor_pago || parcela.valor_parcela)}</strong></span>
          </div>
          <div class="info-row">
            <span class="info-label">Data de Vencimento:</span>
            <span>${formatarData(parcela.data_vencimento)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Data do Pagamento:</span>
            <span><strong>${formatarData(parcela.data_pagamento || new Date().toISOString())}</strong></span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span><strong>PAGO</strong></span>
          </div>
          ${parcela.observacao ? `
          <div class="info-row">
            <span class="info-label">Observações:</span>
            <span>${parcela.observacao}</span>
          </div>
          ` : ''}
        </div>

        <div class="assinatura">
          <p>___________________________________</p>
          <p>Assinatura do Recebedor</p>
        </div>

        <div class="data-emissao">
          Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
    `;

    // Abrir nova janela para impressão/download
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprovante de Pagamento - ${getClienteNome(cliente)}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #000;
            }
            .comprovante { 
              border: 2px solid #000; 
              padding: 20px; 
              max-width: 600px; 
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              border-bottom: 1px solid #000; 
              padding-bottom: 15px; 
              margin-bottom: 15px;
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
              font-weight: bold;
            }
            .info-section { 
              margin-bottom: 15px;
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px;
            }
            .info-label { 
              font-weight: bold; 
              min-width: 150px;
            }
            .assinatura { 
              margin-top: 40px; 
              border-top: 1px solid #000; 
              padding-top: 10px; 
              text-align: center;
            }
            .data-emissao { 
              text-align: right; 
              margin-top: 20px; 
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Comprovante de Pagamento</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Comprovante */}
        <div ref={comprovanteRef} className="border-2 border-gray-800 p-6 mb-6 bg-white">
          {/* Cabeçalho */}
          <div className="text-center border-b border-gray-800 pb-4 mb-4">
            <h1 className="text-2xl font-bold uppercase">Comprovante de Pagamento</h1>
          </div>

          {/* Informações do Cliente e Pedido */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Cliente:</span>
              <span>{getClienteNome(cliente)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Nº do Pedido:</span>
              <span>{prePedidoId}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Parcela:</span>
              <span>{parcela.numero_parcela}ª parcela</span>
            </div>
          </div>

          {/* Valores e Datas */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Valor Original:</span>
              <span>{formatarMoeda(parcela.valor_parcela)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Valor Pago:</span>
              <span className="font-bold text-green-600">
                {formatarMoeda(parcela.valor_pago || parcela.valor_parcela)}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Data de Vencimento:</span>
              <span>{formatarData(parcela.data_vencimento)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Data do Pagamento:</span>
              <span className="font-bold">
                {formatarData(parcela.data_pagamento || new Date().toISOString())}
              </span>
            </div>
          </div>

          {/* Status e Observações */}
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">Status:</span>
              <span className="font-bold text-green-600">PAGO</span>
            </div>
            {parcela.observacao && (
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Observações:</span>
                <span className="text-right max-w-xs">{parcela.observacao}</span>
              </div>
            )}
          </div>

          {/* Assinatura */}
          <div className="mt-8 pt-4 border-t border-gray-800 text-center">
            <p className="mb-1">___________________________________</p>
            <p className="text-sm">Assinatura do Recebedor</p>
          </div>

          {/* Data de Emissão */}
          <div className="text-right mt-4 text-sm text-gray-600">
            Emitido em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Fechar
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download size={16} className="mr-2" />
            Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
}