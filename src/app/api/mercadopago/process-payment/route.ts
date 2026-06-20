import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(
      "📦 Dados recebidos no process-payment:",
      JSON.stringify(body, null, 2),
    );

    const {
      token,
      issuer_id,
      payment_method_id,
      installments,
      description,
      payer,
      external_reference,
      first_name,
      transaction_amount,
    } = body;

    if (!token && !payment_method_id) {
      return NextResponse.json(
        { error: "Token ou payment_method_id são obrigatórios" },
        { status: 400 },
      );
    }

    if (!external_reference) {
      return NextResponse.json(
        { error: "Referência externa é obrigatória" },
        { status: 400 },
      );
    }

    // Buscar valor total do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("total, cliente_id")
      .eq("id", external_reference)
      .single();

    if (pedidoError || !pedido) {
      console.error("❌ Pedido não encontrado:", pedidoError);
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    const paymentData: any = {
      transaction_amount: Number(pedido.total.toFixed(2)),
      token: token,
      description: description || `Pedido #${external_reference}`,
      installments: Number(installments) || 1,
      payment_method_id: payment_method_id,
      external_reference: external_reference,
      issuer_id: issuer_id,
      payer: {
        email: payer.email,
        identification: payer.identification,
        name: first_name,
      },
    };

    console.log(
      "💳 Dados enviados para Mercado Pago:",
      JSON.stringify(paymentData, null, 2),
    );

    // Processar pagamento com Mercado Pago
    const payment = await mercadoPagoService.processPayment(paymentData);
    console.log("📊 Status do pagamento:", payment.status);
    console.log("📊 Resposta completa:", JSON.stringify(payment, null, 2));

    // Resto do código permanece igual...
    const statusMap: Record<string, string> = {
      approved: "pago",
      pending: "pendente",
      in_process: "processando",
      authorized: "autorizado",
      in_mediation: "em_mediacao",
      rejected: "recusado",
      cancelled: "cancelado",
      refunded: "reembolsado",
      charged_back: "estornado",
    };

    if (payment.status === "approved" || payment.status === "pending") {
      const novoStatus = statusMap[payment.status] || "pendente";

      // Dados do cartão/parcelas
      const updateData: any = {
        status: novoStatus,
        payment_id: payment.id,
        updated_at: new Date().toISOString(),
        installments: Number(installments) || null,  
        payment_method: payment_method_id || null,
      };

      // Adicionar informações de parcelamento e método de pagamento
      if (installments) {
        updateData.installments = Number(installments);
      }

      if (payment_method_id) {
        updateData.payment_method = payment_method_id;
      }

      const { error: updateError } = await supabase
        .from("pedidos")
        .update({
          status: novoStatus,
          payment_id: payment.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", external_reference);

      if (updateError) {
        console.error("❌ Erro ao atualizar pedido:", updateError);
      } else {
        console.log(
          `✅ Pedido ${external_reference} atualizado para status: ${novoStatus}`,
        );
      }

      return NextResponse.json({
        success: true,
        payment_id: payment.id,
        status: payment.status,
      });
    } else {
      console.log("❌ Pagamento não aprovado, status:", payment.status);

      await supabase
        .from("pedidos")
        .update({
          status: "cancelado",
          updated_at: new Date().toISOString(),
        })
        .eq("id", external_reference);

      return NextResponse.json(
        {
          success: false,
          error: `Pagamento não aprovado: ${payment.status}`,
          status: payment.status,
          status_detail: payment.status_detail,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("❌ Erro ao processar pagamento:", error);

    if (error instanceof Error) {
      console.error("❌ Mensagem de erro:", error.message);
      console.error("❌ Stack trace:", error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao processar pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}
