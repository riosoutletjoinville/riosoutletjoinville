// app/api/notifications/batch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { action, notificationIds, data } = body

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!notificationIds || notificationIds.length === 0) {
      return NextResponse.json({ error: 'IDs das notificações são obrigatórios' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'markAsRead':
        result = await supabase
          .from('notifications')
          .update({ lida: true, updated_at: new Date().toISOString() })
          .in('id', notificationIds)
          .eq('user_id', user.id)
        
        if (result.error) throw result.error
        return NextResponse.json({ 
          success: true, 
          message: `${notificationIds.length} notificação(ões) marcada(s) como lida(s)`,
          updatedCount: notificationIds.length
        })

      case 'markAsUnread':
        result = await supabase
          .from('notifications')
          .update({ lida: false, updated_at: new Date().toISOString() })
          .in('id', notificationIds)
          .eq('user_id', user.id)
        
        if (result.error) throw result.error
        return NextResponse.json({ 
          success: true, 
          message: `${notificationIds.length} notificação(ões) marcada(s) como não lida(s)`,
          updatedCount: notificationIds.length
        })

      case 'delete':
        result = await supabase
          .from('notifications')
          .delete()
          .in('id', notificationIds)
          .eq('user_id', user.id)
        
        if (result.error) throw result.error
        return NextResponse.json({ 
          success: true, 
          message: `${notificationIds.length} notificação(ões) excluída(s)`,
          deletedCount: notificationIds.length
        })

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na operação em lote:', error)
    return NextResponse.json({ error: 'Erro ao processar operação em lote' }, { status: 500 })
  }
}