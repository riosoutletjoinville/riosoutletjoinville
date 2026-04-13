// src/app/api/mercadopago/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";
import { CheckoutRequestMP, ItemPedidoMP } from "@/types/mercadopago";
import bcrypt from "bcryptjs";

const baseUrl =
  process.env.NEXTAUTH_URL ||
  "https://algorithm-thick-vice-beaver.trycloudflare.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(
      "📦 Dados recebidos no checkout:",
      JSON.stringify(body, null, 2),
    );

    const {
      itens,
      total,
      cliente_email,
      cliente_nome,
      criar_conta = false,
      cliente_senha,
      cliente_dados,
      tipo_checkout = criar_conta ? "cadastro" : "guest",
    }: CheckoutRequestMP & { tipo_checkout?: string } = body;

    if (!itens || itens.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    if (!cliente_email || !cliente_nome) {
      return NextResponse.json(
        { error: "Dados do cliente são obrigatórios" },
        {
          status: 400,
        },
      );
    }

    let clienteId: string | null = null;

    try {
      console.log("👤 Processando cliente:", tipo_checkout);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dadosCliente: any = {
        email: cliente_email,
        telefone: cliente_dados?.telefone || "",
        endereco: cliente_dados?.logradouro || "",
        numero: cliente_dados?.numero || "",
        complemento: cliente_dados?.complemento || "",
        bairro: cliente_dados?.bairro || "",
        cidade: cliente_dados?.cidade || "",
        estado: cliente_dados?.estado || "",
        cep: cliente_dados?.cep || "",
        tipo_cliente: cliente_dados?.tipo_cliente || "fisica",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Campos para controle
        cliente_temporario: tipo_checkout === "guest",
        origem_cadastro: "ecommerce",
        ativo: true,
      };

      // Campos específicos para pessoa FÍSICA (obrigatórios)
      if (dadosCliente.tipo_cliente === "fisica") {
        dadosCliente.nome = cliente_dados?.nome || cliente_nome.split(" ")[0];
        dadosCliente.sobrenome =
          cliente_dados?.sobrenome ||
          cliente_nome.split(" ").slice(1).join(" ") ||
          "";
        dadosCliente.cpf = cliente_dados?.cpf || "";
        // Campos para pessoa jurídica (preenchidos com valores vazios)
        dadosCliente.razao_social = "";
        dadosCliente.cnpj = "";
      }
      // Campos específicos para pessoa JURÍDICA (obrigatórios)
      else {
        dadosCliente.razao_social = cliente_dados?.nome || cliente_nome;
        dadosCliente.cnpj = cliente_dados?.cnpj || "";
        dadosCliente.nome_fantasia = cliente_dados?.nome || cliente_nome;
        // Campos para pessoa física (preenchidos com valores vazios)
        dadosCliente.nome = "";
        dadosCliente.sobrenome = "";
        dadosCliente.cpf = "";
      }

      // Campos de login apenas para cadastro
      if (tipo_checkout === "cadastro") {
        // Criptografar a senha antes de salvar
        const salt = await bcrypt.genSalt(12);
        const senhaHash = await bcrypt.hash(cliente_senha, salt);

        dadosCliente.senha = senhaHash; // Salvar hash, não texto puro
        dadosCliente.ativo_login = true;
        dadosCliente.data_cadastro_login = new Date().toISOString();
      } else {
        dadosCliente.senha = null;
        dadosCliente.ativo_login = false;
        dadosCliente.data_cadastro_login = null;
      }

      console.log("📝 Dados do cliente a serem salvos:", dadosCliente);

      // Verificar se cliente já existe pelo email
      const { data: clienteExistente, error: buscaError } = await supabase
        .from("clientes")
        .select("id")
        .eq("email", cliente_email)
        .single();

      if (buscaError && buscaError.code !== "PGRST116") {
        console.error("❌ Erro ao buscar cliente:", buscaError);
      }

      if (clienteExistente) {
        clienteId = clienteExistente.id;
        console.log("✅ Usando cliente existente:", clienteId);

        // Atualizar dados do cliente existente
        const { error: updateError } = await supabase
          .from("clientes")
          .update({
            ...dadosCliente,
            updated_at: new Date().toISOString(),
          })
          .eq("id", clienteId);

        if (updateError) {
          console.error("❌ Erro ao atualizar cliente:", updateError);
          throw new Error(
            "Erro ao atualizar dados do cliente: " + updateError.message,
          );
        }
      } else {
        // Criar novo cliente
        const { data: cliente, error: insertError } = await supabase
          .from("clientes")
          .insert(dadosCliente)
          .select("id")
          .single();

        if (insertError) {
          console.error("❌ Erro ao criar cliente:", insertError);
          console.error("❌ Detalhes do erro:", insertError.details);
          throw new Error(
            "Não foi possível criar o cliente: " + insertError.message,
          );
        }

        clienteId = cliente.id;
        console.log("✅ Cliente criado com ID:", clienteId);
      }

      // Para cadastro, criar também na tabela usuarios (se necessário)
      if (tipo_checkout === "cadastro" && cliente_senha) {
        console.log("👤 Tentando criar usuário na tabela usuarios...");

        // Verificar se usuário já existe
        const { data: usuarioExistente } = await supabase
          .from("usuarios")
          .select("id")
          .eq("email", cliente_email.toLowerCase())
          .single();

        if (!usuarioExistente) {
          try {
            const salt = await bcrypt.genSalt(12);
            const senhaHash = await bcrypt.hash(cliente_senha, salt);

            const { error: usuarioError } = await supabase
              .from("usuarios")
              .insert({
                nome: dadosCliente.nome || dadosCliente.razao_social,
                email: cliente_email.toLowerCase(),
                senha: senhaHash, // Hash, não texto puro
                tipo: "usuario",
                ativo: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (usuarioError) {
              console.error("❌ Erro ao criar usuário:", usuarioError);
              // Não interrompe o processo, apenas loga o erro
            } else {
              console.log("✅ Usuário criado na tabela usuarios");
            }
          } catch (hashError) {
            console.error("❌ Erro ao criar hash da senha:", hashError);
          }
        } else {
          console.log("✅ Usuário já existe na tabela usuarios");
        }
      }
    } catch (error) {
      console.error("❌ Erro no processamento do cliente:", error);
      throw new Error(
        "Falha no processamento do cliente: " +
          (error instanceof Error ? error.message : "Erro desconhecido"),
      );
    }

    // Verificar se temos clienteId
    if (!clienteId) {
      throw new Error("Cliente ID é obrigatório para criar pedido");
    }

    // Criar pedido
    console.log("📝 Criando pedido...");
    const pedidoData = {
      cliente_id: clienteId,
      total: total,
      status: "pendente",
      data_pedido: new Date().toISOString(),
      condicao_pagamento: "Mercado Pago",
      created_at: new Date().toISOString(),
      origem_pedido: "ecommerce",
      tipo_checkout: tipo_checkout,
    };

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert(pedidoData)
      .select("id")
      .single();

    if (pedidoError) {
      console.error("❌ Erro ao criar pedido:", pedidoError);
      throw pedidoError;
    }

    console.log("✅ Pedido criado com ID:", pedido.id);

    // Criar itens do pedido
    console.log("🛒 Criando itens do pedido...");
    itens.forEach((item, index) => {
      console.log(`Item ${index}:`, {
        produto_id: item.produto_id,
        variacao_id: item.variacao_id || "❌ SEM VARIACAO_ID",
        quantidade: item.quantidade,
      });
    });
    const itensPedido = itens.map((item: ItemPedidoMP) => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      variacao_id: item.variacao_id || null,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.preco_unitario * item.quantidade,
    }));

    const { error: itensError } = await supabase
      .from("pedido_itens")
      .insert(itensPedido);

    if (itensError) {
      console.error("❌ Erro ao criar itens do pedido:", itensError);
      throw itensError;
    }

    console.log("✅ Itens do pedido criados");

    // Criar preferência no Mercado Pago
    console.log("💳 Criando preferência no Mercado Pago...");

    const preferenceItems = itens.map((item: ItemPedidoMP) => ({
      id: item.produto_id,
      title: item.titulo.substring(0, 255),
      quantity: item.quantidade,
      currency_id: "BRL" as const,
      unit_price: item.preco_unitario,
    }));

    const preference = {
      items: preferenceItems,
      payer: {
        email: cliente_email,
      },
      back_urls: {
        success: `${baseUrl}/checkout/sucesso?pedido_id=${pedido.id}&tipo=${tipo_checkout}&criou_conta=${tipo_checkout === "cadastro"}`,
        failure: `${baseUrl}/checkout/erro?pedido_id=${pedido.id}`,
        pending: `${baseUrl}/checkout/pendente?pedido_id=${pedido.id}`,
      },
      auto_return: "approved" as const,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      external_reference: pedido.id,
      statement_descriptor: "RIOSOUTLET",
    };

    console.log("📋 Preference data:", JSON.stringify(preference, null, 2));
    const mpPreference = await mercadoPagoService.createPreference(preference);

    if (!mpPreference || !mpPreference.id) {
      throw new Error("Falha ao criar preferência no Mercado Pago");
    }

    console.log("✅ Preferência criada:", mpPreference.id);

    return NextResponse.json({
      success: true,
      preference_id: mpPreference.id,
      init_point: mpPreference.init_point,
      cliente_id: clienteId,
      pedido_id: pedido.id,
    });
  } catch (error) {
    console.error("❌ Erro no checkout:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar checkout",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
