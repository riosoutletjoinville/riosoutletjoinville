// app/dashboard/notifications/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Bell, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Trash2,
  AlertCircle
} from "lucide-react";

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: any;
  created_at: string;
  user_id: string;
}

const ITEMS_PER_PAGE = 10;

export default function NotificacoesContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"single" | "page" | "all" | "selected">("single");

  useEffect(() => {
    loadNotificationsCount();
    loadNotifications();
  }, [filter, currentPage]);

  const loadNotificationsCount = async () => {
    try {
      let query = supabase
        .from("notifications")
        .select("*", { count: 'exact', head: true });

      if (filter !== "all") {
        if (filter === "unread") {
          query = query.eq("lida", false);
        } else {
          query = query.eq("tipo", filter);
        }
      }

      const { count, error } = await query;
      
      if (error) throw error;
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Erro ao carregar contagem:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setSelectedNotifications([]); // Limpar seleção ao carregar nova página
      
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .range(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE - 1
        );

      if (filter !== "all") {
        if (filter === "unread") {
          query = query.eq("lida", false);
        } else {
          query = query.eq("tipo", filter);
        }
      }

      const { data: notificationsData, error } = await query;

      if (error) throw error;

      setNotifications(notificationsData || []);
      setFilteredNotifications(notificationsData || []);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
    } finally {
      setLoading(false);
    }
  };

  // MARK AS READ FUNCTIONS
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ lida: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, lida: true } : notif
        )
      );
      
      setFilteredNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, lida: true } : notif
        )
      );

      if (filter === "unread") {
        loadNotificationsCount();
      }
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(notif => !notif.lida);
      
      if (unreadNotifications.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ lida: true })
        .in("id", unreadNotifications.map(notif => notif.id));

      if (error) throw error;

      const updatedNotifications = notifications.map(notif => ({
        ...notif,
        lida: true
      }));

      setNotifications(updatedNotifications);
      setFilteredNotifications(updatedNotifications);
      loadNotificationsCount();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  const markAllAsReadGlobal = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ lida: true })
        .eq("lida", false);

      if (error) throw error;

      loadNotificationsCount();
      loadNotifications();
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  };

  // DELETE FUNCTIONS
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setFilteredNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
      
      loadNotificationsCount();
      
      // Se a página ficar vazia, voltar para página anterior
      if (filteredNotifications.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
    }
  };

  const deleteSelectedNotifications = async () => {
    try {
      if (selectedNotifications.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", selectedNotifications);

      if (error) throw error;

      setNotifications(prev => 
        prev.filter(notif => !selectedNotifications.includes(notif.id))
      );
      setFilteredNotifications(prev => 
        prev.filter(notif => !selectedNotifications.includes(notif.id))
      );
      setSelectedNotifications([]);
      
      loadNotificationsCount();
      
      // Recarregar página se ficar vazia
      if (filteredNotifications.length === selectedNotifications.length && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        loadNotifications();
      }
    } catch (error) {
      console.error("Erro ao excluir notificações selecionadas:", error);
    }
  };

  const deletePageNotifications = async () => {
    try {
      const pageNotificationIds = notifications.map(notif => notif.id);
      
      if (pageNotificationIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", pageNotificationIds);

      if (error) throw error;

      setNotifications([]);
      setFilteredNotifications([]);
      setSelectedNotifications([]);
      
      loadNotificationsCount();
      
      // Voltar para página anterior se necessário
      if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        loadNotifications();
      }
    } catch (error) {
      console.error("Erro ao excluir notificações da página:", error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      let query = supabase.from("notifications").delete();

      if (filter !== "all") {
        if (filter === "unread") {
          query = query.eq("lida", false);
        } else {
          query = query.eq("tipo", filter);
        }
      }

      const { error } = await query;

      if (error) throw error;

      setNotifications([]);
      setFilteredNotifications([]);
      setSelectedNotifications([]);
      setCurrentPage(1);
      loadNotificationsCount();
    } catch (error) {
      console.error("Erro ao excluir todas as notificações:", error);
    }
  };

  const confirmDelete = (mode: "single" | "page" | "all" | "selected", notificationId?: string) => {
    setDeleteMode(mode);
    
    if (mode === "single" && notificationId) {
      deleteNotification(notificationId);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const executeDelete = () => {
    setShowDeleteConfirm(false);
    
    switch (deleteMode) {
      case "selected":
        deleteSelectedNotifications();
        break;
      case "page":
        deletePageNotifications();
        break;
      case "all":
        deleteAllNotifications();
        break;
    }
  };

  // SELECTION FUNCTIONS
  const toggleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(notif => notif.id));
    }
  };

  const handleNotificationClick = (notification: Notification, event?: React.MouseEvent) => {
    // Se o clique foi em um elemento de ação (checkbox, botão), não navegar
    if (event && (event.target as HTMLElement).closest('.action-element')) {
      return;
    }

    // Marcar como lida se não estiver lida
    if (!notification.lida) {
      markAsRead(notification.id);
    }

    // Navegar para o recurso relacionado
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

  const getNotificationIcon = (tipo: string) => {
    switch (tipo) {
      case "pedido":
        return <ShoppingCart className="h-5 w-5" />;
      case "estoque":
        return <Package className="h-5 w-5" />;
      case "cliente":
        return <Users className="h-5 w-5" />;
      case "financeiro":
        return <DollarSign className="h-5 w-5" />;
      case "mercadolivre":
        return <AlertTriangle className="h-5 w-5" />;
      case "sistema":
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case "pedido":
        return "text-blue-600 bg-blue-100";
      case "estoque":
        return "text-orange-600 bg-orange-100";
      case "cliente":
        return "text-green-600 bg-green-100";
      case "financeiro":
        return "text-purple-600 bg-purple-100";
      case "mercadolivre":
        return "text-yellow-600 bg-yellow-100";
      case "sistema":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeCount = (type: string) => {
    if (type === "all") return totalCount;
    if (type === "unread") {
      return notifications.filter(n => !n.lida).length;
    }
    return notifications.filter(n => n.tipo === type).length;
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const unreadCount = notifications.filter(notif => !notif.lida).length;
  const hasUnread = notifications.some(notif => !notif.lida);
  const allSelected = filteredNotifications.length > 0 && selectedNotifications.length === filteredNotifications.length;
  const someSelected = selectedNotifications.length > 0 && selectedNotifications.length < filteredNotifications.length;

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-foreground" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Notificações
                </h1>
                <p className="text-muted-foreground mt-1">
                  {totalCount > 0 
                    ? `${totalCount} notificação${totalCount > 1 ? 'es' : ''} no total`
                    : "Nenhuma notificação encontrada"
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Botões de Marcar como Lida */}
              {hasUnread && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Marcar página como lida</span>
                </button>
              )}
              
              {totalCount > 0 && (
                <>
                  <button
                    onClick={markAllAsReadGlobal}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>Marcar todas como lidas</span>
                  </button>

                  {/* Botões de Excluir */}
                  {selectedNotifications.length > 0 && (
                    <button
                      onClick={() => confirmDelete("selected")}
                      className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Excluir selecionadas ({selectedNotifications.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => confirmDelete("page")}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir página</span>
                  </button>

                  <button
                    onClick={() => confirmDelete("all")}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir todas</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "all", label: "Todas" },
            { key: "unread", label: "Não lidas" },
            { key: "pedido", label: "Pedidos" },
            { key: "estoque", label: "Estoque" },
            { key: "cliente", label: "Clientes" },
            { key: "financeiro", label: "Financeiro" },
            { key: "mercadolivre", label: "Mercado Livre" },
            { key: "sistema", label: "Sistema" }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key);
                setCurrentPage(1);
                setSelectedNotifications([]);
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === key 
                  ? "bg-blue-600 text-white" 
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {label} ({getTypeCount(key)})
            </button>
          ))}
        </div>

        {/* Lista de Notificações */}
        <div className="space-y-4 mb-6">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-muted-foreground">
                {filter === "all" 
                  ? "Você não tem notificações no momento."
                  : `Nenhuma notificação encontrada para o filtro "${filter}".`
                }
              </p>
            </div>
          ) : (
            <>
              {/* Header de seleção */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) {
                        input.indeterminate = someSelected;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="action-element h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedNotifications.length > 0 
                      ? `${selectedNotifications.length} notificação${selectedNotifications.length > 1 ? 'es' : ''} selecionada${selectedNotifications.length > 1 ? 's' : ''}`
                      : "Selecionar todas"
                    }
                  </span>
                </div>
                
                {selectedNotifications.length > 0 && (
                  <button
                    onClick={() => confirmDelete("selected")}
                    className="action-element flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir selecionadas</span>
                  </button>
                )}
              </div>

              {/* Lista de notificações */}
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`bg-card rounded-lg border border-border p-4 cursor-pointer transition-all hover:shadow-md ${
                    !notification.lida ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""
                  } ${selectedNotifications.includes(notification.id) ? "ring-2 ring-blue-500" : ""}`}
                  onClick={(e) => handleNotificationClick(notification, e)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleSelectNotification(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="action-element mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0"
                      />
                      
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(
                          notification.tipo
                        )}`}
                      >
                        {getNotificationIcon(notification.tipo)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-medium ${
                            !notification.lida ? "text-foreground" : "text-muted-foreground"
                          }`}>
                            {notification.titulo}
                          </h3>
                          {!notification.lida && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                              Nova
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.mensagem}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      {!notification.lida && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="action-element p-1 text-green-600 hover:text-green-700 transition-colors"
                          title="Marcar como lida"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete("single", notification.id);
                        }}
                        className="action-element p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Excluir notificação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de{" "}
              {totalCount} notificações
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-border hover:bg-accent"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-foreground">
                Confirmar Exclusão
              </h3>
            </div>
            
            <p className="text-muted-foreground mb-6">
              {deleteMode === "selected" && `Tem certeza que deseja excluir ${selectedNotifications.length} notificação${selectedNotifications.length > 1 ? 'es' : ''} selecionada${selectedNotifications.length > 1 ? 's' : ''}?`}
              {deleteMode === "page" && "Tem certeza que deseja excluir todas as notificações desta página?"}
              {deleteMode === "all" && `Tem certeza que deseja excluir todas as notificações${filter !== "all" ? ` do filtro "${filter}"` : ''}? Esta ação não pode ser desfeita.`}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}