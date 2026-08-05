// components/dashboard/SystemStatus.tsx
"use client";

import { AlertTriangle, Package, ShoppingCart, XCircle, EyeOff } from "lucide-react";

interface SystemStatusProps {
  pedidosPendentes: number;
  produtosBaixoEstoque: number;
  produtosSemEstoque: number;
  produtosDesativados: number; // NOVO
}

export function SystemStatus({ 
  pedidosPendentes, 
  produtosBaixoEstoque, 
  produtosSemEstoque,
  produtosDesativados // NOVO
}: SystemStatusProps) {
  const statusItems = [
    {
      icon: ShoppingCart,
      label: "Pedidos Pendentes",
      value: pedidosPendentes,
      color: pedidosPendentes > 0 ? "text-orange-600" : "text-green-600",
      bgColor: pedidosPendentes > 0 ? "bg-orange-50" : "bg-green-50"
    },
    {
      icon: AlertTriangle,
      label: "Produtos com Estoque Baixo",
      value: produtosBaixoEstoque,
      color: produtosBaixoEstoque > 0 ? "text-yellow-600" : "text-green-600",
      bgColor: produtosBaixoEstoque > 0 ? "bg-yellow-50" : "bg-green-50"
    },
    {
      icon: XCircle,
      label: "Produtos sem Estoque",
      value: produtosSemEstoque,
      color: produtosSemEstoque > 0 ? "text-red-600" : "text-green-600",
      bgColor: produtosSemEstoque > 0 ? "bg-red-50" : "bg-green-50"
    },
    {
      icon: EyeOff, // NOVO
      label: "Produtos Desativados",
      value: produtosDesativados,
      color: produtosDesativados > 0 ? "text-gray-600" : "text-green-600",
      bgColor: produtosDesativados > 0 ? "bg-gray-50" : "bg-green-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statusItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div
            key={index}
            className={`flex items-center justify-between p-6 rounded-lg border ${item.bgColor} transition-all hover:shadow-md`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-full bg-white/50 ${item.color}`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}