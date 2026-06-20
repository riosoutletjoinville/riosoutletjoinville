// src/app/api/mercadolibre/user-products/route.ts - CORRIGIDO
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API Route] Iniciando busca de produtos do ML...');

    // ✅ VERIFICAR se o token está no header da requisição
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [API Route] Token não encontrado no header');
      return NextResponse.json({ error: 'Token de acesso não fornecido' }, { status: 401 });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    
    console.log('✅ [API Route] Token recebido via header:', accessToken.substring(0, 20) + '...');

    // ✅ PRIMEIRO: Buscar o user_id do usuário autenticado
    console.log('👤 [API Route] Buscando informações do usuário...');
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ [API Route] Erro ao buscar usuário:', userResponse.status, errorText);
      return NextResponse.json({ error: 'Erro ao buscar informações do usuário' }, { status: userResponse.status });
    }

    const userData = await userResponse.json();
    const userId = userData.id;
    
    console.log('✅ [API Route] User ID encontrado:', userId);
    console.log('👤 [API Route] Usuário:', userData.nickname);

    // ✅ SEGUNDO: Buscar produtos usando o user_id correto
    console.log('🌐 [API Route] Buscando produtos do usuário...');
    const productsUrl = `https://api.mercadolibre.com/users/${userId}/items/search`;
    console.log('📋 [API Route] URL dos produtos:', productsUrl);
    
    const response = await fetch(productsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 [API Route] Resposta do ML recebida - Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API Route] Erro na API do ML:', {
        status: response.status,
        statusText: response.statusText,
        errorDetails: errorText,
        url: productsUrl
      });
      
      if (response.status === 401) {
        return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 });
      }
      
      return NextResponse.json(
        { error: `Erro ao buscar produtos do ML: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [API Route] Produtos encontrados (IDs):', data.results);
    
    // ✅ Se não há produtos, retornar array vazio
    if (!data.results || data.results.length === 0) {
      console.log('ℹ️ [API Route] Nenhum produto encontrado no ML');
      return NextResponse.json([]);
    }
    
    // ✅ Buscar detalhes dos produtos (limitar para não sobrecarregar)
    const products = [];
    const productIds = data.results.slice(0, 20);
    
    console.log(`🔍 [API Route] Buscando detalhes de ${productIds.length} produtos...`);
    
    for (const itemId of productIds) {
      try {
        console.log(`📦 [API Route] Buscando detalhes do produto ${itemId}...`);
        const itemResponse = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        if (itemResponse.ok) {
          const itemData = await itemResponse.json();
          products.push({
            id: itemData.id,
            title: itemData.title,
            price: itemData.price,
            available_quantity: itemData.available_quantity,
            status: itemData.status,
            thumbnail: itemData.thumbnail,
            listing_type_id: itemData.listing_type_id,
            permalink: itemData.permalink
          });
          console.log(`✅ [API Route] Produto ${itemId} adicionado`);
        } else {
          console.warn(`⚠️ [API Route] Erro ao buscar produto ${itemId}:`, itemResponse.status);
        }
      } catch (error) {
        console.error(`❌ [API Route] Erro ao buscar detalhes do produto ${itemId}:`, error);
      }
    }

    console.log(`✅ [API Route] Retornando ${products.length} produtos detalhados`);
    return NextResponse.json(products);

  } catch (error: unknown) {
    console.error('💥 [API Route] Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}