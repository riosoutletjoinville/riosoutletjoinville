// src/app/sessao/[slug]/page.tsx - CORRIGIDO
"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { Filter, X } from "lucide-react";
import FiltroLateral from "@/components/ui/FiltroLateral";
import ProductImage from "@/components/ui/ProductImage";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import SimpleHeader from "@/components/ui/SimpleHeader";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ProdutoSessao {
  id: string;
  produto_id: string;
  ordem: number;
  produto: {
    id: string;
    titulo: string;
    preco: number;
    preco_original?: number;
    preco_prod: number;
    descricao?: string;
    slug?: string;
    imagens: Array<{
      url: string;
      principal: boolean;
    }>;
    categoria: {
      nome: string;
      id: string;
    } | null;
    marca: {
      nome: string;
      id: string;
    } | null;
    genero: {
      nome: string;
      id: string;
    } | null;
  };
}

interface SessaoEspecial {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  cor_fundo: string;
  cor_texto: string;
}

interface FiltrosAplicados {
  categorias: string[];
  tamanhos: string[];
  cores: string[];
  marcas: string[];
  generos: string[];
  precoMin: number;
  precoMax: number;
}

export default function SessaoPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [sessao, setSessao] = useState<SessaoEspecial | null>(null);
  const [produtos, setProdutos] = useState<ProdutoSessao[]>([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState<ProdutoSessao[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosAplicados>({
    categorias: [],
    tamanhos: [],
    cores: [],
    marcas: [],
    generos: [],
    precoMin: 0,
    precoMax: 1000,
  });

  const loadSessaoEDados = useCallback(async () => {
    try {
      // Carrega dados da sessão
      const { data: sessaoData, error: sessaoError } = await supabase
        .from("sessoes_especiais")
        .select("*")
        .eq("slug", slug)
        .eq("ativo", true)
        .single();

      if (sessaoError) throw sessaoError;
      if (!sessaoData) {
        setLoading(false);
        return;
      }

      setSessao(sessaoData);

      // Carrega produtos da sessão
      const { data: produtoSessoes, error: produtosError } = await supabase
        .from("produto_sessoes")
        .select(
          `
          id,
          produto_id,
          ordem,
          produto:produtos(
            id,
            titulo,
            preco,
            preco_original,
            preco_prod,
            descricao,
            slug,
            visivel,
            ativo,
            categoria:categorias(id, nome),
            marca:marcas(id, nome),
            genero:generos(id, nome),
            imagens:produto_imagens(*)
          )
        `,
        )
        .eq("sessao_id", sessaoData.id)
        .eq("produto.visivel", true)
        .eq("produto.ativo", true)
        .order("ordem", { ascending: true });

      if (produtosError) throw produtosError;

      if (produtoSessoes && produtoSessoes.length > 0) {
        const produtosFormatados: ProdutoSessao[] = produtoSessoes
          .map((item: any) => {
            // O produto pode vir como array ou objeto, dependendo da estrutura
            let produtoData = item.produto;

            // Se for array, pega o primeiro item
            if (Array.isArray(produtoData) && produtoData.length > 0) {
              produtoData = produtoData[0];
            }

            // Se não tiver produto, retorna null para filtrar depois
            if (!produtoData) return null;

            // Processa categoria
            let categoria = null;
            if (produtoData.categoria) {
              if (
                Array.isArray(produtoData.categoria) &&
                produtoData.categoria.length > 0
              ) {
                categoria = {
                  id: String(produtoData.categoria[0].id),
                  nome: String(produtoData.categoria[0].nome),
                };
              } else if (!Array.isArray(produtoData.categoria)) {
                categoria = {
                  id: String(produtoData.categoria.id),
                  nome: String(produtoData.categoria.nome),
                };
              }
            }

            // Processa marca
            let marca = null;
            if (produtoData.marca) {
              if (
                Array.isArray(produtoData.marca) &&
                produtoData.marca.length > 0
              ) {
                marca = {
                  id: String(produtoData.marca[0].id),
                  nome: String(produtoData.marca[0].nome),
                };
              } else if (!Array.isArray(produtoData.marca)) {
                marca = {
                  id: String(produtoData.marca.id),
                  nome: String(produtoData.marca.nome),
                };
              }
            }

            // Processa gênero
            let genero = null;
            if (produtoData.genero) {
              if (
                Array.isArray(produtoData.genero) &&
                produtoData.genero.length > 0
              ) {
                genero = {
                  id: String(produtoData.genero[0].id),
                  nome: String(produtoData.genero[0].nome),
                };
              } else if (!Array.isArray(produtoData.genero)) {
                genero = {
                  id: String(produtoData.genero.id),
                  nome: String(produtoData.genero.nome),
                };
              }
            }

            // Processa imagens
            let imagens: Array<{ url: string; principal: boolean }> = [];
            if (produtoData.imagens) {
              const imagensData = Array.isArray(produtoData.imagens)
                ? produtoData.imagens
                : [produtoData.imagens];

              imagens = imagensData.map((img: any) => ({
                url: String(img.url),
                principal: Boolean(img.principal),
              }));
            }

            return {
              id: String(item.id),
              produto_id: String(item.produto_id),
              ordem: Number(item.ordem),
              produto: {
                id: String(produtoData.id),
                titulo: String(produtoData.titulo),
                preco: Number(produtoData.preco),
                preco_original: produtoData.preco_original
                  ? Number(produtoData.preco_original)
                  : undefined,
                preco_prod: Number(produtoData.preco_prod),
                descricao: produtoData.descricao
                  ? String(produtoData.descricao)
                  : undefined,
                slug: produtoData.slug,
                imagens,
                categoria,
                marca,
                genero,
              },
            };
          })
          .filter((item) => item !== null); // Remove itens nulos

        setProdutos(produtosFormatados);
        setProdutosFiltrados(produtosFormatados);

        // Calcular preço máximo
        if (produtosFormatados.length > 0) {
          const precos = produtosFormatados.map((p) => p.produto.preco_prod);
          const maxPreco = Math.max(...precos);
          setFiltros((prev) => ({ ...prev, precoMax: maxPreco }));
        }
      } else {
        setProdutos([]);
        setProdutosFiltrados([]);
      }
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Aplicar filtros
  useEffect(() => {
    if (produtos.length === 0) return;

    let produtosFiltrados = produtos;

    // Filtro por preço
    produtosFiltrados = produtosFiltrados.filter(
      (produtoSessao) =>
        produtoSessao.produto.preco_prod >= filtros.precoMin &&
        produtoSessao.produto.preco_prod <= filtros.precoMax,
    );

    // Filtro por categorias
    if (filtros.categorias.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(
        (produtoSessao) =>
          produtoSessao.produto.categoria &&
          filtros.categorias.includes(produtoSessao.produto.categoria.id),
      );
    }

    // Filtro por marcas
    if (filtros.marcas.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(
        (produtoSessao) =>
          produtoSessao.produto.marca &&
          filtros.marcas.includes(produtoSessao.produto.marca.id),
      );
    }

    // Filtro por gêneros
    if (filtros.generos.length > 0) {
      produtosFiltrados = produtosFiltrados.filter(
        (produtoSessao) =>
          produtoSessao.produto.genero &&
          filtros.generos.includes(produtoSessao.produto.genero.id),
      );
    }

    setProdutosFiltrados(produtosFiltrados);
  }, [filtros, produtos]);

  const handleFiltrosChange = useCallback((novosFiltros: FiltrosAplicados) => {
    setFiltros(novosFiltros);
  }, []);

  const limparFiltros = () => {
    setFiltros({
      categorias: [],
      tamanhos: [],
      cores: [],
      marcas: [],
      generos: [],
      precoMin: 0,
      precoMax: filtros.precoMax,
    });
  };

  useEffect(() => {
    if (slug) {
      loadSessaoEDados();
    }
  }, [slug, loadSessaoEDados]);

  // Adicione um console.log para debug (remova depois)
  useEffect(() => {
    if (produtos.length > 0) {
      console.log("Primeiro produto:", produtos[0]);
      console.log("Marca:", produtos[0].produto.marca);
      console.log("Categoria:", produtos[0].produto.categoria);
      console.log("Gênero:", produtos[0].produto.genero);
    }
  }, [produtos]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sessao) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Sessão não encontrada
          </h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SimpleHeader
        showBackButton={true}
        backUrl="/"
        showLogo={true}
        title={sessao.nome}
      />
      <div className="min-h-screen bg-gray-50">
        {/* Header da Sessão */}
        <div
          className="py-16 text-white"
          style={{ backgroundColor: sessao.cor_fundo }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 text-sm text-white/80 mb-2">
                  <Link href="/" className="hover:text-white">
                    Home
                  </Link>
                  <span>/</span>
                  <span>Sessões</span>
                  <span>/</span>
                  <span className="font-medium">{sessao.nome}</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {sessao.nome}
                </h1>
                <p className="text-xl opacity-90 max-w-2xl">
                  {sessao.descricao}
                </p>
              </div>

              {/* Botão Filtros Mobile */}
              <button
                onClick={() => setMostrarFiltros(true)}
                className="md:hidden flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors"
              >
                <Filter size={16} />
                Filtros
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Filtro Lateral Desktop */}
            <div className="hidden md:block w-80 flex-shrink-0">
              <FiltroLateral
                isOpen={true}
                onClose={() => {}}
                onFiltrosChange={handleFiltrosChange}
                tipoPagina="sessao"
              />
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1">
              {/* Header e Filtros Aplicados */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {produtosFiltrados.length} produto
                    {produtosFiltrados.length !== 1 ? "s" : ""} encontrado
                    {produtosFiltrados.length !== 1 ? "s" : ""}
                  </h2>
                </div>
              </div>

              {/* Filtros Aplicados */}
              {(filtros.categorias.length > 0 ||
                filtros.marcas.length > 0 ||
                filtros.generos.length > 0 ||
                filtros.tamanhos.length > 0 ||
                filtros.cores.length > 0 ||
                filtros.precoMin > 0 ||
                filtros.precoMax < (filtros.precoMax || 1000)) && (
                <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {filtros.categorias.length > 0 && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {filtros.categorias.length} categoria
                        {filtros.categorias.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {filtros.marcas.length > 0 && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {filtros.marcas.length} marca
                        {filtros.marcas.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {filtros.generos.length > 0 && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {filtros.generos.length} gênero
                        {filtros.generos.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {filtros.tamanhos.length > 0 && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                        {filtros.tamanhos.length} tamanho
                        {filtros.tamanhos.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {filtros.cores.length > 0 && (
                      <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                        {filtros.cores.length} cor
                        {filtros.cores.length !== 1 ? "es" : ""}
                      </span>
                    )}
                    {(filtros.precoMin > 0 ||
                      filtros.precoMax < (filtros.precoMax || 1000)) && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        Preço: R$ {filtros.precoMin.toFixed(2)} - R${" "}
                        {filtros.precoMax.toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={limparFiltros}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      Limpar todos
                    </button>
                  </div>
                </div>
              )}

              {/* Grid de Produtos */}
              {produtosFiltrados.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {produtosFiltrados.map((produtoSessao) => {
                    const produto = produtoSessao.produto;
                    const imagemPrincipal =
                      produto.imagens?.find((img) => img.principal) ||
                      produto.imagens?.[0];

                    return (
                      <div
                        key={produtoSessao.id}
                        className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                      >
                        <Link href={`/produto/${produto.slug}`}>
                          <div className="aspect-square bg-gray-50 overflow-hidden relative">
                            {imagemPrincipal ? (
                              <ProductImage
                                src={imagemPrincipal.url}
                                alt={produto.titulo}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">
                                  Sem imagem
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>

                        <div className="p-4 flex flex-col flex-grow">
                          <Link href={`/produto/${produto.slug}`}>
                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-blue-600 transition-colors">
                              {produto.titulo}
                            </h3>
                          </Link>

                          <div className="flex justify-between items-center text-sm mb-3">
                            <span className="text-gray-600">
                              {produto.marca?.nome || "Sem marca"}
                            </span>
                            {produto.genero && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                {produto.genero.nome}
                              </span>
                            )}
                          </div>

                          <div className="mt-auto">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-bold text-green-600 text-lg">
                                R$ {produto.preco_prod.toFixed(2)}
                              </span>
                              {produto.preco_original &&
                                produto.preco_original > produto.preco_prod && (
                                  <span className="text-sm text-gray-500 line-through">
                                    R$ {produto.preco_original.toFixed(2)}
                                  </span>
                                )}
                            </div>

                            {produto.preco_original &&
                              produto.preco_original > produto.preco_prod && (
                                <div className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full inline-block mb-3">
                                  -
                                  {Math.round(
                                    ((produto.preco_original -
                                      produto.preco_prod) /
                                      produto.preco_original) *
                                      100,
                                  )}
                                  % OFF
                                </div>
                              )}

                            <Link
                              href={`/produto/${produto.slug}`}
                              className="block w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors text-center font-medium text-sm"
                            >
                              Ver Detalhes
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="w-24 h-24 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Tente ajustar os filtros para ver mais produtos.
                  </p>
                  <button
                    onClick={limparFiltros}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filtro Lateral Mobile */}
        {mostrarFiltros && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 md:hidden">
            <div className="fixed right-0 top-0 h-full w-80 bg-white overflow-y-auto">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filtros</h3>
                  <button
                    onClick={() => setMostrarFiltros(false)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <FiltroLateral
                  isOpen={mostrarFiltros}
                  onClose={() => setMostrarFiltros(false)}
                  onFiltrosChange={handleFiltrosChange}
                  tipoPagina="sessao"
                />
              </div>
            </div>
          </div>
        )}
        <ScrollToTop />
      </div>
    </>
  );
}
