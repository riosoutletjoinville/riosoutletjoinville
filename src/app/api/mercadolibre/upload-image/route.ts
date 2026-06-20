//src/app/api/mercadolibre/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const accessToken = authHeader.substring(7);
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL da imagem não fornecida' }, { status: 400 });
    }

    console.log('Fazendo upload da imagem via URL:', imageUrl);

    // ✅✅✅ FORMATO CORRETO PARA A API ATUAL DO MERCADO LIVRE
    const uploadData = {
      "source": imageUrl,  // ✅ APENAS 'source' com a URL
    };

    const response = await fetch('https://api.mercadolibre.com/pictures', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadData), // ✅ Formato correto
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro no upload para ML:', errorText);
      return NextResponse.json({ 
        error: 'Erro no upload do ML',
        details: errorText 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro interno no upload:', error);
    return NextResponse.json({ 
      error: 'Erro interno no servidor'
    }, { status: 500 });
  }
}