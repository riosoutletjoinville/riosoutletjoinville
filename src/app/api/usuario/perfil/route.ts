// src/app/api/usuario/perfil/route.ts
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    // Buscar na tabela usuarios
    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (perfilError) {
      console.error('Erro ao buscar perfil:', perfilError)
      return NextResponse.json({ error: perfilError.message }, { status: 500 })
    }
    
    // Se não encontrou perfil, retorna dados básicos
    if (!perfil) {
      return NextResponse.json({
        perfil: {
          id: user.id,
          email: user.email,
          nome: user.email?.split('@')[0] || 'Usuário',
          tipo: 'usuario',
          ativo: true,
          local_trabalho: '',
          phone: ''
        }
      })
    }
    
    return NextResponse.json({ perfil })
  } catch (error) {
    console.error('Erro na API de perfil:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}