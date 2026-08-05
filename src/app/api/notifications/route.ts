// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET: Listar notificações com filtros e paginação
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Parâmetros de consulta
    const filter = searchParams.get('filter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeCount = searchParams.get('includeCount') === 'true'
    
    const offset = (page - 1) * limit

    // Construir query base
    let query = supabase
      .from('notifications')
      .select('*', { count: includeCount ? 'exact' : undefined })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (filter !== 'all') {
      if (filter === 'unread') {
        query = query.eq('lida', false)
      } else {
        query = query.eq('tipo', filter)
      }
    }

    const { data: notifications, error, count } = await query

    if (error) {
      console.error('Erro na query:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const response: any = { notifications: notifications || [] }
    if (includeCount && count !== undefined) {
      response.total = count
      response.page = page
      response.totalPages = Math.ceil(count / limit)
      response.limit = limit
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
  }
}

// POST: Criar nova notificação
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { tipo, titulo, mensagem, metadata, user_id } = body

    // Validar tipo
    const validTypes = ['pedido', 'estoque', 'cliente', 'financeiro', 'mercadolivre', 'sistema']
    if (!validTypes.includes(tipo)) {
      return NextResponse.json({ 
        error: 'Tipo de notificação inválido',
        validTypes 
      }, { status: 400 })
    }

    // Validar campos obrigatórios
    if (!titulo || !mensagem) {
      return NextResponse.json({ 
        error: 'Título e mensagem são obrigatórios' 
      }, { status: 400 })
    }

    // Criar notificação
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        tipo,
        titulo,
        mensagem,
        metadata: metadata || {},
        user_id: user_id || null,
        lida: false
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      notification,
      message: 'Notificação criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return NextResponse.json({ error: 'Erro ao criar notificação' }, { status: 500 })
  }
}

// PUT: Atualizar notificações (marcar como lida, etc)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const { action, notificationIds, filters } = body

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (action === 'markAsRead') {
      if (notificationIds && notificationIds.length > 0) {
        // Marcar notificações específicas como lidas
        const { data, error } = await supabase
          .from('notifications')
          .update({ lida: true })
          .in('id', notificationIds)
          .eq('user_id', user.id)
          .select()
        
        if (error) {
          console.error('Erro ao marcar como lidas:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, updated: data, count: data?.length || 0 })
      } else {
        // Marcar todas como lidas (respeitando filtro se houver)
        let updateQuery = supabase
          .from('notifications')
          .update({ lida: true })
          .eq('user_id', user.id)
          .eq('lida', false)

        if (filters?.tipo && filters.tipo !== 'all') {
          updateQuery = updateQuery.eq('tipo', filters.tipo)
        }

        const { data, error } = await updateQuery.select()
        if (error) {
          console.error('Erro ao marcar todas como lidas:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, updated: data, count: data?.length || 0 })
      }
    }
    
    if (action === 'markAsUnread') {
      if (!notificationIds || notificationIds.length === 0) {
        return NextResponse.json({ error: 'IDs das notificações são obrigatórios' }, { status: 400 })
      }
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ lida: false })
        .in('id', notificationIds)
        .eq('user_id', user.id)
        .select()
      
      if (error) {
        console.error('Erro ao marcar como não lidas:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true, updated: data, count: data?.length || 0 })
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao atualizar notificações:', error)
    return NextResponse.json({ error: 'Erro ao atualizar notificações' }, { status: 500 })
  }
}

// DELETE: Excluir notificações
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const mode = searchParams.get('mode') || 'single'
    
    // Caso single (exclusão individual)
    if (mode === 'single') {
      const id = searchParams.get('id')
      if (!id) {
        return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Erro ao excluir notificação:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ success: true, message: 'Notificação excluída com sucesso' })
    }
    
    // Caso selected (exclusão de múltiplas selecionadas)
    if (mode === 'selected') {
      const idsParam = searchParams.get('ids')
      if (!idsParam) {
        return NextResponse.json({ error: 'IDs das notificações são obrigatórios' }, { status: 400 })
      }
      
      const notificationIds = idsParam.split(',')
      if (notificationIds.length === 0) {
        return NextResponse.json({ error: 'IDs das notificações são obrigatórios' }, { status: 400 })
      }
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Erro ao excluir notificações:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${notificationIds.length} notificação(ões) excluída(s)`,
        deletedCount: notificationIds.length
      })
    }
    
    // Caso page (exclusão da página atual)
    if (mode === 'page') {
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '10')
      const filter = searchParams.get('filter') || 'all'
      const offset = (page - 1) * limit

      // Primeiro buscar os IDs da página
      let pageQuery = supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (filter !== 'all') {
        if (filter === 'unread') {
          pageQuery = pageQuery.eq('lida', false)
        } else {
          pageQuery = pageQuery.eq('tipo', filter)
        }
      }

      const { data: pageNotifications, error: pageError } = await pageQuery
      if (pageError) {
        console.error('Erro ao buscar página:', pageError)
        return NextResponse.json({ error: pageError.message }, { status: 500 })
      }

      if (pageNotifications && pageNotifications.length > 0) {
        const pageIds = pageNotifications.map(n => n.id)
        const { error } = await supabase
          .from('notifications')
          .delete()
          .in('id', pageIds)
        
        if (error) {
          console.error('Erro ao excluir página:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `${pageIds.length} notificação(ões) da página excluída(s)`,
          deletedCount: pageIds.length
        })
      }
      
      return NextResponse.json({ success: true, message: 'Nenhuma notificação para excluir', deletedCount: 0 })
    }
    
    // Caso all (excluir todas)
    if (mode === 'all') {
      const filter = searchParams.get('filter') || 'all'
      
      let deleteQuery = supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (filter !== 'all') {
        if (filter === 'unread') {
          deleteQuery = deleteQuery.eq('lida', false)
        } else {
          deleteQuery = deleteQuery.eq('tipo', filter)
        }
      }

      const { error } = await deleteQuery
      if (error) {
        console.error('Erro ao excluir todas:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `Todas as notificações${filter !== 'all' ? ` do filtro "${filter}"` : ''} foram excluídas`,
        deletedCount: 'all'
      })
    }

    return NextResponse.json({ error: 'Modo de exclusão inválido' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao excluir notificações:', error)
    return NextResponse.json({ error: 'Erro ao excluir notificações' }, { status: 500 })
  }
}

// PATCH: Atualizar notificação específica
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const body = await request.json()
    
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID da notificação é obrigatório' }, { status: 400 })
    }

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { lida } = body

    if (lida === undefined) {
      return NextResponse.json({ error: 'Campo "lida" é obrigatório' }, { status: 400 })
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .update({ 
        lida: lida,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar notificação:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      notification,
      message: lida ? 'Notificação marcada como lida' : 'Notificação marcada como não lida'
    })
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error)
    return NextResponse.json({ error: 'Erro ao atualizar notificação' }, { status: 500 })
  }
}