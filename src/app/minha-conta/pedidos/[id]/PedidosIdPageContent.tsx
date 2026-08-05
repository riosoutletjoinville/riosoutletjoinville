// src/app/minha-conta/pedidos/[id]/page.tsx
'use client';

import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ClienteHeader from '@/components/clientes/HeaderClientes';
import { 
  Truck, 
  Package, 
  Calendar, 
  CreditCard, 
  MapPin, 
  Download, 
  ArrowLeft,
  ShoppingBag,
  Receipt,
  CheckCircle,
  Clock,
  XCircle,
  Printer,
  Mail,
  Phone,
  User,
  Building2,
  DollarSign,
  QrCode
} from 'lucide-react';
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


interface PedidoDetalhado {
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
  origem_pedido?: string;
  tipo_checkout?: string;
  payment_method?: string;  
  installments?: number;     
  qr_code?: string;         
  qr_code_base64?: string;
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

export default function PedidosIdPageContent() {
  const { cliente, loading } = useClienteAuth();
  const params = useParams();
  const pedidoId = params.id as string;
  
  const [pedido, setPedido] = useState<PedidoDetalhado | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (cliente && pedidoId) {
      carregarPedido();
    }
  }, [cliente, pedidoId]);

  const carregarPedido = async () => {
    try {
      const response = await fetch(`/api/clientes/pedidos/${pedidoId}?cliente_id=${cliente?.id}`);
      if (response.ok) {
        const data = await response.json();
        setPedido(data.pedido);
      } else {
        console.error('Erro ao carregar pedido');
      }
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
    } finally {
      setCarregando(false);
    }
  };

  const gerarPDF = async () => {
    if (!pedido || !cliente) return;

    const doc = new jsPDF();
    
    // Logo
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text('Rios Outlet', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('CNPJ: 00.000.000/0001-00', 20, 30);
    doc.text('Rua Exemplo, 123 - Joinville/SC', 20, 37);
    doc.text('Telefone: (47) 99999-9999', 20, 44);
    
    // Linha separadora
    doc.line(20, 50, 190, 50);
    
    // Info do Pedido
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Pedido: ${pedido.numero}`, 20, 65);
    doc.setFontSize(10);
    doc.text(`Data: ${format(new Date(pedido.data_pedido), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 73);
    doc.text(`Status: ${getStatusText(pedido.status)}`, 20, 81);
    doc.text(`Pagamento: ${pedido.condicao_pagamento || 'À vista'}`, 20, 89);
    
    // Dados do Cliente
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Dados do Cliente:', 20, 105);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    const nomeCliente = cliente.nome || cliente.razao_social || '';
    doc.text(`Nome: ${nomeCliente}`, 20, 113);
    doc.text(`Email: ${cliente.email || ''}`, 20, 121);
    doc.text(`Telefone: ${cliente.telefone || ''}`, 20, 129);
    
    if (cliente.tipo_cliente === 'fisica') {
      doc.text(`CPF: ${cliente.cpf || ''}`, 20, 137);
    } else {
      doc.text(`CNPJ: ${cliente.cnpj || ''}`, 20, 137);
    }
    
    // Endereço de Entrega
    if (pedido.cep_entrega) {
      doc.text('Endereço de Entrega:', 120, 105);
      doc.text(`CEP: ${pedido.cep_entrega}`, 120, 113);
      doc.text(`Frete: ${pedido.opcao_frete || 'Não informado'}`, 120, 121);
      if (pedido.codigo_rastreio) {
        doc.text(`Rastreio: ${pedido.codigo_rastreio}`, 120, 129);
      }
      if (pedido.transportadora) {
        doc.text(`Transportadora: ${pedido.transportadora}`, 120, 137);
      }
    }
    
    // Tabela de Itens
    const itens = pedido.itens || [];
    const tableColumn = ["Produto", "SKU", "Tamanho", "Cor", "Qtd", "Preço Unit.", "Subtotal"];
    const tableRows = itens.map(item => [
      item.produto_titulo,
      item.sku || '-',
      item.tamanho || '-',
      item.cor || '-',
      item.quantidade.toString(),
      `R$ ${item.preco_unitario.toFixed(2)}`,
      `R$ ${item.subtotal.toFixed(2)}`
    ]);
    
    if (tableRows.length > 0) {
      doc.autoTable({
        startY: 155,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { cellWidth: 12 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 }
        }
      });
    }
    
    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || 150;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    const subtotalY = finalY + 10;
    const subtotal = pedido.total - (pedido.frete_valor || 0);
    doc.text(`Subtotal: R$ ${subtotal.toFixed(2)}`, 140, subtotalY);
    
    if (pedido.frete_valor && pedido.frete_valor > 0) {
      doc.text(`Frete: R$ ${pedido.frete_valor.toFixed(2)}`, 140, subtotalY + 8);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: R$ ${pedido.total.toFixed(2)}`, 140, subtotalY + 20);
    } else if (pedido.frete_gratis) {
      doc.text(`Frete: Grátis`, 140, subtotalY + 8);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: R$ ${pedido.total.toFixed(2)}`, 140, subtotalY + 20);
    } else {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: R$ ${pedido.total.toFixed(2)}`, 140, subtotalY + 10);
    }
    
    // Informações adicionais
    let infoY = subtotalY + 35;
    if (pedido.despachado && pedido.data_despacho) {
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94);
      doc.text(`✓ Pedido despachado em ${format(new Date(pedido.data_despacho), "dd/MM/yyyy")}`, 20, infoY);
      infoY += 8;
      if (pedido.codigo_rastreio) {
        doc.text(`Código de rastreio: ${pedido.codigo_rastreio}`, 20, infoY);
        infoY += 8;
        doc.text(`Transportadora: ${pedido.transportadora || 'Não informada'}`, 20, infoY);
        infoY += 8;
      }
    }
    
    if (pedido.observacoes) {
      doc.setTextColor(100, 100, 100);
      doc.text(`Observações: ${pedido.observacoes}`, 20, infoY + 10);
    }
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Documento emitido em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
        20,
        doc.internal.pageSize.height - 10
      );
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }
    
    doc.save(`Pedido_${pedido.numero}.pdf`);
    toast.success('PDF gerado com sucesso!');
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
      pago: 'bg-green-100 text-green-800 border-green-200',
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processando: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200',
      aprovado: 'bg-green-100 text-green-800 border-green-200',
      enviado: 'bg-purple-100 text-purple-800 border-purple-200',
      entregue: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'pago' || status === 'aprovado') return <CheckCircle className="h-5 w-5" />;
    if (status === 'pendente' || status === 'processando') return <Clock className="h-5 w-5" />;
    if (status === 'cancelado') return <XCircle className="h-5 w-5" />;
    return <Package className="h-5 w-5" />;
  };

  if (loading || carregando) {
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

  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClienteHeader activeTab="pedidos" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-4">Pedido Não Encontrado</h2>
              <Button asChild>
                <Link href="/minha-conta/pedidos">
                  Voltar para Meus Pedidos
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClienteHeader activeTab="pedidos" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Botão Voltar */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="gap-2">
            <Link href="/minha-conta/pedidos">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Meus Pedidos
            </Link>
          </Button>
        </div>

        {/* Header do Pedido */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">
                  Pedido {pedido.numero}
                </h1>
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(pedido.status)}`}>
                  {getStatusIcon(pedido.status)}
                  {getStatusText(pedido.status)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(pedido.data_pedido), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  {pedido.condicao_pagamento || 'À vista'}
                </div>
                {pedido.origem_pedido && (
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="h-4 w-4" />
                    Origem: {pedido.origem_pedido === 'ecommerce' ? 'E-commerce' : 'Dashboard'}
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={gerarPDF}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conteúdo Principal - Itens do Pedido */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Itens do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pedido.itens && pedido.itens.length > 0 ? (
                    pedido.itens.map((item) => (
                      <div key={item.id} className="flex justify-between items-start py-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.produto_titulo}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                            {item.sku && <span>SKU: {item.sku}</span>}
                            {item.tamanho && <span>Tamanho: {item.tamanho}</span>}
                            {item.cor && <span>Cor: {item.cor}</span>}
                            <span>Quantidade: {item.quantidade}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            R$ {item.subtotal.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            R$ {item.preco_unitario.toFixed(2)} cada
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">Nenhum item encontrado</p>
                  )}
                </div>

                {/* Resumo de Valores */}
                <div className="mt-6 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">
                        R$ {(pedido.total - (pedido.frete_valor || 0)).toFixed(2)}
                      </span>
                    </div>
                    {pedido.frete_valor > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Frete</span>
                        <span className="text-gray-900">R$ {pedido.frete_valor.toFixed(2)}</span>
                      </div>
                    )}
                    {pedido.frete_gratis && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Frete</span>
                        <span className="text-green-600 font-medium">Grátis</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-lg font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-blue-600">
                        R$ {pedido.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Informações Adicionais */}
          <div className="lg:col-span-1 space-y-6">
            {/* Dados do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Nome</p>
                  <p className="text-sm text-gray-600">{cliente.nome || cliente.razao_social || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {cliente.email || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Telefone</p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {cliente.telefone || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {cliente.tipo_cliente === 'fisica' ? 'CPF' : 'CNPJ'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {cliente.tipo_cliente === 'fisica' ? cliente.cpf : cliente.cnpj || '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Informações de Entrega */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pedido.cep_entrega ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-700">CEP de Entrega</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {pedido.cep_entrega}
                      </p>
                    </div>
                    {pedido.opcao_frete && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Opção de Frete</p>
                        <p className="text-sm text-gray-600">{pedido.opcao_frete}</p>
                      </div>
                    )}
                    {pedido.prazo_entrega && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Prazo de Entrega</p>
                        <p className="text-sm text-gray-600">{pedido.prazo_entrega}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Informações de entrega não disponíveis</p>
                )}
              </CardContent>
            </Card>

            {/* Informações de Pagamento */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <CreditCard className="h-5 w-5" />
      Pagamento
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div>
      <p className="text-sm font-medium text-gray-700">Forma de Pagamento</p>
      <p className="text-sm text-gray-600 flex items-center gap-1">
        {pedido.payment_method === 'pix' ? (
          <>
            <QrCode className="h-3 w-3" />
            PIX
          </>
        ) : pedido.payment_method === 'credit_card' ? (
          <>
            <CreditCard className="h-3 w-3" />
            Cartão de Crédito
          </>
        ) : pedido.payment_method === 'debit_card' ? (
          <>
            <CreditCard className="h-3 w-3" />
            Cartão de Débito
          </>
        ) : (
          pedido.condicao_pagamento || 'Não informado'
        )}
      </p>
    </div>
    
    {/* Exibir parcelas se for cartão de crédito */}
    {pedido.payment_method === 'credit_card' && pedido.installments && pedido.installments > 1 && (
      <div>
        <p className="text-sm font-medium text-gray-700">Parcelamento</p>
        <p className="text-sm text-gray-600">
          {pedido.installments}x de R$ {(pedido.total / pedido.installments).toFixed(2)}
        </p>
      </div>
    )}
    
    {/* Exibir QR Code se for PIX (opcional, na página de detalhes) */}
    {pedido.payment_method === 'pix' && pedido.qr_code_base64 && (
      <div className="mt-3">
        <p className="text-sm font-medium text-gray-700 mb-2">QR Code PIX</p>
        <img 
          src={`data:image/png;base64,${pedido.qr_code_base64}`} 
          alt="QR Code PIX" 
          className="w-32 h-32 border rounded"
        />
        <p className="text-xs text-gray-500 mt-1">Código para pagamento</p>
      </div>
    )}
  </CardContent>
</Card>

            {/* Informações de Despacho */}
            {pedido.despachado && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Truck className="h-5 w-5" />
                    Pedido Despachado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pedido.data_despacho && (
                    <div>
                      <p className="text-sm font-medium text-green-700">Data do Despacho</p>
                      <p className="text-sm text-green-600">
                        {format(new Date(pedido.data_despacho), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {pedido.codigo_rastreio && (
                    <div>
                      <p className="text-sm font-medium text-green-700">Código de Rastreio</p>
                      <p className="text-sm text-green-600 font-mono break-all">{pedido.codigo_rastreio}</p>
                    </div>
                  )}
                  {pedido.transportadora && (
                    <div>
                      <p className="text-sm font-medium text-green-700">Transportadora</p>
                      <p className="text-sm text-green-600">{pedido.transportadora}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Nota Fiscal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Nota Fiscal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  asChild
                >
                  <Link href={`/minha-conta/nfe?pedido=${pedido.id}`}>
                    <Printer className="h-4 w-4" />
                    Visualizar Nota Fiscal
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Observações */}
            {pedido.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{pedido.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}