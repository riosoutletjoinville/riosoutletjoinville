//src/app/api/clientes/auth/cadastro/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clienteAuthService } from '@/lib/cliente-auth';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json();

    const camposObrigatorios = ['email', 'senha', 'nome', 'sobrenome', 'cpf'];
    for (const campo of camposObrigatorios) {
      if (!dados[campo]) {
        return NextResponse.json(
          { error: `Campo ${campo} é obrigatório` },
          { status: 400 }
        );
      }
    }

    const result = await clienteAuthService.cadastrarCliente(dados);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
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
    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}