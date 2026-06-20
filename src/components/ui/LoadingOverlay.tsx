// components/ui/LoadingOverlay.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Target } from "lucide-react";

export default function LoadingOverlay() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleStart = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLoading(true);
      }, 300); // Delay para não mostrar em navegações muito rápidas
    };

    const handleComplete = () => {
      clearTimeout(timeoutId);
      setIsLoading(false);
    };

    // Listeners para navegação
    window.addEventListener("beforeunload", handleStart);
    
    // Quando a rota muda
    handleComplete();

    return () => {
      window.removeEventListener("beforeunload", handleStart);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center transition-opacity duration-300">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center">
        <div className="relative">
          {/* Logo animada */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
            <Target className="w-10 h-10 text-white animate-pulse" />
          </div>
          
          {/* Spinner */}
          <div className="absolute -top-2 -right-2">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-primary-600 animate-spin"></div>
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Carregando módulo
        </h3>
        <p className="text-gray-600 mb-4">
          Aguarde enquanto preparamos o conteúdo...
        </p>
        
        {/* Barra de progresso simulada */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full animate-progress"
            style={{ width: "90%" }}
          ></div>
        </div>
        
        {/* Dicas dinâmicas */}
        <div className="mt-6 text-sm text-gray-500">
          <p className="animate-pulse">
            {tips[Math.floor(Math.random() * tips.length)]}
          </p>
        </div>
      </div>
    </div>
  );
}

const tips = [
  "💡 Você pode usar atalhos de teclado para navegar mais rápido",
  "🚀 Atalho: G + D para ir ao Dashboard",
  "📊 Atalho: G + F para ir ao Funil de Vendas",
  "💬 Atalho: G + W para ir ao WhatsApp",
  "🎯 Mantenha seus leads organizados com tags personalizadas",
  "⚡ Use modelos rápidos para agilizar o atendimento",
];