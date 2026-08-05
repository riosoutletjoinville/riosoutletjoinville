// src/app/minha-conta/pedidos/PedidosPageContent.tsx
'use client';

import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ClienteHeader from '@/components/clientes/HeaderClientes';
import { Download, Eye, Package, Calendar, CreditCard, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'sonner';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface PedidoCliente {
  id: string;
  numero: string;
  total: number;
  status: string;
  data_pedido: string;
  condicao_pagamento: string;
  frete_valor: number;
  frete_gratis: boolean;
  opcao_frete: string;
  cep_entrega: string;
  prazo_entrega: string;
  despachado: boolean;
  data_despacho?: string;
  codigo_rastreio?: string;
  transportadora?: string;
  observacoes?: string;
  itens: Array<{
    id: string;
    produto_titulo: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    tamanho?: string;
    cor?: string;
    sku?: string;
  }>;
}

export default function PedidosPageContent() {
  const { cliente, loading } = useClienteAuth();
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [configFiscal, setConfigFiscal] = useState<any>(null);

  // Buscar configurações fiscais
  useEffect(() => {
    const buscarConfigFiscal = async () => {
      try {
        const response = await fetch('/api/configuracoes-fiscais');
        if (response.ok) {
          const data = await response.json();
          setConfigFiscal(data.config);
        }
      } catch (error) {
        console.error('Erro ao buscar config fiscal:', error);
      }
    };
    buscarConfigFiscal();
  }, []);

  // Buscar pedidos
  useEffect(() => {
    if (cliente) {
      carregarPedidos();
    }
  }, [cliente]);

  const carregarPedidos = async () => {
    try {
      const response = await fetch(`/api/clientes/pedidos?cliente_id=${cliente?.id}`);
      if (response.ok) {
        const data = await response.json();
        const pedidosComItens = (data.pedidos || []).map((pedido: any) => ({
          ...pedido,
          itens: pedido.itens || []
        }));
        setPedidos(pedidosComItens);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setCarregandoPedidos(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pago: 'Pago',
      pendente: 'Pendente',
      processando: 'Processando',
      cancelado: 'Cancelado',
      aprovado: 'Aprovado',
      enviado: 'Enviado',
      entregue: 'Entregue'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pago: 'bg-green-100 text-green-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      processando: 'bg-blue-100 text-blue-800',
      cancelado: 'bg-red-100 text-red-800',
      aprovado: 'bg-green-100 text-green-800',
      enviado: 'bg-purple-100 text-purple-800',
      entregue: 'bg-emerald-100 text-emerald-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const gerarPDF = async (pedido: PedidoCliente) => {
    const doc = new jsPDF();
    
    // Dados da empresa (usar configurações fiscais ou fallback)
    const empresa = configFiscal || {
      emitente_razao_social: 'Rios Outlet',
      emitente_nome_fantasia: 'Rios Outlet',
      emitente_cnpj: '00.000.000/0001-00',
      emitente_ie: 'Isento',
      emitente_logradouro: 'Rua Exemplo',
      emitente_numero: '123',
      emitente_bairro: 'Centro',
      emitente_cidade: 'Joinville',
      emitente_estado: 'SC',
      emitente_cep: '89200-000',
      emitente_telefone: '(47) 99999-9999',
      emitente_email: 'contato@riosoutlet.com.br'
    };
    
    // Título com nome da empresa
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(empresa.emitente_nome_fantasia || empresa.emitente_razao_social, 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`CNPJ: ${empresa.emitente_cnpj}`, 20, 30);
    doc.text(`IE: ${empresa.emitente_ie || 'Isento'}`, 20, 37);
    
    const enderecoCompleto = `${empresa.emitente_logradouro || ''}, ${empresa.emitente_numero || ''} - ${empresa.emitente_bairro || ''}`;
    doc.text(enderecoCompleto, 20, 44);
    doc.text(`${empresa.emitente_cidade || ''}/${empresa.emitente_estado || ''} - CEP: ${empresa.emitente_cep || ''}`, 20, 51);
    doc.text(`Tel: ${empresa.emitente_telefone || ''} | Email: ${empresa.emitente_email || ''}`, 20, 58);
    
    // Linha separadora
    doc.line(20, 64, 190, 64);
    
    // Info do Pedido
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`PEDIDO Nº: ${pedido.numero}`, 20, 78);
    doc.setFontSize(10);
    doc.text(`Data: ${format(new Date(pedido.data_pedido), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 86);
    doc.text(`Status: ${getStatusText(pedido.status)}`, 20, 94);
    doc.text(`Pagamento: ${pedido.condicao_pagamento || 'À vista'}`, 20, 102);
    
    // Dados do Cliente
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('DADOS DO CLIENTE:', 20, 118);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    const nomeCliente = cliente?.nome || cliente?.razao_social || '';
    doc.text(`Nome: ${nomeCliente}`, 20, 126);
    doc.text(`Email: ${cliente?.email || ''}`, 20, 134);
    doc.text(`Telefone: ${cliente?.telefone || ''}`, 20, 142);
    
    if (cliente?.tipo_cliente === 'fisica') {
      doc.text(`CPF: ${cliente?.cpf || ''}`, 20, 150);
    } else {
      doc.text(`CNPJ: ${cliente?.cnpj || ''}`, 20, 150);
      if (cliente?.inscricao_estadual) {
        doc.text(`IE: ${cliente.inscricao_estadual}`, 20, 158);
      }
    }
    
    // Endereço do Cliente
    if (cliente?.endereco) {
      doc.text('ENDEREÇO DE COBRANÇA:', 20, 174);
      const clienteEndereco = `${cliente.endereco || ''}, ${cliente.numero || ''}${cliente.complemento ? `, ${cliente.complemento}` : ''}`;
      doc.text(clienteEndereco, 20, 182);
      doc.text(`${cliente.bairro || ''} - ${cliente.cidade || ''}/${cliente.estado || ''}`, 20, 190);
      doc.text(`CEP: ${cliente.cep || ''}`, 20, 198);
    }
    
    // Endereço de Entrega
    let startY = cliente?.endereco ? 210 : 174;
    if (pedido.cep_entrega) {
      doc.text('ENDEREÇO DE ENTREGA:', 20, startY);
      startY += 8;
      doc.text(`CEP: ${pedido.cep_entrega}`, 20, startY);
      startY += 8;
      doc.text(`Frete: ${pedido.opcao_frete || 'Não informado'}`, 20, startY);
      startY += 8;
      if (pedido.codigo_rastreio) {
        doc.text(`Rastreio: ${pedido.codigo_rastreio}`, 20, startY);
        startY += 8;
      }
      if (pedido.transportadora) {
        doc.text(`Transportadora: ${pedido.transportadora}`, 20, startY);
        startY += 8;
      }
    }
    
    // Tabela de Itens
    const itens = pedido.itens || [];
    const tableColumn = ["Código", "Produto", "Tamanho", "Cor", "Qtd", "Valor Unit.", "Subtotal"];
    const tableRows = itens.map((item, index) => [
      (item as any).sku || `ITEM-${index + 1}`,
      item.produto_titulo.length > 30 ? item.produto_titulo.substring(0, 27) + '...' : item.produto_titulo,
      item.tamanho || '-',
      item.cor || '-',
      item.quantidade.toString(),
      `R$ ${item.preco_unitario.toFixed(2)}`,
      `R$ ${item.subtotal.toFixed(2)}`
    ]);
    
    if (tableRows.length > 0) {
      doc.autoTable({
        startY: startY + 10,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8 },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 50 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 12 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 }
        }
      });
    }
    
    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || (startY + 20);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const totalY = finalY + 10;
    const subtotal = pedido.total - (pedido.frete_valor || 0);
    doc.text(`Subtotal: R$ ${subtotal.toFixed(2)}`, 140, totalY);
    
    if (pedido.frete_valor && pedido.frete_valor > 0) {
      doc.text(`Frete: R$ ${pedido.frete_valor.toFixed(2)}`, 140, totalY + 6);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: R$ ${pedido.total.toFixed(2)}`, 140, totalY + 16);
    } else if (pedido.frete_gratis) {
      doc.text(`Frete: Grátis`, 140, totalY + 6);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: R$ ${pedido.total.toFixed(2)}`, 140, totalY + 16);
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL: R$ ${pedido.total.toFixed(2)}`, 140, totalY + 6);
    }
    
    // Informações de despacho
    let infoY = totalY + 35;
    if (pedido.despachado && pedido.data_despacho) {
      doc.setFontSize(9);
      doc.setTextColor(34, 197, 94);
      doc.text(`✓ Pedido despachado em ${format(new Date(pedido.data_despacho), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, infoY);
      infoY += 7;
      if (pedido.codigo_rastreio) {
        doc.text(`Código de rastreio: ${pedido.codigo_rastreio}`, 20, infoY);
        infoY += 7;
        doc.text(`Transportadora: ${pedido.transportadora || 'Não informada'}`, 20, infoY);
        infoY += 7;
      }
    }
    
    // Observações
    if (pedido.observacoes) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Observações: ${pedido.observacoes}`, 20, infoY + 10);
    }
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Documento emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        20,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }
    
    doc.save(`Pedido_${pedido.numero}.pdf`);
    toast.success('PDF gerado com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Acesso Restrito</h2>
            <p className="text-gray-600 mb-6">
              Faça login para acessar sua área de cliente.
            </p>
            <Button asChild>
              <Link href="/minha-conta/login">
                Fazer Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClienteHeader activeTab="pedidos" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe seus pedidos e veja os detalhes de cada compra.
          </p>
        </div>

        {carregandoPedidos ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : pedidos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-500 mb-6">
                Você ainda não realizou nenhum pedido.
              </p>
              <Button asChild>
                <Link href="/">
                  Começar a Comprar
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => {
              const itens = pedido.itens || [];
              return (
                <Card key={pedido.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {/* Cabeçalho do Pedido */}
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-4 border-b">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Pedido {pedido.numero}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pedido.status)}`}>
                            {getStatusText(pedido.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(pedido.data_pedido), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {pedido.condicao_pagamento || 'À vista'}
                          </div>
                          {pedido.despachado && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Truck className="h-3 w-3" />
                              Despachado
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => gerarPDF(pedido)}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </Button>
                        <Button asChild size="sm" className="gap-2">
                          <Link href={`/minha-conta/pedidos/${pedido.id}`}>
                            <Eye className="h-4 w-4" />
                            Detalhes
                          </Link>
                        </Button>
                      </div>
                    </div>

                    {/* Itens do Pedido */}
                    <div className="space-y-2">
                      {itens.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <div className="flex-1">
                            <span className="font-medium">{item.produto_titulo}</span>
                            {item.tamanho && (
                              <span className="text-gray-500 ml-2">Tamanho: {item.tamanho}</span>
                            )}
                            {item.cor && (
                              <span className="text-gray-500 ml-2">Cor: {item.cor}</span>
                            )}
                            <span className="text-gray-500 ml-2">Qtd: {item.quantidade}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">R$ {item.subtotal.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                      {itens.length > 3 && (
                        <p className="text-sm text-blue-600">
                          + {itens.length - 3} outros itens
                        </p>
                      )}
                    </div>

                    {/* Rodapé do Pedido */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap justify-between items-center">
                      <div>
                        {pedido.codigo_rastreio && (
                          <div className="text-sm">
                            <span className="text-gray-500">Rastreio: </span>
                            <span className="font-medium">{pedido.codigo_rastreio}</span>
                          </div>
                        )}
                        {pedido.transportadora && (
                          <div className="text-sm text-gray-500">
                            Transportadora: {pedido.transportadora}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {pedido.frete_valor > 0 ? (
                            <>Frete: R$ {pedido.frete_valor.toFixed(2)}</>
                          ) : pedido.frete_gratis ? (
                            <>Frete Grátis</>
                          ) : null}
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          Total: R$ {pedido.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}