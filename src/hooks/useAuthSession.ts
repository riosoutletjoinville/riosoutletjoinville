// src/hooks/useAuthSession.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Buscar sessão inicial
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao buscar sessão:', sessionError);
          setError(sessionError.message);
        } else {
          setSession(session);
          setUser(session?.user || null);
        }
      } catch (err) {
        console.error('Erro na inicialização:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshSession = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) throw refreshError;
      
      setSession(session);
      setUser(session?.user || null);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao refrescar sessão');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (!session) {
      const refreshed = await refreshSession();
      return refreshed?.access_token || null;
    }
    
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const timeUntilExpiry = expiresAt * 1000 - Date.now();
      if (timeUntilExpiry < 5 * 60 * 1000) {
        const refreshed = await refreshSession();
        return refreshed?.access_token || null;
      }
    }
    
    return session.access_token;
  };

  return {
    session,
    user,
    loading,
    error,
    refreshSession,
    getAccessToken,
    isAuthenticated: !!session && !!user
  };
}