// src/app/api/mercadopago/pix/route.ts

import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";

// src/app/api/mercadopago/pix/route.ts

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pedido_id, total } = body;

    console.log("🔄 Criando pagamento PIX para pedido EXISTENTE:", pedido_id);

    if (!pedido_id || !total) {
      return NextResponse.json(
        { error: "pedido_id e total são obrigatórios" },
        { status: 400 }
      );
    }

    // 1. Buscar o pedido existente incluindo status e payment_method
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(`
        id,
        total,
        status,
        payment_id,
        payment_method,
        qr_code,
        qr_code_base64,
        pix_expiration,
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

    // ✅ NOVA VALIDAÇÃO: Se já tem QR code e não expirou, retornar ele
    if (pedido.qr_code_base64 && pedido.qr_code) {
      // Verificar se o QR code expirou
      const expiracao = pedido.pix_expiration ? new Date(pedido.pix_expiration) : null;
      const agora = new Date();
      
      if (expiracao && expiracao > agora) {
        console.log("♻️ Retornando QR code existente (ainda válido)");
        return NextResponse.json({
          success: true,
          qr_code: pedido.qr_code,
          qr_code_base64: pedido.qr_code_base64,
          payment_id: pedido.payment_id,
          status: pedido.status,
        });
      } else if (expiracao && expiracao <= agora) {
        console.log("⚠️ QR code expirado, gerando novo");
        // Continua para gerar novo
      }
    }

    // VALIDAÇÃO: Se o pedido já foi pago, não permitir gerar PIX
    if (pedido.status === 'pago' || pedido.status === 'approved') {
      console.warn(`⚠️ Pedido ${pedido_id} já está pago (status: ${pedido.status})`);
      return NextResponse.json(
        { error: "Este pedido já foi pago. Não é possível gerar um novo PIX." },
        { status: 400 }
      );
    }

    if (pedido.payment_method && pedido.payment_method !== 'pix' && pedido.status === 'pago') {
      console.warn(`⚠️ Pedido ${pedido_id} já foi pago com ${pedido.payment_method}`);
      return NextResponse.json(
        { error: `Este pedido já foi pago com ${pedido.payment_method === 'cartao' ? 'Cartão' : pedido.payment_method}.` },
        { status: 400 }
      );
    }

    // Se está aguardando pagamento com outro método, permitir mudar para PIX
    if (pedido.payment_method && pedido.payment_method !== 'pix' && pedido.status === 'pendente') {
      console.log(`🔄 Mudando método de ${pedido.payment_method} para PIX`);
    }

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

    // 5. ATUALIZAR pedido existente com os dados do PIX
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
      // Continua mesmo com erro, pois já temos os dados do PIX
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