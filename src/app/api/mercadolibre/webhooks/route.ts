import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { mercadoLivreService } from "@/lib/mercadolibre";
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  try {
    // Verificar se é um webhook válido do Mercado Livre
    const topic = req.headers.get("x-topic");
    const resource = req.headers.get("x-resource");
    const userId = req.headers.get("x-user-id");

    if (!topic || !resource) {
      console.error("Cabeçalhos de webhook ausentes");
      return NextResponse.json({ error: "Cabeçalhos necessários ausentes" }, {
        status: 400,
      });
    }

    const body = await req.json();

    console.log("Webhook recebido:", { topic, resource, userId, body });

    // Salvar a notificação no banco
    const { error } = await supabase
      .from("mercado_livre_webhooks")
      .insert({
        topic,
        resource,
        user_id: userId,
        received_at: new Date().toISOString(),
        payload: body,
      });

    if (error) {
      console.error("Erro ao salvar webhook:", error);
      return NextResponse.json({ error: "Erro ao salvar webhook" }, {
        status: 500,
      });
    }

    // Processar diferentes tipos de notificação
    switch (topic) {
      case "orders_v2":
        await processOrderNotification(resource);
        break;
      case "items":
        await processItemNotification(resource);
        break;
      case "questions":
        await processQuestionNotification(resource);
        break;
      case "messages":
        await processMessageNotification(resource);
        break;
      default:
        console.log("Tópico não processado:", topic);
    }

    try {
      const accessToken = await mercadoLivreService.getAccessToken();
      if (accessToken) {
        await mercadoLivreService.processNotification(
          accessToken,
          topic,
          resource,
        );
      }
    } catch (processingError) {
      console.error("Erro ao processar notificação:", processingError);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }
}

async function processOrderNotification(resource: string) {
  try {
    const orderId = resource.split("/").pop();
    console.log("Processando pedido:", orderId);

    // Aqui você implementaria a lógica para buscar detalhes do pedido
    // e atualizar seu sistema
  } catch (error) {
    console.error("Erro ao processar notificação de pedido:", error);
  }
}

async function processItemNotification(resource: string) {
  try {
    const itemId = resource.split("/").pop();
    console.log("Item modificado:", itemId);

    // Buscar informações atualizadas do produto
    const accessToken = await mercadoLivreService.getAccessToken();
    if (accessToken) {
      const itemInfo = await mercadoLivreService.getProduct(
        accessToken,
        itemId!,
      );

      // Atualizar status no banco
      await supabase
        .from("produtos")
        .update({
          ml_status: itemInfo.status,
          updated_at: new Date().toISOString(),
        })
        .eq("ml_item_id", itemId);
    }
  } catch (error) {
    console.error("Erro ao processar notificação de item:", error);
  }
}

async function processQuestionNotification(resource: string) {
  try {
    const questionId = resource.split("/").pop();
    console.log("Nova pergunta:", questionId);
  } catch (error) {
    console.error("Erro ao processar notificação de pergunta:", error);
  }
}

async function processMessageNotification(resource: string) {
  try {
    const messageId = resource.split("/").pop();
    console.log("Nova mensagem:", messageId);
  } catch (error) {
    console.error("Erro ao processar notificação de mensagem:", error);
  }
}

// GET para verificação do webhook pelo Mercado Livre
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const topic = searchParams.get("topic");

  if (topic) {
    console.log("Verificação de webhook recebida para tópico:", topic);
    return NextResponse.json({ status: "ok", topic });
  }

  return NextResponse.json({ status: "ok" });
}
