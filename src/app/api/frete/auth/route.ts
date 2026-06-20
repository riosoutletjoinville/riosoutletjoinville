// src/app/api/frete/auth/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
  const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://www.riosoutlet.joinville.br';
  const MELHOR_ENVIO_URL = process.env.MELHOR_ENVIO_URL || 'https://sandbox.melhorenvio.com.br';
  const redirectUri = `${NEXTAUTH_URL}/api/frete/auth/callback`;
  
  // ✅ Usar variável de ambiente
  const authUrl = `${MELHOR_ENVIO_URL}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=shipping-calculate`;
  
  return NextResponse.redirect(authUrl);
}