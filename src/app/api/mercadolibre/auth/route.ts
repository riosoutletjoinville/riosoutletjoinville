// src/app/api/mercadolibre/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { code, state } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Código de autorização não fornecido' }, { status: 400 });
    }

    // variáveis de ambiente estão configuradas
    const clientId = process.env.NEXT_PUBLIC_MERCADO_LIVRE_APP_ID;
    const clientSecret = process.env.MERCADO_LIVRE_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_MERCADO_LIVRE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Variáveis de ambiente não configuradas:', {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        redirectUri: !!redirectUri
      });
      return NextResponse.json({ error: 'Configuração incompleta' }, { status: 500 });
    }

    console.log('Trocando código por tokens...', { clientId, redirectUri });

    // tokens
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const responseText = await tokenResponse.text();
    console.log('Resposta do Mercado Livre:', responseText);

    if (!tokenResponse.ok) {
      console.error('Erro ao obter tokens do Mercado Livre:', responseText);
      return NextResponse.json({ error: 'Falha na autenticação com Mercado Livre' }, { status: 400 });
    }

    const tokens = JSON.parse(responseText);
    console.log('Tokens recebidos:', tokens);

    // usuário do Mercado Livre
    const userInfoResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    console.log('Bearer Token (access_token):', `Bearer ${tokens.access_token}`);
    if (!userInfoResponse.ok) {
      console.error('Erro ao obter informações do usuário:', await userInfoResponse.text());
      return NextResponse.json({ error: 'Falha ao obter informações do usuário' }, { status: 400 });
    }

    const userInfo = await userInfoResponse.json();
    console.log('Informações do usuário:', userInfo);

    // ID do usuário atual do Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // Salvar tokens no banco de dados
    const { error } = await supabase
      .from('mercado_livre_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        ml_user_id: userInfo.id,
        ml_nickname: userInfo.nickname,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao salvar tokens:', error);
      return NextResponse.json({ error: 'Erro ao salvar tokens' }, { status: 500 });
    }

    console.log('Tokens salvos com sucesso para o usuário:', user.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Autenticação bem-sucedida',
      user: userInfo 
    });

  } catch (error: unknown) {
    console.error('Erro na autenticação:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}