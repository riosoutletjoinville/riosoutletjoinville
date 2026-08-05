// src/app/api/image-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_STORAGE_URL = 'https://oithqkjlvdgwlaumcibf.supabase.co/storage/v1/object/public/produtos';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get('path');
  
  if (!path) {
    return new NextResponse('Missing path parameter', { status: 400 });
  }

  try {
    // Decodifica o path (já que pode vir encoded)
    const decodedPath = decodeURIComponent(path);
    
    // Remove qualquer tentativa de path traversal
    const safePath = decodedPath.replace(/\.\./g, '');
    
    // Constrói a URL original do Supabase
    let originalUrl: string;
    
    // Se já for URL completa, extrai o caminho
    if (safePath.startsWith('http')) {
      const match = safePath.match(/\/produtos\/(.+)$/);
      if (match && match[1]) {
        originalUrl = `${SUPABASE_STORAGE_URL}/${match[1]}`;
      } else {
        originalUrl = safePath;
      }
    } else {
      originalUrl = `${SUPABASE_STORAGE_URL}/${safePath}`;
    }

    // Faz o fetch da imagem
    const response = await fetch(originalUrl, {
      headers: {
        // Preserva headers necessários
        'User-Agent': 'RiosOutlet-ImageProxy/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Image proxy error: ${response.status} for ${originalUrl}`);
      // Retorna uma imagem placeholder 1x1 transparente em vez de erro
      const placeholderSvg = `<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg"/>`;
      return new NextResponse(placeholderSvg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Obtém o buffer da imagem
    const imageBuffer = await response.arrayBuffer();
    
    // Determina o content-type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Cache agressivo - 1 ano para URLs estáveis
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Vercel-CDN-Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    // Retorna placeholder em caso de erro
    const placeholderSvg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="12">Erro</text></svg>`;
    return new NextResponse(placeholderSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}