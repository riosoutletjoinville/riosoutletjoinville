//src/app/checkout/erro/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function CheckoutErroContent() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-red-600 mb-2">Pagamento Não Aprovado</h2>
          <p className="text-gray-600 mb-6">
            Houve um problema com seu pagamento. Tente novamente ou entre em contato conosco.
          </p>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/checkout">
                Tentar Novamente
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Continuar Comprando
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}