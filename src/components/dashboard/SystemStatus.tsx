// components/dashboard/SystemStatus.tsx
"use client";

import { AlertTriangle, Package, ShoppingCart, XCircle } from "lucide-react";

interface SystemStatusProps {
  pedidosPendentes: number;
  produtosBaixoEstoque: number;
  produtosSemEstoque: number;
}

export function SystemStatus({ 
  pedidosPendentes, 
  produtosBaixoEstoque, 
  produtosSemEstoque 
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
    }
  ];

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">
        Status do Sistema
      </h3>
      <div className="space-y-3">
        {statusItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${item.bgColor}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-sm font-medium text-card-foreground">
                  {item.label}
                </span>
              </div>
              <span className={`text-sm font-bold ${item.color}`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}