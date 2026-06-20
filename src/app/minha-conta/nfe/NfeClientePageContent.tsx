// src/app/minha-conta/nfe/page.tsx
'use client';

import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClienteHeader from '@/components/clientes/HeaderClientes';
import { useEffect, useState } from 'react';
import { FileText, Download, Eye, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';

interface NFeCliente {
  id: string;
  numero_nf: string;
  serie_nf: string;
  chave_acesso: string;
  status: string;
  data_emissao: string;
  valor_total: number;
  pedido_id: string;
  pedido_numero: string;
  danfe_url?: string;
  xml_url?: string;
}

export default function NFeClientePageContent() {
  const { cliente, loading } = useClienteAuth();
  const [nfeList, setNfeList] = useState<NFeCliente[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (cliente) {
      carregarNFes();
    }
  }, [cliente]);

  const carregarNFes = async () => {
    try {
      const response = await fetch(`/api/clientes/nfe?cliente_id=${cliente?.id}`);
      if (response.ok) {
        const data = await response.json();
        setNfeList(data.nfe || []);
      }
    } catch (error) {
      console.error('Erro ao carregar NF-e:', error);
    } finally {
      setCarregando(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      autorizada: 'bg-green-100 text-green-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      cancelada: 'bg-red-100 text-red-800',
      reprovada: 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const textMap: Record<string, string> = {
      autorizada: 'Autorizada',
      pendente: 'Pendente',
      cancelada: 'Cancelada',
      reprovada: 'Reprovada'
    };
    return textMap[status] || status;
  };

  const handleDownloadXML = async (nfeId: string) => {
    try {
      const response = await fetch(`/api/clientes/nfe/${nfeId}/xml`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nfe_${nfeId}.xml`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('XML baixado com sucesso!');
      } else {
        toast.error('Erro ao baixar XML');
      }
    } catch (error) {
      console.error('Erro ao baixar XML:', error);
      toast.error('Erro ao baixar XML');
    }
  };

  const handleViewDANFE = (danfeUrl: string) => {
    window.open(danfeUrl, '_blank');
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
              Faça login para acessar suas notas fiscais.
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
      <ClienteHeader activeTab="nfe" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Minhas Notas Fiscais</h1>
          <p className="text-gray-600 mt-1">
            Consulte e baixe suas notas fiscais eletrônicas.
          </p>
        </div>

        {nfeList.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma nota fiscal encontrada
              </h3>
              <p className="text-gray-500">
                Você ainda não possui notas fiscais emitidas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {nfeList.map((nfe) => (
              <Card key={nfe.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          NF-e {nfe.numero_nf} / Série {nfe.serie_nf}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(nfe.status)}`}>
                          {getStatusText(nfe.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          Emissão: {format(new Date(nfe.data_emissao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          Valor: R$ {nfe.valor_total?.toFixed(2) || '0,00'}
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500 break-all">
                            Chave: {nfe.chave_acesso}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Pedido: #{nfe.pedido_numero}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {nfe.danfe_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDANFE(nfe.danfe_url!)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          DANFE
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadXML(nfe.id)}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        XML
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/minha-conta/pedidos/${nfe.pedido_id}`}>
                          Ver Pedido
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}