//src/types/pre-pedido.ts
export interface Cliente {
  id: string;
  tipo_cliente: 'juridica' | 'fisica';
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  nome?: string;
  sobrenome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}

export interface Produto {
  id: string;
  titulo: string;
  preco: number;
  codigo: string;
  ncm: string;
  imagem_principal?: string;
}

export interface ItemPedido {
  produto: Produto;
  quantidade: number;
  preco_unitario: number;
  tamanhos: { [tamanho: string]: number };
  subtotal: number;
  desconto: number;
  filial: string;
  embargue: string;
}

export interface PrePedido {
  id: string;
  cliente_id: string;
  itens: ItemPedido[];
  total: number;
  observacoes: string;
  condicao_pagamento: string;
  status: 'rascunho' | 'confirmado' | 'cancelado';
  usuario_id: string;
  created_at: string;
  updated_at: string;
  cliente?: Cliente;
}