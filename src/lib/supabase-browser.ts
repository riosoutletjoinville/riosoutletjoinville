// src/lib/supabase-browser.ts
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClientInstance: SupabaseClient | null = null;

/**
 * Retorna SEMPRE a mesma instância do Supabase no browser.
 * Evita o problema de múltiplas instâncias com sessões dessincronizadas.
 */
export const getSupabaseSingleton = (): SupabaseClient => {
  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClientInstance;
};

/**
 * Aguarda a sessão estar disponível, tentando algumas vezes.
 * Útil quando o componente monta antes da hidratação da sessão.
 */
export const getAuthenticatedUser = async (
  client: SupabaseClient,
  maxRetries = 3,
  delayMs = 300,
): Promise<{ id: string; email?: string } | null> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // getUser força refresh do token se necessário
    const { data: { user }, error } = await client.auth.getUser();

    if (user && !error) {
      return { id: user.id, email: user.email };
    }

    // Fallback: getSession (mais rápido, mas pode estar desidratado)
    const { data: { session } } = await client.auth.getSession();
    if (session?.user) {
      return { id: session.user.id, email: session.user.email };
    }

    // Aguardar antes de tentar novamente
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
};