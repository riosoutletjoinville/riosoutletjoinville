// src/components/checkout/CheckoutFormSkeleton.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CheckoutFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="h-7 bg-gray-200 rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Resumo skeleton */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
              <div className="border-t pt-2">
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse ml-auto"></div>
              </div>
            </div>

            {/* Opções skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-3 p-4 border rounded-lg">
                  <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse mt-1"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão skeleton */}
            <div className="h-12 bg-gray-200 rounded-lg animate-pulse mt-6"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}