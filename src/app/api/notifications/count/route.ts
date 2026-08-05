// app/api/notifications/count/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const filter = searchParams.get('filter') || 'all'

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (filter !== 'all') {
      if (filter === 'unread') {
        query = query.eq('lida', false)
      } else {
        query = query.eq('tipo', filter)
      }
    }

    const { count, error } = await query

    if (error) throw error

    // Buscar contagem não lida separadamente
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('lida', false)

    // Buscar contagens por tipo
    const tipos = ['pedido', 'estoque', 'cliente', 'financeiro', 'mercadolivre', 'sistema']
    const countsByType: Record<string, number> = {}
    
    for (const tipo of tipos) {
      const { count: tipoCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('tipo', tipo)
      
      countsByType[tipo] = tipoCount || 0
    }

    return NextResponse.json({
      total: count || 0,
      unread: unreadCount || 0,
      byType: countsByType,
      filterCount: count || 0
    })
  } catch (error) {
    console.error('Erro ao buscar contagem de notificações:', error)
    return NextResponse.json({ error: 'Erro ao buscar contagem' }, { status: 500 })
  }
}