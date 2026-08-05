// src/app/api/clientes/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createClienteSession } from "@/lib/cliente-auth";

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: "Email e senha são obrigatórios" },
        { status: 400 },
      );
    }

    // Buscar cliente
    const { data: cliente, error } = await supabase
      .from("clientes")
      .select(
        "id, email, senha, ativo, ativo_login, nome, sobrenome, tipo_cliente",
      )
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !cliente) {
      return NextResponse.json(
        { success: false, error: "Email ou senha inválidos" },
        { status: 401 },
      );
    }

    // Verificar status
    if (!cliente.ativo) {
      return NextResponse.json(
        { success: false, error: "Conta desativada" },
        { status: 401 },
      );
    }

    if (!cliente.ativo_login) {
      return NextResponse.json(
        { success: false, error: "Login não ativado" },
        { status: 401 },
      );
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, cliente.senha);
    if (!senhaValida) {
      return NextResponse.json(
        { success: false, error: "Email ou senha inválidos" },
        { status: 401 },
      );
    }

    // Criar sessão
    const { token, expiresAt } = await createClienteSession(cliente.id);

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      cliente_id: cliente.id,
      user: {
        id: cliente.id,
        email: cliente.email,
        nome: cliente.nome || "",
        sobrenome: cliente.sobrenome || "",
        tipo_cliente: cliente.tipo_cliente,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
