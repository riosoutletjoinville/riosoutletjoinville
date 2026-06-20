//src/app/api/clientes/auth/sessao/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clienteAuthService } from '@/lib/cliente-auth';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('cliente_token')?.value;

    if (!token) {
      return NextResponse.json({ cliente: null });
    }

    const result = await clienteAuthService.verificarSessao(token);

    // VERIFICA SE O CLIENTE EXISTE (correto para o que o método retorna)
    if (!result.cliente) {
      const response = NextResponse.json({ cliente: null });
      response.cookies.delete('cliente_token');
      return response;
    }

    return NextResponse.json({ cliente: result.cliente });
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    return NextResponse.json({ cliente: null });
  }
}