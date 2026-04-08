// lib/notifications.ts
import { supabase } from '@/lib/supabase'

export interface CreateNotificationData {
  tipo: 'pedido' | 'estoque' | 'financeiro' | 'cliente' | 'sistema' | 'mercadolivre'
  titulo: string
  mensagem: string
  user_id?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any
}

export async function createNotification(data: CreateNotificationData) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        tipo: data.tipo,
        titulo: data.titulo,
        mensagem: data.mensagem,
        user_id: data.user_id || null,
        metadata: data.metadata || null,
        lida: false
      }])

    if (error) {
      console.error('Erro ao criar notificação:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao criar notificação:', error)
    return false
  }
}

// Notificações específicas para cada módulo
export const notificationService = {
  // Notificações de Pedidos
  async novoPedido(pedidoId: string, total: number, clienteNome: string) {
    return await createNotification({
      tipo: 'pedido',
      titulo: 'Novo Pedido Recebido',
      mensagem: `Pedido #${pedidoId.slice(-6)} - ${clienteNome} - R$ ${total.toFixed(2)}`,
      metadata: { pedido_id: pedidoId, total, cliente_nome: clienteNome }
    })
  },

  async pedidoStatusAlterado(pedidoId: string, novoStatus: string) {
    return await createNotification({
      tipo: 'pedido',
      titulo: 'Status do Pedido Alterado',
      mensagem: `Pedido #${pedidoId.slice(-6)} - Status: ${novoStatus}`,
      metadata: { pedido_id: pedidoId, novo_status: novoStatus }
    })
  },

  // Notificações de Estoque
  async estoqueBaixo(produtoId: string, produtoNome: string, estoqueAtual: number) {
    return await createNotification({
      tipo: 'estoque',
      titulo: 'Estoque Baixo',
      mensagem: `${produtoNome} - Apenas ${estoqueAtual} unidades em estoque`,
      metadata: { produto_id: produtoId, produto_nome: produtoNome, estoque_atual: estoqueAtual }
    })
  },

  async semEstoque(produtoId: string, produtoNome: string) {
    return await createNotification({
      tipo: 'estoque',
      titulo: 'Produto sem Estoque',
      mensagem: `${produtoNome} - Estoque esgotado`,
      metadata: { produto_id: produtoId, produto_nome: produtoNome }
    })
  },

  // Notificações de Clientes
  async novoCliente(clienteId: string, clienteNome: string, tipo: string) {
    return await createNotification({
      tipo: 'cliente',
      titulo: 'Novo Cliente Cadastrado',
      mensagem: `${clienteNome} (${tipo})`,
      metadata: { cliente_id: clienteId, cliente_nome: clienteNome, tipo_cliente: tipo }
    })
  },

  // Notificações Financeiras
  async novaReceita(valor: number, descricao: string) {
    return await createNotification({
      tipo: 'financeiro',
      titulo: 'Nova Receita',
      mensagem: `${descricao} - R$ ${valor.toFixed(2)}`,
      metadata: { valor, descricao, tipo_movimento: 'entrada' }
    })
  },

  async novaDespesa(valor: number, descricao: string) {
    return await createNotification({
      tipo: 'financeiro',
      titulo: 'Nova Despesa',
      mensagem: `${descricao} - R$ ${valor.toFixed(2)}`,
      metadata: { valor, descricao, tipo_movimento: 'saida' }
    })
  },

  // Notificações do Sistema
  async sistema(message: string, critical = false) {
    return await createNotification({
      tipo: 'sistema',
      titulo: critical ? 'Alerta do Sistema' : 'Informação do Sistema',
      mensagem: message,
      metadata: { critical }
    })
  }
}