// app/produto/[slug]/page.tsx
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import ProductImage from "@/components/ui/ProductImage";
import ImageGallery from "@/components/ui/ProdutoGallery";
import { ProductStructuredData } from "@/components/seo/StructuredData";
import SimpleHeader from "@/components/ui/SimpleHeader";

// ========== INTERFACES PARA TIPAGEM ==========
interface CategoriaPai {
  id: string;
  nome: string;
  slug: string;
}

interface Categoria {
  id: string;
  nome: string;
  slug: string;
  categoria_pai: CategoriaPai | null;
}

interface Marca {
  nome: string;
}

interface Imagem {
  id: string;
  url: string;
  principal: boolean;
  ordem: number;
}

interface Cor {
  nome: string;
  codigo_hex: string;
}

interface Tamanho {
  nome: string;
}

interface Variacao {
  id: string;
  sku: string;
  estoque: number;
  preco: number;
  codigo_ean: string;
  cor: Cor | null;
  tamanho: Tamanho | null;
}

interface Produto {
  id: string;
  titulo: string;
  descricao: string;
  preco: number;
  preco_original: number | null;
  estoque: number;
  ativo: boolean;
  slug: string;
  categoria_id: string;
  marca_id: string;
  categoria: Categoria;
  marca: Marca;
  imagens: Imagem[];
  variacoes: Variacao[];
}

