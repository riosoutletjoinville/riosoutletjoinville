// src/app/dashboard/nfe/[id]/danfe/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DANFE } from '@/components/dashboard/DANFE';

export default function DANFEPage() {
  const params = useParams();
  const [nfe, setNfe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      carregarDados();
    }
  }, [params?.id]);

  async function carregarDados() {
    try {
      // Buscar a NF-e com os dados relacionados
      const { data: nfeData, error: nfeError } = await supabase
        .from('notas_fiscais')
        .select(`
          *,
          pedido:pedidos(
            id,
            total,
            cliente:clientes(
              nome,
              endereco,
              numero,
              complemento,
              bairro,
              cidade,
              estado,
              cep,
              cpf,
              cnpj
            ),
            itens:pedido_itens(
              quantidade,
              preco_unitario,
              produto:produtos(titulo)
            )
          )
        `)
        .eq('id', params.id)
        .single();

      if (nfeError) throw nfeError;

      // Formatar os dados para o DANFE
      const itensFormatados = nfeData.pedido?.itens?.map((item: any) => ({
        nome: item.produto?.titulo || 'Produto',
        quantidade: item.quantidade,
        valor_unitario: item.preco_unitario
      })) || [];

      const enderecoCompleto = nfeData.pedido?.cliente 
        ? `${nfeData.pedido.cliente.endereco || ''}, ${nfeData.pedido.cliente.numero || ''}${nfeData.pedido.cliente.complemento ? ' - ' + nfeData.pedido.cliente.complemento : ''} - ${nfeData.pedido.cliente.bairro || ''}`
        : '';

      setNfe({
        numero_nf: nfeData.numero_nf || '000',
        serie_nf: nfeData.serie_nf || '1',
        chave_acesso: nfeData.chave_acesso || '00000000000000000000000000000000000000000000',
        data_emissao: nfeData.data_emissao || nfeData.created_at || new Date().toISOString(),
        protocolo: nfeData.protocolo,
        valor_total: nfeData.pedido?.total || 0,
        destinatario_nome: nfeData.pedido?.cliente?.nome || 'Cliente não informado',
        destinatario_documento: nfeData.pedido?.cliente?.cpf || nfeData.pedido?.cliente?.cnpj || '',
        pedido: {
          cliente: {
            nome: nfeData.pedido?.cliente?.nome || '',
            endereco: enderecoCompleto,
            cidade: nfeData.pedido?.cliente?.cidade || '',
            estado: nfeData.pedido?.cliente?.estado || '',
            cep: nfeData.pedido?.cliente?.cep || ''
          },
          itens: itensFormatados
        }
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #000',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p>Carregando DANFE...</p>
        </div>
      </div>
    );
  }

  if (!nfe) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>DANFE não encontrado</h2>
          <button 
            onClick={() => window.close()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return <DANFE nfe={nfe} />;
}