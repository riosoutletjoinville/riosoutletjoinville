// src/app/api/mercadolibre/delete-item/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "ID do item é obrigatório" },
        { status: 400 },
      );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 },
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    console.log(`🗑️ [delete-item] Iniciando exclusão do item ${itemId}`);

    // ═══ PASSO 1: Verificar status atual ═══
    const checkResponse = await fetch(
      `https://api.mercadolibre.com/items/${itemId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!checkResponse.ok) {
      if (checkResponse.status === 404) {
        console.log(`ℹ️ [delete-item] Produto ${itemId} já não existe no ML`);
        return NextResponse.json({
          success: true,
          message: "Produto já não existe no Mercado Livre",
        });
      }
      const errorBody = await checkResponse.text();
      console.error(`❌ [delete-item] Erro ao verificar:`, errorBody);
      return NextResponse.json(
        {
          error: `Erro ao verificar produto: ${checkResponse.status} - ${errorBody}`,
        },
        { status: checkResponse.status },
      );
    }

    const productData = await checkResponse.json();
    console.log(`📊 [delete-item] Status atual: ${productData.status}`);

    // ═══ PASSO 2: Helper para marcar como deletado ═══
    const attemptDelete = async () => {
      return fetch(`https://api.mercadolibre.com/items/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted: "true" }),
      });
    };

    // ═══ PASSO 3: Tentar deletar DIRETO (funciona para closed e inactive) ═══
    console.log("🗑️ [delete-item] Tentando exclusão direta...");
    let deleteResponse = await attemptDelete();

    // ═══ PASSO 4: Se falhou, tentar fechar primeiro (active/paused) ═══
    if (!deleteResponse.ok && productData.status !== "closed") {
      const firstError = await deleteResponse.text();
      console.log(
        `⚠️ [delete-item] Exclusão direta falhou (${deleteResponse.status}). Tentando fechar primeiro...`,
      );

      const closeResponse = await fetch(
        `https://api.mercadolibre.com/items/${itemId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "closed" }),
        },
      );

      if (closeResponse.ok) {
        console.log("⏳ [delete-item] Aguardando 2s após fechar...");
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("🗑️ [delete-item] Tentando exclusão após fechar...");
        deleteResponse = await attemptDelete();
      } else {
        const closeError = await closeResponse.text();
        console.error(`❌ [delete-item] Erro ao fechar:`, closeError);
        // Mantém o primeiro erro de delete para reportar (mais relevante)
        return NextResponse.json(
          {
            error: `Não foi possível excluir: ${firstError}. Também falhou ao fechar: ${closeError}`,
          },
          { status: deleteResponse.status },
        );
      }
    }

    // ═══ PASSO 5: Verificar resultado final ═══
    if (!deleteResponse.ok) {
      const errorBody = await deleteResponse.text();
      console.error(`❌ [delete-item] Erro ao deletar:`, errorBody);
      return NextResponse.json(
        {
          error: `Erro ao excluir: ${deleteResponse.status} - ${errorBody}`,
        },
        { status: deleteResponse.status },
      );
    }

    console.log(`✅ [delete-item] Item ${itemId} excluído com sucesso`);
    return NextResponse.json({
      success: true,
      message: "Produto excluído com sucesso do Mercado Livre",
    });
  } catch (error) {
    console.error("💥 [delete-item] Erro interno:", error);
    return NextResponse.json(
      {
        error: `Erro interno: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      },
      { status: 500 },
    );
  }
}