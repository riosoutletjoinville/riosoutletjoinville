// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, titulo, mensagem, metadata } = body

    // Verificar se o tipo é válido antes de acessar
    const validTypes = ['novoPedido', 'pedidoStatusAlterado', 'estoqueBaixo', 'novoCliente', 'financeiro', 'mercadolivre', 'sistema'];
    
    if (!validTypes.includes(tipo)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tipo de notificação inválido' 
      }, { status: 400 });
    }

    // Usar type assertion para evitar erro TypeScript
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serviceMethod = (notificationService as any)[tipo];
    
    if (typeof serviceMethod !== 'function') {
      return NextResponse.json({ 
        success: false, 
        error: 'Método de notificação não encontrado' 
      }, { status: 400 });
    }

    const success = await serviceMethod({
      titulo,
      mensagem,
      metadata
    })

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao criar notificação' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Erro na API de notificações:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}