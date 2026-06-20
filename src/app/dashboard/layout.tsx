// app/dashboard/layout.tsx - VERSÃO CORRIGIDA (SEM LOADING DUPLICADO)
"use client";

import DashboardNav from "@/components/dashboard/DashboardNav";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function DashboardProtected({ children }: { children: React.ReactNode }) {
  const { user, loading, perfil } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Verificar autenticação APENAS quando loading terminar
    if (!loading && !user) {
      router.replace("/");
      return;
    }

    // Verificar permissões baseadas no tipo
    if (!loading && user && perfil) {
      // Contador: só pode acessar rotas específicas
      if (perfil.tipo === "contador") {
        const allowedRoutes = [
          "/dashboard/contador",
          "/dashboard/financeiro",
          "/dashboard/relatorios",
          "/dashboard/nfe",
        ];
        const isAllowed = allowedRoutes.some(
          (route) => pathname === route || pathname.startsWith(route + "/")
        );
        if (!isAllowed && pathname !== "/dashboard") {
          router.replace("/dashboard/contador");
        }
      }

      // Vendedor: rotas limitadas
      if (perfil.tipo === "vendedor") {
        const allowedRoutes = [
          "/dashboard",
          "/dashboard/produtos",
          "/dashboard/pedidos",
        ];
        const isAllowed = allowedRoutes.some(
          (route) => pathname === route || pathname.startsWith(route + "/")
        );
        if (!isAllowed && pathname !== "/dashboard") {
          router.replace("/dashboard");
        }
      }

      // Usuário comum: apenas dashboard e pedidos
      if (perfil.tipo === "usuario") {
        const allowedRoutes = ["/dashboard", "/dashboard/pedidos"];
        const isAllowed = allowedRoutes.some(
          (route) => pathname === route || pathname.startsWith(route + "/")
        );
        if (!isAllowed && pathname !== "/dashboard") {
          router.replace("/dashboard");
        }
      }
    }
  }, [loading, user, perfil, router, pathname]);

  // Loading state unificado e centralizado
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
        <p className="text-gray-600 text-sm">Carregando dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex h-screen overflow-hidden">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 lg:px-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardProtected>{children}</DashboardProtected>;
}