// src/app/api/configuracoes-fiscais/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 🔥 CORREÇÃO: cookies() deve ser await
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Buscar configurações fiscais
    const { data, error } = await supabase
      .from('configuracoes_fiscais')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      configFiscal: data && data.length > 0 ? data[0] : null 
    });

  } catch (error) {
    console.error('Erro ao buscar configurações fiscais:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}