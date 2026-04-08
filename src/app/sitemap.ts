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
  
  // Rotas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
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
    // Produtos dinâmicos
    const { data: produtos } = await supabase
      .from('produtos')
      .select('slug, updated_at')
      .eq('ativo', true)
      .eq('visivel', true)
      .not('slug', 'is', null)
    
    const productRoutes: MetadataRoute.Sitemap = (produtos || []).map((produto: Produto) => ({
      url: `${baseUrl}/produto/${produto.slug}`,
      lastModified: new Date(produto.updated_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
    
    // Categorias dinâmicas
    const { data: categorias } = await supabase
      .from('categorias')
      .select('slug, updated_at')
      .eq('ativo', true)
    
    const categoryRoutes: MetadataRoute.Sitemap = (categorias || []).map((categoria: Categoria) => ({
      url: `${baseUrl}/categoria/${categoria.slug}`,
      lastModified: new Date(categoria.updated_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
    
    // Marcas dinâmicas
    const { data: marcas } = await supabase
      .from('marcas')
      .select('slug, updated_at')
      .eq('ativo', true)
    
    const brandRoutes: MetadataRoute.Sitemap = (marcas || []).map((marca: Marca) => ({
      url: `${baseUrl}/marca/${marca.slug}`,
      lastModified: new Date(marca.updated_at),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
    
    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...brandRoutes]
  } catch (error) {
    console.error('Erro ao gerar sitemap:', error)
    return staticRoutes
  }
}