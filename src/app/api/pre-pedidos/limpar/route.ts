// app/api/pre-pedidos/limpar/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { ItemPedido } from "@/types/pre-pedido"; // Adicione esta linha

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Verificar se o usuário é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    const { data: adminCheck } = await supabase
      .from("usuarios")
      .select("tipo")
      .eq("id", user.id)
      .single();
      
    if (adminCheck?.tipo !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar todos os pré-pedidos confirmados (não convertidos)
    const { data: prePedidos, error } = await supabase
      .from("pre_pedidos")
      .select("id, itens, status")
      .eq("status", "confirmado")
      .limit(1000);

    if (error) throw error;

    const resultados = [];
    
    for (const prePedido of prePedidos || []) {
      const itens = prePedido.itens as ItemPedido[];
      let temProdutoInvalido = false;
      const produtosInvalidos = [];

      for (const item of itens) {
        // Verificar se o produto existe
        const { data: produto } = await supabase
          .from("produtos")
          .select("id, ativo")
          .eq("id", item.produto.id)
          .maybeSingle();

        if (!produto) {
          temProdutoInvalido = true;
          produtosInvalidos.push({
            produto_id: item.produto.id,
            titulo: item.produto.titulo || "Produto desconhecido",
            motivo: "Produto não encontrado"
          });
        } else if (produto.ativo === false) {
          temProdutoInvalido = true;
          produtosInvalidos.push({
            produto_id: item.produto.id,
            titulo: item.produto.titulo || "Produto desconhecido",
            motivo: "Produto desativado"
          });
        }
      }

      if (temProdutoInvalido) {
        // Opção 1: Cancelar o pré-pedido automaticamente
        await supabase
          .from("pre_pedidos")
          .update({
            status: "cancelado",
            motivo_cancelamento: `Cancelado automaticamente - Produtos inválidos: ${produtosInvalidos.map(p => p.titulo).join(", ")}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prePedido.id);

        resultados.push({
          pre_pedido_id: prePedido.id,
          status: "cancelado",
          produtosInvalidos
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processados ${resultados.length} pré-pedidos inválidos`,
      resultados
    });

  } catch (error) {
    console.error("Erro ao limpar pré-pedidos inválidos:", error);
    return NextResponse.json(
      { error: "Erro ao processar requisição" },
      { status: 500 }
    );
  }
}