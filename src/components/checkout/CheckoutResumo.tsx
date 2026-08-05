// src/components/checkout/CheckoutResumo.tsx
"use client";

import { ItemCarrinho } from "@/hooks/useCarrinho";
import Image from "next/image";
import { Package } from "lucide-react";

interface CheckoutResumoProps {
  itens: ItemCarrinho[];
  subtotal: number;
  freteValor: number;
  total: number;
  freteGratis?: boolean;
  freteNome?: string;
  fretePrazo?: string;
}

export function CheckoutResumo({
  itens,
  subtotal,
  freteValor,
  total,
  freteGratis = false,
  freteNome,
  fretePrazo,
}: CheckoutResumoProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Package className="w-5 h-5" />
        Resumo do Pedido
      </h3>

      {/* Lista de Itens */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {itens.map((item, index) => (
          <div key={`${item.produto_id}-${item.variacao_id || index}`} className="flex items-start gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 relative overflow-hidden">
              {item.imagem_url ? (
                <Image
                  src={item.imagem_url}
                  alt={item.titulo}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-2">{item.titulo}</p>
              {item.variacao && (
                <p className="text-xs text-gray-500">
                  {item.variacao.cor && `Cor: ${item.variacao.cor}`}
                  {item.variacao.cor && item.variacao.tamanho && " | "}
                  {item.variacao.tamanho && `Tam: ${item.variacao.tamanho}`}
                </p>
              )}
              <p className="text-xs text-gray-500">Qtd: {item.quantidade}</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-sm">
                R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {item.quantidade}x R$ {item.preco_unitario.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Valores */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({itens.reduce((acc, i) => acc + i.quantidade, 0)} itens):</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frete:</span>
          {freteGratis ? (
            <span className="text-green-600 font-medium">Grátis</span>
          ) : (
            <span>R$ {freteValor.toFixed(2)}</span>
          )}
        </div>

        {freteNome && fretePrazo && !freteGratis && (
          <div className="text-xs text-gray-500">
            <p>{freteNome} - {fretePrazo}</p>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total:</span>
          <span className="text-green-600">R$ {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}