// src/hooks/usePixelEvents.ts
import { useCallback } from 'react';
import { pixelManager, ProductData, PurchaseData } from '@/lib/pixel-manager';
import { useCarrinho } from './useCarrinho';

export function usePixelEvents() {
  const { carrinho, totalPreco, totalItens } = useCarrinho();

  // ViewContent - para página de produto
  const trackProductView = useCallback((product: any) => {
    const productData: ProductData = {
      id: product.id,
      name: product.titulo || product.name,
      category: product.categoria?.nome || product.category,
      brand: product.marca?.nome || product.brand,
      price: product.preco || product.price,
      currency: 'BRL',
    };
    pixelManager.trackViewContent(productData);
  }, []);

  // AddToCart - Versão melhorada com mais dados
  const trackAddToCart = useCallback((product: any, quantity: number = 1) => {
    const productData: ProductData = {
      id: product.id,
      name: product.titulo || product.name,
      category: product.categoria?.nome || product.category,
      brand: product.marca?.nome || product.brand,
      price: product.preco || product.price,
      currency: 'BRL',
      quantity: quantity,
      variant: product.variacao_selecionada || undefined,
    };
    
    // Log para debug
    console.log('[Pixel] Tracking AddToCart:', {
      product: productData,
      quantity
    });
    
    pixelManager.trackAddToCart(productData, quantity);
  }, []);

  // InitiateCheckout
  const trackInitiateCheckout = useCallback(() => {
    if (carrinho.length === 0) {
      console.warn('[Pixel] Carrinho vazio, não é possível rastrear InitiateCheckout');
      return;
    }
    
    const products = carrinho.map(item => ({
      id: item.produto_id,
      name: item.titulo,
      price: item.preco_unitario,
      quantity: item.quantidade,
    }));
    
    console.log('[Pixel] Tracking InitiateCheckout:', {
      products,
      total: totalPreco,
      items: totalItens
    });
    
    pixelManager.trackInitiateCheckout(products, totalPreco);
  }, [carrinho, totalPreco, totalItens]);

  // Purchase
  const trackPurchase = useCallback((data: {
    order_id: string;
    total: number;
    products: any[];
    payment_method?: string;
  }) => {
    const purchaseData: PurchaseData = {
      value: data.total,
      currency: 'BRL',
      transaction_id: data.order_id,
      order_id: data.order_id,
      payment_method: data.payment_method,
      contents: data.products.map(p => ({
        id: p.id || p.produto_id,
        name: p.titulo || p.name,
        price: p.preco || p.preco_unitario || p.price,
        quantity: p.quantidade || p.quantity || 1,
      })),
      content_type: 'product',
    };
    
    console.log('[Pixel] Tracking Purchase:', purchaseData);
    pixelManager.trackPurchase(purchaseData);
  }, []);

  // Search
  const trackSearch = useCallback((query: string, resultsCount?: number) => {
    pixelManager.trackSearch(query, resultsCount);
  }, []);

  // Registration
  const trackRegistration = useCallback((method: 'email' | 'google' | 'facebook' | 'whatsapp' | 'manual' = 'email') => {
    pixelManager.trackCompleteRegistration(method);
  }, []);

  // Lead
  const trackLead = useCallback((email: string, name?: string, phone?: string) => {
    pixelManager.trackLead(email, name, phone);
  }, []);

  // AddPaymentInfo
  const trackAddPaymentInfo = useCallback((orderId: string, total: number, paymentMethod: string) => {
    pixelManager.trackAddPaymentInfo(orderId, total, paymentMethod);
  }, []);

  return {
    trackProductView,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackSearch,
    trackRegistration,
    trackLead,
    trackAddPaymentInfo,
  };
}