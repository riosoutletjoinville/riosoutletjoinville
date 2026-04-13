// src/app/api/clientes/pedidos/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// CORREÇÃO: params é uma Promise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar o params
    const { id: pedidoId } = await params;
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("cliente_id");

    console.log("🔍 Buscando pedido:", { pedidoId, clienteId });

    if (!pedidoId) {
      return NextResponse.json(
        { error: "ID do pedido é obrigatório" },
        { status: 400 }
      );
    }

    if (!clienteId) {
      return NextResponse.json(
        { error: "ID do cliente é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar pedido com verificação de propriedade
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(`
        id,
        total,
        status,
        data_pedido,
        created_at,
        condicao_pagamento,
        frete_valor,
        frete_gratis,
        opcao_frete,
        cep_entrega,
        prazo_entrega,
        observacoes,
        origem_pedido,
        tipo_checkout,
        payment_id,
        payment_method,
        installments,
        qr_code,
        qr_code_base64,
        pix_expiration,
        cliente_id
      `)
      .eq("id", pedidoId)
      .eq("cliente_id", clienteId)
      .single();

    if (pedidoError) {
      console.error("❌ Erro ao buscar pedido:", pedidoError);
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 }
      );
    }

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado ou não pertence a este cliente" },
        { status: 404 }
      );
    }

    // Buscar itens do pedido
    const { data: itens, error: itensError } = await supabase
      .from("pedido_itens")
      .select(`
        id,
        produto_id,
        variacao_id,
        quantidade,
        preco_unitario,
        subtotal,
        produtos:produto_id (
          titulo,
          sku
        ),
        produto_variacoes:variacao_id (
          tamanho,
          cor,
          sku
        )
      `)
      .eq("pedido_id", pedidoId);

    if (itensError) {
      console.error("❌ Erro ao buscar itens:", itensError);
    }

    // Formatar itens
    const itensFormatados = (itens || []).map((item: any) => ({
      id: item.id,
      produto_titulo: item.produtos?.titulo || "Produto",
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      subtotal: item.subtotal,
      tamanho: item.produto_variacoes?.tamanho || null,
      cor: item.produto_variacoes?.cor || null,
      sku: item.produto_variacoes?.sku || item.produtos?.sku || null,
    }));

    // Gerar número do pedido (formato: #ANO-MES-DIA-XXXX)
    const dataPedido = new Date(pedido.data_pedido);
    const ano = dataPedido.getFullYear();
    const mes = String(dataPedido.getMonth() + 1).padStart(2, '0');
    const dia = String(dataPedido.getDate()).padStart(2, '0');
    const numero = `${ano}${mes}${dia}-${pedido.id.slice(0, 4).toUpperCase()}`;

    // Verificar se está despachado (exemplo: status = 'enviado' ou 'entregue')
    const despachado = ['enviado', 'entregue'].includes(pedido.status?.toLowerCase() || '');

    const pedidoFormatado = {
      id: pedido.id,
      numero: numero,
      total: pedido.total,
      status: pedido.status,
      data_pedido: pedido.data_pedido,
      condicao_pagamento: pedido.condicao_pagamento,
      frete_valor: pedido.frete_valor,
      frete_gratis: pedido.frete_gratis,
      opcao_frete: pedido.opcao_frete,
      cep_entrega: pedido.cep_entrega,
      prazo_entrega: pedido.prazo_entrega,
      observacoes: pedido.observacoes,
      origem_pedido: pedido.origem_pedido,
      tipo_checkout: pedido.tipo_checkout,
      payment_method: pedido.payment_method,
      installments: pedido.installments,
      qr_code: pedido.qr_code,
      qr_code_base64: pedido.qr_code_base64,
      despachado: despachado,
      itens: itensFormatados,
    };

    console.log("✅ Pedido encontrado:", { id: pedido.id, itens: itensFormatados.length });

    return NextResponse.json({
      success: true,
      pedido: pedidoFormatado,
    });

  } catch (error) {
    console.error("❌ Erro interno:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}