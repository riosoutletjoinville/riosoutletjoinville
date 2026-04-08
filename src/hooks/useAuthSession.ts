// src/hooks/useAuthSession.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Buscar sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Erro ao buscar sessão:', error);
        setError(error.message);
      } else {
        setSession(session);
      }
      setLoading(false);
    });

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshSession = async () => {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      setSession(session);
      return session;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao refrescar sessão');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    // Se não tem sessão, tenta refrescar
    if (!session) {
      const refreshed = await refreshSession();
      return refreshed?.access_token || null;
    }
    
    // Verificar se o token está próximo de expirar (menos de 5 minutos)
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const timeUntilExpiry = expiresAt * 1000 - Date.now();
      if (timeUntilExpiry < 5 * 60 * 1000) {
        // Menos de 5 minutos, refresca
        const refreshed = await refreshSession();
        return refreshed?.access_token || null;
      }
    }
    
    return session.access_token;
  };

  return {
    session,
    loading,
    error,
    refreshSession,
    getAccessToken,
    isAuthenticated: !!session
  };
}