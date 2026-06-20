// src/app/api/frete/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';


const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://www.riosoutlet.joinville.br';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const MELHOR_ENVIO_URL = process.env.MELHOR_ENVIO_URL || 'https://sandbox.melhorenvio.com.br';
    console.log('❌ Erro na autorização:', `${NEXTAUTH_URL}`);
    console.log('❌ Erro na autorização:', `${MELHOR_ENVIO_URL}`);
    if (error) {
      console.log('❌ Erro na autorização:', error);
      return NextResponse.redirect(`${NEXTAUTH_URL}/dashboard?error=auth_failed`);
    }

    if (!code) {
      return NextResponse.redirect(`${NEXTAUTH_URL}/dashboard?error=no_code`);
    }

    console.log('✅ Código de autorização recebido:', code);

    // Trocar o código pelo access token
    const tokenResponse = await fetch(`${MELHOR_ENVIO_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID,
        client_secret: process.env.MELHOR_ENVIO_CLIENT_SECRET,
        redirect_uri: `${NEXTAUTH_URL}/api/frete/auth/callback`,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.log('❌ Erro ao obter token:', tokenData);
      return NextResponse.redirect(`${NEXTAUTH_URL}/dashboard?error=token_failed`);
    }

    console.log('✅ Access Token obtido:', tokenData.access_token);
    console.log('✅ Refresh Token:', tokenData.refresh_token);
    console.log('✅ Token expira em:', tokenData.expires_in, 'segundos');

    // Por enquanto, vamos apenas logar e redirecionar
    return NextResponse.redirect(`${NEXTAUTH_URL}/dashboard?success=auth_complete&token=` + tokenData.access_token);

  } catch (error) {
    console.log('❌ Erro no callback:', error);
    return NextResponse.redirect(`${NEXTAUTH_URL}/dashboard?error=callback_error`);
  }
}