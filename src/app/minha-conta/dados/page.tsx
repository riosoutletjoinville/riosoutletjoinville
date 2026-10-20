// app/dashboard/cores/page.tsx
import { Suspense } from "react";
import DadosClientContent from "./DadoClienteContent";

export const dynamic = 'force-dynamic';

export default function DadosClientePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <DadosClientContent />
    </Suspense>
  );
}