// src/components/seo/StructuredData.tsx
"use client";

import { useEffect } from 'react';

interface ProductStructuredDataProps {
  product: {
    name: string;
    description: string;
    sku: string;
    price: number;
    currency?: string;
    availability?: string;
    image?: string;
    brand?: string;
    category?: string;
    url?: string;
    reviewCount?: number;
    ratingValue?: number;
  };
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      sku: product.sku,
      mpn: product.sku,
      
      ...(product.image && {
        image: product.image,
      }),
      
      ...(product.brand && {
        brand: {
          '@type': 'Brand',
          name: product.brand,
        },
      }),
      
      ...(product.category && {
        category: product.category,
      }),
      
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'BRL',
        availability: product.availability || 'https://schema.org/InStock',
        url: product.url || typeof window !== 'undefined' ? window.location.href : '',
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      
      ...(product.reviewCount && product.ratingValue && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.ratingValue,
          reviewCount: product.reviewCount,
        },
      }),
    };
    
    // Adicionar ao DOM
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, [product]);
  
  return null;
}

// Componente para dados da organização
export function OrganizationStructuredData() {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'Rios Outlet',
      description: 'A loja de calçados mais completa de Joinville',
      url: 'https://riosoutlet.com.br',
      logo: 'https://riosoutlet.com.br/logomarca.jpg',
      image: 'https://riosoutlet.com.br/logomarca.jpg',
      telephone: '+55 47 99999-9999',
      email: 'contato@riosoutlet.com.br',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Rua das Lojas, 123',
        addressLocality: 'Joinville',
        addressRegion: 'SC',
        postalCode: '89200-000',
        addressCountry: 'BR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '-26.3045',
        longitude: '-48.8487',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '18:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Saturday',
          opens: '09:00',
          closes: '13:00',
        },
      ],
      sameAs: [
        'https://www.facebook.com/riosoutlet',
        'https://www.instagram.com/riosoutlet',
      ],
      priceRange: '$$',
      paymentAccepted: 'Cartão de Crédito, Pix, Boleto',
      currenciesAccepted: 'BRL',
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  
  return null;
}

// Componente para breadcrumbs
export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, [items]);
  
  return null;
}