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

      { /* if (payment.status === "approved") {
        console.log("💰 Pagamento aprovado, criando movimento financeiro...");

        const { error: financeError } = await supabase
          .from("financeiro")
          .insert({
            tipo: "recebimento",
            descricao: `Pagamento Pedido #${external_reference}`,
            valor: payment.transaction_amount,
            categoria: "vendas",
            data_movimento: new Date().toISOString(),
            pedido_id: external_reference,
            tipo_movimento: "entrada",
            status: "confirmado",
            created_at: new Date().toISOString(),
          });

        if (financeError) {
          console.error("❌ Erro ao criar movimento financeiro:", financeError);
        } else {
          console.log("✅ Movimento financeiro criado");
        }

        const { data: itensPedido } = await supabase
          .from("pedido_itens")
          .select("*")
          .eq("pedido_id", external_reference);

        if (itensPedido && itensPedido.length > 0) {
          console.log(
            `📦 Dando baixa em ${itensPedido.length} itens do estoque...`,
          );

          for (const item of itensPedido) {
            // 1º: ATUALIZAR O ESTOQUE (o que estava faltando!)
            if (item.variacao_id) {
              // Buscar a variação primeiro para saber o estoque atual
              const { data: variacao, error: fetchError } = await supabase
                .from("produto_variacoes")
                .select("estoque")
                .eq("id", item.variacao_id)
                .single();

              if (fetchError) {
                console.error(
                  `❌ Erro ao buscar variação ${item.variacao_id}:`,
                  fetchError,
                );
              } else {
                const novoEstoque = (variacao?.estoque || 0) - item.quantidade;

                const { error: updateError } = await supabase
                  .from("produto_variacoes")
                  .update({ estoque: novoEstoque })
                  .eq("id", item.variacao_id);

                if (updateError) {
                  console.error(
                    `❌ Erro ao atualizar estoque da variação:`,
                    updateError,
                  );
                } else {
                  console.log(
                    `✅ Estoque da variação ${item.variacao_id} atualizado: ${novoEstoque}`,
                  );
                }
              }
            } else {
              // Sem variação, atualiza o produto principal
              const { data: produto, error: fetchError } = await supabase
                .from("produtos")
                .select("estoque")
                .eq("id", item.produto_id)
                .single();

              if (fetchError) {
                console.error(
                  `❌ Erro ao buscar produto ${item.produto_id}:`,
                  fetchError,
                );
              } else {
                const novoEstoque = (produto?.estoque || 0) - item.quantidade;

                const { error: updateError } = await supabase
                  .from("produtos")
                  .update({ estoque: novoEstoque })
                  .eq("id", item.produto_id);

                if (updateError) {
                  console.error(
                    `❌ Erro ao atualizar estoque do produto:`,
                    updateError,
                  );
                } else {
                  console.log(
                    `✅ Estoque do produto ${item.produto_id} atualizado: ${novoEstoque}`,
                  );
                }
              }
            }

            // 2º: REGISTRAR A BAIXA (seu código original)
            const { error: baixaError } = await supabase
              .from("baixas_estoque")
              .insert({
                produto_id: item.produto_id,
                variacao_id: item.variacao_id,
                quantidade: item.quantidade,
                motivo: "venda",
                preco_unitario: item.preco_unitario,
                pedido_id: external_reference,
                tipo_ajuste: "saida",
                created_at: new Date().toISOString(),
              });

            if (baixaError) {
              console.error(
                `❌ Erro ao registrar baixa no estoque:`,
                baixaError,
              );
            } else {
              console.log(
                `✅ Baixa registrada: produto ${item.produto_id}, quantidade ${item.quantidade}`,
              );
            }
          }
        }
      } */ }

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
