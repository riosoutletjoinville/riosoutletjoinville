// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Ignorar recursos estáticos e RSC (otimizado)
  if (
    pathname.includes('_next') || 
    pathname.includes('favicon.ico') || 
    pathname.includes('_rsc') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.svg') ||
    pathname.includes('.webp')
  ) {
    return NextResponse.next()
  }
  
  // Isso evita processamento desnecessário
  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isLoginRoute = pathname === '/login'
  
  // Se não for rota que precisa de autenticação, retorna imediatamente
  if (!isDashboardRoute && !isLoginRoute) {
    return NextResponse.next()
  }
  
  // Criar cliente Supabase apenas quando necessário
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          // Otimizar: só definir cookie se realmente necessário
          if (value && value.length > 0) {
            response.cookies.set({ name, value, ...options })
          }
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  try {
    // Verificar sessão
    const { data: { session } } = await supabase.auth.getSession()
    const isAuthenticated = !!session
    
    // 1. Se está autenticado e tenta acessar login, redireciona para dashboard
    if (isAuthenticated && isLoginRoute) {
      const url = new URL('/dashboard', req.url)
      return NextResponse.redirect(url)
    }
    
    // 2. Se NÃO está autenticado e tenta acessar dashboard, redireciona para login
    if (!isAuthenticated && isDashboardRoute) {
      const url = new URL('/login', req.url)
      return NextResponse.redirect(url)
    }
    
  } catch (error) {
    console.error('Erro ao verificar sessão:', error)
    // Em caso de erro, redirecionar para login em rotas protegidas
    if (isDashboardRoute) {
      const url = new URL('/login', req.url)
      return NextResponse.redirect(url)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)'
  ]
}