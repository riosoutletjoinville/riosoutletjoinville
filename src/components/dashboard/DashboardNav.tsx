// components/dashboard/DashboardNav.tsx - VERSÃO OTIMIZADA
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import {
  Home,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Menu,
  X,
  LogOut,
  Tag,
  Palette,
  Ruler,
  Users,
  Grid,
  VenusAndMars,
  Settings,
  UserCog,
  StoreIcon,
  BellIcon,
  MailIcon,
  Receipt,
  User,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import React from "react";

// Lazy loading para componentes pesados
const NotificationBellLazy = lazy(() => 
  import("@/components/notifications/NotificationBell").then(mod => ({ default: mod.NotificationBell }))
);

// Cache de navegação para evitar recálculos
const navigationByRole = {
  admin: [
    { name: "Visão Geral", href: "/dashboard", icon: Home, requiredRole: "admin" },
    { name: "Produtos", href: "/dashboard/produtos", icon: Package, requiredRole: "admin" },
    { name: "Pedidos", href: "/dashboard/pedidos", icon: ShoppingCart, requiredRole: "admin" },
    { name: "Clientes", href: "/dashboard/clientes", icon: Users, requiredRole: "admin" },
    { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign, requiredRole: "admin" },
    { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3, requiredRole: "admin" },
    { name: "Contador", href: "/dashboard/contador", icon: Receipt, requiredRole: "admin" },
    { name: "NFe", href: "/dashboard/nfe", icon: StoreIcon, requiredRole: "admin" },
    { name: "Notificações", href: "/dashboard/notificacoes", icon: BellIcon, requiredRole: "admin" },
    { name: "Newsletter", href: "/dashboard/newsletter", icon: MailIcon, requiredRole: "admin" },
    { name: "Mercado Livre", href: "/dashboard/mercado-livre/auth", icon: StoreIcon, requiredRole: "admin" },
    { name: "Configuração ML", href: "/dashboard/mercado-livre/config", icon: Settings, requiredRole: "admin" },
  ],
  contador: [
    { name: "Contador", href: "/dashboard/contador", icon: Receipt, requiredRole: "contador" },
    { name: "Financeiro", href: "/dashboard/financeiro", icon: DollarSign, requiredRole: "contador" },
    { name: "Relatórios", href: "/dashboard/relatorios", icon: BarChart3, requiredRole: "contador" },
    { name: "NFe", href: "/dashboard/nfe", icon: StoreIcon, requiredRole: "contador" },
  ],
  vendedor: [
    { name: "Visão Geral", href: "/dashboard", icon: Home, requiredRole: "vendedor" },
    { name: "Produtos", href: "/dashboard/produtos", icon: Package, requiredRole: "vendedor" },
    { name: "Pedidos", href: "/dashboard/pedidos", icon: ShoppingCart, requiredRole: "vendedor" },
  ],
  usuario: [
    { name: "Visão Geral", href: "/dashboard", icon: Home, requiredRole: "usuario" },
    { name: "Pedidos", href: "/dashboard/pedidos", icon: ShoppingCart, requiredRole: "usuario" },
  ],
};

const configItems = [
  { name: "Banners", href: "/dashboard/banners", icon: BellIcon, requiredRole: "admin" },
  { name: "Sessões", href: "/dashboard/sessoes", icon: Package, requiredRole: "admin" },
  { name: "Categorias", href: "/dashboard/categorias", icon: Grid, requiredRole: "admin" },
  { name: "Marcas", href: "/dashboard/marcas", icon: Tag, requiredRole: "admin" },
  { name: "Cores", href: "/dashboard/cores", icon: Palette, requiredRole: "admin" },
  { name: "Tamanhos", href: "/dashboard/tamanhos", icon: Ruler, requiredRole: "admin" },
  { name: "Gêneros", href: "/dashboard/generos", icon: VenusAndMars, requiredRole: "admin" },
];

const adminItems = [
  { name: "Usuários", href: "/dashboard/admin/users", icon: UserCog, requiredRole: "admin" },
  { name: "Configurações", href: "/dashboard/configuracoes-fiscais", icon: Settings, requiredRole: "admin" },
];

// Componente de seção colapsável memoizado
const CollapsibleSection = React.memo(({ title, children, defaultCollapsed = false }: { title: string; children: React.ReactNode; defaultCollapsed?: boolean }) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4 hover:text-gray-300 transition-colors"
      >
        <span>{title}</span>
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
      </button>
      {!isCollapsed && children}
    </div>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

// Componente de item de navegação memoizado
const NavItem = React.memo(({ item, pathname, closeMenu }: { item: any; pathname: string; closeMenu: () => void }) => {
  const Icon = item.icon;
  const isActive = pathname === item.href;
  
  return (
    <li>
      <Link
        href={item.href}
        prefetch={false} // Desabilita prefetch automático
        className={cn(
          "flex items-center px-4 py-3 rounded-lg transition-all duration-200",
          isActive
            ? "bg-blue-600 text-white shadow-lg"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        )}
        onClick={closeMenu}
      >
        <Icon size={20} className="mr-3 flex-shrink-0" />
        <span className="text-sm font-medium truncate">{item.name}</span>
      </Link>
    </li>
  );
});

NavItem.displayName = 'NavItem';

export default function DashboardNav() {
  const pathname = usePathname();
  const { perfil, signOut, loading: authLoading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Mostrar placeholder enquanto carrega
  useEffect(() => {
    if (!authLoading) {
      // Pequeno delay para evitar flash
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  // Memoizar navegação baseada no perfil
  const navigation = useMemo(() => {
    if (!perfil) return [];
    const role = perfil.tipo as keyof typeof navigationByRole;
    return navigationByRole[role] || navigationByRole.usuario;
  }, [perfil]);

  const visibleConfigItems = useMemo(() => {
    if (perfil?.tipo !== 'admin') return [];
    return configItems;
  }, [perfil]);

  const visibleAdminItems = useMemo(() => {
    if (perfil?.tipo !== 'admin') return [];
    return adminItems;
  }, [perfil]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsCollapsed(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const closeMenu = useCallback(() => {
    if (isMobile) setIsCollapsed(true);
  }, [isMobile]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, signOut]);

  const showConfig = visibleConfigItems.length > 0;
  const showAdmin = visibleAdminItems.length > 0;

  // Placeholder enquanto carrega
  if (!isReady || authLoading) {
    return (
      <div className="fixed lg:relative w-64 bg-gray-800 dark:bg-gray-900 min-h-screen p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-[60px] bg-gray-700 rounded"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 dark:bg-gray-900 text-white rounded-md shadow-lg"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <Menu size={24} /> : <X size={24} />}
      </button>

      {!isCollapsed && isMobile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={closeMenu} />
      )}

      <nav
        ref={navRef}
        className={cn(
          "bg-gray-800 dark:bg-gray-900 text-white min-h-screen p-4 transition-all duration-300 fixed lg:relative z-40 flex flex-col justify-between overflow-y-auto",
          "w-64",
          isCollapsed && isMobile ? "-translate-x-full" : "translate-x-0",
          !isMobile && "translate-x-0"
        )}
      >
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="w-[130px] h-[60px]">
              <img
                src="/logomarca.jpg"
                alt="Logo do Sistema"
                className="w-full h-full object-contain"
                loading="lazy" // Lazy loading da logo
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {navigation.length > 0 && (
            <CollapsibleSection title="Principal" defaultCollapsed={false}>
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <NavItem key={item.name} item={item} pathname={pathname} closeMenu={closeMenu} />
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {showConfig && (
            <CollapsibleSection title="Configurações" defaultCollapsed={true}>
              <ul className="space-y-1">
                {visibleConfigItems.map((item) => (
                  <NavItem key={item.name} item={item} pathname={pathname} closeMenu={closeMenu} />
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {showAdmin && (
            <CollapsibleSection title="Administração" defaultCollapsed={true}>
              <ul className="space-y-1">
                {visibleAdminItems.map((item) => (
                  <NavItem key={item.name} item={item} pathname={pathname} closeMenu={closeMenu} />
                ))}
              </ul>
            </CollapsibleSection>
          )}
        </div>

        <div className="border-t border-gray-700 pt-4 mt-6">
          <div className="flex items-center space-x-2 mb-3 px-2">
            <User size={16} className="text-gray-400 flex-shrink-0" />
            <div className="text-sm text-gray-400 truncate flex-1" title={perfil?.email || perfil?.nome || ""}>
              {perfil?.nome || perfil?.email || "Usuário"}
            </div>
            <span className={cn(
              "text-xs px-2 py-1 rounded-full whitespace-nowrap",
              perfil?.tipo === 'admin' && "bg-red-500/20 text-red-400",
              perfil?.tipo === 'contador' && "bg-blue-500/20 text-blue-400",
              perfil?.tipo === 'vendedor' && "bg-green-500/20 text-green-400",
              perfil?.tipo === 'usuario' && "bg-gray-500/20 text-gray-400"
            )}>
              {perfil?.tipo === 'contador' ? 'Contador' : 
               perfil?.tipo === 'vendedor' ? 'Vendedor' :
               perfil?.tipo === 'admin' ? 'Admin' : 'Usuário'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-colors border border-red-500/30 hover:border-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <Loader2 size={18} className="mr-3 animate-spin flex-shrink-0" />
            ) : (
              <LogOut size={18} className="mr-3 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">
              {isLoggingOut ? "Saindo..." : "Sair do Sistema"}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}