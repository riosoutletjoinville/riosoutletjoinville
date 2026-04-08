// src/app/api/certificados/verificar/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');
    const validade = searchParams.get('validade');

    // Criar cliente com service role key (bypass RLS)
    const supabase = createRouteHandlerClient(
      { cookies },
      {
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Use a service role key
      }
    );

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