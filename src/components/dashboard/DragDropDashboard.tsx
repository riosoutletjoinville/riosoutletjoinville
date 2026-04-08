// components/dashboard/DragDropDashboard.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Grid3X3, 
  Settings, 
  Package, 
  ShoppingCart, 
  Users, 
  StoreIcon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  LucideIcon 
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DashboardStats {
  totalProdutos: number;
  produtosBaixoEstoque: number;
  totalPedidos: number;
  pedidosPendentes: number;
  totalClientes: number;
  produtosML: number;
  receitaMes: number;
  despesaMes: number;
}

interface DragDropDashboardProps {
  stats: DashboardStats;
}

interface LayoutItem {
  id: string;
  colSpan: number;
}

interface StatCardData {
  id: string;
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  href: string;
  description: string;
  trend: "positive" | "warning" | "negative" | "neutral";
}

function SortableStatCard({ id, card, isEditing }: { id: string; card: StatCardData; isEditing: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isDragging ? 'opacity-50 z-50' : ''}
        h-full
      `}
    >
      <StatCard {...card} />
    </div>
  );
}

export function DragDropDashboard({ stats }: DragDropDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const defaultLayout = useMemo((): LayoutItem[] => [
    { id: 'produtos', colSpan: 1 },
    { id: 'pedidos', colSpan: 1 },
    { id: 'clientes', colSpan: 1 },
    { id: 'ml', colSpan: 1 },
    { id: 'saldo', colSpan: 1 },
    { id: 'receita', colSpan: 1 },
  ], []);

  const [layout, setLayout] = useState<LayoutItem[]>(defaultLayout);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLayout((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout);
        setLayout(parsedLayout);
      } catch (error) {
        console.error('Erro ao carregar layout:', error);
        setLayout(defaultLayout);
      }
    }
  }, [defaultLayout]);

  useEffect(() => {
    if (layout !== defaultLayout) {
      localStorage.setItem('dashboard-layout', JSON.stringify(layout));
    }
  }, [layout, defaultLayout]);

  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem('dashboard-layout');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const saldoMes = stats.receitaMes - stats.despesaMes;
  const lucroPercentual = stats.receitaMes > 0 ? ((saldoMes / stats.receitaMes) * 100) : 0;

  const statCards: StatCardData[] = [
    {
      id: 'produtos',
      title: "Total de Produtos",
      value: formatNumber(stats.totalProdutos),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-200 dark:border-blue-800",
      href: "/dashboard/products",
      description: `${stats.produtosBaixoEstoque} com estoque baixo`,
      trend: stats.produtosBaixoEstoque > 0 ? "warning" : "positive"
    },
    {
      id: 'pedidos',
      title: "Total de Pedidos",
      value: formatNumber(stats.totalPedidos),
      icon: ShoppingCart,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      borderColor: "border-green-200 dark:border-green-800",
      href: "/dashboard/orders",
      description: `${stats.pedidosPendentes} pendentes`,
      trend: stats.pedidosPendentes > 0 ? "warning" : "positive"
    },
    {
      id: 'clientes',
      title: "Total de Clientes",
      value: formatNumber(stats.totalClientes),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      borderColor: "border-purple-200 dark:border-purple-800",
      href: "/dashboard/clients",
      description: "Clientes ativos",
      trend: "positive"
    },
    {
      id: 'ml',
      title: "Produtos no ML",
      value: formatNumber(stats.produtosML),
      icon: StoreIcon,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      href: "/dashboard/mercadolibre",
      description: "Publicados",
      trend: "neutral"
    },
    {
      id: 'saldo',
      title: "Saldo do Mês",
      value: formatCurrency(saldoMes),
      icon: saldoMes >= 0 ? TrendingUp : TrendingDown,
      color: saldoMes >= 0 ? "text-green-600" : "text-red-600",
      bgColor: saldoMes >= 0 ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950",
      borderColor: saldoMes >= 0 ? "border-green-200 dark:border-green-800" : "border-red-200 dark:border-red-800",
      href: "/dashboard/finance",
      description: `${lucroPercentual.toFixed(1)}% de lucro`,
      trend: saldoMes >= 0 ? "positive" : "negative"
    },
    {
      id: 'receita',
      title: "Receita Mensal",
      value: formatCurrency(stats.receitaMes),
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      href: "/dashboard/finance",
      description: "Entradas do mês",
      trend: "positive"
    },
  ];

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground flex items-center">
          <Grid3X3 className="h-5 w-5 mr-2" />
          Visão Geral
        </h2>
        <div className="flex items-center space-x-2">
          {isEditing && (
            <button
              onClick={resetLayout}
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-1 rounded border border-border hover:bg-accent"
            >
              Redefinir Layout
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-lg transition-colors ${
              isEditing 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card border border-border hover:bg-accent'
            }`}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout.map(item => item.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {layout.map((item) => {
              const card = statCards.find(c => c.id === item.id);
              if (!card) return null;
              
              return (
                <div
                  key={card.id}
                  className={`
                    ${item.colSpan === 2 ? 'lg:col-span-2' : ''}
                    transition-all duration-200
                  `}
                >
                  <SortableStatCard id={card.id} card={card} isEditing={isEditing} />
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {isEditing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-6 bg-card border border-border rounded-lg shadow-lg max-w-md">
            <p className="text-foreground mb-4 font-medium">
              Modo de Edição Ativo
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Arraste e solte os cards para reorganizar o dashboard
            </p>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Concluir Edição
            </button>
          </div>
        </div>
      )}
    </div>
  );
}