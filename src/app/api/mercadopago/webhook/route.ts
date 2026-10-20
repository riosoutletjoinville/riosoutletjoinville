// src/app/api/mercadopago/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { mercadoPagoService } from "@/lib/mercadopago";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // VERIFICAR SE O WEBHOOK ESTÁ SENDO CHAMADO
    console.log("🔔 WEBHOOK CHAMADO - Headers:", {
      contentType: request.headers.get("content-type"),
      userAgent: request.headers.get("user-agent"),
    });
    const body = await request.json();
    console.log(
      "🔔 Webhook Mercado Pago recebido:",
      JSON.stringify(body, null, 2),
    );

    const { action, type, data } = body;

    // Verificar action ao invés de type
    if (
      type === "payment" &&
      (action === "payment.created" || action === "payment.updated")
    ) {
      const paymentId = data.id;
      console.log(
        `🔔 Processando payment ID: ${paymentId} (action: ${action})`,
      );

      // Aguardar um pouco para o pagamento estar disponível
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Buscar detalhes do pagamento
      const payment = await mercadoPagoService.getPayment(paymentId);
      console.log(
        "💰 Detalhes do pagamento:",
        JSON.stringify(payment, null, 2),
      );

      if (payment && payment.external_reference) {
        const pedidoId = payment.external_reference;
        const status = payment.status;

        console.log(`🔔 Atualizando pedido ${pedidoId} para status: ${status}`);

        // Mapear status do Mercado Pago para status do sistema
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

        const novoStatus = statusMap[status] || "pendente";

        const updateData: any = {
          status: novoStatus,
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
        };

        // Adicionar método de pagamento (bandeira do cartão)
        if (payment.payment_method_id) {
          updateData.payment_method = payment.payment_method_id;
          console.log(`💳 Salvando bandeira: ${payment.payment_method_id}`);
        }

        // Adicionar número de parcelas
        if (payment.installments) {
          updateData.installments = payment.installments;
          console.log(`📊 Salvando parcelas: ${payment.installments}`);
        }

        // Opcional: Salvar também o status_detail para debug
        if (payment.status_detail) {
          updateData.status_detail = payment.status_detail;
        }

        // Atualizar pedido
        const { error: updateError } = await supabase
          .from("pedidos")
          .update({
            status: novoStatus,
            payment_id: paymentId,
            payment_method: payment.payment_method_id,
            installments: payment.installments,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pedidoId);

        if (updateError) {
          console.error("❌ Erro ao atualizar pedido:", updateError);
          return NextResponse.json(
            { error: "Erro ao atualizar pedido" },
            { status: 500 },
          );
        }

        console.log(
          `✅ Pedido ${pedidoId} atualizado para status: ${novoStatus}`,
        );

        // Se pagamento aprovado, processar baixa de estoque e financeiro
        if (status === "approved") {
          console.log(`💰 Pagamento aprovado para pedido ${pedidoId}`);

          // Buscar itens do pedido
          const { data: itensPedido } = await supabase
            .from("pedido_itens")
            .select("*")
            .eq("pedido_id", pedidoId);

          const { data: existingFinanceiro } = await supabase
            .from("financeiro")
            .select("id")
            .eq("pedido_id", pedidoId)
            .maybeSingle();

          if (existingFinanceiro) {
            console.log(
              `⚠️ Movimento financeiro já existe para pedido ${pedidoId}, pulando...`,
            );
          } else {
            // Registrar movimento financeiro
            const { error: financeError } = await supabase
              .from("financeiro")
              .insert({
                tipo: "entrada", // ✅ CORRETO
                descricao: `Pagamento Pedido #${pedidoId}`,
                valor: payment.transaction_amount,
                categoria: "vendas",
                data_movimento: new Date().toISOString().split("T")[0], // ✅ Apenas YYYY-MM-DD
                pedido_id: pedidoId,
                tipo_movimento: "entrada",
                status: "confirmado",
                payment_id: paymentId,
              });

            if (financeError) {
              console.error("❌ Erro financeiro:", financeError);
            } else {
              console.log(
                `✅ Movimento financeiro criado para pedido ${pedidoId}`,
              );
            }
          }

          // Baixar estoque se tiver itens
          if (itensPedido && itensPedido.length > 0) {
            for (const item of itensPedido) {
              const { error: baixaError } = await supabase
                .from("baixas_estoque")
                .insert({
                  produto_id: item.produto_id,
                  variacao_id: item.variacao_id,
                  quantidade: item.quantidade,
                  motivo: "venda",
                  preco_unitario: item.preco_unitario,
                  pedido_id: pedidoId,
                  tipo_ajuste: "saida",
                  created_at: new Date().toISOString(),
                });

              if (baixaError) {
                console.error(
                  `❌ Erro ao dar baixa no estoque do produto ${item.produto_id}:`,
                  baixaError,
                );
              } else {
                console.log(
                  `✅ Estoque baixado: produto ${item.produto_id}, quantidade ${item.quantidade}`,
                );
              }
            }
          }
        }
      } else {
        console.warn(
          `⚠️ Pagamento ${paymentId} não tem external_reference ou não foi encontrado`,
        );
      }
    } else {
      console.log(`ℹ️ Evento ignorado: type=${type}, action=${action}`);
    }

    // Sempre retornar 200 para o Mercado Pago
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    // Mesmo com erro, retornar 200 para evitar reenvios duplicados
    return NextResponse.json(
      { received: true, error: "Processado com erro" },
      { status: 200 },
    );
  }
}
