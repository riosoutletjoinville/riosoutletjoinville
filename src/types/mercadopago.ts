// src/types/mercadopago.ts 
export interface MercadoPagoItem {
  id?: string;
  title: string;
  quantity: number;
  currency_id: "BRL";
  unit_price: number;
}

export interface DadosFreteMP {
  cep: string;
  valor_frete: number;
  frete_gratis: boolean;
  opcao_frete?: string;
  prazo_entrega?: string;
}

export interface MercadoPagoPayer {
  email?: string;
  first_name?: string;
  last_name?: string;
  identification?: {
    type: "CPF" | "CNPJ";
    number: string;
  };
}

export interface MercadoPagoPreference {
  items: MercadoPagoItem[];
  payer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: "CPF" | "CNPJ";
      number: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return?: "approved";
  notification_url?: string;
  external_reference?: string;
  statement_descriptor?: string;
  purpose?: "wallet_purchase";
}

export interface ItemPedidoMP {
  id: string;
  produto_id: string;
  variacao_id?: string; 
  titulo: string;
  preco_unitario: number;
  quantidade: number;
  imagem_url: string;
  variacao?: {
    cor?: string;
    tamanho?: string;
  };
}

export interface ClienteDadosMP {
  nome: string;
  sobrenome: string;
  email: string;
  cnpj: string;
  cpf: string;
  telefone?: string;
  tipo_cliente: "fisica" | "juridica";
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface ClienteCadastroMP {
  nome: string;
  sobrenome: string;
  email: string;
  cpf: string;
  telefone?: string;
  tipo_cliente: "fisica" | "juridica";
  senha?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface CheckoutRequestMP {
  pedido_id?: string;
  itens: ItemPedidoMP[];
  total: number;
  subtotal?: number;
  frete_valor?: number; 
  frete_nome?: string; 
  frete_prazo?: string; 
  cliente_email: string;
  cliente_nome: string;
  criar_conta?: boolean;
  cliente_senha?: string;
  cliente_dados?: ClienteDadosMP;
  tipo_checkout?: "login" | "cadastro" | "guest";
  frete?: DadosFreteMP;
}

export interface CheckoutResponseMP {
  success: boolean;
  preference_id: string;
  init_point?: string;
  cliente_id: string;
  pedido_id: string;
}

export interface PaymentResponseMP {
  id: number | string;
  date_created: string;
  date_approved: string | null;
  date_last_updated: string;
  money_release_date: string | null;
  issuer_id: string | null;
  payment_method_id: string;
  payment_type_id: string;
  status: "approved" | "pending" | "in_process" | "rejected" | "cancelled" | "authorized" | "refunded" | "charged_back";
  status_detail?: string;
  currency_id: string;
  description: string;
  taxes_amount: number;
  shipping_amount: number;
  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;
  transaction_details: {
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    external_resource_url: string | null;
    installment_amount: number;
    financial_institution: string | null;
  };
  installments: number;
  card_id: string | null;
  external_reference: string;
  statement_descriptor: string;
  notification_url: string | null;
  
  // ADICIONE ESTA PROPRIEDADE (essencial para Pix)
  point_of_interaction?: {
    type: string;
    sub_type: string | null;
    application_data?: {
      name: string;
      version: string;
    };
    transaction_data?: {
      qr_code_base64: string;
      qr_code: string;
      ticket_url: string;
    };
  };
  
  payer?: {
    id: string | null;
    email: string;
    identification: {
      type: string;
      number: string;
    };
    type: string | null;
  };
  
  fee_details?: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
}

// resposta da API de Pix
export interface PixPaymentResponse {
  success: boolean;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  payment_id: number | string;
  status: string;
  pedido_id?: string;
}

// requisição de Pix
export interface PixPaymentRequest {
  pedido_id: string;
  total: number;
}

export interface PreferenceResponseMP {
  id: string;
  init_point: string;
}

export interface BrickInitialization {
  amount: number;
  preferenceId?: string;
}

export interface BrickCustomization {
  visual?: {
    style?: {
      theme?: "default" | "dark" | "bootstrap" | "flat";
      customVariables?: {
        [key: string]: string;
      };
    };
  };
  paymentMethods?: {
    types?: {
      creditCard?: boolean;
      debitCard?: boolean;
      ticket?: boolean;
      bankTransfer?: boolean;
      atm?: boolean;
      digitalWallet?: boolean;
    };
    excludedPaymentTypes?: string[];
    installments?: number;
  };
}

export interface BrickRender {
  render: (container: string, settings: BrickSettings) => Promise<void>;
}

export interface BrickSettings {
  initialization: BrickInitialization;
  customization?: BrickCustomization;
  callbacks?: {
    onReady?: () => void;
    onError?: (error: BrickError) => void;
    onSubmit?: (cardFormData: CardFormData) => void;
  };
}

export interface BrickError {
  type: string;
  cause: BrickErrorCause[];
}

export interface BrickErrorCause {
  code: string;
  description: string;
}

export interface CardFormData {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  description: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

export interface PaymentData {
  transaction_amount: number;
  token: string;
  description: string;
  installments: number;
  payment_method_id: string;
  issuer_id: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
  pedido_id?: string;
}

export interface DadosClientePedido {
  nome: string;
  sobrenome?: string;
  email: string;
  cpf?: string;
  telefone?: string;
  tipo_cliente: "fisica" | "juridica";
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface DadosCheckout {
  email: string;
  nome: string;
  tipo_cliente: "fisica" | "juridica";
  criar_conta: boolean;
  senha?: string;
  sobrenome?: string;
  cpf?: string;
  telefone?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface DadosFormularioCheckout {
  email: string;
  senha?: string;
  nome: string;
  sobrenome?: string;
  cpf?: string;
  cnpj?: string;
  telefone?: string;
  tipo_cliente: "fisica" | "juridica";
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface CheckoutLogadoRequest {
  itens: ItemPedidoMP[];
  total: number;
  subtotal: number;
  frete_valor: number;
  frete_nome?: string;
  frete_prazo?: string;
  cliente_email: string;
  cliente_nome: string;
  cliente_id: string;
  cliente_dados: {
    email: string;
    nome: string;
    sobrenome?: string;
    cpf?: string;
    cnpj?: string;
    telefone?: string;
    tipo_cliente: "fisica" | "juridica";
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  tipo_checkout: "logado";
}

export interface CheckoutLogadoResponse {
  success: boolean;
  preference_id: string;
  init_point: string;
  pedido_id: string;
  cliente_id: string;
  error?: string;
}