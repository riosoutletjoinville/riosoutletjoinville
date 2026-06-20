// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Produto {
  slug: string
  updated_at: string
}

interface Categoria {
  slug: string
  updated_at: string
}

interface Marca {
  slug: string
  updated_at: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://riosoutlet.com.br'
  
  // Rotas estáticas - garantir URLs sem barras duplicadas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/produtos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/marcas`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categorias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]
  
  try {
    // Produtos dinâmicos - filtrar slugs inválidos
    const { data: produtos } = await supabase
      .from('produtos')
      .select('slug, updated_at')
      .eq('ativo', true)
      .eq('visivel', true)
      .not('slug', 'is', null)
      .neq('slug', '') // Evitar slugs vazios
      .limit(10000) // Limitar para performance
    
    const productRoutes: MetadataRoute.Sitemap = (produtos || [])
      .filter((produto: Produto) => produto.slug && produto.slug.trim().length > 0)
      .map((produto: Produto) => ({
        url: `${baseUrl}/produto/${encodeURIComponent(produto.slug)}`,
        lastModified: new Date(produto.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    
    // Categorias dinâmicas
    const { data: categorias } = await supabase
      .from('categorias')
      .select('slug, updated_at')
      .eq('ativo', true)
      .not('slug', 'is', null)
      .neq('slug', '')
    
    const categoryRoutes: MetadataRoute.Sitemap = (categorias || [])
      .filter((categoria: Categoria) => categoria.slug && categoria.slug.trim().length > 0)
      .map((categoria: Categoria) => ({
        url: `${baseUrl}/categoria/${encodeURIComponent(categoria.slug)}`,
        lastModified: new Date(categoria.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    
    // Marcas dinâmicas
    const { data: marcas } = await supabase
      .from('marcas')
      .select('slug, updated_at')
      .eq('ativo', true)
      .not('slug', 'is', null)
      .neq('slug', '')
    
    const brandRoutes: MetadataRoute.Sitemap = (marcas || [])
      .filter((marca: Marca) => marca.slug && marca.slug.trim().length > 0)
      .map((marca: Marca) => ({
        url: `${baseUrl}/marca/${encodeURIComponent(marca.slug)}`,
        lastModified: new Date(marca.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    
    const allRoutes = [...staticRoutes, ...productRoutes, ...categoryRoutes, ...brandRoutes]
    
    // Log para debug - quantas URLs foram geradas
    console.log(`Sitemap gerado com ${allRoutes.length} URLs`)
    
    return allRoutes
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error)
    return staticRoutes
  }
}