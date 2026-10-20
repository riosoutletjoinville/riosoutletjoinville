// lib/notifications.ts - Serviço de notificações refatorado
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export interface CreateNotificationParams {
  tipo: 'pedido' | 'estoque' | 'cliente' | 'financeiro' | 'mercadolivre' | 'sistema'
  titulo: string
  mensagem: string
  metadata?: Record<string, any>
  userId?: string
}

class NotificationService {
  private supabase = createClientComponentClient()

  // Criar notificação genérica
  async create(params: CreateNotificationParams): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          tipo: params.tipo,
          titulo: params.titulo,
          mensagem: params.mensagem,
          metadata: params.metadata || {},
          user_id: params.userId || null,
          lida: false
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao criar notificação:', error)
      return false
    }
  }

  // Métodos específicos para cada tipo
  async novoPedido(params: { titulo: string; mensagem: string; metadata?: any; userId?: string }) {
    return this.create({ tipo: 'pedido', ...params })
  }

  async pedidoStatusAlterado(params: { titulo: string; mensagem: string; metadata?: any; userId?: string }) {
    return this.create({ tipo: 'pedido', ...params })
  }

  async estoqueBaixo(params: { titulo: string; mensagem: string; metadata?: any; userId?: string }) {
    return this.create({ tipo: 'estoque', ...params })
  }

  async novoCliente(params: { titulo: string; mensagem: string; metadata?: any; userId?: string }) {
    return this.create({ tipo: 'cliente', ...params })
  }

  async financeiro(params: { titulo: string; mensagem: string; metadata?: any; userId?: string }) {
    return this.create({ tipo: 'financeiro', ...params })
  }

  async mercadolivre(params: { titulo: string; mensagem: string; metadata?: any; userId?: string }) {
    return this.create({ tipo: 'mercadolivre', ...params })
  }

  async sistema(params: { titulo: string; mensagem: string; metadata?: any; userId?: string }) {
    return this.create({ tipo: 'sistema', ...params })
  }

  // Buscar notificações
  async getNotifications(options?: { 
    filter?: string; 
    page?: number; 
    limit?: number;
    includeCount?: boolean;
  }) {
    const searchParams = new URLSearchParams()
    
    if (options?.filter && options.filter !== 'all') {
      searchParams.set('filter', options.filter)
    }
    if (options?.page) searchParams.set('page', options.page.toString())
    if (options?.limit) searchParams.set('limit', options.limit.toString())
    if (options?.includeCount) searchParams.set('includeCount', 'true')

    const response = await fetch(`/api/notifications?${searchParams.toString()}`)
    return response.json()
  }

  // Marcar como lida
  async markAsRead(notificationIds: string | string[]) {
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds]
    
    const response = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAsRead', notificationIds: ids })
    })
    
    return response.json()
  }

  // Marcar todas como lidas
  async markAllAsRead(filter?: string) {
    const response = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAsRead', filters: { tipo: filter } })
    })
    
    return response.json()
  }

  // Excluir notificação
  async deleteNotification(notificationId: string) {
    const response = await fetch(`/api/notifications?id=${notificationId}&mode=single`, {
      method: 'DELETE'
    })
    
    return response.json()
  }

  // Excluir notificações selecionadas
  async deleteSelected(notificationIds: string[]) {
    const response = await fetch(`/api/notifications?mode=selected&ids=${notificationIds.join(',')}`, {
      method: 'DELETE'
    })
    
    return response.json()
  }

  // Excluir página atual
  async deletePage(page: number, limit: number, filter?: string) {
    const response = await fetch(`/api/notifications?mode=page&page=${page}&limit=${limit}&filter=${filter || 'all'}`, {
      method: 'DELETE'
    })
    
    return response.json()
  }

  // Excluir todas as notificações
  async deleteAll(filter?: string) {
    const response = await fetch(`/api/notifications?mode=all&filter=${filter || 'all'}`, {
      method: 'DELETE'
    })
    
    return response.json()
  }

  // Operações em lote
  async batchOperation(action: 'markAsRead' | 'markAsUnread' | 'delete', notificationIds: string[]) {
    const response = await fetch('/api/notifications/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notificationIds })
    })
    
    return response.json()
  }

  // Buscar contagens
  async getCounts(filter?: string) {
    const searchParams = new URLSearchParams()
    if (filter && filter !== 'all') searchParams.set('filter', filter)
    
    const response = await fetch(`/api/notifications/count?${searchParams.toString()}`)
    return response.json()
  }
}

export const notificationService = new NotificationService()