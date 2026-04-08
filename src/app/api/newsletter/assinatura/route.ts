// src/app/api/newsletter/assinatura/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para obter IP do cliente
function getClientIP(request: NextRequest): string {
  // Tentar obter do header X-Forwarded-For (comum em deployments)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Tentar obter do header X-Real-IP
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback para localhost
  return 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const { email, nome } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de e-mail inválido' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const { data: existingSubscriber } = await supabase
      .from('newsletter_assinantes')
      .select('id, ativo')
      .eq('email', email)
      .single();

    if (existingSubscriber) {
      if (existingSubscriber.ativo) {
        return NextResponse.json(
          { error: 'Este e-mail já está inscrito na newsletter' },
          { status: 409 }
        );
      } else {
        // Reativar inscrição
        const { error } = await supabase
          .from('newsletter_assinantes')
          .update({ 
            ativo: true, 
            data_cancelamento: null,
            nome: nome || undefined
          })
          .eq('id', existingSubscriber.id);

        if (error) throw error;

        return NextResponse.json({ 
          message: 'Inscrição reativada com sucesso!',
          reativado: true
        });
      }
    }

    // Criar token de confirmação
    const tokenConfirmacao = Math.random().toString(36).substring(2) + Date.now().toString(36);

    // Inserir novo assinante
    const { data: newSubscriber, error } = await supabase
      .from('newsletter_assinantes')
      .insert({
        email,
        nome,
        token_confirmacao: tokenConfirmacao,
        ip_inscricao: getClientIP(request),
        user_agent: request.headers.get('user-agent')
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir no Supabase:', error);
      throw error;
    }

    // TODO: Enviar email de confirmação
    // await enviarEmailConfirmacao(email, tokenConfirmacao);

    return NextResponse.json({ 
      message: 'Inscrição realizada com sucesso! Verifique seu e-mail para confirmar.',
      id: newSubscriber.id
    });

  } catch (error) {
    console.error('Erro ao processar inscrição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (!email && !token) {
      return NextResponse.json(
        { error: 'E-mail ou token é obrigatório' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('newsletter_assinantes')
      .update({ 
        ativo: false, 
        data_cancelamento: new Date().toISOString() 
      });

    if (token) {
      query = query.eq('token_confirmacao', token);
    } else {
      query = query.eq('email', email);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ 
      message: 'Inscrição cancelada com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}