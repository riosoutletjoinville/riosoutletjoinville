// app/api/pedidos/[id]/cancelar/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getBrasiliaISOString } from "@/lib/dateUtils";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  console.log("========================================");
  console.log("🚀 API /api/pedidos/cancelar FOI CHAMADA!");
  console.log("📦 Pedido ID:", id);
  console.log("========================================");

  try {
    const supabase = await createSupabaseServerClient();

    // 1. Autenticação
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ Erro de autenticação:", userError);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("✅ Usuário autenticado:", user.id);

    // 2. Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("id, status, total, pre_pedido_id")
      .eq("id", id)
      .single();

    if (pedidoError || !pedido) {
      console.error("❌ Erro ao buscar pedido:", pedidoError);
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    // 3. Verificar se o pedido já está cancelado
    if (pedido.status === "cancelado") {
      return NextResponse.json(
        { error: "Este pedido já está cancelado" },
        { status: 400 }
      );
    }

    // 4. Verificar se o pedido pode ser cancelado
    const statusesPermitidos = [
      "confirmado", "pendente", "processando",
      "troca_solicitada", "defeito_fabricacao", "doacao"
    ];
    
    if (!statusesPermitidos.includes(pedido.status)) {
      return NextResponse.json(
        { 
          error: `Pedido com status "${pedido.status}" não pode ser cancelado.`,
          statusAtual: pedido.status
        },
        { status: 400 }
      );
    }

    // 5. Buscar o body da requisição
    const body = await request.json();
    const { motivo, tipo_cancelamento = "arrependimento" } = body;

    if (!motivo) {
      return NextResponse.json(
        { error: "Motivo do cancelamento é obrigatório" },
        { status: 400 }
      );
    }

    console.log(`📝 Cancelando pedido ${id} - Motivo: ${motivo}`);

    // 6. Chamar a função RPC para cancelar o pedido
    const { data: resultado, error: rpcError } = await supabase
      .rpc('cancelar_pedido_completo', {
        p_pedido_id: id,
        p_motivo: motivo,
        p_tipo_cancelamento: tipo_cancelamento,
        p_usuario_id: user.id
      });

    if (rpcError) {
      console.error("❌ Erro ao executar RPC:", rpcError);
      
      // Verificar se o erro é específico
      if (rpcError.message?.includes('duplicate key')) {
        return NextResponse.json(
          { 
            error: "Erro de duplicidade no financeiro. Tente novamente.",
            detalhe: rpcError.message
          },
          { status: 409 }
        );
      }
      
      throw new Error(rpcError.message || "Erro ao executar cancelamento");
    }

    // 7. Verificar o resultado
    if (resultado?.error) {
      console.error("❌ Erro no RPC:", resultado);
      return NextResponse.json(
        { error: resultado.error },
        { status: 500 }
      );
    }

    console.log("🎉 Cancelamento concluído com sucesso!");

    return NextResponse.json({
      success: true,
      message: "Pedido cancelado com sucesso",
      pedido_id: id,
      detalhes: resultado
    });

  } catch (error) {
    console.error("❌ ERRO NO CANCELAMENTO:", error);
    return NextResponse.json(
      { 
        error: "Erro interno ao processar cancelamento",
        detalhe: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}