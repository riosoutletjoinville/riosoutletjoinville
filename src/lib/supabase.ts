// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

// ÚNICA instância do Supabase
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

let supabaseAdminInstance: SupabaseClient | null = null

export const getSupabaseAdmin = (): SupabaseClient | null => {
  if (!supabaseServiceRoleKey) return null
  
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey)
  }
  
  return supabaseAdminInstance
}

// Para operações administrativas, use esta função
export const getAdminClient = (): SupabaseClient => {
  if (!supabaseServiceRoleKey) {
    throw new Error('Service role key não configurada')
  }
  
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey)
  }
  
  return supabaseAdminInstance
}

// Modifique as funções administrativas para usar getAdminClient()
export const listUsersAdmin = async () => {
  const adminClient = getAdminClient()
  const { data, error } = await adminClient.auth.admin.listUsers()
  if (error) throw error
  return data
}

export const createUserAdmin = async (email: string, password: string) => {
  const adminClient = getAdminClient()
  const { data, error } = await adminClient.auth.admin.createUser({
    email: email.trim(),
    password: password.trim(),
    email_confirm: true,
    user_metadata: {
      created_via: 'admin_dashboard',
    }
  })
  
  if (error) throw error
  return data
}

// NOVA FUNÇÃO: Verifica se o admin está disponível
export const hasAdminAccess = (): boolean => {
  return !!supabaseServiceRoleKey;
}

// Funções de upload/download de imagens (mantidas)
// src/lib/supabase.ts
export const uploadImage = async (file: File, produtoId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${produtoId}/${Math.random()}.${fileExt}`
  
  // USE O CLIENT ADMIN PARA BYPASS DO RLS
  const adminClient = getAdminClient()
  
  const { data, error } = await adminClient.storage
    .from('produtos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Erro no upload:', error)
    throw error
  }

  const { data: { publicUrl } } = adminClient.storage
    .from('produtos')
    .getPublicUrl(fileName)

  return publicUrl
}

export const deleteImage = async (imageUrl: string): Promise<void> => {
  const urlParts = imageUrl.split('/')
  const fileName = urlParts.slice(-2).join('/')
  
  // USE O CLIENT ADMIN PARA BYPASS DO RLS
  const adminClient = getAdminClient()
  
  const { error } = await adminClient.storage
    .from('produtos')
    .remove([fileName])
  
  if (error) {
    console.error('Erro ao deletar imagem:', error)
    throw error
  }
}