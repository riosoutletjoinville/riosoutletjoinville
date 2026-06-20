// src/app/api/clientes/atualizar/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { clienteId, ...dadosAtualizados } = body;

    if (!clienteId) {
      return NextResponse.json({ error: 'ID do cliente não fornecido' }, { status: 400 });
    }

    // Verificar se o cliente está autenticado via sessão
    const { data: session, error: sessionError } = await supabase
      .from('cliente_sessoes')
      .select('*')
      .eq('cliente_id', clienteId)
      .gt('expira_em', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    // Atualizar dados do cliente
    const { data: cliente, error: updateError } = await supabase
      .from('clientes')
      .update(dadosAtualizados)
      .eq('id', clienteId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar cliente:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar dados' }, { status: 500 });
    }

    return NextResponse.json({ cliente });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}