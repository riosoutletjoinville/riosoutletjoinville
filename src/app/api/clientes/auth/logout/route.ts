//src/app/api/clientes/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clienteAuthService } from '@/lib/cliente-auth';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('cliente_token')?.value;

    if (token) {
      await clienteAuthService.logoutCliente(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('cliente_token');

    return response;
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}