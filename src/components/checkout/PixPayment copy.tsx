// src/components/checkout/PixPayment.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, Clock } from "lucide-react";

interface PixPaymentProps {
  pedidoId: string;
  total: number;
  onPaymentConfirmed?: () => void;
}

export function PixPayment({ pedidoId, total, onPaymentConfirmed }: PixPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("");
  const [qrCodeText, setQrCodeText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [paymentId, setPaymentId] = useState<string>("");

  useEffect(() => {
    gerarPix();
  }, []);

  const gerarPix = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/mercadopago/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId, total }),
      });

      const data = await response.json();

      if (data.success) {
        setQrCodeBase64(data.qr_code_base64);
        setQrCodeText(data.qr_code);
        setPaymentId(data.payment_id);
      } else {
        setError(data.error || "Erro ao gerar QR Code");
      }
    } catch (err) {
      console.error("Erro ao gerar Pix:", err);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(qrCodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Gerando QR Code PIX...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={gerarPix} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Pagamento via PIX</h3>
            <p className="text-gray-600 text-sm">
              Escaneie o QR Code com seu aplicativo de pagamento
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="border p-4 rounded-lg bg-white">
              <img
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code PIX"
                className="w-64 h-64"
              />
            </div>
          </div>

          {/* Código Copia e Cola */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Ou copie o código PIX:</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 p-3 rounded text-xs font-mono break-all">
                {qrCodeText}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={copiarCodigo}
                className="flex-shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {copied && (
              <p className="text-green-600 text-sm">Código copiado!</p>
            )}
          </div>

          {/* Informações */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-blue-800">
              <Clock className="h-4 w-4" />
              <p className="text-sm">
                O QR Code expira em 30 minutos
              </p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Após o pagamento, a confirmação é automática.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            <p>Valor a pagar: <strong>R$ {total.toFixed(2)}</strong></p>
            <p>Pedido: #{pedidoId.slice(0, 8)}</p>
          </div>

          {onPaymentConfirmed && (
            <Button
              onClick={onPaymentConfirmed}
              variant="outline"
              className="w-full"
            >
              Já realizei o pagamento
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}