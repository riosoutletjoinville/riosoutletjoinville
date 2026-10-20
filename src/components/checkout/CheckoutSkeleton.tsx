// src/components/checkout/CheckoutSkeleton.tsx
import { Card, CardContent } from "@/components/ui/card";

export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              {/* Header Skeleton */}
              <div className="mb-6">
                <div className="h-8 bg-gray-200 rounded-lg w-48 mb-4 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
              </div>

              {/* Form Skeleton */}
              <div className="space-y-4">
                {/* Campos de identificação */}
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Campos de endereço */}
                <div className="space-y-3 mt-4">
                  <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Resumo do pedido */}
                <div className="border-t pt-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Botão skeleton */}
                <div className="mt-6">
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}