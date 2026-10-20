// components/dashboard/PedidosMetrics.tsx
"use client";
import { TrendingUp, Users, Package, AlertTriangle, LucideIcon } from "lucide-react";

interface Pedido {
  data_pedido: string;
  total: number;
  status: string;
}

interface PrePedido {
  status: string;
}

interface PedidosMetricsProps {
  pedidos: Pedido[];
  prePedidos: PrePedido[];
}

interface Metric {
  label: string;
  value: string;
  icon: LucideIcon;
  change: string;
  trend: "up" | "down";
}

export default function PedidosMetrics({ pedidos, prePedidos }: PedidosMetricsProps) {
  const metrics: Metric[] = [
    {
      label: "Faturamento Hoje",
      value: `R$ ${pedidos
        .filter(p => new Date(p.data_pedido).toDateString() === new Date().toDateString())
        .reduce((sum, p) => sum + p.total, 0)
        .toFixed(2)}`,
      icon: TrendingUp,
      change: "+12%",
      trend: "up",
    },
    {
      label: "Pedidos Pendentes",
      value: pedidos.filter(p => p.status === 'pendente').length.toString(),
      icon: Package,
      change: "+5%",
      trend: "up",
    },
    {
      label: "Pré-Pedidos Ativos",
      value: prePedidos.filter(p => p.status === 'confirmado').length.toString(),
      icon: Users,
      change: "-2%",
      trend: "down",
    },
    {
      label: "Problemas",
      value: pedidos.filter(p => 
        ['cancelado', 'devolvido', 'trocado'].includes(p.status)
      ).length.toString(),
      icon: AlertTriangle,
      change: "+8%",
      trend: "up",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                <p className={`text-sm mt-1 ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change} em relação à semana passada
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}