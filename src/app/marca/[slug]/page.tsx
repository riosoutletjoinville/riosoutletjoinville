// app/marca/[slug]/page.tsx
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import SimpleHeader from "@/components/ui/SimpleHeader";
import { ProductGrid } from "@/components/ui/ProductGrid";
import { MarcaFilters } from "./MarcaFilters";
import { Suspense } from "react";

interface Marca {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ 
    page?: string; 
    cor?: string; 
    tamanho?: string; 
    minPrice?: string; 
    maxPrice?: string; 
    orderBy?: string;
    view?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: marca } = await supabase
    .from("marcas")
    .select("nome")
    .eq("slug", slug)
    .single();

  if (!marca) {
    return {
      title: "Marca não encontrada",
    };
  }

  return {
    title: `${marca.nome} - Rios Outlet`,
    description: `Produtos da marca ${marca.nome} com os melhores preços`,
  };
}

async function MarcaContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const search = await searchParams;
  
  const page = parseInt(search.page || "1");
  const limit = 12;
  const minPrice = search.minPrice ? parseFloat(search.minPrice) : undefined;
  const maxPrice = search.maxPrice ? parseFloat(search.maxPrice) : undefined;
  const orderBy = search.orderBy || "relevance";
  const selectedCores = search.cor ? search.cor.split(",") : [];
  const selectedTamanhos = search.tamanho ? search.tamanho.split(",") : [];

  // Buscar dados da marca
  const { data: marca, error: marcaError } = await supabase
    .from("marcas")
    .select("*")
    .eq("slug", slug)
    .single();

  if (marcaError || !marca) {
    notFound();
  }

  // Buscar produtos da marca com filtros
  let query = supabase
    .from("produtos")
    .select(
      `
      id,
      titulo,
      preco,
      preco_original,
      slug,
      imagens:produto_imagens(url, principal, ordem)
    `,
      { count: "exact" }
    )
    .eq("marca_id", marca.id)
    .eq("ativo", true)
    .eq("visivel", true)
    .gt("estoque", 0);

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

  // Calcular faixa de preço dos produtos desta marca
  const { data: priceRangeData } = await supabase
    .from("produtos")
    .select("preco")
    .eq("marca_id", marca.id)
    .eq("ativo", true)
    .eq("visivel", true)
    .gt("estoque", 0);

  const prices = priceRangeData?.map(p => p.preco) || [];
  const globalMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const globalMaxPrice = prices.length > 0 ? Math.max(...prices) : 1000;

  const totalPages = Math.ceil((count || 0) / limit);

  // Buscar cores disponíveis para esta marca
  const { data: produtosDaMarca } = await supabase
    .from("produtos")
    .select("id")
    .eq("marca_id", marca.id)
    .eq("ativo", true)
    .eq("visivel", true)
    .gt("estoque", 0);

  const produtosIds = produtosDaMarca?.map(p => p.id) || [];

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

  // Buscar tamanhos disponíveis para esta marca
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

  // Ordenar imagens por principal e ordem
  const produtosComImagem =
    produtos?.map((produto) => ({
      ...produto,
      imagens:
        produto.imagens?.sort((a, b) => {
          if (a.principal && !b.principal) return -1;
          if (!a.principal && b.principal) return 1;
          return (a.ordem || 0) - (b.ordem || 0);
        }) || [],
    })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader
        showBackButton={true}
        backUrl="/"
        showLogo={true}
        title={marca.nome}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link href="/" className="hover:text-amber-600">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{marca.nome}</span>
          </div>
        </div>
      </div>

      {/* Header da Marca */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {marca.logo_url ? (
              <div className="relative w-32 h-32 flex-shrink-0">
                <Image
                  src={marca.logo_url}
                  alt={marca.nome}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-4xl font-bold text-amber-700">
                  {marca.nome.charAt(0)}
                </span>
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {marca.nome}
              </h1>
              <p className="text-gray-600">
                {count || 0} {count === 1 ? "produto" : "produtos"} disponíveis
              </p>
            </div>
          </div>
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
          <MarcaFilters
            marcaId={marca.id}
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

        <ProductGrid
          products={produtosComImagem}
          showViewToggle={true}
        />

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const params = new URLSearchParams();
                if (selectedCores.length) params.set("cor", selectedCores.join(","));
                if (selectedTamanhos.length) params.set("tamanho", selectedTamanhos.join(","));
                if (minPrice) params.set("minPrice", minPrice.toString());
                if (maxPrice) params.set("maxPrice", maxPrice.toString());
                if (orderBy !== "relevance") params.set("orderBy", orderBy);
                params.set("page", pageNum.toString());
                
                return (
                  <Link
                    key={pageNum}
                    href={`/marca/${marca.slug}?${params.toString()}`}
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
      <ScrollToTop />
    </div>
  );
}

export default async function MarcaPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50">Carregando...</div>}>
      <MarcaContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}