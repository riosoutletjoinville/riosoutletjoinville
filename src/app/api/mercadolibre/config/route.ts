import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const config = await req.json();
    
    // Aqui você pode salvar no banco de dados se quiser
    console.log('Configuração recebida:', config);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuração salva com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    redirectUri: process.env.NEXT_PUBLIC_MERCADO_LIVRE_REDIRECT_URI,
    baseUrl: process.env.NEXTAUTH_URL,
    appId: process.env.NEXT_PUBLIC_MERCADO_LIVRE_APP_ID
  });
}