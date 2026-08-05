// src/app/api/newsletter/confirmar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de confirmação é obrigatório' },
        { status: 400 }
      );
    }

    const { data: subscriber, error } = await supabase
      .from('newsletter_assinantes')
      .update({ 
        confirmado: true,
        data_confirmacao: new Date().toISOString(),
        token_confirmacao: null
      })
      .eq('token_confirmacao', token)
      .eq('confirmado', false)
      .select()
      .single();

    if (error) throw error;

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Token inválido ou já confirmado' },
        { status: 400 }
      );
    }

    // Redirecionar para página de sucesso
    return NextResponse.redirect(new URL('/newsletter/confirmacao-sucesso', request.url));

  } catch (error) {
    console.error('Erro ao confirmar inscrição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}