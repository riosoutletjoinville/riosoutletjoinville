// app/api/pedidos/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

interface ItemPedido {
  produto: {
    id: string;
    titulo?: string;
  };
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  desconto: number;
  tamanhos: { [key: string]: number };
  filial: string;
  embargue: string;
  variacao_id?: string;
  cor?: string;
  tamanho?: string;
}

function extrairTamanhoECor(valor: string): {
  tamanho: string;
  cor: string | null;
} {
  const lastUnderscoreIndex = valor.lastIndexOf("_");

  if (lastUnderscoreIndex > 0) {
    const tamanho = valor.substring(0, lastUnderscoreIndex);
    const cor = valor.substring(lastUnderscoreIndex + 1);
    return { tamanho, cor };
  }

  return { tamanho: valor, cor: null };
}

export async function POST(request: Request) {
  console.log("========================================");
  console.log("🚀 API /api/pedidos FOI CHAMADA!");
  console.log("⏰ Horário:", new Date().toISOString());
  console.log("========================================");

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ Erro de autenticação:", userError);
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    console.log("✅ Usuário autenticado:", user.id);

    const body = await request.json();
    const {
      prePedidoId,
      tipoPedidoId,
      justificativaTipo,
      naoBaixarEstoque = false,
    } = body;

    if (!prePedidoId) {
      return NextResponse.json(
        { error: "ID do pré-pedido é obrigatório" },
        { status: 400 },
      );
    }

    // 1. Buscar o pré-pedido
    const { data: prePedido, error: prePedidoError } = await supabase
      .from("pre_pedidos")
      .select(`*, cliente:clientes (*)`)
      .eq("id", prePedidoId)
      .single();

    if (prePedidoError || !prePedido) {
      console.error("❌ Erro ao buscar pré-pedido:", prePedidoError);
      return NextResponse.json(
        { error: "Pré-pedido não encontrado" },
        { status: 404 },
      );
    }

    // 2. Buscar usuário
    let usuarioData = null;
    if (prePedido.usuario_id) {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", prePedido.usuario_id)
        .single();
      usuarioData = usuario;
    }

    // 3. Verificar se já foi convertido
    if (prePedido.status === "convertido") {
      return NextResponse.json(
        { error: "Este pré-pedido já foi convertido em pedido" },
        { status: 400 },
      );
    }

    // 4. VALIDAR E PREPARAR BAIXA DE ESTOQUE
    const variacoesParaBaixar: {
      variacao_id: string;
      quantidade: number;
      produto_id: string;
      produto_titulo: string;
      tamanho_nome: string;
      cor_nome: string | null;
      preco_unitario: number;
    }[] = [];

    if (!naoBaixarEstoque) {
      for (const item of prePedido.itens as ItemPedido[]) {
        for (const [chaveTamanho, quantidade] of Object.entries(
          item.tamanhos,
        )) {
          if (quantidade <= 0) continue;

          const { tamanho: nomeTamanho, cor: nomeCor } =
            extrairTamanhoECor(chaveTamanho);

          // Buscar ID do tamanho
          const { data: tamanhoData } = await supabase
            .from("tamanhos")
            .select("id")
            .eq("nome", nomeTamanho)
            .single();

          if (!tamanhoData) {
            return NextResponse.json(
              {
                error: `Tamanho "${nomeTamanho}" não encontrado`,
                produto: item.produto.titulo,
              },
              { status: 400 },
            );
          }

          // Buscar ID da cor
          let corId = null;
          if (nomeCor) {
            const { data: corData } = await supabase
              .from("cores")
              .select("id")
              .eq("nome", nomeCor)
              .maybeSingle();
            corId = corData?.id || null;
          }

          // Buscar a variação
          let query = supabase
            .from("produto_variacoes")
            .select("id, estoque")
            .eq("produto_id", item.produto.id)
            .eq("tamanho_id", tamanhoData.id);

          if (corId) {
            query = query.eq("cor_id", corId);
          } else {
            query = query.is("cor_id", null);
          }

          const { data: variacao } = await query.maybeSingle();

          if (!variacao) {
            return NextResponse.json(
              {
                error: "Variação não encontrada",
                produto: item.produto.titulo,
                tamanho: nomeTamanho,
                cor: nomeCor || "padrão",
              },
              { status: 400 },
            );
          }

          if ((variacao.estoque || 0) < quantidade) {
            return NextResponse.json(
              {
                error: "Estoque insuficiente",
                produto: item.produto.titulo,
                tamanho: nomeTamanho,
                cor: nomeCor || null,
                disponivel: variacao.estoque || 0,
                solicitado: quantidade,
              },
              { status: 400 },
            );
          }

          variacoesParaBaixar.push({
            variacao_id: variacao.id,
            quantidade: quantidade,
            produto_id: item.produto.id,
            produto_titulo: item.produto.titulo || "",
            tamanho_nome: nomeTamanho,
            cor_nome: nomeCor,
            preco_unitario: item.preco_unitario,
          });
        }
      }
    }

    // 5. CRIAR O PEDIDO
    const pedidoData = {
      cliente_id: prePedido.cliente_id,
      total: prePedido.total,
      status: "confirmado",
      data_pedido: new Date().toISOString(),
      pre_pedido_id: prePedido.id,
      observacoes: prePedido.observacoes,
      condicao_pagamento: prePedido.condicao_pagamento,
      usuario_id: prePedido.usuario_id || user.id,
      tipo_pedido_id: tipoPedidoId || prePedido.tipo_pedido_id,
      local_trabalho_ped: prePedido.local_trabalho_ped || "",
      vendedor_nome: usuarioData?.nome || "",
      vendedor_email: usuarioData?.email || "",
      vendedor_telefone: usuarioData?.phone || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert(pedidoData)
      .select()
      .single();

    if (pedidoError) {
      console.error("❌ Erro ao criar pedido:", pedidoError);
      return NextResponse.json(
        { error: "Erro ao criar pedido" },
        { status: 500 },
      );
    }

    // 6. INSERIR ITENS DO PEDIDO
    const itensInseridos = [];

    for (const item of prePedido.itens as ItemPedido[]) {
      for (const [chaveTamanho, quantidade] of Object.entries(item.tamanhos)) {
        if (quantidade <= 0) continue;

        const { tamanho: nomeTamanho, cor: nomeCor } =
          extrairTamanhoECor(chaveTamanho);

        const { data: tamanhoData } = await supabase
          .from("tamanhos")
          .select("id")
          .eq("nome", nomeTamanho)
          .single();

        let corId = null;
        if (nomeCor) {
          const { data: corData } = await supabase
            .from("cores")
            .select("id")
            .eq("nome", nomeCor)
            .maybeSingle();
          corId = corData?.id || null;
        }

        let query = supabase
          .from("produto_variacoes")
          .select("id")
          .eq("produto_id", item.produto.id)
          .eq("tamanho_id", tamanhoData.id);

        if (corId) {
          query = query.eq("cor_id", corId);
        } else {
          query = query.is("cor_id", null);
        }

        const { data: variacao } = await query.maybeSingle();

        itensInseridos.push({
          pedido_id: pedido.id,
          produto_id: item.produto.id,
          quantidade: quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.preco_unitario * quantidade,
          desconto: item.desconto || 0,
          tamanhos: { [chaveTamanho]: quantidade },
          filial: item.filial || "Matriz",
          embargue: item.embargue || "Verificar com o vendedor",
          variacao_id: variacao?.id || null,
        });
      }
    }

    if (itensInseridos.length > 0) {
      const { error: itensError } = await supabase
        .from("pedido_itens")
        .insert(itensInseridos);

      if (itensError) {
        console.error("❌ Erro ao inserir itens:", itensError);
        await supabase.from("pedidos").delete().eq("id", pedido.id);
        return NextResponse.json(
          { error: "Erro ao inserir itens do pedido" },
          { status: 500 },
        );
      }
    }

    // 7. REGISTRAR NO FINANCEIRO
    console.log("💰 Registrando no financeiro...");
    // Usar data local do Brasil (UTC-3)
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    const dataLocal = `${ano}-${mes}-${dia}`;

    const { error: financeiroError } = await supabase
      .from("financeiro")
      .insert({
        tipo: "recebimento",
        descricao: `Venda - Pedido #${pedido.id.slice(-8)}`,
        valor: prePedido.total,
        categoria: "vendas",
        data_movimento: dataLocal,
        pedido_id: pedido.id,
        tipo_movimento: "entrada",
        status: "confirmado",
        created_at: new Date().toISOString(),
      });

    if (financeiroError) {
      console.error("❌ Erro ao registrar financeiro:", financeiroError);
    } else {
      console.log("✅ Financeiro registrado com sucesso");
    }

    // 8. ATUALIZAR PRÉ-PEDIDO
    await supabase
      .from("pre_pedidos")
      .update({
        status: "convertido",
        updated_at: new Date().toISOString(),
        pedido_id: pedido.id,
        tipo_pedido_id: tipoPedidoId || prePedido.tipo_pedido_id,
        justificativa_tipo: justificativaTipo || null,
      })
      .eq("id", prePedido.id);

    console.log("🎉 Processo concluído com sucesso!");

    return NextResponse.json({
      success: true,
      message: "Pedido confirmado com sucesso",
      pedido_id: pedido.id,
      pre_pedido_id: prePedido.id,
    });
  } catch (error) {
    console.error("❌ ERRO:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar requisição" },
      { status: 500 },
    );
  }
}
