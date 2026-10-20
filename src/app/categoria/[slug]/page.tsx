// app/categoria/[slug]/page.tsx
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/template/header";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { CategoriaFilters } from "./CategoriasFilters";
import { CategorySkeleton } from "@/components/skeleton/CategorySkeleton"; // Importe o skeleton existente

// Importe o loading component que criamos
import CategoriaLoading from "./loading";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string; page?: string; cor?: string; tamanho?: string; minPrice?: string; maxPrice?: string; orderBy?: string; view?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: categoria } = await supabase
    .from("categorias")
    .select("nome, descricao")
    .eq("slug", slug)
    .eq("exibir_no_site", true)
    .single();

  if (!categoria) {
    return { title: "Categoria não encontrada" };
  }

  return {
    title: `${categoria.nome} - Rios Outlet`,
    description: categoria.descricao || `Confira nossos produtos na categoria ${categoria.nome}`,
  };
}

// Componente assíncrono para carregar os dados
async function CategoriaContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const search = await searchParams;
  
  const page = parseInt(search.page || "1");
  const limit = 12;
  const subCategoriaSlug = search.sub;
  const minPrice = search.minPrice ? parseFloat(search.minPrice) : undefined;
  const maxPrice = search.maxPrice ? parseFloat(search.maxPrice) : undefined;
  const orderBy = search.orderBy || "relevance";
  const selectedCores = search.cor ? search.cor.split(",") : [];
  const selectedTamanhos = search.tamanho ? search.tamanho.split(",") : [];

  // Buscar categoria principal
  const { data: categoria } = await supabase
    .from("categorias")
    .select(`
      *,
      subcategorias:categorias!categoria_pai_id(
        id,
        nome,
        slug,
        descricao
      )
    `)
    .eq("slug", slug)
    .eq("exibir_no_site", true)
    .single();

  if (!categoria) {
    notFound();
  }

  // Buscar subcategoria específica
  let subCategoria = null;
  if (subCategoriaSlug) {
    const { data } = await supabase
      .from("categorias")
      .select("id, nome, slug, descricao")
      .eq("slug", subCategoriaSlug)
      .eq("categoria_pai_id", categoria.id)
      .single();
    subCategoria = data;
  }

  // Definir os IDs das categorias a serem consideradas
  const categoriaIds = subCategoria 
    ? [subCategoria.id] 
    : [categoria.id, ...(categoria.subcategorias?.map((s: any) => s.id) || [])];

  // Buscar produtos com filtros
  let query = supabase
    .from("produtos")
    .select(`
      *,
      marca:marcas(nome),
      imagens:produto_imagens(*)
    `, { count: "exact" })
    .eq("ativo", true)
    .eq("visivel", true)
    .gt("estoque", 0)
    .in("categoria_id", categoriaIds);

  // Filtro por cores
  if (selectedCores.length > 0) {
    const { data: produtosComCores } = await supabase
      .from("produto_cores")
      .select("produto_id")
      .in("cor_id", selectedCores);
    
    const produtoIdsComCores = produtosComCores?.map(pc => pc.produto_id) || [];
    
    if (produtoIdsComCores.length > 0) {
      query = query.in("id", produtoIdsComCores);
    } else {
      query = query.in("id", []);
    }
  }

  // Filtro por tamanhos
  if (selectedTamanhos.length > 0) {
    const { data: produtosComTamanhos } = await supabase
      .from("produto_tamanhos")
      .select("produto_id")
      .in("tamanho_id", selectedTamanhos);
    
    const produtoIdsComTamanhos = produtosComTamanhos?.map(pt => pt.produto_id) || [];
    
    if (produtoIdsComTamanhos.length > 0) {
      query = query.in("id", produtoIdsComTamanhos);
    } else {
      query = query.in("id", []);
    }
  }

  // Filtro por preço
  if (minPrice !== undefined) {
    query = query.gte("preco", minPrice);
  }
  if (maxPrice !== undefined) {
    query = query.lte("preco", maxPrice);
  }

  // Ordenação
  if (orderBy === "price_asc") {
    query = query.order("preco", { ascending: true });
  } else if (orderBy === "price_desc") {
    query = query.order("preco", { ascending: false });
  } else if (orderBy === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  // Paginação
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data: produtos, count } = await query.range(from, to);

  // Calcular faixa de preço dos produtos para esta categoria
  const { data: priceRangeData } = await supabase
    .from("produtos")
    .select("preco")
    .eq("ativo", true)
    .eq("visivel", true)
    .gt("estoque", 0)
    .in("categoria_id", categoriaIds);

  const prices = priceRangeData?.map(p => p.preco) || [];
  const globalMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const globalMaxPrice = prices.length > 0 ? Math.max(...prices) : 1000;

  const totalPages = Math.ceil((count || 0) / limit);

  // Buscar cores disponíveis
  const { data: produtosDaCategoria } = await supabase
    .from("produtos")
    .select("id")
    .eq("ativo", true)
    .eq("visivel", true)
    .gt("estoque", 0)
    .in("categoria_id", categoriaIds);

  const produtosIds = produtosDaCategoria?.map(p => p.id) || [];

  let coresDisponiveis: Array<{ id: string; nome: string; codigo_hex?: string }> = [];
  if (produtosIds.length > 0) {
    const { data: coresComProdutos } = await supabase
      .from("produto_cores")
      .select(`
        cor_id,
        cores:id (id, nome, codigo_hex)
      `)
      .in("produto_id", produtosIds);

    const coresUnicas = new Map();
    coresComProdutos?.forEach(item => {
      const cor = item.cores as any;
      if (cor && !coresUnicas.has(cor.id)) {
        coresUnicas.set(cor.id, { 
          id: cor.id, 
          nome: cor.nome, 
          codigo_hex: cor.codigo_hex 
        });
      }
    });
    coresDisponiveis = Array.from(coresUnicas.values());
  }

  let tamanhosDisponiveis: Array<{ id: string; nome: string; tipo: string; ordem?: number }> = [];
  if (produtosIds.length > 0) {
    const { data: tamanhosComProdutos } = await supabase
      .from("produto_tamanhos")
      .select(`
        tamanho_id,
        tamanhos:id (id, nome, tipo, ordem)
      `)
      .in("produto_id", produtosIds);

    const tamanhosUnicos = new Map();
    tamanhosComProdutos?.forEach(item => {
      const tamanho = item.tamanhos as any;
      if (tamanho && !tamanhosUnicos.has(tamanho.id)) {
        tamanhosUnicos.set(tamanho.id, { 
          id: tamanho.id, 
          nome: tamanho.nome, 
          tipo: tamanho.tipo,
          ordem: tamanho.ordem 
        });
      }
    });
    tamanhosDisponiveis = Array.from(tamanhosUnicos.values()).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center text-sm text-gray-600">
              <Link href="/" className="hover:text-amber-600">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/categorias" className="hover:text-amber-600">Categorias</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium">{categoria.nome}</span>
              {subCategoria && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900">{subCategoria.nome}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header da Categoria */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {subCategoria ? subCategoria.nome : categoria.nome}
            </h1>
            <p className="text-gray-600 max-w-2xl">
              {subCategoria ? subCategoria.descricao : categoria.descricao}
            </p>

            {/* Subcategorias */}
            {!subCategoria && categoria.subcategorias?.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Subcategorias:</h2>
                <div className="flex flex-wrap gap-2">
                  {categoria.subcategorias.map((sub: any) => (
                    <Link
                      key={sub.id}
                      href={`/categoria/${categoria.slug}?sub=${sub.slug}`}
                      className="px-4 py-2 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-700 rounded-full text-sm transition-colors"
                    >
                      {sub.nome}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="container mx-auto px-4 py-8">
          {count !== undefined && (
            <div className="mb-4 text-sm text-gray-600">
              {count} produto{count !== 1 ? "s" : ""} encontrado{count !== 1 ? "s" : ""}
            </div>
          )}

          <Suspense fallback={<div className="text-center py-12">Carregando filtros...</div>}>
            <CategoriaFilters
              categoryId={categoria.id}
              subCategoryId={subCategoria?.id}
              globalMinPrice={globalMinPrice}
              globalMaxPrice={globalMaxPrice}
              currentMinPrice={minPrice}
              currentMaxPrice={maxPrice}
              currentOrderBy={orderBy}
              currentCores={selectedCores}
              currentTamanhos={selectedTamanhos}
              coresDisponiveis={coresDisponiveis}
              tamanhosDisponiveis={tamanhosDisponiveis}
            />
          </Suspense>

          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <CategorySkeleton key={i} />
              ))}
            </div>
          }>
            <ProductGrid
              products={produtos || []}
              showViewToggle={true}
            />
          </Suspense>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  const params = new URLSearchParams();
                  if (subCategoriaSlug) params.set("sub", subCategoriaSlug);
                  if (selectedCores.length) params.set("cor", selectedCores.join(","));
                  if (selectedTamanhos.length) params.set("tamanho", selectedTamanhos.join(","));
                  if (minPrice) params.set("minPrice", minPrice.toString());
                  if (maxPrice) params.set("maxPrice", maxPrice.toString());
                  if (orderBy !== "relevance") params.set("orderBy", orderBy);
                  params.set("page", pageNum.toString());
                  
                  return (
                    <Link
                      key={pageNum}
                      href={`/categoria/${categoria.slug}?${params.toString()}`}
                      className={`px-4 py-2 rounded-lg ${
                        page === pageNum
                          ? "bg-amber-600 text-white"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      } transition-colors`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <ScrollToTop />
    </div>
  );
}

// Componente principal com Suspense
export default async function CategoriaPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<CategoriaLoading />}>
      <CategoriaContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}