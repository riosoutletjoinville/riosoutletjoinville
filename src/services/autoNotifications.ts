// services/autoNotifications.ts
import { notificationService } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'

export class AutoNotificationService {
  // Verificar estoque baixo periodicamente
  static async checkLowStock() {
    try {
      const { data: lowStockProducts } = await supabase
        .from('produtos')
        .select('id, titulo, estoque')
        .lt('estoque', 10)
        .gt('estoque', 0)
        .eq('ativo', true)

      for (const product of lowStockProducts || []) {
        await notificationService.estoqueBaixo(
          product.id,
          product.titulo,
          product.estoque
        )
      }

      // Verificar produtos sem estoque
      const { data: outOfStockProducts } = await supabase
        .from('produtos')
        .select('id, titulo')
        .eq('estoque', 0)
        .eq('ativo', true)

      for (const product of outOfStockProducts || []) {
        await notificationService.semEstoque(product.id, product.titulo)
      }
    } catch (error) {
      console.error('Erro ao verificar estoque:', error)
    }
  }

  // Verificar pedidos pendentes
  static async checkPendingOrders() {
    try {
      const { data: pendingOrders } = await supabase
        .from('pedidos')
        .select('id, total, status')
        .eq('status', 'pendente')

      if (pendingOrders && pendingOrders.length > 0) {
        await notificationService.sistema(
          `Existem ${pendingOrders.length} pedidos pendentes para processamento`
        )
      }
    } catch (error) {
      console.error('Erro ao verificar pedidos pendentes:', error)
    }
  }

  // Inicializar verificações automáticas
  static initialize() {
    // Verificar a cada 30 minutos
    setInterval(() => {
      this.checkLowStock()
      this.checkPendingOrders()
    }, 30 * 60 * 1000) // 30 minutos

    // Executar imediatamente ao iniciar
    this.checkLowStock()
    this.checkPendingOrders()
  }
}