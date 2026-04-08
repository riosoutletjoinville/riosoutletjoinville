//src/app/api/clientes/auth/pedidos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; 
import { Pedido, PedidoItem } from '@/types';
export const dynamic = 'force-dynamic';

interface PedidoDetalhado extends Pedido {
  itens: PedidoItem[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ← CORREÇÃO AQUI
) {
  try {
    const { id: pedidoId } = await params; // ← E AQUI precisa do await
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('cliente_id');

    if (!clienteId) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .eq('cliente_id', clienteId)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Buscar itens do pedido
    const { data: itens, error: itensError } = await supabase
      .from('pedido_itens')
      .select('*')
      .eq('pedido_id', pedidoId);

    if (itensError) {
      console.error('Erro ao buscar itens:', itensError);
      return NextResponse.json(
        { error: 'Erro ao buscar itens do pedido' },
        { status: 500 }
      );
    }

    const pedidoDetalhado: PedidoDetalhado = {
      ...pedido,
      itens: itens || []
    };

    return NextResponse.json({ pedido: pedidoDetalhado });
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}