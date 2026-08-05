// components/auth/RouteGuard.tsx
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedTypes?: Array<'admin' | 'usuario' | 'vendedor' | 'contador'>;
  fallbackPath?: string;
}

export function RouteGuard({ 
  children, 
  allowedTypes = ['admin', 'usuario', 'vendedor', 'contador'],
  fallbackPath = "/" 
}: RouteGuardProps) {
  const { perfil, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!perfil || !allowedTypes.includes(perfil.tipo))) {
      router.replace(fallbackPath);
    }
  }, [perfil, loading, allowedTypes, router, fallbackPath]);

  if (!perfil || !allowedTypes.includes(perfil.tipo)) {
    return null;
  }

  return <>{children}</>;
}