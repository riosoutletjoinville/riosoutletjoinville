// app/categorias/page.tsx (versão com grid estilizada)
import { supabase } from "@/lib/supabase";
import { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/template/header";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { CategoriasGrid } from "@/components/ui/CategoriasGrid";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Todas as Categorias - Rios Outlet",
  description: "Explore todas as categorias de produtos da Rios Outlet. Encontre calçados, roupas e acessórios com os melhores preços.",
};

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  subcategorias?: { id: string; nome: string; slug: string }[];
}

async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select(`
      id,
      nome,
      slug,
      descricao,
      subcategorias:categorias!categoria_pai_id(
        id,
        nome,
        slug
      )
    `)
    .is("categoria_pai_id", null)
    .eq("exibir_no_site", true)
    .order("nome");

  if (error) {
    console.error("Erro ao buscar categorias:", error);
    return [];
  }

  return data || [];
}

export default async function CategoriasContent() {
  const categorias = await getCategorias();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumb */}

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-5xl font-bold mb-4 animate-fade-in">
              Todas as Categorias
            </h1>
            <p className="text-xl max-w-2xl mx-auto opacity-90">
              Explore nossa variedade de produtos organizados por categorias. 
              Encontre o que você precisa com os melhores preços!
            </p>
          </div>
        </div>

        {/* Grid de Categorias Estilizado */}
        <div className="container mx-auto px-4 py-12">
          <Suspense fallback={
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            </div>
          }>
            <CategoriasGrid 
              categorias={categorias}
              variant="large"
              columns={4}
              showViewAll={true}
            />
          </Suspense>
        </div>

        {/* Seção com subcategorias em destaque (opcional) */}
        {categorias.some(c => c.subcategorias && c.subcategorias.length > 0) && (
          <div className="bg-gray-50 border-t border-gray-100 py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Subcategorias em Destaque
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categorias
                  .filter(c => c.subcategorias && c.subcategorias.length > 0)
                  .slice(0, 8)
                  .map(categoria => (
                    <div key={categoria.id} className="bg-white rounded-xl shadow-sm p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{categoria.nome}</h3>
                      <div className="flex flex-wrap gap-2">
                        {categoria.subcategorias?.slice(0, 3).map(sub => (
                          <Link
                            key={sub.id}
                            href={`/categoria/${categoria.slug}?sub=${sub.slug}`}
                            className="text-xs px-2 py-1 bg-gray-100 hover:bg-amber-100 text-gray-600 hover:text-amber-700 rounded transition-colors"
                          >
                            {sub.nome}
                          </Link>
                        ))}
                        {categoria.subcategorias && categoria.subcategorias.length > 3 && (
                          <Link
                            href={`/categoria/${categoria.slug}`}
                            className="text-xs px-2 py-1 text-amber-600 hover:text-amber-800"
                          >
                            +{categoria.subcategorias.length - 3}
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>      
      <ScrollToTop />
    </div>
  );
}