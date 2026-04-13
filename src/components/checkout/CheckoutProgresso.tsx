// src/components/checkout/CheckoutProgresso.tsx
"use client";

import { Check } from "lucide-react";

interface CheckoutProgressoProps {
  etapaAtual: "revisao" | "pagamento" | "confirmacao";
}

const etapas = [
  { id: "revisao", label: "Revisão", numero: 1 },
  { id: "pagamento", label: "Pagamento", numero: 2 },
  { id: "confirmacao", label: "Confirmação", numero: 3 },
] as const;

export function CheckoutProgresso({ etapaAtual }: CheckoutProgressoProps) {
  const indiceAtual = etapas.findIndex(e => e.id === etapaAtual);

  return (
    <div className="flex items-center justify-center">
      {etapas.map((etapa, index) => {
        const isCompleted = index < indiceAtual;
        const isActive = index === indiceAtual;
        const isPending = index > indiceAtual;

        return (
          <div key={etapa.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  isCompleted
                    ? "bg-green-600 text-white"
                    : isActive
                    ? "bg-green-600 text-white ring-4 ring-green-100"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  etapa.numero
                )}
              </div>
              <span
                className={`text-xs mt-2 ${
                  isActive ? "text-green-600 font-medium" : "text-gray-500"
                }`}
              >
                {etapa.label}
              </span>
            </div>
            {index < etapas.length - 1 && (
              <div
                className={`w-16 md:w-24 h-0.5 mx-2 ${
                  index < indiceAtual ? "bg-green-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}