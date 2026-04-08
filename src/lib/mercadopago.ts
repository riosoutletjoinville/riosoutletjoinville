// src/lib/mercadopago.ts
import axios from "axios";
import {
  MercadoPagoPreference,
  PaymentData,
  PaymentResponseMP,
  PreferenceResponseMP,
} from "@/types/mercadopago";
import { randomUUID } from "crypto";

export interface CreatePaymentRequest {
  transaction_amount: number;
  token: string;
  payment_method_id: string;
  installments: number;
  issuer_id?: string;
  payer: {
    email: string;
    identification?: {
      type: "CPF" | "CNPJ";
      number: string;
    };
    name?: string; // Adicionar nome do titular aqui
  };
  first_name?: string; // Manter para compatibilidade, mas não usar
  last_name?: string;
  external_reference: string;
  description?: string;
}

export class MercadoPagoService {
  private readonly accessToken: string;
  private readonly baseURL = "https://api.mercadopago.com";

  constructor() {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não está definido no ambiente");
    }
    this.accessToken = token;
  }

  async createPreference(
    preferenceData: MercadoPagoPreference,
  ): Promise<PreferenceResponseMP> {
    const response = await this.makeRequest<PreferenceResponseMP>(
      "POST",
      "/checkout/preferences",
      preferenceData,
    );
    return response;
  }

  async getPayment(paymentId: string): Promise<PaymentResponseMP> {
    const response = await this.makeRequest<PaymentResponseMP>(
      "GET",
      `/v1/payments/${paymentId}`,
    );
    return response;
  }

  async createPayment(data: CreatePaymentRequest): Promise<PaymentResponseMP> {
    const response = await this.makeRequest<PaymentResponseMP>(
      "POST",
      "/v1/payments",
      data,
      {
        "X-Idempotency-Key": randomUUID(),
      },
    );
    return response;
  }

  // src/lib/mercadopago.ts
async processPayment(data: CreatePaymentRequest): Promise<PaymentResponseMP> {
  let cpfNumber = "";

  if (data.payer.identification && data.payer.identification.number) {
    cpfNumber = data.payer.identification.number.replace(/\D/g, "");
  }

  // CORREÇÃO: O nome do titular deve ir dentro do payer
  const payer = {
    email: data.payer.email,
    identification: {
      type: "CPF" as const,
      number: cpfNumber,
    },
    name: data.first_name, // Adicionar nome dentro do payer
  };

  const paymentRequest = {
    transaction_amount: Number(data.transaction_amount.toFixed(2)),
    token: data.token,
    description: data.description || `Pedido #${data.external_reference}`,
    installments: data.installments,
    payment_method_id: data.payment_method_id,
    issuer_id: data.issuer_id,
    payer: payer,
    // REMOVER first_name do nível raiz
    external_reference: data.external_reference,
  };

  console.log(
    "Enviando pagamento - payer:",
    JSON.stringify(paymentRequest.payer, null, 2),
  );
  console.log(
    "Enviando pagamento - COMPLETO:",
    JSON.stringify(paymentRequest, null, 2),
  );

  const response = await this.makeRequest<PaymentResponseMP>(
    "POST",
    "/v1/payments",
    paymentRequest,
    {
      "X-Idempotency-Key": randomUUID(),
    },
  );

  return response;
}

  private async makeRequest<T>(
    method: "GET" | "POST",
    endpoint: string,
    data?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    try {
      // CORREÇÃO: Forçar serialização completa recursiva
      const cleanData = JSON.parse(
        JSON.stringify(data, (key, value) => {
          // Se for objeto identification, garantir que seja serializado corretamente
          if (key === "identification" && value && typeof value === "object") {
            return {
              type: value.type,
              number: value.number,
            };
          }
          return value;
        }),
      );

      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          ...extraHeaders,
        },
        data: cleanData,
      };

      console.log(`📡 Fazendo requisição ${method} ${endpoint}`);
      console.log("📡 Body enviado:", JSON.stringify(cleanData, null, 2));

      const response = await axios(config);
      return response.data as T;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("❌ ERRO COMPLETO DO MERCADO PAGO:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          requestData: data,
        });

        const errorData = error.response?.data;
        let message = "Erro desconhecido";

        if (errorData?.message) {
          message = errorData.message;
        }

        if (errorData?.cause && errorData.cause.length > 0) {
          const causes = errorData.cause
            .map((c: any) => c.description || c.message)
            .join(", ");
          message = `${message} - Detalhes: ${causes}`;
        }

        throw new Error(`Falha na API Mercado Pago: ${message}`);
      }
      console.error("❌ Erro inesperado na requisição MP:", error);
      throw new Error("Erro interno ao comunicar com Mercado Pago");
    }
  }
}

export const mercadoPagoService = new MercadoPagoService();
