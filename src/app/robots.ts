// src/app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://riosoutlet.com.br'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/api/',
        '/login/',
        '/carrinho/',
        '/checkout/',
        '/minha-conta/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}