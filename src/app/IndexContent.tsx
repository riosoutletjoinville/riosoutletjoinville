// src/app/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useCarrinho } from "@/hooks/useCarrinho";
import CarrinhoModal from "@/components/ui/CarrinhoModal";
import ProductImage from "@/components/ui/ProductImage";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import HeroCarousel from "@/components/ui/carousel";
import FloatingButtons from "@/components/ui/FloatingButtons";
import { useSearchParams } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import SessoesEspeciais from "@/components/template/SessoesEspeciais";
import NewsletterSection from "@/components/template/NewsletterSection";
import Header from "@/components/template/header";
import Footer from "@/components/template/Footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useRouter, usePathname } from "next/navigation";
import {
  Truck,
  Shield,
  CreditCard,
  RotateCcw,
  Sparkles,
  Flame,
  Star,
  Clock,
  ArrowRight,
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Produto {
  id: string;
  titulo: string;
  preco: number;
  preco_original?: number;
  descricao?: string;
  imagens: Array<{
    url: string;
    principal: boolean;
  }>;
  categoria: {
    nome: string;
  };
  marca: {
    nome: string;
  };
  slug: string;
}

// Componente de Benefícios
function BeneficiosSection() {
  const beneficios = [
    {
      icon: Truck,
      title: "Frete Grátis",
      description: "Para compras acima de R$ 500",
    },
    {
      icon: Shield,
      title: "Compra Segura",
      description: "Site 100% seguro e certificado",
    },
    {
      icon: CreditCard,
      title: "Até 12x sem juros",
      description: "Parcele suas compras",
    },
    {
      icon: RotateCcw,
      title: "30 dias para trocar",
      description: "Primeira troca grátis",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-8 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {beneficios.map((beneficio, index) => (
            <div key={index} className="flex items-center justify-center gap-3">
              <div className="flex-shrink-0">
                <beneficio.icon className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {beneficio.title}
                </h3>
                <p className="text-xs text-gray-600">{beneficio.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
// Componente de Produtos com Grid Aprimorado
function ProdutosGrid({
  produtos,
  currentPage,
  totalCount,
  handleComprar,
}: {
  produtos: Produto[];
  currentPage: number;
  totalCount: number;
  handleComprar: (produto: Produto) => void;
}) {
  if (produtos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gray-50 rounded-2xl p-12 max-w-md mx-auto">
          <p className="text-gray-500 text-lg">
            Nenhum produto disponível no momento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {produtos.map((product) => {
        const imagemPrincipal =
          product.imagens?.find((img) => img.principal) || product.imagens?.[0];
        const desconto =
          product.preco_original && product.preco_original > product.preco
            ? Math.round(
                ((product.preco_original - product.preco) /
                  product.preco_original) *
                  100,
              )
            : 0;

        return (
          <div
            key={product.id}
            className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            {/* Container da Imagem */}
            <Link
              href={`/produto/${product.slug}`}
              className="block relative aspect-square bg-gray-50 overflow-hidden"
            >
              {imagemPrincipal ? (
                <ProductImage
                  src={imagemPrincipal.url}
                  alt={product.titulo}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-300">Sem imagem</span>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {desconto > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                    -{desconto}%
                  </span>
                )}
                {product.preco_original &&
                  product.preco_original > product.preco && (
                    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                      OFERTA
                    </span>
                  )}
              </div>              
            </Link>

            {/* Informações do Produto */}
            <div className="p-4">
              {/* Marca e Categoria */}
              <div className="flex items-center gap-2 mb-2">
                {product.marca?.nome && (
                  <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                    {product.marca.nome}
                  </span>
                )}
                {product.categoria?.nome && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500">
                      {product.categoria.nome}
                    </span>
                  </>
                )}
              </div>

              {/* Título */}
              <Link href={`/produto/${product.slug}`}>
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2 hover:text-amber-600 transition-colors min-h-[2.5rem]">
                  {product.titulo}
                </h3>
              </Link>

              {/* Preços */}
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xl font-bold text-green-600">
                  R$ {product.preco.toFixed(2)}
                </span>
                {product.preco_original &&
                  product.preco_original > product.preco && (
                    <span className="text-sm text-gray-400 line-through">
                      R$ {product.preco_original.toFixed(2)}
                    </span>
                  )}
              </div>

              {/* Parcelamento */}
              {product.preco >= 100 && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <CreditCard size={14} className="text-gray-400" />
                  <span>
                    até <span className="font-medium">12x</span> de{" "}
                    <span className="font-medium">
                      R$ {(product.preco / 12).toFixed(2)}
                    </span>{" "}
                    s/juros
                  </span>
                </div>
              )}

              {/* Frete Grátis (simulado) */}
              {product.preco >= 199 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-green-600 bg-green-50 py-1 px-2 rounded-full inline-flex">
                  <Truck size={14} />
                  <span>Frete Grátis</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pages.push("...");
    }
  }

  const uniquePages = [...new Set(pages)];

  const handlePageChange = (page: number) => {
    // Criar nova URL com o parâmetro de página
    const params = new URLSearchParams(window.location.search);
    params.set("page", page.toString());

    // Usar router.push para navegação sem refresh
    router.push(`${pathname}?${params.toString()}#produtos-section`, {
      scroll: false, // Impede o scroll automático
    });

    // Scroll suave manual após a navegação
    setTimeout(() => {
      const element = document.getElementById("produtos-section");
      if (element) {
        const offset = 80; // Altura do header fixo
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-12">
      {currentPage > 1 && (
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Anterior
        </button>
      )}

      {uniquePages.map((page, index) =>
        page === "..." ? (
          <span key={`dots-${index}`} className="px-3 py-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => handlePageChange(page as number)}
            className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? "bg-amber-600 text-white"
                : "border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ),
      )}

      {currentPage < totalPages && (
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Próxima
        </button>
      )}
    </div>
  );
}

// Componente de Loading Aprimorado
function HomeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando produtos...</p>
      </div>
    </div>
  );
}

// Componente Principal
function HomeContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const pageParam = searchParams.get("page");

  const [carrinhoModalAberto, setCarrinhoModalAberto] = useState(false);
  const { adicionarAoCarrinho } = useCarrinho();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  interface Banner {
    id: string;
    titulo: string;
    subtitulo?: string;
    imagem_url: string;
    link?: string;
    texto_botao?: string;
    ativo: boolean;
    ordem: number;
  }

  async function getProdutos(
    page: number = 1,
    limit: number = 12,
  ): Promise<{ produtos: Produto[]; totalCount: number }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("produtos")
        .select(
          `
          *,
          categoria:categorias(nome),
          marca:marcas(nome),
          imagens:produto_imagens(*)
        `,
          { count: "exact" },
        )
        .eq("ativo", true)
        .eq("visivel", true)
        .gt("estoque", 0)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { produtos: data || [], totalCount: count || 0 };
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return { produtos: [], totalCount: 0 };
    }
  }

  async function getBanners(): Promise<Banner[]> {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar banners:", error);
      return [];
    }
  }

  useEffect(() => {
    if (window.location.hash === "#produtos-section") {
      setTimeout(() => {
        const element = document.getElementById("produtos-section");
        if (element) {
          const offset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 300);
    }
  }, []);

  // Efeito para carregar produtos quando a página muda
  useEffect(() => {
    async function carregarDados() {
      const currentPage = parseInt(pageParam || "1");
      const [produtosData, bannersData] = await Promise.all([
        getProdutos(currentPage, 12),
        getBanners(),
      ]);

      setProdutos(produtosData.produtos);
      setTotalCount(produtosData.totalCount);
      setBanners(bannersData);
      setLoading(false);
    }

    carregarDados();
  }, [pageParam]);

  const handleComprar = (produto: Produto) => {
    const imagemPrincipal =
      produto.imagens?.find((img) => img.principal) || produto.imagens?.[0];

    adicionarAoCarrinho({
      id: produto.id,
      produto_id: produto.id,
      titulo: produto.titulo,
      preco_unitario: produto.preco,
      quantidade: 1,
      imagem_url: imagemPrincipal?.url,
    });

    setCarrinhoModalAberto(true);
  };

  const currentPage = parseInt(pageParam || "1");
  const totalPages = Math.ceil(totalCount / 12);
  const [isChangingPage, setIsChangingPage] = useState(false);

  // Modificar o efeito para mostrar loading
  useEffect(() => {
    async function carregarDados() {
      const currentPage = parseInt(pageParam || "1");
      setIsChangingPage(true);

      const [produtosData, bannersData] = await Promise.all([
        getProdutos(currentPage, 12),
        getBanners(),
      ]);

      setProdutos(produtosData.produtos);
      setTotalCount(produtosData.totalCount);
      setBanners(bannersData);
      setIsChangingPage(false);
      setLoading(false);
    }

    carregarDados();
  }, [pageParam]);

  if (loading) {
    return <HomeLoading />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <SpeedInsights />
      <HeroCarousel banners={banners} />

      <BeneficiosSection />

      <SessoesEspeciais />

      {/* Seção de Produtos */}
      <section id="produtos-section" className="py-16 bg-gray-50 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-amber-600 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Produtos em Destaque
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
              {isChangingPage
                ? "Carregando..."
                : `Mostrando ${produtos.length} de ${totalCount} produtos`}
            </p>
          </div>

          {isChangingPage ? (
            // Skeleton loading para produtos
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
                >
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <ProdutosGrid
              produtos={produtos}
              currentPage={currentPage}
              totalCount={totalCount}
              handleComprar={handleComprar}
            />
          )}

          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterSection />

      <Footer />

      <CarrinhoModal
        isOpen={carrinhoModalAberto}
        onClose={() => setCarrinhoModalAberto(false)}
      />

      <FloatingButtons />
      <Analytics />
    </div>
  );
}

export default function IndexContent() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
