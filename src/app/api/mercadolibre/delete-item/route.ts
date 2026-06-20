// src/app/api/mercadolibre/delete-item/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get('itemId');
        
        if (!itemId) {
            return NextResponse.json({ error: 'ID do item é obrigatório' }, { status: 400 });
        }

        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
        }

        const accessToken = authHeader.replace('Bearer ', '');

        console.log(`🗑️ [API] Excluindo item ${itemId}`);

        // ✅ PASSO 1: Verificar status atual
        const checkResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!checkResponse.ok) {
            if (checkResponse.status === 404) {
                return NextResponse.json({ 
                    success: true, 
                    message: 'Produto já não existe no Mercado Livre' 
                });
            }
            const errorBody = await checkResponse.text();
            return NextResponse.json({ 
                error: `Erro ao verificar produto: ${checkResponse.status} - ${errorBody}` 
            }, { status: checkResponse.status });
        }

        const productData = await checkResponse.json();
        console.log(`📊 [API] Status atual: ${productData.status}`);

        let needsClosing = false;

        // ✅ DEFINIR ESTRATÉGIA
        if (productData.status === "closed") {
            console.log("✅ [API] Produto já FECHADO, marcando como DELETADO");
        } else if (productData.status === "active" || productData.status === "paused") {
            console.log("🔄 [API] Produto ATIVO/PAUSADO, fechando primeiro");
            needsClosing = true;
        } else {
            return NextResponse.json({ 
                error: `Não é possível excluir produto com status "${productData.status}"` 
            }, { status: 400 });
        }

        // ✅ PASSO 2: Fechar se necessário
        if (needsClosing) {
            console.log("🔄 [API] Fechando anúncio...");
            const closeResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: "closed" }),
            });

            if (!closeResponse.ok) {
                const errorBody = await closeResponse.text();
                return NextResponse.json({ 
                    error: `Erro ao fechar anúncio: ${closeResponse.status} - ${errorBody}` 
                }, { status: closeResponse.status });
            }

            console.log("⏳ [API] Aguardando 2 segundos...");
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // ✅ PASSO 3: Marcar como deletado
        console.log("🗑️ [API] Marcando como DELETADO...");
        const deleteResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deleted: "true" }),
        });

        if (!deleteResponse.ok) {
            const errorBody = await deleteResponse.text();
            return NextResponse.json({ 
                error: `Erro ao excluir: ${deleteResponse.status} - ${errorBody}` 
            }, { status: deleteResponse.status });
        }

        console.log('✅ [API] Produto excluído com sucesso');
        return NextResponse.json({ 
            success: true,
            message: 'Produto excluído com sucesso do Mercado Livre' 
        });
        
    } catch (error) {
        console.error('💥 [API] Erro ao excluir produto:', error);
        return NextResponse.json({ 
            error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
        }, { status: 500 });
    }
}