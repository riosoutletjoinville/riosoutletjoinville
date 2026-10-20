// src/components/checkout/CheckoutPagamento.tsx
"use client";

import { useState, useEffect } from "react";
import { CreditCard, Banknote, QrCode, Shield, Lock } from "lucide-react";

interface CheckoutPagamentoProps {
  preferenceId: string;
  total: number;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
  onPaymentPending?: (paymentId: string) => void;
}

export function CheckoutPagamento({
  preferenceId,
  total,
  onPaymentSuccess,
  onPaymentError,
  onPaymentPending,
}: CheckoutPagamentoProps) {
  const [formaPagamento, setFormaPagamento] = useState<"cartao" | "pix" | "boleto">("cartao");
  const [loading, setLoading] = useState(false);

  // Este componente é um wrapper para o Brick do Mercado Pago
  // O Brick real será inicializado via useEffect na página de checkout
  
  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <CreditCard className="w-5 h-5" />
        Forma de Pagamento
      </h3>

      {/* Opções de Pagamento */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFormaPagamento("cartao")}
          className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
            formaPagamento === "cartao"
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <CreditCard className={`w-6 h-6 ${formaPagamento === "cartao" ? "text-green-600" : "text-gray-500"}`} />
          <span className="text-sm font-medium">Cartão</span>
          <span className="text-xs text-gray-500">até 12x</span>
        </button>

        <button
          onClick={() => setFormaPagamento("pix")}
          className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
            formaPagamento === "pix"
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <QrCode className={`w-6 h-6 ${formaPagamento === "pix" ? "text-green-600" : "text-gray-500"}`} />
          <span className="text-sm font-medium">PIX</span>
          <span className="text-xs text-gray-500">instantâneo</span>
        </button>

        <button
          onClick={() => setFormaPagamento("boleto")}
          className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-all ${
            formaPagamento === "boleto"
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Banknote className={`w-6 h-6 ${formaPagamento === "boleto" ? "text-green-600" : "text-gray-500"}`} />
          <span className="text-sm font-medium">Boleto</span>
          <span className="text-xs text-gray-500">3 dias úteis</span>
        </button>
      </div>

      {/* Container para o Brick do Mercado Pago */}
      <div id="paymentBrick_container" className="min-h-[300px]">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        )}
      </div>

      {/* Informações de Segurança */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4" />
          <span>Pagamento Seguro</span>
        </div>
        <div className="flex items-center gap-1">
          <Lock className="w-4 h-4" />
          <span>Dados Criptografados</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Ao finalizar, você concorda com nossos Termos de Uso e Política de Privacidade.
      </p>
    </div>
  );
}