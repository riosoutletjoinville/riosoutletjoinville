// contexts/AuthContext.tsx - COM CACHE E OTIMIZAÇÕES
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";

interface UsuarioPerfil {
  id: string;
  nome: string;
  email: string;
  tipo: 'admin' | 'usuario' | 'vendedor' | 'contador';
  ativo: boolean;
  local_trabalho?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  perfil: UsuarioPerfil | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  hasPermission: (permissoes: string | string[]) => boolean;
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache de perfis para evitar múltiplas buscas
const perfilCache = new Map<string, UsuarioPerfil>();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initialCheckDone = useRef(false);

  const buscarPerfilUsuario = useCallback(async (email: string) => {
    // Verificar cache primeiro
    if (perfilCache.has(email)) {
      return perfilCache.get(email)!;
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      // Armazenar no cache
      perfilCache.set(email, data as UsuarioPerfil);
      return data as UsuarioPerfil;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return null;
    }
  }, []);

  const redirectBasedOnRole = useCallback((perfilData: UsuarioPerfil | null) => {
    if (!perfilData) {
      router.replace('/');
      return;
    }

    if (perfilData.tipo === 'contador') {
      router.replace('/dashboard/contador');
    } else {
      router.replace('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (initialCheckDone.current) return;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao verificar sessão:", error);
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser?.email) {
          const perfilData = await buscarPerfilUsuario(currentUser.email);
          setPerfil(perfilData);
        }
      } catch (error) {
        console.error("Erro ao inicializar auth:", error);
      } finally {
        setLoading(false);
        initialCheckDone.current = true;
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      if (newUser?.email) {
        const perfilData = await buscarPerfilUsuario(newUser.email);
        setPerfil(perfilData);
        
        if (event === "SIGNED_IN" && window.location.pathname === "/login") {
          redirectBasedOnRole(perfilData);
        }
      } else {
        setPerfil(null);
        if (event === "SIGNED_OUT") {
          perfilCache.clear(); // Limpar cache no logout
          router.replace("/");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [buscarPerfilUsuario, redirectBasedOnRole, router]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user?.email) {
        const perfilData = await buscarPerfilUsuario(data.user.email);
        setPerfil(perfilData);
        redirectBasedOnRole(perfilData);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Erro ao fazer login" };
    }
  }, [buscarPerfilUsuario, redirectBasedOnRole]);

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Erro no logout:", error);
      
      setUser(null);
      setPerfil(null);
      perfilCache.clear();
      router.replace("/");
    } catch (error) {
      console.error("Erro no logout:", error);
      setUser(null);
      setPerfil(null);
      router.replace("/");
    }
  }, [router]);

  const signOut = logout;

  const hasPermission = useCallback((permissoes: string | string[]): boolean => {
    if (!perfil) return false;
    if (perfil.tipo === 'admin') return true;
    
    const permissoesArray = Array.isArray(permissoes) ? permissoes : [permissoes];
    
    switch (perfil.tipo) {
      case 'contador':
        return permissoesArray.every(p => 
          p === 'contador' || p === 'financeiro' || p === 'relatorios' || p === 'nfe'
        );
      case 'vendedor':
        return permissoesArray.every(p => 
          p === 'vendedor' || p === 'produtos' || p === 'pedidos'
        );
      case 'usuario':
        return permissoesArray.every(p => p === 'usuario' || p === 'basico');
      default:
        return false;
    }
  }, [perfil]);

  const value = {
    user,
    perfil,
    loading,
    login,
    logout,
    signOut,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}