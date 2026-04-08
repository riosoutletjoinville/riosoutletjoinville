// components/notifications/NotificationBell.tsx - ATUALIZADO
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, X, CheckCheck, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  created_at: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)
        .eq("lida", false);

      if (error) throw error;

      setNotifications(notificationsData || []);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ lida: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      if (notifications.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ lida: true })
        .in("id", notifications.map(notif => notif.id));

      if (error) throw error;

      setNotifications([]);
      setShowDropdown(false);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    setShowDropdown(false);
    
    switch (notification.tipo) {
      case "pedido":
        if (notification.metadata?.pedidoId) {
          router.push(`/dashboard/orders?id=${notification.metadata.pedidoId}`);
        } else {
          router.push("/dashboard/orders");
        }
        break;
      case "estoque":
        if (notification.metadata?.produtoId) {
          router.push(`/dashboard/products?id=${notification.metadata.produtoId}`);
        } else {
          router.push("/dashboard/products");
        }
        break;
      case "cliente":
        if (notification.metadata?.clienteId) {
          router.push(`/dashboard/clients?id=${notification.metadata.clienteId}`);
        } else {
          router.push("/dashboard/clients");
        }
        break;
      case "financeiro":
        router.push("/dashboard/finance");
        break;
      case "mercadolivre":
        router.push("/dashboard/mercadolivre");
        break;
      default:
        break;
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-foreground hover:bg-accent rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notificações</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center space-x-1 text-xs text-green-600 hover:text-green-700 transition-colors"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="h-3 w-3" />
                    <span>Marcar todas</span>
                  </button>
                )}
                <span className="text-sm text-muted-foreground">
                  {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhuma notificação não lida
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors bg-blue-50/30 group"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {notification.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.mensagem}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                        title="Marcar como lida"
                      >
                        <CheckCheck className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Excluir notificação"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-border">
            <button
              onClick={() => {
                setShowDropdown(false);
                router.push("/dashboard/notifications");
              }}
              className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Ver todas as notificações
            </button>
          </div>
        </div>
      )}
    </div>
  );
}