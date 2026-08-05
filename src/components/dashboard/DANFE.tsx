// src/components/dashboard/DANFE.tsx
'use client';

import { useEffect, useRef } from 'react';

interface DANFEProps {
  nfe: {
    numero_nf: string;
    serie_nf: string;
    chave_acesso: string;
    data_emissao: string;
    protocolo?: string;
    valor_total: number;
    destinatario_nome: string;
    destinatario_documento?: string;
    pedido: {
      cliente: {
        nome: string;
        endereco?: string;
        cidade?: string;
        estado?: string;
        cep?: string;
      };
      itens?: Array<{
        nome: string;
        quantidade: number;
        valor_unitario: number;
      }>;
    };
  };
}

export function DANFE({ nfe }: DANFEProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        doc.open();
        doc.write(gerarHTMLDANFE());
        doc.close();
      }
    }
  }, [nfe]);

  const gerarHTMLDANFE = () => {
    const data = new Date(nfe.data_emissao);
    const dataFormatada = data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `<!DOCTYPE html>
<html>
<head>
  <title>DANFE - NF-e ${nfe.numero_nf}</title>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Courier New', monospace; 
      background: #fff; 
      padding: 20px; 
      font-size: 12px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
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
    .header h1 { font-size: 24px; font-weight: bold; }
    .header h2 { font-size: 16px; }
    .section { 
      border: 1px solid #000; 
      padding: 10px; 
      margin-bottom: 20px; 
    }
    .section-title { 
      font-weight: bold; 
      margin-bottom: 10px; 
      text-transform: uppercase; 
      background: #f0f0f0;
      padding: 3px;
    }
    .row { 
      display: flex; 
      margin-bottom: 5px; 
    }
    .label { 
      font-weight: bold; 
      width: 150px; 
    }
    .value { 
      flex: 1; 
    }
    .chave-acesso { 
      font-family: monospace; 
      font-size: 18px; 
      text-align: center; 
      letter-spacing: 2px; 
      background: #f9f9f9;
      padding: 10px;
      margin: 10px 0;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 10px 0; 
    }
    th, td { 
      border: 1px solid #000; 
      padding: 5px; 
      text-align: left; 
    }
    th { background: #f0f0f0; }
    .footer { 
      text-align: center; 
      margin-top: 20px; 
      border-top: 2px solid #000; 
      padding-top: 10px; 
      font-size: 10px;
    }
    .buttons { 
      text-align: center; 
      margin: 20px 0; 
    }
    .btn { 
      background: #000; 
      color: #fff; 
      border: none; 
      padding: 10px 20px; 
      font-size: 14px; 
      cursor: pointer; 
      margin: 0 5px;
      border-radius: 4px;
    }
    .btn:hover { background: #333; }
  </style>
</head>
<body>
  <div class="buttons no-print">
    <button class="btn" onclick="window.print()">🖨️ Imprimir DANFE</button>
    <button class="btn" onclick="window.close()" style="background: #666;">✖️ Fechar</button>
  </div>

  <div class="container">
    <div class="header">
      <h1>DANFE</h1>
      <h2>Documento Auxiliar da Nota Fiscal Eletrônica</h2>
      <p>NF-e nº ${nfe.numero_nf} - Série ${nfe.serie_nf}</p>
    </div>

    <div class="section">
      <div class="section-title">Chave de Acesso</div>
      <div class="chave-acesso">${nfe.chave_acesso}</div>
    </div>

    <div class="section">
      <div class="section-title">Informações da NF-e</div>
      <div class="row">
        <span class="label">Número:</span>
        <span class="value">${nfe.numero_nf}</span>
      </div>
      <div class="row">
        <span class="label">Série:</span>
        <span class="value">${nfe.serie_nf}</span>
      </div>
      <div class="row">
        <span class="label">Data de Emissão:</span>
        <span class="value">${dataFormatada}</span>
      </div>
      <div class="row">
        <span class="label">Protocolo:</span>
        <span class="value">${nfe.protocolo || '-'}</span>
      </div>
      <div class="row">
        <span class="label">Valor Total:</span>
        <span class="value">R$ ${nfe.valor_total.toFixed(2)}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Destinatário</div>
      <div class="row">
        <span class="label">Nome:</span>
        <span class="value">${nfe.destinatario_nome}</span>
      </div>
      ${nfe.destinatario_documento ? `
      <div class="row">
        <span class="label">CPF/CNPJ:</span>
        <span class="value">${nfe.destinatario_documento}</span>
      </div>
      ` : ''}
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
      <div class="section-title">Produtos</div>
      <table>
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Qtd</th>
            <th>Valor Unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${nfe.pedido.itens.map(item => `
          <tr>
            <td>${item.nome}</td>
            <td>${item.quantidade}</td>
            <td>R$ ${item.valor_unitario.toFixed(2)}</td>
            <td>R$ ${(item.quantidade * item.valor_unitario).toFixed(2)}</td>
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <div class="footer">
      <p>Consulte pela Chave de Acesso em www.sefaz.fazenda.gov.br</p>
      <p>Este documento é uma representação gráfica da NF-e e não vale como documento fiscal</p>
    </div>
  </div>
</body>
</html>`;
  };

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