// src/lib/pixel-manager.ts
declare global {
  interface Window {
    fbq: any;
  }
}

export type PixelEventType =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Search'
  | 'CompleteRegistration'
  | 'Lead'
  | 'Contact';

export interface PixelEventData {
  [key: string]: any;
}

export interface ProductData {
  id: string;
  name: string;
  category?: string;
  brand?: string;
  price: number;
  currency?: string;
  quantity?: number;
  variant?: string;
  position?: number;
}

export interface PurchaseData {
  value: number;
  currency: string;
  transaction_id?: string;
  contents: ProductData[];
  content_type: 'product' | 'product_group';
  order_id?: string;
  payment_method?: string;
}

export interface CheckoutData {
  value: number;
  currency: string;
  contents: ProductData[];
  content_type: 'product' | 'product_group';
  num_items?: number;
  step?: 1 | 2 | 3;
}

class PixelManager {
  private pixelId: string | null = null;
  private isInitialized = false;
  private debugMode = false;
  private retryCount = 0;
  private maxRetries = 5;

  constructor() {
    this.pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || null;
    this.debugMode = process.env.NODE_ENV === 'development';
  }

  private getPixelId(): string {
    if (!this.pixelId) {
      console.warn('Facebook Pixel ID não configurado');
      return '';
    }
    return this.pixelId;
  }

  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
  }

  private waitForFbq(callback: () => void, retries: number = 0) {
    if (this.isAvailable()) {
      callback();
      return;
    }

    if (retries >= this.maxRetries) {
      console.warn('[Pixel] fbq não disponível após múltiplas tentativas');
      return;
    }

    setTimeout(() => {
      this.waitForFbq(callback, retries + 1);
    }, 300);
  }

  private trackEvent(eventName: PixelEventType, data?: PixelEventData): void {
    const pixelId = this.getPixelId();
    if (!pixelId) return;

    this.waitForFbq(() => {
      try {
        window.fbq('track', eventName, data);
        if (this.debugMode) {
          console.log(`[Pixel] Evento enviado: ${eventName}`, data);
        }
      } catch (error) {
        console.error(`Erro ao enviar evento ${eventName}:`, error);
      }
    });
  }

  // ============ EVENTOS ============

  trackPageView(data?: { content_name?: string; content_category?: string }) {
    this.trackEvent('PageView', data);
  }

  trackViewContent(product: ProductData) {
    this.trackEvent('ViewContent', {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      content_brand: product.brand,
      value: product.price,
      currency: product.currency || 'BRL',
    });
  }

  trackAddToCart(product: ProductData, quantity: number = 1) {
    this.trackEvent('AddToCart', {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      content_brand: product.brand,
      value: product.price * quantity,
      currency: product.currency || 'BRL',
      quantity: quantity,
    });
  }

  trackAddToWishlist(product: ProductData) {
    this.trackEvent('AddToWishlist', {
      content_type: 'product',
      content_ids: [product.id],
      content_name: product.name,
      content_category: product.category,
      content_brand: product.brand,
      value: product.price,
      currency: product.currency || 'BRL',
    });
  }

  trackInitiateCheckout(products: ProductData[], total: number) {
    this.trackEvent('InitiateCheckout', {
      content_type: 'product',
      content_ids: products.map(p => p.id),
      contents: products.map(p => ({
        id: p.id,
        quantity: p.quantity || 1,
        item_price: p.price,
      })),
      value: total,
      currency: 'BRL',
      num_items: products.reduce((acc, p) => acc + (p.quantity || 1), 0),
    });
  }

  trackAddPaymentInfo(orderId: string, total: number, paymentMethod: string) {
    this.trackEvent('AddPaymentInfo', {
      transaction_id: orderId,
      value: total,
      currency: 'BRL',
      payment_method: paymentMethod,
    });
  }

  trackPurchase(data: PurchaseData) {
    this.trackEvent('Purchase', {
      value: data.value,
      currency: data.currency || 'BRL',
      transaction_id: data.transaction_id || data.order_id,
      content_type: data.content_type || 'product',
      content_ids: data.contents.map(p => p.id),
      contents: data.contents.map(p => ({
        id: p.id,
        quantity: p.quantity || 1,
        item_price: p.price,
      })),
      num_items: data.contents.reduce((acc, p) => acc + (p.quantity || 1), 0),
    });
  }

  trackSearch(query: string, resultsCount?: number) {
    this.trackEvent('Search', {
      search_string: query,
      content_category: 'search_results',
      num_results: resultsCount,
    });
  }

  trackCompleteRegistration(method: 'email' | 'google' | 'facebook' | 'whatsapp' | 'manual') {
    this.trackEvent('CompleteRegistration', {
      content_name: 'Cadastro de Cliente',
      status: 'success',
      method: method,
    });
  }

  trackLead(email: string, name?: string, phone?: string) {
    this.trackEvent('Lead', {
      content_name: 'Lead Capturado',
      email: email,
      name: name,
      phone: phone,
    });
  }

  trackContact(method: 'whatsapp' | 'email' | 'phone' | 'form', contactInfo?: any) {
    this.trackEvent('Contact', {
      content_name: 'Contato via ' + method,
      method: method,
      ...contactInfo,
    });
  }

  trackCustom(eventName: string, data?: PixelEventData) {
    this.waitForFbq(() => {
      if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq('trackCustom', eventName, data);
        if (this.debugMode) {
          console.log(`[Pixel] Custom Event: ${eventName}`, data);
        }
      }
    });
  }
}

// Singleton
export const pixelManager = new PixelManager();

// Hook para usar no React
export function usePixel() {
  return pixelManager;
}