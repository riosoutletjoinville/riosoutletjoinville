// src/app/api/cron/nfe/route.ts
import { NextResponse } from 'next/server';
import { NFeAutoService } from '@/services/nfeAutoService';

// Endpoint para trigger manual ou por cron job
export async function POST(request: Request) {
  try {
    // Verificar token de segurança
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Processar filas (não esperar - rodar em background)
    (async () => {
      await NFeAutoService['processarFilas']();
    })();

    return NextResponse.json({ 
      success: true, 
      message: 'Processamento iniciado' 
    });

  } catch (error) {
    console.error('Erro no cron job:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro no processamento' 
    }, { status: 500 });
  }
}