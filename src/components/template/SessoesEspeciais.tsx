// src/components/template/SessoesEspeciais.tsx
"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import ProductImage from "../ui/ProductImage";
import { ChevronRight, Sparkles, Flame, Star, Tag, Crown, Zap } from "lucide-react";

interface Produto {
  id: string;
  titulo: string;
  preco: number;
  preco_original?: number;
  preco_prod: number;
  slug: string;
  imagens: Array<{
    url: string;
    principal: boolean;
  }>;
  marca?: {
    nome: string;
  };
}

interface ProdutoSessao {
  id: string;
  produto_id: string;
  ordem: number;
  produto: Produto;
}

interface SessaoEspecial {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  cor_fundo: string;
  cor_texto: string;
  icone?: string;
}

// Mapeamento de ícones baseado no nome da sessão
const getSessaoIcon = (nome: string) => {
  const nomeLower = nome.toLowerCase();
  if (nomeLower.includes('lançamento') || nomeLower.includes('lancamento')) return <Sparkles className="w-5 h-5" />;
  if (nomeLower.includes('oferta') || nomeLower.includes('promo')) return <Tag className="w-5 h-5" />;
  if (nomeLower.includes('mais vendido') || nomeLower.includes('popular')) return <Flame className="w-5 h-5" />;
  if (nomeLower.includes('top') || nomeLower.includes('destaque')) return <Crown className="w-5 h-5" />;
  if (nomeLower.includes('relâmpago') || nomeLower.includes('relampago')) return <Zap className="w-5 h-5" />;
  return <Star className="w-5 h-5" />;
};

