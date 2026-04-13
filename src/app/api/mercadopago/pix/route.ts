// src/app/api/mercadopago/pix/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pedido_id, total } = body;

    console.log("🔄 Criando pagamento PIX para pedido:", pedido_id);

    if (!pedido_id || !total) {
      return NextResponse.json(
        { error: "pedido_id e total são obrigatórios" },
        { status: 400 }
      );
    }

    // 1. Buscar o pedido com dados do cliente
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(`
        id,
        total,
        cliente_id,
        clientes:cliente_id (
          id,
          email,
          nome,
          sobrenome,
          cpf,
          cnpj,
          tipo_cliente,
          razao_social
        )
      `)
      .eq("id", pedido_id)
      .single();

    if (pedidoError || !pedido) {
      console.error("❌ Pedido não encontrado:", pedidoError);
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // CORREÇÃO: Acessar cliente como objeto (não array)
    const cliente = pedido.clientes as any;
    
    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado para este pedido" },
        { status: 404 }
      );
    }

    console.log("👤 Dados do cliente:", {
      email: cliente.email,
      cpf: cliente.cpf,
      tipo_cliente: cliente.tipo_cliente,
    });

    // 2. Determinar documento (CPF ou CNPJ)
    let identificationType: "CPF" | "CNPJ" = "CPF";
    let identificationNumber = "";

    if (cliente.tipo_cliente === "juridica" && cliente.cnpj) {
      identificationType = "CNPJ";
      identificationNumber = cliente.cnpj.replace(/\D/g, "");
    } else if (cliente.cpf) {
      identificationNumber = cliente.cpf.replace(/\D/g, "");
    } else {
      console.warn("⚠️ Cliente sem CPF/CNPJ, enviando sem identificação");
    }

    // Nome do pagador
    const payerName = cliente.tipo_cliente === "juridica"
      ? cliente.razao_social || ""
      : `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim();

    // 3. Criar pagamento Pix
    console.log("📤 Enviando para Mercado Pago:", {
      transaction_amount: Number(total.toFixed(2)),
      description: `Pedido #${pedido_id}`,
      payment_method_id: "pix",
      payer: {
        email: cliente.email,
        ...(identificationNumber && {
          identification: {
            type: identificationType,
            number: identificationNumber,
          }
        }),
        name: payerName || undefined,
      },
      external_reference: pedido_id,
    });

    // Usar createPixPayment do serviço
    const response = await mercadoPagoService.createPixPayment({
      transaction_amount: Number(total.toFixed(2)),
      description: `Pedido #${pedido_id}`,
      payer: {
        email: cliente.email,
        ...(identificationNumber && {
          identification: {
            type: identificationType,
            number: identificationNumber,
          }
        }),
        name: payerName || undefined,
      },
      external_reference: pedido_id,
    });

    console.log("✅ Resposta do Mercado Pago:", {
      id: response.id,
      status: response.status,
      hasPointOfInteraction: !!response.point_of_interaction,
    });

    // 4. Verificar se temos os dados do Pix
    if (!response.point_of_interaction?.transaction_data) {
      console.error("❌ Resposta não contém dados do Pix:", response);
      return NextResponse.json(
        { error: "Erro ao gerar QR Code Pix. Resposta incompleta do Mercado Pago." },
        { status: 500 }
      );
    }

    // 5. Atualizar pedido com campos do PIX
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        payment_id: response.id.toString(),
        payment_method: 'pix',
        status: "aguardando_pagamento",
        qr_code: response.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64,
        pix_expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", pedido_id);

    if (updateError) {
      console.error("❌ Erro ao atualizar pedido:", updateError);
    }

    // 6. Retornar dados do QR Code
    return NextResponse.json({
      success: true,
      qr_code: response.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64,
      ticket_url: response.point_of_interaction.transaction_data.ticket_url,
      payment_id: response.id,
      status: response.status,
    });

  } catch (error) {
    console.error("❌ Erro ao criar Pix:", error);

    let errorMessage = "Erro ao gerar Pix";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}