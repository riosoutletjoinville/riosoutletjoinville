// src/app/api/mercadolibre/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Interface para os tokens do Mercado Livre
interface MercadoLivreTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  user_id?: number;
}

// Interface para as informações do usuário do Mercado Livre
interface MercadoLivreUserInfo {
  id: number;
  nickname: string;
  email?: string;
}

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;

  try {
    console.log("=== CALLBACK INICIADO ===");
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("Erro do Mercado Livre:", error);
      return NextResponse.redirect(
        new URL("/dashboard/mercado-livre?ml_error=auth_failed", baseUrl),
      );
    }

    if (!code) {
      console.error("Código não recebido");
      return NextResponse.redirect(
        new URL("/dashboard/mercado-livre?ml_error=no_code", baseUrl),
      );
    }

    console.log("Tentando trocar código por tokens...");
    const tokens = await exchangeCodeForTokens(code);
    console.log("Tokens recebidos com sucesso");

    console.log("Salvando tokens no Supabase...");
    await saveTokensToSupabase(tokens);
    console.log("Tokens salvos com sucesso");

    // ✅ REDIRECIONAR PARA A PÁGINA DE AUTENTICAÇÃO COM SUCESSO
    // Isso permite que o AuthMLContent.tsx mostre o status conectado
    return NextResponse.redirect(
      new URL("/dashboard/mercado-livre?ml_success=connected", baseUrl),
    );
  } catch (error: unknown) {
    console.error("ERRO NO CALLBACK:", error);
    return NextResponse.redirect(
      new URL("/dashboard/mercado-livre?ml_error=internal_error", baseUrl),
    );
  }
}

async function exchangeCodeForTokens(
  code: string,
): Promise<MercadoLivreTokens> {
  const clientId = process.env.MERCADO_LIVRE_APP_ID;
  const clientSecret = process.env.MERCADO_LIVRE_CLIENT_SECRET;
  const redirectUri = process.env.MERCADO_LIVRE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Configuração do Mercado Livre incompleta");
  }

  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Erro ao obter tokens:", errorText);
    throw new Error("Falha ao obter tokens do Mercado Livre");
  }

  const tokens: MercadoLivreTokens = await response.json();
  return tokens;
}

async function saveTokensToSupabase(tokens: MercadoLivreTokens) {
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error("Configuração do Supabase incompleta");
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const userInfoResponse = await fetch(
      "https://api.mercadolibre.com/users/me",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    if (!userInfoResponse.ok) {
      throw new Error("Falha ao obter informações do usuário");
    }

    const userInfo: MercadoLivreUserInfo = await userInfoResponse.json();
    console.log("Informações do usuário ML:", userInfo);

    let userId: string | null = null;

    // Primeiro: Buscar pelo email na tabela usuarios
    if (userInfo.email) {
      const { data: usuarioData, error: usuarioError } = await adminSupabase
        .from("usuarios")
        .select("id, email")
        .eq("email", userInfo.email)
        .maybeSingle();

      if (usuarioError) {
        console.error(
          "Erro ao buscar usuário na tabela usuarios:",
          usuarioError,
        );
      }

      if (usuarioData) {
        userId = usuarioData.id;
        console.log("Usuário encontrado na tabela usuarios:", userId);

        // Atualizar a tabela usuarios com o ml_user_id
        const { error: updateError } = await adminSupabase
          .from("usuarios")
          .update({ ml_user_id: userInfo.id })
          .eq("id", userId);

        if (updateError) {
          console.error(
            "Erro ao atualizar ml_user_id em usuarios:",
            updateError,
          );
        }
      }
    }

    // Segundo: Se não encontrou na tabela usuarios, buscar na tabela profiles
    if (!userId && userInfo.email) {
      const { data: profileData, error: profileError } = await adminSupabase
        .from("profiles")
        .select("id, email")
        .eq("email", userInfo.email)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Erro ao buscar usuário na tabela profiles:",
          profileError,
        );
      }

      if (profileData) {
        userId = profileData.id;
        console.log("Usuário encontrado na tabela profiles:", userId);

        // Atualizar a tabela profiles com o ml_user_id
        const { error: updateError } = await adminSupabase
          .from("profiles")
          .update({ ml_user_id: userInfo.id })
          .eq("id", userId);

        if (updateError) {
          console.error(
            "Erro ao atualizar ml_user_id em profiles:",
            updateError,
          );
        }
      }
    }

    // Terceiro: Se ainda não encontrou, buscar qualquer usuário existente
    if (!userId) {
      // Tenta na tabela usuarios
      const { data: usuarios, error: usuariosError } = await adminSupabase
        .from("usuarios")
        .select("id")
        .limit(1);

      if (usuariosError) {
        console.error(
          "Erro ao buscar usuários na tabela usuarios:",
          usuariosError,
        );
      }

      if (usuarios && usuarios.length > 0) {
        userId = usuarios[0].id;
        console.log("Usando primeiro usuário da tabela usuarios:", userId);
      } else {
        // Tenta na tabela profiles
        const { data: profiles, error: profilesError } = await adminSupabase
          .from("profiles")
          .select("id")
          .limit(1);

        if (profilesError) {
          console.error(
            "Erro ao buscar usuários na tabela profiles:",
            profilesError,
          );
          throw new Error("Erro ao buscar usuários no sistema");
        }

        if (!profiles || profiles.length === 0) {
          console.error("Nenhum usuário encontrado no sistema");
          throw new Error("Nenhum usuário encontrado no sistema");
        }

        userId = profiles[0].id;
        console.log("Usando primeiro usuário da tabela profiles:", userId);
      }
    }

    // Garantir que userId não é null antes de usar
    if (!userId) {
      throw new Error("Falha ao determinar o ID do usuário");
    }

    const { error } = await adminSupabase.from("mercado_livre_tokens").upsert(
      {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        ml_user_id: userInfo.id,
        ml_nickname: userInfo.nickname,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      },
    );

    if (error) {
      if (error.code === "23505") {
        // Já existe token para este usuário, fazer update
        const { error: updateError } = await adminSupabase
          .from("mercado_livre_tokens")
          .update({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            ml_user_id: userInfo.id,
            ml_nickname: userInfo.nickname,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Erro ao atualizar tokens:", updateError);

          // 🔁 ROLLBACK: Limpar ml_user_id se o update falhar
          await adminSupabase
            .from("usuarios")
            .update({ ml_user_id: null })
            .eq("id", userId);

          throw updateError;
        }
        console.log("Tokens atualizados com sucesso para o usuário:", userId);
      } else {
        console.error("Erro ao salvar tokens:", error);

        // 🔁 ROLLBACK: Limpar ml_user_id se qualquer outro erro ocorrer
        await adminSupabase
          .from("usuarios")
          .update({ ml_user_id: null })
          .eq("id", userId);

        throw error;
      }
    }

    console.log("Tokens salvos com sucesso para o usuário:", userId);
  } catch (error) {
    console.error("Erro em saveTokensToSupabase:", error);
    throw error;
  }
}
