// src/app/dashboard/nfe/NfeContent.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { NFeList } from '@/components/dashboard/NFeList';
import { NFeForm } from '@/components/dashboard/NFeForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { NFeStatusBadge } from '@/components/dashboard/NFeStatusBadge';

const ITEMS_PER_PAGE = 10;

export default function NfeContent() {
  const [nfes, setNfes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Estados para emissão
  const [configFiscal, setConfigFiscal] = useState(null);
  const [certificadoValido, setCertificadoValido] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    carregarNfes();
    verificarConfiguracao();
  }, [filtro, paginaAtual]);

  async function carregarNfes() {
    setLoading(true);
    
    try {
      let countQuery = supabase
        .from('notas_fiscais')
        .select('*', { count: 'exact', head: true });

      if (filtro !== 'todas') {
        countQuery = countQuery.eq('status', filtro);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        throw countError;
      }

      setTotalItens(count || 0);
      setTotalPaginas(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      const offset = (paginaAtual - 1) * ITEMS_PER_PAGE;

      let query = supabase
        .from('notas_fiscais')
        .select(`
          *,
          pedido:pedidos(
            id,
            data_pedido,
            total,
            status,
            cliente:clientes(nome)
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (filtro !== 'todas') {
        query = query.eq('status', filtro);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setNfes(data || []);
    } catch (error) {
      console.error('Erro ao carregar NF-es:', error);
    } finally {
      setLoading(false);
    }
  }

  async function verificarConfiguracao() {
    setLoadingConfig(true);
    try {
      const configResponse = await fetch('/api/configuracoes-fiscais');
      const configData = await configResponse.json();
      setConfigFiscal(configData.configFiscal);

      const hoje = new Date().toISOString().split('T')[0];
      const certResponse = await fetch(`/api/certificados/verificar?ativo=true&validade=${hoje}`);
      const certData = await certResponse.json();
      setCertificadoValido(certData.certificadoValido);
    } catch (error) {
      console.error('Erro na verificação:', error);
    } finally {
      setLoadingConfig(false);
    }
  }

  const handlePaginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  const handleProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  const handleFiltroChange = (novoFiltro: string) => {
    setFiltro(novoFiltro);
    setPaginaAtual(1);
  };

  const handleEmitSuccess = () => {
    carregarNfes();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notas Fiscais</h1>
      </div>

      <Tabs defaultValue="listar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="listar">Listar Notas</TabsTrigger>
          <TabsTrigger value="emitir">Emitir Nova Nota</TabsTrigger>
        </TabsList>

        <TabsContent value="listar">
          {/* Filtros */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {['todas', 'pendente', 'processando', 'autorizada', 'cancelada', 'rejeitada'].map((status) => (
              <Button
                key={status}
                variant={filtro === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltroChange(status)}
              >
                {status === 'todas' ? 'Todas' : <NFeStatusBadge status={status} showLabel />}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <NFeList nfes={nfes} onRefresh={carregarNfes} />
              
              {totalPaginas > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((paginaAtual - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(paginaAtual * ITEMS_PER_PAGE, totalItens)} de {totalItens} notas fiscais
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePaginaAnterior} disabled={paginaAtual === 1}>
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        let paginaMostrar;
                        if (totalPaginas <= 5) {
                          paginaMostrar = i + 1;
                        } else if (paginaAtual <= 3) {
                          paginaMostrar = i + 1;
                        } else if (paginaAtual >= totalPaginas - 2) {
                          paginaMostrar = totalPaginas - 4 + i;
                        } else {
                          paginaMostrar = paginaAtual - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={paginaMostrar}
                            variant={paginaAtual === paginaMostrar ? 'default' : 'outline'}
                            size="sm"
                            className="w-8"
                            onClick={() => setPaginaAtual(paginaMostrar)}
                          >
                            {paginaMostrar}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button variant="outline" size="sm" onClick={handleProximaPagina} disabled={paginaAtual === totalPaginas}>
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="emitir">
          {loadingConfig ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <NFeForm 
              configFiscal={configFiscal}
              onSuccess={handleEmitSuccess}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}