// src/app/api/mercadolibre/items/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Obter o token do header Authorization
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de autorização não fornecido" },
        { status: 401 },
      );
    }

    const accessToken = authHeader.substring(7);
    const body = await request.json();

    console.log(
      "Publicando produto no ML com token:",
      accessToken.substring(0, 20) + "...",
    );
    console.log("Dados do produto:", JSON.stringify(body, null, 2));

    const response = await fetch("https://api.mercadolibre.com/items", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log("Resposta completa do ML:", responseText);

    if (!response.ok) {
      // Log detalhado para diagnóstico
      console.error("Status do erro:", response.status);
      console.error("Cabeçalhos da resposta:", Object.fromEntries(response.headers.entries()));
      console.error("Corpo do erro:", responseText);
      
      return NextResponse.json(
        { 
          error: `Erro ao publicar produto`,
          details: responseText,
          status: response.status 
        },
        { status: response.status },
      );
    }

    const result = JSON.parse(responseText);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na API route:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Obter o token do header Authorization
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token de autorização não fornecido" },
        { status: 401 },
      );
    }

    const accessToken = authHeader.substring(7);
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "ID do item é obrigatório" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const response = await fetch(
      `https://api.mercadolibre.com/items/${itemId}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Erro ao atualizar produto: ${errorText}` },
        { status: response.status },
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na API route:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

// No arquivo route.ts - ATUALIZAR a função DELETE
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');
        
        if (!itemId) {
            return NextResponse.json(
                { error: 'ID do item é obrigatório' },
                { status: 400 }
            );
        }

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Token de acesso não fornecido' },
                { status: 401 }
            );
        }

        const accessToken = authHeader.replace('Bearer ', '');

        console.log(`🗑️ [API] Excluindo item ${itemId} do Mercado Livre`);

        // ✅ PRIMEIRO verificar se o produto existe e seu status
        try {
            const checkResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (checkResponse.status === 404) {
                console.log(`ℹ️ [API] Produto ${itemId} já não existe no ML`);
                return NextResponse.json({ 
                    success: true, 
                    message: 'Produto já não existe no Mercado Livre' 
                });
            }

            if (!checkResponse.ok) {
                const errorData = await checkResponse.json();
                console.log(`📊 [API] Status atual do produto:`, errorData);
            }
        } catch (checkError) {
            console.warn('⚠️ [API] Erro ao verificar produto:', checkError);
        }

        // Fazer a requisição DELETE
        const response = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        console.log(`📡 [API] Resposta do ML: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            // ✅ TRATAMENTO ESPECÍFICO PARA 404 - considerar sucesso
            if (response.status === 404) {
                console.log('ℹ️ [API] Produto já não existe no ML (404)');
                return NextResponse.json({ 
                    success: true, 
                    message: 'Produto já não existe no Mercado Livre' 
                });
            }

            let errorData;
            try {
                errorData = await response.json();
            } catch {
                errorData = await response.text();
            }
            
            console.error('❌ [API] Erro na API do Mercado Livre:', errorData);
            return NextResponse.json(
                { 
                    error: `Erro ao excluir produto: ${JSON.stringify(errorData)}` 
                },
                { status: response.status }
            );
        }

        console.log('✅ [API] Produto excluído com sucesso no ML');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('💥 [API] Erro ao excluir produto:', error);
        return NextResponse.json(
            { 
                error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
            },
            { status: 500 }
        );
    }
}
