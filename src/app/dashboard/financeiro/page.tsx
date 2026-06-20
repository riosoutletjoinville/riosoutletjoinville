// app/dashboard/financeiro/page.tsx
import { Suspense } from "react";
import FinanceiroContent from "./FinanceiroContent";

export const dynamic = 'force-dynamic'; // ← Agora funciona (Server Component)

export default function FinanceiroPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <FinanceiroContent />
    </Suspense>
  );
}