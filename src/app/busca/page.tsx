// app/busca/page.tsx
export const dynamic = 'force-dynamic';
import { Suspense } from "react";
import SearchResults from "@/components/template/search/SearchResults";
import Header from "@/components/template/header";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

export const metadata = {
  title: "Busca - Rios Outlet",
  description: "Encontre os melhores produtos com os melhores preços",
};

export default function BuscaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Resultados da busca</h1>
          </div>
        </div>
        
        <Suspense fallback={
          <div className="container mx-auto px-4 py-12">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          </div>
        }>
          <SearchResults />
        </Suspense>
      </main>
      
      <ScrollToTop />
    </div>
  );
}