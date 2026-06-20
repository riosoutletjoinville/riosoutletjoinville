//src/app/api/clientes/pedidos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; 
import { Pedido } from '@/types';
export const dynamic = 'force-dynamic';

interface PedidoFormatado {
  id: string;
  numero: string;
  total: number;
  status: string;
  data_pedido: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('cliente_id');

    if (!clienteId) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      );
    }

    // Formatar dados para o frontend
    const pedidosFormatados: PedidoFormatado[] = (pedidos || []).map(pedido => ({
      id: pedido.id,
      numero: `#${pedido.id.slice(-8).toUpperCase()}`,
      total: pedido.total,
      status: pedido.status,
      data_pedido: pedido.data_pedido
    }));

    return NextResponse.json({ pedidos: pedidosFormatados });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}