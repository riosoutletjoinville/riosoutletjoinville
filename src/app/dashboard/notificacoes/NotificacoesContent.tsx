// app/dashboard/notifications/NotificacoesContent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Trash2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  metadata: any;
  created_at: string;
  user_id: string;
}

interface CountsResponse {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

const ITEMS_PER_PAGE = 10;

export default function NotificacoesContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"single" | "page" | "all" | "selected">("single");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [counts, setCounts] = useState<CountsResponse>({ total: 0, unread: 0, byType: {} });

  // Função auxiliar para chamar API (garantindo que vai para a rota correta)
  const apiFetch = async (endpoint: string, options?: RequestInit) => {
    const url = `/api/notifications${endpoint}`;
    console.log('🔵 Chamando API:', url);
    const response = await fetch(url, options);
    return response;
  };

  // Carregar contagens
  const loadCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/count');
      const data = await response.json();
      if (response.ok) {
        setCounts(data);
      }
    } catch (error) {
      console.error("Erro ao carregar contagens:", error);
    }
  }, []);

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setSelectedNotifications([]);
      
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.set('filter', filter);
      }
      params.set('page', currentPage.toString());
      params.set('limit', ITEMS_PER_PAGE.toString());
      params.set('includeCount', 'true');
      
      const response = await fetch(`/api/notifications?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar notificações');
      
      setNotifications(data.notifications || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      toast.error("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  }, [filter, currentPage]);

  // Recarregar tudo
  const refreshAll = useCallback(async () => {
    await Promise.all([loadNotifications(), loadCounts()]);
  }, [loadNotifications, loadCounts]);

  useEffect(() => {
    refreshAll();
  }, [filter, currentPage, refreshAll]);

  // Marcar como lida
  const markAsRead = async (notificationId: string) => {
    setActionLoading(`read-${notificationId}`);
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lida: true })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, lida: true } : notif
          )
        );
        await loadCounts();
        toast.success("Notificação marcada como lida");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
      toast.error("Erro ao marcar como lida");
    } finally {
      setActionLoading(null);
    }
  };

  // Marcar todas como lidas da página
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.lida).map(n => n.id);
    if (unreadIds.length === 0) {
      toast.info("Não há notificações não lidas nesta página");
      return;
    }
    
    setActionLoading('markAllRead');
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', notificationIds: unreadIds })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, lida: true }))
        );
        await loadCounts();
        toast.success(`${unreadIds.length} notificação(ões) marcada(s) como lida(s)`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
      toast.error("Erro ao marcar notificações como lidas");
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ CORRIGIDA: Excluir notificações selecionadas
  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) return;
    
    setActionLoading('deleteSelected');
    try {
      console.log('🔵 Excluindo notificações:', selectedNotifications);
      
      // Usar o endpoint /batch para operações em lote
      const response = await fetch('/api/notifications/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'delete', 
          notificationIds: selectedNotifications 
        })
      });
      
      const data = await response.json();
      console.log('🔵 Resposta:', data);
      
      if (data.success) {
        setNotifications(prev => 
          prev.filter(notif => !selectedNotifications.includes(notif.id))
        );
        setSelectedNotifications([]);
        await loadCounts();
        
        // Se a página ficou vazia, voltar uma página
        if (notifications.length === selectedNotifications.length && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          await loadNotifications();
        }
        
        toast.success(data.message || `${selectedNotifications.length} notificação(ões) excluída(s)`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erro ao excluir notificações selecionadas:", error);
      toast.error("Erro ao excluir notificações");
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  // Excluir notificação individual
  const deleteNotification = async (notificationId: string) => {
    setActionLoading(`delete-${notificationId}`);
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}&mode=single`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newNotifications = notifications.filter(notif => notif.id !== notificationId);
        setNotifications(newNotifications);
        setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
        await loadCounts();
        
        if (newNotifications.length === 0 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          await loadNotifications();
        }
        
        toast.success("Notificação excluída com sucesso");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
      toast.error("Erro ao excluir notificação");
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
      setDeleteId(null);
    }
  };

  // Excluir todas notificações da página
  const deletePageNotifications = async () => {
    const pageIds = notifications.map(n => n.id);
    if (pageIds.length === 0) return;
    
    setActionLoading('deletePage');
    try {
      const response = await fetch('/api/notifications/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', notificationIds: pageIds })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await loadCounts();
        
        if (currentPage > 1 && notifications.length === pageIds.length) {
          setCurrentPage(prev => prev - 1);
        } else {
          await loadNotifications();
        }
        
        toast.success(`Notificações da página excluídas`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erro ao excluir notificações da página:", error);
      toast.error("Erro ao excluir notificações da página");
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  // Excluir todas notificações
  const deleteAllNotifications = async () => {
    setActionLoading('deleteAll');
    try {
      const response = await fetch(`/api/notifications?mode=all&filter=${filter}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications([]);
        setSelectedNotifications([]);
        setCurrentPage(1);
        await loadCounts();
        await loadNotifications();
        toast.success(`Todas as notificações${filter !== 'all' ? ` do filtro "${filter}"` : ''} foram excluídas`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Erro ao excluir todas as notificações:", error);
      toast.error("Erro ao excluir notificações");
    } finally {
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  const confirmDelete = (mode: "single" | "page" | "all" | "selected", notificationId?: string) => {
    setDeleteMode(mode);
    if (mode === "single" && notificationId) {
      setDeleteId(notificationId);
    }
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
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
      case "single":
        if (deleteId) {
          deleteNotification(deleteId);
        }
        break;
    }
  };

  const toggleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(notif => notif.id));
    }
  };

  const handleNotificationClick = (notification: Notification, event?: React.MouseEvent) => {
    if (event && (event.target as HTMLElement).closest('.action-element')) {
      return;
    }

    if (!notification.lida) {
      markAsRead(notification.id);
    }

    switch (notification.tipo) {
      case "pedido":
        router.push(`/dashboard/orders?id=${notification.metadata?.pedidoId || ''}`);
        break;
      case "estoque":
        router.push(`/dashboard/products?id=${notification.metadata?.produtoId || ''}`);
        break;
      case "cliente":
        router.push(`/dashboard/clients?id=${notification.metadata?.clienteId || ''}`);
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
      case "pedido": return <ShoppingCart className="h-5 w-5" />;
      case "estoque": return <Package className="h-5 w-5" />;
      case "cliente": return <Users className="h-5 w-5" />;
      case "financeiro": return <DollarSign className="h-5 w-5" />;
      case "mercadolivre": return <AlertTriangle className="h-5 w-5" />;
      case "sistema": return <CheckCircle className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (tipo: string) => {
    switch (tipo) {
      case "pedido": return "text-blue-600 bg-blue-100";
      case "estoque": return "text-orange-600 bg-orange-100";
      case "cliente": return "text-green-600 bg-green-100";
      case "financeiro": return "text-purple-600 bg-purple-100";
      case "mercadolivre": return "text-yellow-600 bg-yellow-100";
      case "sistema": return "text-gray-600 bg-gray-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeCount = (type: string): number => {
    if (type === "all") return counts.total;
    if (type === "unread") return counts.unread;
    return counts.byType[type] || 0;
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const unreadCount = notifications.filter(notif => !notif.lida).length;
  const hasUnread = unreadCount > 0;
  const allSelected = notifications.length > 0 && selectedNotifications.length === notifications.length;
  const someSelected = selectedNotifications.length > 0 && selectedNotifications.length < notifications.length;
  const isActionLoading = (id: string) => actionLoading === id;

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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-foreground" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Notificações</h1>
                <p className="text-muted-foreground mt-1">
                  {counts.total > 0 
                    ? `${counts.total} notificação${counts.total > 1 ? 'es' : ''} no total`
                    : "Nenhuma notificação encontrada"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {hasUnread && (
                <button
                  onClick={markAllAsRead}
                  disabled={!!actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isActionLoading('markAllRead') ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  <span>Marcar página como lida</span>
                </button>
              )}
              
              {selectedNotifications.length > 0 && (
                <button
                  onClick={() => confirmDelete("selected")}
                  disabled={!!actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isActionLoading('deleteSelected') ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Excluir selecionadas ({selectedNotifications.length})</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={() => confirmDelete("page")}
                  disabled={!!actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isActionLoading('deletePage') ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Excluir página</span>
                </button>
              )}

              {counts.total > 0 && (
                <button
                  onClick={() => confirmDelete("all")}
                  disabled={!!actionLoading}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isActionLoading('deleteAll') ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Excluir todas</span>
                </button>
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
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma notificação</h3>
              <p className="text-muted-foreground">
                {filter === "all" 
                  ? "Você não tem notificações no momento."
                  : `Nenhuma notificação encontrada para o filtro "${filter}".`}
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
                    disabled={!!actionLoading}
                    className="action-element h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedNotifications.length > 0 
                      ? `${selectedNotifications.length} notificação${selectedNotifications.length > 1 ? 'es' : ''} selecionada${selectedNotifications.length > 1 ? 's' : ''}`
                      : "Selecionar todas"}
                  </span>
                </div>
              </div>

              {/* Lista de notificações */}
              {notifications.map(notification => (
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
                        disabled={!!actionLoading}
                        className="action-element mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 flex-shrink-0 disabled:opacity-50"
                      />
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.tipo)}`}>
                        {getNotificationIcon(notification.tipo)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-medium ${!notification.lida ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.titulo}
                          </h3>
                          {!notification.lida && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">Nova</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.mensagem}</p>
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
                          disabled={!!actionLoading}
                          className="action-element p-1 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                          title="Marcar como lida"
                        >
                          {isActionLoading(`read-${notification.id}`) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCheck className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete("single", notification.id);
                        }}
                        disabled={!!actionLoading}
                        className="action-element p-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Excluir notificação"
                      >
                        {isActionLoading(`delete-${notification.id}`) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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
          <div className="flex items-center justify-between border-t border-border pt-6 flex-wrap gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount} notificações
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || !!actionLoading}
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
                      disabled={!!actionLoading}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
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
                disabled={currentPage === totalPages || !!actionLoading}
                className="p-2 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-foreground">Confirmar Exclusão</h3>
            </div>
            
            <p className="text-muted-foreground mb-6">
              {deleteMode === "selected" && `Tem certeza que deseja excluir ${selectedNotifications.length} notificação${selectedNotifications.length > 1 ? 'es' : ''} selecionada${selectedNotifications.length > 1 ? 's' : ''}?`}
              {deleteMode === "page" && "Tem certeza que deseja excluir todas as notificações desta página?"}
              {deleteMode === "all" && `Tem certeza que deseja excluir todas as notificações${filter !== "all" ? ` do filtro "${filter}"` : ''}? Esta ação não pode ser desfeita.`}
              {deleteMode === "single" && "Tem certeza que deseja excluir esta notificação?"}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                disabled={!!actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {actionLoading && (actionLoading === 'deleteSelected' || actionLoading === 'deletePage' || actionLoading === 'deleteAll') && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}