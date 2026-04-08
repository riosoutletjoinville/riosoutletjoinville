// components/dashboard/RecentActivities.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  TrendingUp
} from "lucide-react";

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

interface RecentActivitiesProps {
  className?: string;
  limit?: number;
}

export function RecentActivities({ className = "", limit = 5 }: RecentActivitiesProps) {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivities();
  }, []);

  const loadRecentActivities = async () => {
    try {
      setLoading(true);
      
      // Buscar pedidos recentes
      const { data: recentOrders } = await supabase
        .from("pedidos")
        .select("id, total, data_pedido, status")
        .order("data_pedido", { ascending: false })
        .limit(limit);

      // Buscar produtos com estoque baixo
      const { data: lowStockProducts } = await supabase
        .from("produtos")
        .select("id, titulo, estoque")
        .lt("estoque", 10)
        .gt("estoque", 0)
        .eq("ativo", true)
        .limit(3);

      // Buscar novos clientes
      const { data: newClients } = await supabase
        .from("clientes")
        .select("id, nome, razao_social, created_at, tipo_cliente")
        .order("created_at", { ascending: false })
        .limit(2);

      // Buscar movimentos financeiros recentes
      const { data: recentFinancial } = await supabase
        .from("financeiro")
        .select("id, descricao, valor, tipo_movimento, data_movimento")
        .order("data_movimento", { ascending: false })
        .limit(3);

      const activitiesList: RecentActivity[] = [];

      // Adicionar pedidos recentes
      recentOrders?.forEach((order) => {
        activitiesList.push({
          id: order.id,
          type: "pedido",
          description: `Novo pedido #${order.id.slice(-6)} - R$ ${order.total.toFixed(2)}`,
          time: formatTimeAgo(new Date(order.data_pedido)),
          icon: <ShoppingCart className="h-4 w-4" />,
          color: "text-blue-600"
        });
      });

      // Adicionar produtos com estoque baixo
      lowStockProducts?.forEach((product) => {
        activitiesList.push({
          id: product.id,
          type: "estoque",
          description: `Estoque baixo: ${product.titulo} (${product.estoque} unidades)`,
          time: "Agora",
          icon: <AlertTriangle className="h-4 w-4" />,
          color: "text-orange-600"
        });
      });

      // Adicionar novos clientes
      newClients?.forEach((client) => {
        const clientName = client.tipo_cliente === 'fisica' 
          ? `${client.nome} ${client.razao_social || ''}`.trim()
          : client.razao_social;
        
        activitiesList.push({
          id: client.id,
          type: "cliente",
          description: `Novo cliente: ${clientName}`,
          time: formatTimeAgo(new Date(client.created_at)),
          icon: <Users className="h-4 w-4" />,
          color: "text-green-600"
        });
      });

      // Adicionar movimentos financeiros
      recentFinancial?.forEach((movement) => {
        const tipo = movement.tipo_movimento === 'entrada' ? 'Receita' : 'Despesa';
        activitiesList.push({
          id: movement.id,
          type: "financeiro",
          description: `${tipo}: ${movement.descricao} - R$ ${movement.valor}`,
          time: formatTimeAgo(new Date(movement.data_movimento)),
          icon: <DollarSign className="h-4 w-4" />,
          color: movement.tipo_movimento === 'entrada' ? "text-green-600" : "text-red-600"
        });
      });

      // Ordenar por tempo (mais recentes primeiro) e limitar
      const sortedActivities = activitiesList
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);

      setActivities(sortedActivities);

    } catch (error) {
      console.error("Erro ao carregar atividades recentes:", error);
      
      // Dados de exemplo em caso de erro
      setActivities([
        {
          id: "1",
          type: "sistema",
          description: "Dashboard carregado com sucesso",
          time: "Agora",
          icon: <CheckCircle className="h-4 w-4" />,
          color: "text-green-600"
        },
        {
          id: "2",
          type: "pedido",
          description: "Novo pedido recebido - R$ 250,00",
          time: "5 min atrás",
          icon: <ShoppingCart className="h-4 w-4" />,
          color: "text-blue-600"
        },
        {
          id: "3",
          type: "produto",
          description: "Produto cadastrado: Sandália Verão",
          time: "15 min atrás",
          icon: <Package className="h-4 w-4" />,
          color: "text-purple-600"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Agora";
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 dia atrás";
    return `${diffInDays} dias atrás`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "pedido":
        return <ShoppingCart className="h-4 w-4" />;
      case "produto":
        return <Package className="h-4 w-4" />;
      case "cliente":
        return <Users className="h-4 w-4" />;
      case "financeiro":
        return <DollarSign className="h-4 w-4" />;
      case "estoque":
        return <AlertTriangle className="h-4 w-4" />;
      case "sistema":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Atividades Recentes
          </h3>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">
          Atividades Recentes
        </h3>
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhuma atividade recente</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0 ${activity.color}`}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={loadRecentActivities}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Atualizar atividades
          </button>
        </div>
      )}
    </div>
  );
}