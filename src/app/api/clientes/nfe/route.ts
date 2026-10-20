// src/app/api/clientes/nfe/route.ts (versão alternativa)
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('cliente_id');
    const pedidoId = searchParams.get('pedido');

    if (!clienteId) {
      return NextResponse.json({ error: 'Cliente não identificado' }, { status: 400 });
    }

    // Verificar se o cliente existe
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', clienteId)
      .single();

    if (clienteError || !cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Primeiro, buscar os pedidos do cliente
    const pedidosQuery = supabase
      .from('pedidos')
      .select('id, numero')
      .eq('cliente_id', clienteId);

    const { data: pedidos, error: pedidosError } = await pedidosQuery;

    if (pedidosError) {
      console.error('Erro ao buscar pedidos:', pedidosError);
      return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
    }

    if (!pedidos || pedidos.length === 0) {
      return NextResponse.json({ nfe: [] });
    }

    // Pegar os IDs dos pedidos
    const pedidoIds = pedidos.map(p => p.id);
    
    // Buscar NF-e relacionadas aos pedidos
    let nfeQuery = supabase
      .from('notas_fiscais')
      .select('*')
      .in('pedido_id', pedidoIds);

    if (pedidoId) {
      nfeQuery = nfeQuery.eq('pedido_id', pedidoId);
    }

    const { data: nfe, error: nfeError } = await nfeQuery.order('data_emissao', { ascending: false });

    if (nfeError) {
      console.error('Erro ao buscar NF-e:', nfeError);
      return NextResponse.json({ error: 'Erro ao buscar notas fiscais' }, { status: 500 });
    }

    // Criar um mapa de pedidos para acesso rápido
    const pedidosMap = new Map();
    pedidos.forEach(p => {
      pedidosMap.set(p.id, p);
    });

    // Formatar dados para o cliente
    const nfeFormatadas = (nfe || []).map(item => ({
      id: item.id,
      numero_nf: item.numero_nf || '--',
      serie_nf: item.serie_nf || '1',
      chave_acesso: item.chave_acesso || '--',
      status: item.status || 'pendente',
      data_emissao: item.data_emissao || new Date().toISOString(),
      valor_total: item.valor_total || 0,
      pedido_id: item.pedido_id,
      pedido_numero: pedidosMap.get(item.pedido_id)?.numero || `PED-${item.pedido_id?.slice(0, 8)}`,
      danfe_url: item.danfe_url,
      xml_url: item.xml_url
    }));

    return NextResponse.json({ nfe: nfeFormatadas });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}