// src/app/api/certificados/verificar/route.ts
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');
    const validade = searchParams.get('validade');

    // Usar o cliente server-side que você já tem (já lida com await cookies())
    const supabase = await createSupabaseServerClient();

    let query = supabase
      .from('certificados_a3')
      .select('*');

    if (ativo !== null) {
      query = query.eq('ativo', ativo === 'true');
    }

    if (validade) {
      query = query.gte('validade', validade);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      certificados: data,
      certificadoValido: data && data.length > 0 
    });

  } catch (error) {
    console.error('Erro ao verificar certificados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}