interface ProdutoRelacionado {
  id: string;
  titulo: string;
  slug: string;
  preco: number;
  preco_original: number | null;
  imagens: Imagem[];
}
// =============================================

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const { data: produto } = await supabase
    .from("produtos")
    .select("titulo, descricao")
    .eq("slug", slug)
    .single();

  if (!produto) {
    return {
      title: "Produto não encontrado",
    };
  }

  return {
    title: `${produto.titulo} - Rios Outlet`,
    description:
      produto.descricao || `Confira detalhes do produto ${produto.titulo}`,
  };
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;

  const { data: produto } = await supabase
    .from("produtos")
    .select(
      `
      *,
      categoria:categorias(
        id,
        nome,
        slug,
        categoria_pai:categorias!categoria_pai_id(
          id,
          nome,
          slug
        )
      ),
      marca:marcas(nome),
      imagens:produto_imagens(*),
      variacoes:produto_variacoes(
        id,
        sku,
        estoque,
        preco,
        codigo_ean,
        cor:cores(nome, codigo_hex),
        tamanho:tamanhos(nome)
      )
    `,
    )
    .eq("slug", slug) 
    .eq("ativo", true)
    .single();

  if (!produto) {
    notFound();
  }

  // Cast para o tipo Produto
  const produtoTyped = produto as unknown as Produto;

  // Buscar produtos relacionados da mesma categoria
  const { data: relacionados } = await supabase
    .from("produtos")
    .select(
      `
      id,
      titulo,
      slug,
      preco,
      preco_original,
      imagens:produto_imagens(*)
    `,
    )
    .eq("categoria_id", produtoTyped.categoria_id)
    .eq("ativo", true)
    .neq("id", produtoTyped.id)
    .limit(4);

  // Ordenar imagens por 'principal' e 'ordem'
  const imagensOrdenadas = [...(produtoTyped.imagens || [])].sort((a, b) => {
    if (a.principal && !b.principal) return -1;
    if (!a.principal && b.principal) return 1;
    return (a.ordem || 0) - (b.ordem || 0);
  });

  // Preparar dados estruturados para Schema.org
  const structuredDataProduct = {
    name: produtoTyped.titulo,
    description: produtoTyped.descricao || "",
    sku: produtoTyped.id,
    price: produtoTyped.preco,
    image: imagensOrdenadas[0]?.url || "",
    brand: produtoTyped.marca?.nome || "",
    category: produtoTyped.categoria?.nome || "",
    availability: produtoTyped.estoque > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
  };

  return (
    <>
      {/* Dados estruturados para SEO */}
      <ProductStructuredData product={structuredDataProduct} />
      <SimpleHeader />
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center text-sm text-gray-600">
              <Link href="/" className="hover:text-amber-600">
                Home
              </Link>
              <span className="mx-2"> / </span>
              <Link href="/categorias" className="hover:text-amber-600">
                Categorias 
              </Link>

              {produtoTyped.categoria?.categoria_pai && (
                <>
                  <Link
                    href={`/categoria/${produtoTyped.categoria.categoria_pai.slug}`}
                    className="hover:text-amber-600"
                  >
                    <span className="mx-2"> / </span>{produtoTyped.categoria.categoria_pai.nome}
                  </Link>
                </>
              )}
              <Link
                href={`/categoria/${produtoTyped.categoria.slug}`}
                className="hover:text-amber-600"
              >
              {produtoTyped.categoria.nome}
              </Link>

              <span className="mx-2">/</span>
              <span className="text-gray-900 font-medium line-clamp-1">
                {produtoTyped.titulo}
              </span>
            </div>
          </div>
        </div>

        {/* Detalhes do Produto */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Imagens */}
              <div>
                {imagensOrdenadas.length > 0 ? (
                  <ImageGallery 
                    imagens={imagensOrdenadas} 
                    titulo={produtoTyped.titulo}
                  />
                ) : (
                  <div className="relative aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">Sem imagem</span>
                  </div>
                )}
              </div>

              {/* Informações */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {produtoTyped.titulo}
                </h1>

                <div className="mb-6">
                  <span className="text-3xl font-bold text-green-600">
                    R$ {produtoTyped.preco.toFixed(2)}
                  </span>
                  {produtoTyped.preco_original &&
                    produtoTyped.preco_original > produtoTyped.preco && (
                      <div className="mt-2">
                        <span className="text-lg text-gray-500 line-through">
                          R$ {produtoTyped.preco_original.toFixed(2)}
                        </span>
                        <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          -
                          {Math.round(
                            ((produtoTyped.preco_original - produtoTyped.preco) /
                              produtoTyped.preco_original) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                    )}
                </div>

                {/* Marca e Categoria */}
                <div className="flex items-center space-x-4 mb-6 text-sm">
                  {produtoTyped.marca && (
                    <span className="text-gray-600">
                      Marca:{" "}
                      <span className="font-medium">
                        {produtoTyped.marca.nome}
                      </span>
                    </span>
                  )}
                  <span className="text-gray-600">
                    Categoria:
                    <Link
                      href={`/categoria/${produtoTyped.categoria.slug}`}
                      className="ml-1 font-medium text-amber-600 hover:text-amber-700"
                    >
                      {produtoTyped.categoria.nome}
                    </Link>
                  </span>
                </div>

                {/* Descrição */}
                {produtoTyped.descricao && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Descrição</h2>
                    <p className="text-gray-700 whitespace-pre-line">
                      {produtoTyped.descricao}
                    </p>
                  </div>
                )}

                {/* Estoque */}
                <div className="mb-6">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                      produtoTyped.estoque > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {produtoTyped.estoque > 0 ? "Em estoque" : "Fora de estoque"}
                  </span>
                </div>

                {/* Botão de compra */}
                {produtoTyped.estoque > 0 && (
                  <AddToCartButton produto={produtoTyped} />
                )}
              </div>
            </div>
          </div>

          {/* Produtos Relacionados */}
          {relacionados && relacionados.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Produtos Relacionados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {(relacionados as unknown as ProdutoRelacionado[]).map((rel) => {
                  const imagem =
                    rel.imagens?.find((img) => img.principal) || rel.imagens?.[0];

                  return (
                    <Link
                      key={rel.id}
                      href={`/produto/${rel.slug}`}
                      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-square bg-white p-4">
                        {imagem ? (
                          <ProductImage
                            src={imagem.url}
                            alt={rel.titulo}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400">Sem imagem</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 border-t">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-2">
                          {rel.titulo}
                        </h3>
                        <span className="text-lg font-bold text-green-600">
                          R$ {rel.preco.toFixed(2)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}