import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Obter o token do header Authorization
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização não fornecido' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Usar o token recebido no header em vez de buscar do serviço
    const response = await fetch('https://api.mercadolibre.com/users/me/shipping_preferences', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro na API de shipping:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}