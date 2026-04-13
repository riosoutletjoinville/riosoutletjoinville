// src/app/api/mercadopago/checkout/logado/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";
import { ItemPedidoMP } from "@/types/mercadopago";

const baseUrl = process.env.NEXTAUTH_URL || "https://algorithm-thick-vice-beaver.trycloudflare.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📦 Checkout logado - dados recebidos:", JSON.stringify(body, null, 2));

    const {
      itens,
      total,
      subtotal,
      frete_valor,
      frete_nome,
      frete_prazo,
      cliente_email,
      cliente_nome,
      cliente_id,
      cliente_dados,
    } = body;

    // Validações
    if (!itens || itens.length === 0) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    if (!cliente_id) {
      return NextResponse.json(
        { error: "Cliente não identificado" },
        { status: 400 }
      );
    }

    // Verificar se cliente existe
    const { data: cliente, error: clienteError } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", cliente_id)
      .single();

    if (clienteError || !cliente) {
      console.error("❌ Cliente não encontrado:", clienteError);
      return NextResponse.json(
        { error: "Cliente não encontrado" },
        { status: 404 }
      );
    }

    console.log("✅ Cliente encontrado:", cliente.id);

    // Criar pedido
    const pedidoData = {
      cliente_id: cliente_id,
      total: total,
      status: "pendente",
      data_pedido: new Date().toISOString(),
      condicao_pagamento: "Mercado Pago",
      origem_pedido: "ecommerce",
      tipo_checkout: "logado",
      frete_valor: frete_valor || 0,
      frete_gratis: frete_valor === 0,
      cep_entrega: cliente.cep || cliente_dados?.cep,
      opcao_frete: frete_nome,
      prazo_entrega: frete_prazo,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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

    console.log("✅ Pedido criado:", pedido.id);

    // Criar itens do pedido
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
      console.error("❌ Erro ao criar itens:", itensError);
      throw itensError;
    }

    console.log("✅ Itens do pedido criados");

    // Criar preferência no Mercado Pago
    const preferenceItems = itens.map((item: ItemPedidoMP) => ({
      id: item.produto_id,
      title: item.titulo.substring(0, 255),
      quantity: item.quantidade,
      currency_id: "BRL" as const,
      unit_price: item.preco_unitario,
    }));

    // Adicionar frete como item se houver
    if (frete_valor && frete_valor > 0) {
      preferenceItems.push({
        id: "frete",
        title: `Frete - ${frete_nome || "Entrega"}`,
        quantity: 1,
        currency_id: "BRL" as const,
        unit_price: frete_valor,
      });
    }

    // Construir objeto payer com tipagem correta
    const payer: {
      email: string;
      name: string;
      identification?: {
        type: "CPF" | "CNPJ";
        number: string;
      };
    } = {
      email: cliente_email,
      name: cliente_nome,
    };

    // Adicionar identificação apenas se for pessoa física com CPF
    if (cliente.tipo_cliente === "fisica" && cliente.cpf) {
      payer.identification = {
        type: "CPF",
        number: cliente.cpf.replace(/\D/g, ""),
      };
    } else if (cliente.tipo_cliente === "juridica" && cliente.cnpj) {
      payer.identification = {
        type: "CNPJ",
        number: cliente.cnpj.replace(/\D/g, ""),
      };
    }

    const preference = {
      items: preferenceItems,
      payer: payer,
      back_urls: {
        success: `${baseUrl}/checkout/sucesso?pedido_id=${pedido.id}&tipo=logado`,
        failure: `${baseUrl}/checkout/erro?pedido_id=${pedido.id}`,
        pending: `${baseUrl}/checkout/pendente?pedido_id=${pedido.id}`,
      },
      auto_return: "approved" as const,
      notification_url: `${baseUrl}/api/mercadopago/webhook`,
      external_reference: pedido.id,
      statement_descriptor: "RIOSOUTLET",
    };

    console.log("📋 Criando preferência MP:", JSON.stringify(preference, null, 2));
    
    const mpPreference = await mercadoPagoService.createPreference(preference);

    if (!mpPreference || !mpPreference.id) {
      throw new Error("Falha ao criar preferência no Mercado Pago");
    }

    console.log("✅ Preferência criada:", mpPreference.id);

    // Atualizar pedido com preference_id
    await supabase
      .from("pedidos")
      .update({ payment_id: mpPreference.id })
      .eq("id", pedido.id);

    return NextResponse.json({
      success: true,
      preference_id: mpPreference.id,
      init_point: mpPreference.init_point,
      pedido_id: pedido.id,
      cliente_id: cliente_id,
    });

  } catch (error) {
    console.error("❌ Erro no checkout logado:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar checkout",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}