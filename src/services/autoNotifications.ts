// services/autoNotifications.ts
import { notificationService } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'

export class AutoNotificationService {
  // Verificar estoque baixo periodicamente
  static async checkLowStock() {
    try {
      const { data: lowStockProducts } = await supabase
        .from('produtos')
        .select('id, titulo, estoque, ultima_notificacao_estoque')
        .lt('estoque', 10)
        .gt('estoque', 0)
        .eq('ativo', true)

      for (const product of lowStockProducts || []) {
        const ultimaNotificacao = product.ultima_notificacao_estoque 
          ? new Date(product.ultima_notificacao_estoque) 
          : null
        
        const deveNotificar = !ultimaNotificacao || 
          (Date.now() - ultimaNotificacao.getTime()) > 24 * 60 * 60 * 1000

        if (deveNotificar) {
          await notificationService.estoqueBaixo({
            titulo: '⚠️ Estoque Baixo',
            mensagem: `O produto "${product.titulo}" está com apenas ${product.estoque} unidades em estoque.`,
            metadata: {
              productId: product.id,
              productName: product.titulo,
              currentStock: product.estoque
            }
          })
          
          await supabase
            .from('produtos')
            .update({ ultima_notificacao_estoque: new Date().toISOString() })
            .eq('id', product.id)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar estoque baixo:', error)
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
        await notificationService.sistema({
          titulo: '📋 Pedidos Pendentes',
          mensagem: `Existem ${pendingOrders.length} pedido(s) pendente(s) para processamento.`,
          metadata: { pendingCount: pendingOrders.length }
        })
      }
    } catch (error) {
      console.error('Erro ao verificar pedidos pendentes:', error)
    }
  }

  // Verificar pagamentos atrasados - VERSÃO CORRIGIDA
  static async checkOverduePayments() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Buscar parcelas atrasadas
      const { data: overdueParcelas } = await supabase
        .from('pre_pedido_parcelas')
        .select(`
          id,
          numero_parcela,
          valor_parcela,
          data_vencimento,
          status,
          pre_pedido_id
        `)
        .lt('data_vencimento', today)
        .eq('status', 'pendente')

      if (!overdueParcelas || overdueParcelas.length === 0) return

      // Agrupar por pre_pedido_id
      const pedidosMap = new Map()
      for (const parcela of overdueParcelas) {
        if (!pedidosMap.has(parcela.pre_pedido_id)) {
          pedidosMap.set(parcela.pre_pedido_id, [])
        }
        pedidosMap.get(parcela.pre_pedido_id).push(parcela)
      }

      // Para cada pedido, buscar o cliente
      for (const [prePedidoId, parcelas] of pedidosMap.entries()) {
        const { data: prePedido } = await supabase
          .from('pre_pedidos')
          .select('cliente_id')
          .eq('id', prePedidoId)
          .single()

        if (prePedido?.cliente_id) {
          const { data: cliente } = await supabase
            .from('clientes')
            .select('nome, razao_social')
            .eq('id', prePedido.cliente_id)
            .single()

          const nomeCliente = cliente?.nome || cliente?.razao_social || 'Cliente'
          const totalAtrasado = parcelas.reduce((sum: number, p: any) => sum + Number(p.valor_parcela), 0)

          await notificationService.financeiro({
            titulo: '⚠️ Parcela(s) em Atraso',
            mensagem: `${nomeCliente} possui ${parcelas.length} parcela(s) em atraso no valor total de R$ ${totalAtrasado.toFixed(2)}.`,
            metadata: {
              cliente: nomeCliente,
              parcelasCount: parcelas.length,
              totalAtrasado
            }
          })
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos atrasados:', error)
    }
  }

  // Verificar produtos zerados
  static async checkZeroStock() {
    try {
      const { data: zeroStockProducts } = await supabase
        .from('produtos')
        .select('id, titulo, estoque')
        .eq('estoque', 0)
        .eq('ativo', true)

      if (zeroStockProducts && zeroStockProducts.length > 0) {
        const productsList = zeroStockProducts.slice(0, 5).map(p => p.titulo).join(', ')
        const extra = zeroStockProducts.length - 5
        const mensagem = extra > 0 
          ? `${productsList} e mais ${extra} produto(s) sem estoque`
          : `${productsList} estão sem estoque`

        await notificationService.sistema({
          titulo: '❌ Produtos sem Estoque',
          mensagem,
          metadata: { count: zeroStockProducts.length }
        })
      }
    } catch (error) {
      console.error('Erro ao verificar produtos zerados:', error)
    }
  }

  // Inicializar verificações automáticas
  static initialize() {
    const interval = setInterval(() => {
      this.checkLowStock()
      this.checkPendingOrders()
      this.checkOverduePayments()
      this.checkZeroStock()
    }, 30 * 60 * 1000)

    this.checkLowStock()
    this.checkPendingOrders()
    this.checkOverduePayments()
    this.checkZeroStock()

    return () => clearInterval(interval)
  }
}