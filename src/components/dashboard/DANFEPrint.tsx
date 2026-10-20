// src/components/dashboard/DANFEPrint.tsx
'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DANFEPrintProps {
  nfe: {
    numero_nf: string;
    serie_nf: string;
    chave_acesso: string;
    data_emissao: string;
    protocolo?: string;
    valor_total: number;
    destinatario_nome: string;
    destinatario_cpf_cnpj: string;
    pedido: {
      id: string;
      cliente: {
        nome: string;
        endereco?: string;
        cidade?: string;
        estado?: string;
      };
      itens?: Array<{
        nome: string;
        quantidade: number;
        valor_unitario: number;
        valor_total: number;
      }>;
    };
  };
  onClose?: () => void;
}

export function DANFEPrint({ nfe, onClose }: DANFEPrintProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>DANFE - NF-e ${nfe.numero_nf}</title>
            <meta charset="utf-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Courier New', monospace;
                background: #fff;
                padding: 20px;
                font-size: 12px;
              }
              
              @media print {
                body {
                  padding: 0;
                }
                .no-print {
                  display: none;
                }
              }
              
              .container {
                max-width: 800px;
                margin: 0 auto;
                border: 2px solid #000;
                padding: 20px;
              }
              
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin-bottom: 20px;
              }
              
              .header h1 {
                font-size: 24px;
                font-weight: bold;
              }
              
              .header h2 {
                font-size: 18px;
              }
              
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 20px;
              }
              
              .section {
                border: 1px solid #000;
                padding: 10px;
                margin-bottom: 20px;
              }
              
              .section-title {
                font-weight: bold;
                margin-bottom: 10px;
                text-transform: uppercase;
              }
              
              .row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
              }
              
              .label {
                font-weight: bold;
                width: 40%;
              }
              
              .value {
                width: 60%;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              
              th, td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
              }
              
              th {
                background: #f0f0f0;
              }
              
              .barcode {
                text-align: center;
                margin: 20px 0;
                font-family: 'Libre Barcode 39', cursive;
                font-size: 32px;
              }
              
              .chave-acesso {
                font-family: monospace;
                font-size: 14px;
                text-align: center;
                letter-spacing: 2px;
              }
              
              .footer {
                text-align: center;
                margin-top: 20px;
                border-top: 2px solid #000;
                padding-top: 10px;
              }
              
              .button-container {
                text-align: center;
                margin: 20px 0;
              }
              
              .print-button {
                background: #000;
                color: #fff;
                border: none;
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
                border-radius: 4px;
              }
              
              .print-button:hover {
                background: #333;
              }
            </style>
          </head>
          <body>
            <div class="button-container no-print">
              <button class="print-button" onclick="window.print()">
                Imprimir DANFE
              </button>
              <button class="print-button" onclick="window.close()" style="margin-left: 10px; background: #666;">
                Fechar
              </button>
            </div>
            
            <div class="container">
              <div class="header">
                <h1>DANFE</h1>
                <h2>Documento Auxiliar da Nota Fiscal Eletrônica</h2>
                <p>NF-e ${nfe.numero_nf} - Série ${nfe.serie_nf}</p>
              </div>
              
              <div class="info-grid">
                <div>
                  <p><strong>Número:</strong> ${nfe.numero_nf}</p>
                  <p><strong>Série:</strong> ${nfe.serie_nf}</p>
                  <p><strong>Data Emissão:</strong> ${format(new Date(nfe.data_emissao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                </div>
                <div>
                  <p><strong>Protocolo:</strong> ${nfe.protocolo || '-'}</p>
                  <p><strong>Valor Total:</strong> R$ ${nfe.valor_total?.toFixed(2) || '0,00'}</p>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Chave de Acesso</div>
                <div class="chave-acesso">${nfe.chave_acesso}</div>
                <div class="barcode">*${nfe.chave_acesso}*</div>
              </div>
              
              <div class="section">
                <div class="section-title">Destinatário</div>
                <div class="row">
                  <span class="label">Nome/Razão Social:</span>
                  <span class="value">${nfe.destinatario_nome || nfe.pedido.cliente.nome}</span>
                </div>
                <div class="row">
                  <span class="label">CPF/CNPJ:</span>
                  <span class="value">${nfe.destinatario_cpf_cnpj || '-'}</span>
                </div>
                <div class="row">
                  <span class="label">Endereço:</span>
                  <span class="value">${nfe.pedido.cliente.endereco || '-'}</span>
                </div>
                <div class="row">
                  <span class="label">Cidade/UF:</span>
                  <span class="value">${nfe.pedido.cliente.cidade || ''} / ${nfe.pedido.cliente.estado || ''}</span>
                </div>
              </div>
              
              ${nfe.pedido.itens && nfe.pedido.itens.length > 0 ? `
              <div class="section">
                <div class="section-title">Produtos/Serviços</div>
                <table>
                  <thead>
                    <tr>
                      <th>Descrição</th>
                      <th>Qtd</th>
                      <th>Valor Unit.</th>
                      <th>Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${nfe.pedido.itens.map(item => `
                    <tr>
                      <td>${item.nome}</td>
                      <td>${item.quantidade}</td>
                      <td>R$ ${item.valor_unitario?.toFixed(2)}</td>
                      <td>R$ ${item.valor_total?.toFixed(2)}</td>
                    </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ` : ''}
              
              <div class="footer">
                <p>Consulte pela Chave de Acesso em http://www.sefaz.fazenda.gov.br/</p>
                <p>Este documento é uma representação gráfica da NF-e</p>
              </div>
            </div>
          </body>
          </html>
        `);
        doc.close();
      }
    }
  }, [nfe]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: '#fff'
      }}
      title="DANFE"
    />
  );
}