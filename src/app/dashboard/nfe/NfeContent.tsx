// src/app/dashboard/nfe/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { NFeList } from '@/components/dashboard/NFeList';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { NFeStatusBadge } from '@/components/dashboard/NFeStatusBadge';

const ITEMS_PER_PAGE = 10;

export default function NfeContent() {
  const [nfes, setNfes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    carregarNfes();
  }, [filtro, paginaAtual]);

  async function carregarNfes() {
    setLoading(true);
    
    try {
      // Primeiro, conta o total de registros para o filtro atual
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

      // Calcula o offset baseado na página atual
      const offset = (paginaAtual - 1) * ITEMS_PER_PAGE;

      // Busca os dados com paginação
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
    setPaginaAtual(1); // Reseta para primeira página ao mudar filtro
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notas Fiscais</h1>
        <Link href="/dashboard/nfe/emitir">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova NF-e
          </Button>
        </Link>
      </div>

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
          
          {/* Componente de Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Mostrando {((paginaAtual - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(paginaAtual * ITEMS_PER_PAGE, totalItens)} de {totalItens} notas fiscais
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePaginaAnterior}
                  disabled={paginaAtual === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    // Lógica para mostrar páginas próximas à atual
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
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleProximaPagina}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}