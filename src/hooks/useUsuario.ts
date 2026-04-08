import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Usuario {
  id: string;
  email: string;
  nome: string;
  tipo: string;
  ml_user_id?: string;
  ml_nickname?: string;
}

export function useUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarUsuario() {
      try {
        setLoading(true);
        
        // Primeiro, obter o usuário autenticado
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData.user) {
          setUsuario(null);
          setLoading(false);
          return;
        }

        // Depois, buscar dados adicionais na tabela usuarios
        const { data: perfil, error: perfilError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", authData.user.id)
          .maybeSingle();  // USAR maybeSingle

        if (perfilError) {
          console.error("Erro ao buscar perfil:", perfilError);
          setError(perfilError.message);
          setUsuario(null);
          setLoading(false);
          return;
        }

        // Se não tem perfil, cria um objeto básico com dados do auth
        if (!perfil) {
          setUsuario({
            id: authData.user.id,
            email: authData.user.email || "",
            nome: authData.user.email?.split("@")[0] || "Usuário",
            tipo: "usuario",
          });
        } else {
          setUsuario(perfil as Usuario);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setLoading(false);
      }
    }

    carregarUsuario();
  }, []);

  return { usuario, loading, error };
}