//src/app/api/clientes/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clienteAuthService } from '@/lib/cliente-auth';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await clienteAuthService.loginCliente({ email, senha });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }

    // VERIFICAÇÃO DO TOKEN
    if (!result.token) {
      return NextResponse.json(
        { error: 'Token não gerado' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      cliente: result.cliente,
      token: result.token
    });

    // Set cookie com o token - AGORA result.token é garantido como string
    response.cookies.set('cliente_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 dias
    });

    return response;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}