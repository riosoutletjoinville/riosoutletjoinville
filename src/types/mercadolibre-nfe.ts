// src/types/mercadolibre-nfe.ts

export interface MercadoLivreNFe {
  id?: string;
  order_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'issued' | 'cancelled' | 'error';
  invoice_number?: string;
  invoice_url?: string;
  access_token: string;
  emission_date?: Date;
  cancellation_date?: Date;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface NFeEmissionData {
  order_id: string;
  access_token: string;
  invoice_data: {
    type: 'invoice' | 'credit_note';
    series: number;
    number: number;
    issued_date: string; // ISO 8601
    invoice_key?: string;
    items: Array<{
      item_code: string;
      description: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      tax_rate: number;
    }>;
    customer: {
      tax_payer_id: string; // CPF/CNPJ
      legal_name: string;
      email: string;
      address: {
        zip_code: string;
        street_name: string;
        street_number: string;
        neighborhood: string;
        city: string;
        state: string;
      };
    };
    total: {
      gross: number;
      discounts: number;
      taxes: number;
      net: number;
    };
  };
}

export interface NFeEmissionResponse {
  invoice_id: string;
  status: string;
  invoice_number: string;
  invoice_url: string;
  emission_date: string;
}

export interface NFeStatusResponse {
  invoice_id: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  invoice_number?: string;
  invoice_url?: string;
  rejection_reason?: string;
}

export interface WebhookNFeEvent {
  resource: string;
  user_id: number;
  topic: 'invoices';
  application_id: number;
  sent: string;
  attempt: number;
  data: {
    invoice_id: string;
    order_id: string;
    status: string;
  };
}