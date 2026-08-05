// src/components/checkout/PixPayment.tsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check, Clock } from "lucide-react";

interface PixPaymentProps {
  pedidoId: string;
  total: number;
  initialPixData?: {
    qr_code: string;
    qr_code_base64: string;
    payment_id: string;
  } | null;
  onPaymentConfirmed?: () => void;
}

export function PixPayment({
  pedidoId,
  total,
  initialPixData,
  onPaymentConfirmed,
}: PixPaymentProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [qrCodeBase64, setQrCodeBase64] = useState<string>("");
  const [qrCodeText, setQrCodeText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [paymentId, setPaymentId] = useState<string>("");
  const hasFetched = useRef(false);

  
const gerarPix = useCallback(async () => {
  console.log("🔄 Chamando gerarPix()...");

  if (!pedidoId) {
    console.error("❌ Pedido ID não disponível");
    setError("Pedido não identificado");
    setLoading(false);
    return;
  }

  setLoading(true);
  setError("");

  try {
    const response = await fetch("/api/mercadopago/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pedido_id: pedidoId,
        total: total,
      }),
    });

    const data = await response.json();
    console.log("📦 Resposta da API PIX:", data);

    if (data.success) {
      console.log("✅ PIX gerado via API!");
      setQrCodeBase64(data.qr_code_base64);
      setQrCodeText(data.qr_code);
      setPaymentId(data.payment_id);
      setLoading(false);
    } else {
      console.error("❌ Erro na resposta:", data.error);
      setError(data.error || `Erro ${response.status}: ${JSON.stringify(data)}`);
      setLoading(false);
    }
  } catch (err) {
    console.error("❌ Erro completo no fetch PIX:", err);
    setError(`Falha de comunicação: ${err.message || err}`);
    setLoading(false);
  }
}, [pedidoId, total]); // ✅ Dependências corretas


useEffect(() => {
  console.log("🔍 PixPayment iniciado com:", { 
    pedidoId, 
    hasInitialData: !!initialPixData,
    initialPixData 
  });
  
  if (!hasFetched.current) {
    hasFetched.current = true;
    
    if (initialPixData?.qr_code_base64 && initialPixData?.qr_code) {
      console.log("✅ Usando initialPixData fornecido");
      setQrCodeBase64(initialPixData.qr_code_base64);
      setQrCodeText(initialPixData.qr_code);
      setPaymentId(initialPixData.payment_id);
      setLoading(false);
    } else {
      console.log("🔄 Sem initialPixData, chamando gerarPix()");
      gerarPix();
    }
  }
  
  // Cleanup: resetar hasFetched quando o componente desmontar
  return () => {
    hasFetched.current = false;
  };
}, [pedidoId, initialPixData, gerarPix]);

  const copiarCodigo = () => {
    navigator.clipboard.writeText(qrCodeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
// Inside the component, after the initial useEffect
useEffect(() => {
  if (initialPixData) {
    // force set
    setQrCodeBase64(initialPixData.qr_code_base64);
    setQrCodeText(initialPixData.qr_code);
    setPaymentId(initialPixData.payment_id);
    setLoading(false);
  }
}, [initialPixData]);
  // ✅ Garantir que loading seja false quando tiver dados
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

  if (!qrCodeBase64 && !qrCodeText) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-4">QR Code não disponível</p>
          <Button onClick={gerarPix} variant="outline">
            Gerar PIX
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
              {qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-64 h-64"
                  onError={(e) =>
                    console.error("❌ Erro ao carregar imagem:", e)
                  }
                  onLoad={() => console.log("✅ Imagem carregada com sucesso!")}
                />
              ) : (
                <div className="w-64 h-64 bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-400">QR Code não disponível</p>
                </div>
              )}
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
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
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
              <p className="text-sm">O QR Code expira em 30 minutos</p>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Após o pagamento, a confirmação é automática.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            <p>
              Valor a pagar: <strong>R$ {total.toFixed(2)}</strong>
            </p>
            <p>Pedido: #{pedidoId.slice(0, 8)}</p>
          </div>

          {onPaymentConfirmed && (
            <Button
              onClick={onPaymentConfirmed}
              variant="outline"
              className="w-full mt-4"
            >
              Já realizei o pagamento
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}