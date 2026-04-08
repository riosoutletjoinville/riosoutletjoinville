// components/dashboard/QuickActions.tsx
"use client";

import Link from "next/link";
import { Package, ShoppingCart, Users, BarChart3 } from "lucide-react";

export function QuickActions() {
  const quickActions = [
    {
      title: "Novo Produto",
      description: "Adicionar produto",
      icon: Package,
      href: "/dashboard/products",
      color: "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
    },
    {
      title: "Novo Pedido",
      description: "Criar pedido",
      icon: ShoppingCart,
      href: "/dashboard/orders",
      color: "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
    },
    {
      title: "Novo Cliente",
      description: "Cadastrar cliente",
      icon: Users,
      href: "/dashboard/clients",
      color: "bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700"
    },
    {
      title: "Relatórios",
      description: "Ver relatórios",
      icon: BarChart3,
      href: "/dashboard/reports",
      color: "bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
    },
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">
        Ações Rápidas
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              href={action.href}
              className="block group"
            >
              <div className={`
                ${action.color} text-white rounded-lg p-4 text-center 
                transition-all duration-200 group-hover:shadow-lg
              `}>
                <Icon className="h-6 w-6 mx-auto mb-2" />
                <div className="text-sm font-medium">{action.title}</div>
                <div className="text-xs opacity-90 mt-1">{action.description}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}