export default function SessoesEspeciais() {
  const [sessoesComProdutos, setSessoesComProdutos] = useState<
    Array<{
      sessao: SessaoEspecial;
      produtos: ProdutoSessao[];
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessoesComProdutos();
  }, []);

  const loadSessoesComProdutos = async () => {
    try {
      const supabase = createClient();
      const { data: sessoes, error: sessoesError } = await supabase
        .from("sessoes_especiais")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (sessoesError) throw sessoesError;

      // Para cada sessão, carrega os produtos
      const sessoesComProdutosData = await Promise.all(
        (sessoes || []).map(async (sessao) => {
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
                slug,
                imagens:produto_imagens(*),
                marca:marcas(nome)
              )
            `
            )
            .eq("sessao_id", sessao.id)
            .order("ordem", { ascending: true })
            .limit(10);

          if (produtosError) throw produtosError;

          const produtosFormatados: ProdutoSessao[] = (produtoSessoes || [])
            .map((item: any) => ({
              id: item.id,
              produto_id: item.produto_id,
              ordem: item.ordem,
              produto: Array.isArray(item.produto) ? item.produto[0] : item.produto,
            }))
            .filter(item => item.produto); // Filtra produtos que existem

          return {
            sessao,
            produtos: produtosFormatados,
          };
        })
      );

      // Filtra apenas sessões que têm produtos
      const sessoesComProdutosFiltradas = sessoesComProdutosData.filter(
        (item) => item.produtos.length > 0
      );

      setSessoesComProdutos(sessoesComProdutosFiltradas);
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-12">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="bg-gray-100 rounded-xl h-64"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sessoesComProdutos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-16 py-12 bg-gray-50">
      {sessoesComProdutos.map(({ sessao, produtos }, index) => (
        <section key={sessao.id} className="relative">
          {/* Background sutil alternado */}
          <div className={`absolute inset-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`} />
          
          <div className="relative max-w-7xl mx-auto px-4">
            {/* Header da Sessão com estilo melhorado */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                {/* Ícone colorido da sessão */}
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: sessao.cor_fundo, color: sessao.cor_texto }}
                >
                  {getSessaoIcon(sessao.nome)}
                </div>
                
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {sessao.nome}
                  </h2>
                  {sessao.descricao && (
                    <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                      {sessao.descricao}
                    </p>
                  )}
                </div>
              </div>

              {/* Link "Ver mais" */}
              {produtos.length >= 8 && (
                <Link
                  href={`/sessao/${sessao.slug}`}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: sessao.cor_fundo + '20', // 20% de opacidade
                    color: sessao.cor_fundo 
                  }}
                >
                  Ver todos
                  <ChevronRight size={16} />
                </Link>
              )}
            </div>

            {/* Carrossel de Produtos */}
            <div className="relative -mx-2 px-2">
              <Swiper
                modules={[Autoplay, Navigation, Pagination]}
                spaceBetween={16}
                slidesPerView={2}
                breakpoints={{
                  640: { slidesPerView: 3 },
                  768: { slidesPerView: 4 },
                  1024: { slidesPerView: 5 },
                }}
                navigation={{
                  prevEl: `.swiper-button-prev-${sessao.id}`,
                  nextEl: `.swiper-button-next-${sessao.id}`,
                }}
                pagination={{ 
                  clickable: true,
                  el: `.swiper-pagination-${sessao.id}`,
                }}
                autoplay={{
                  delay: 4000,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }}
                loop={produtos.length > 5}
                className="!overflow-visible"
              >
                {produtos.map((produtoSessao) => {
                  const produto = produtoSessao.produto;
                  if (!produto) return null;

                  const imagemPrincipal =
                    produto.imagens?.find((img) => img.principal) ||
                    produto.imagens?.[0];
                  
                  const desconto = produto.preco_original && produto.preco_original > produto.preco_prod
                    ? Math.round(((produto.preco_original - produto.preco_prod) / produto.preco_original) * 100)
                    : 0;

                  return (
                    <SwiperSlide key={produtoSessao.id}>
                      <Link href={`/produto/${produto.slug}`}>
                        <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                          {/* Container da imagem */}
                          <div className="relative aspect-square bg-white p-4">
                            {imagemPrincipal ? (
                              <ProductImage
                                src={imagemPrincipal.url}
                                alt={produto.titulo}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                className="object-contain group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">Sem imagem</span>
                              </div>
                            )}

                            {/* Badge de desconto */}
                            {desconto > 0 && (
                              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                                -{desconto}%
                              </div>
                            )}

                            {/* Marca (se disponível) */}
                            {produto.marca?.nome && (
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full shadow">
                                {produto.marca.nome}
                              </div>
                            )}
                          </div>

                          {/* Informações do produto */}
                          <div className="p-3 border-t border-gray-100">
                            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2 h-10">
                              {produto.titulo}
                            </h3>

                            <div className="space-y-1">
                              {/* Preço com desconto */}
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-green-600">
                                  R$ {produto.preco_prod.toFixed(2)}
                                </span>
                                {produto.preco_original && produto.preco_original > produto.preco_prod && (
                                  <span className="text-xs text-gray-400 line-through">
                                    R$ {produto.preco_original.toFixed(2)}
                                  </span>
                                )}
                              </div>

                              {/* Parcelamento */}
                              {produto.preco_prod >= 50 && (
                                <p className="text-xs text-gray-600">
                                  até <span className="font-medium">12x</span> de{' '}
                                  <span className="font-medium">
                                    R$ {(produto.preco_prod / 12).toFixed(2)}
                                  </span>
                                </p>
                              )}

                              {/* Botão de compra rápida (aparece no hover) */}
                              <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-xs text-center text-amber-600 font-medium">
                                  Clique para comprar
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {/* Botões de navegação customizados */}
              <button
                className={`swiper-button-prev-${sessao.id} absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all z-10 hidden md:flex`}
                style={{ color: sessao.cor_fundo }}
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <button
                className={`swiper-button-next-${sessao.id} absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all z-10 hidden md:flex`}
                style={{ color: sessao.cor_fundo }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Paginação */}
              <div className={`swiper-pagination-${sessao.id} flex justify-center gap-2 mt-6 md:hidden`} />
            </div>

            {/* Link "Ver mais" para mobile */}
            {produtos.length >= 8 && (
              <div className="text-center mt-6 md:hidden">
                <Link
                  href={`/sessao/${sessao.slug}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border"
                  style={{ 
                    borderColor: sessao.cor_fundo,
                    color: sessao.cor_fundo 
                  }}
                >
                  Ver todos os produtos
                  <ChevronRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}