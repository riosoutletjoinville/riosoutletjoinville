// src/hooks/useUsuario.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthSession } from "./useAuthSession";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  tipo: string;
  ml_user_id?: string;
  ml_nickname?: string;
}

export function useUsuario() {
  const { user, loading: authLoading, isAuthenticated } = useAuthSession();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarUsuario() {
      // Aguardar auth carregar
      if (authLoading) return;
      
      // Se não autenticado, limpar estado
      if (!isAuthenticated || !user) {
        setUsuario(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Buscar dados adicionais na tabela usuarios
        const { data: perfil, error: perfilError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (perfilError) {
          console.error("Erro ao buscar perfil:", perfilError);
          setError(perfilError.message);
          setUsuario(null);
        } else if (perfil) {
          setUsuario(perfil as Usuario);
        } else {
          // Criar objeto básico com dados do auth
          setUsuario({
            id: user.id,
            email: user.email || "",
            nome: user.email?.split("@")[0] || "Usuário",
            tipo: "usuario",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    }

    carregarUsuario();
  }, [user, authLoading, isAuthenticated]);

  return { 
    usuario, 
    loading: authLoading || loading, 
    error,
    isAuthenticated 
  };
}