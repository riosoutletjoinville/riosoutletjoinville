//src/types/index.ts
export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image_url: string
  created_at: string
}

export interface Order {
  id: string
  customer_name: string
  total: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  created_at: string
}

export interface Produto {
  id: string
  nome: string
  descricao: string
  preco: number
  estoque: number
  categoria: string
  created_at: string
}

export interface Cliente {
  id: string
  nome: string
  email: string
  telefone: string
  endereco: string
  created_at: string
}

export interface Pedido {
  id: string
  cliente_id: string
  total: number
  status: string
  data_pedido: string
  created_at: string
  cliente: Cliente
}

export interface MovimentoFinanceiro {
  id: string
  tipo: string
  descricao: string
  valor: number
  categoria: string
  data_movimento: string
  created_at: string
}

export interface PedidoItem {
  id: string
  pedido_id: string
  produto_id: string
  variacao_id?: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  desconto?: number
}

export interface MovimentoFinanceiro {
  id: string
  tipo: string
  descricao: string
  valor: number
  categoria: string
  data_movimento: string
  created_at: string
  pedido_id?: string
  tipo_movimento?: 'entrada' | 'saida'
  status?: string
}
