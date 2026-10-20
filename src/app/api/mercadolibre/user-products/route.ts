// src/app/api/mercadolibre/user-products/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API Route] Iniciando busca de produtos do ML...');

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [API Route] Token não encontrado no header');
      return NextResponse.json({ 
        error: 'Token de acesso não fornecido',
        details: 'O header Authorization está ausente ou mal formatado.'
      }, { status: 401 });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    
    console.log('✅ [API Route] Token recebido via header:', accessToken.substring(0, 20) + '...');

    // Validar token
    console.log('👤 [API Route] Validando token com /users/me...');
    const userResponse = await fetch('https://api.mercadolibre.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ [API Route] Erro ao validar token:', userResponse.status, errorText);
      
      if (userResponse.status === 401) {
        return NextResponse.json({ 
          error: 'Token do Mercado Livre inválido ou expirado. Reconecte sua conta.',
          details: errorText
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: 'Erro ao validar token com o Mercado Livre',
        details: errorText
      }, { status: userResponse.status });
    }

    const userData = await userResponse.json();
    const userId = userData.id;
    
    console.log('✅ [API Route] User ID encontrado:', userId);
    console.log('👤 [API Route] Usuário:', userData.nickname);

    // Buscar produtos
    console.log('🌐 [API Route] Buscando produtos do usuário...');
    const productsUrl = `https://api.mercadolibre.com/users/${userId}/items/search`;
    
    const response = await fetch(productsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API Route] Erro na API do ML:', {
        status: response.status,
        statusText: response.statusText,
        errorDetails: errorText,
        url: productsUrl
      });
      
      return NextResponse.json({ 
        error: `Erro ao buscar produtos do ML: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('✅ [API Route] Produtos encontrados (IDs):', data.results?.length || 0);
    
    if (!data.results || data.results.length === 0) {
      console.log('ℹ️ [API Route] Nenhum produto encontrado no ML');
      return NextResponse.json([]);
    }
    
    // Buscar detalhes (limitado a 20 para performance)
    const products = [];
    const productIds = data.results.slice(0, 20);
    
    console.log(`🔍 [API Route] Buscando detalhes de ${productIds.length} produtos...`);
    
    for (const itemId of productIds) {
      try {
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
        }
      } catch (error) {
        console.error(`❌ [API Route] Erro ao buscar detalhes do produto ${itemId}:`, error);
      }
    }

    console.log(`✅ [API Route] Retornando ${products.length} produtos detalhados`);
    return NextResponse.json(products);

  } catch (error: unknown) {
    console.error('💥 [API Route] Erro interno:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}