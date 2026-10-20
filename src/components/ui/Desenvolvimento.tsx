// components/ui/EmDesenvolvimento.tsx
"use client";

import Link from "next/link";
import { Construction, ArrowLeft, Home } from "lucide-react";

interface EmDesenvolvimentoProps {
  titulo?: string;
  mensagem?: string;
  mostrarBotaoVoltar?: boolean;
  tempoEstimado?: string;
}

export default function Desenvolvimento({
  titulo = "Página em Desenvolvimento",
  mensagem = "Estamos trabalhando para trazer novidades incríveis para você. Em breve esta página estará disponível!",
  mostrarBotaoVoltar = true,
  tempoEstimado = "em breve",
}: EmDesenvolvimentoProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-amber-100 rounded-full animate-pulse"></div>
          </div>
          <div className="relative z-10">
            <Construction className="w-28 h-28 text-amber-600 mx-auto" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">{titulo}</h1>
        
        <p className="text-lg text-gray-600 mb-6">{mensagem}</p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-amber-800">
            ⏳ Previsão: <strong>{tempoEstimado}</strong>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Home size={18} className="mr-2" />
            Ir para Home
          </Link>
          
          {mostrarBotaoVoltar && (
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}