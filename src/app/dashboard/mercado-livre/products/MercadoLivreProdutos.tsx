// src/app/dashboard/mercadolibre/products/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Image from "next/image";
import { mercadoLivreService } from "@/lib/mercadolibre";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import MLProductActions from "@/components/dashboard/MLProductActions";
import { mercadoLivreProductsService } from "@/lib/products";

interface MLProduct {
  id: string;
  title: string;
  price: number;
  available_quantity: number;
  status: string;
  thumbnail: string;
  listing_type_id?: string;
  permalink?: string;
}

interface InternalProduct {
  id: string; // UUID interno
  ml_item_id: string; // ID do ML
  titulo: string;
  preco: number;
  estoque: number;
  ml_status: string;
  publicar_ml: boolean;
  condicao: string;
  categoria_id?: string;
  marca_id?: string;
  genero_id?: string;
}

export default function MercadoLivreProdutos() {
  const [products, setProducts] = useState<MLProduct[]>([]);
  const [internalProducts, setInternalProducts] = useState<
    Record<string, InternalProduct>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 6;

  // Calcular produtos para exibir
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );

  useEffect(() => {
    if (!hasFetched) {
      fetchProducts();
      setHasFetched(true);
    }
  }, [hasFetched]);

  // Buscar produtos internos correspondentes
  const fetchInternalProducts = async (mlProducts: MLProduct[]) => {
    try {
      const mlItemIds = mlProducts
        .map((p) => p.id)
        .filter((id) => id && id.startsWith("MLB"));

      if (mlItemIds.length === 0) {
        console.log("Nenhum ID do ML válido encontrado");
        return {};
      }

      console.log("Buscando produtos internos para IDs:", mlItemIds);

      const { data: internalProds, error } = await supabase
        .from("produtos")
        .select(
          "id, titulo, preco, estoque, ml_item_id, ml_status, publicar_ml, condicao, categoria_id, marca_id, genero_id"
        )
        .in("ml_item_id", mlItemIds);

      if (error) {
        console.error("Erro ao buscar produtos internos:", error);
        return {};
      }

      // Criar mapa: ml_item_id -> produto interno
      const productMap: Record<string, InternalProduct> = {};
      internalProds?.forEach((prod) => {
        if (prod.ml_item_id) {
          productMap[prod.ml_item_id] = prod as InternalProduct;
        }
      });

      console.log(
        "Produtos internos encontrados:",
        Object.keys(productMap).length
      );
      return productMap;
    } catch (error) {
      console.error("Erro ao buscar produtos internos:", error);
      return {};
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const isConnected = await mercadoLivreService.isUserConnected();
      if (!isConnected) {
        setError("Não conectado ao Mercado Livre. Conecte sua conta primeiro.");
        setLoading(false);
        return;
      }

      console.log("Buscando produtos do Mercado Livre...");
      const productsData = await mercadoLivreService.getProducts();
      console.log("Produtos encontrados:", productsData);

      // Buscar produtos internos correspondentes
      const internalProductsMap = await fetchInternalProducts(
        productsData || []
      );
      setInternalProducts(internalProductsMap);

      setProducts(productsData || []);
    } catch (error: unknown) {
      console.error("Erro detalhado:", error);
      if (error instanceof Error) {
        setError("Erro ao carregar produtos: " + error.message);
      } else {
        setError(
          "Erro ao carregar produtos. Verifique a conexão com o Mercado Livre."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products.length > 0) {
      console.log("Produtos carregados:", products.length, "itens");
      console.log(
        "Produtos internos mapeados:",
        Object.keys(internalProducts).length
      );
    }
  }, [products.length, internalProducts]);

  // Função para verificar status de sincronização
  const getProductSyncStatus = (mlProductId: string) => {
    const internalProduct = internalProducts[mlProductId];
    if (!internalProduct) {
      return {
        synced: false,
        message: "Não sincronizado",
        color: "bg-red-100 text-red-800",
      };
    }
    return {
      synced: true,
      message: "Sincronizado",
      color: "bg-green-100 text-green-800",
      internalId: internalProduct.id,
    };
  };

  // Adicione esta função após getProductSyncStatus
  const getProductReviewStatus = (product: MLProduct) => {
    if (product.status === "under_review") {
      return {
        needsReview: true,
        message: "Em revisão - Corrigir fotos",
        color: "bg-orange-100 text-orange-800",
        details:
          "Algumas fotos não cumprem o tamanho mínimo, posição e proporção",
      };
    }

    if (product.status === "rejected") {
      return {
        needsReview: true,
        message: "Rejeitado - Corrigir fotos",
        color: "bg-red-100 text-red-800",
        details: "Fotos não atendem aos requisitos do Mercado Livre",
      };
    }

    return {
      needsReview: false,
      message: "",
      color: "",
      details: "",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3">Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Produtos no Mercado Livre
            </h1>
            <p className="text-gray-600">Gerencie seus produtos publicados</p>
            <p className="text-sm text-gray-500">
              {Object.keys(internalProducts).length} de {products.length}{" "}
              produtos sincronizados
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchProducts}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Atualizar Lista
            </button>
            <Link
              href="/dashboard/mercadolibre/products/sync"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              Sincronizar Produtos
            </Link>
            <Link
              href="/dashboard/mercadolibre"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              Voltar
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentProducts.map((product) => {
            const syncStatus = getProductSyncStatus(product.id);
            const internalProduct = internalProducts[product.id];

            return (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
              >
                <div className="relative w-full h-48 bg-gray-100">
                  {product.thumbnail ? (
                    <Image
                      src={product.thumbnail.replace("http://", "https://")}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-product.png";
                        target.onerror = null;
                      }}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaUMk6objMkSqBz3oA//9k="
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400">Sem imagem</span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 h-14 overflow-hidden">
                    {product.title}
                  </h3>
                  {getProductReviewStatus(product).needsReview && (
                    <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="flex items-start">
                        <svg
                          className="w-5 h-5 text-orange-500 mt-0.5 mr-2 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <p className="text-orange-800 font-medium text-sm">
                            {getProductReviewStatus(product).message}
                          </p>
                          <p className="text-orange-600 text-xs mt-1">
                            {getProductReviewStatus(product).details}
                          </p>
                          <button
                            onClick={() =>
                              window.open(product.permalink, "_blank")
                            }
                            className="text-orange-700 underline text-xs mt-2 hover:text-orange-900"
                          >
                            Ver detalhes no Mercado Livre
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <p className="text-green-600 font-bold text-xl">
                      R$ {product.price.toFixed(2)}
                    </p>

                    <p className="text-gray-600">
                      Estoque:{" "}
                      <span className="font-medium">
                        {product.available_quantity}
                      </span>
                    </p>

                    <div className="flex justify-between items-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          product.status === "active"
                            ? "bg-green-100 text-green-800"
                            : product.status === "paused"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.status === "active"
                          ? "Ativo"
                          : product.status === "paused"
                          ? "Pausado"
                          : product.status}
                      </span>

                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${syncStatus.color}`}
                      >
                        {syncStatus.message}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {syncStatus.synced ? (
                      <div className="space-y-2">
                        <MLProductActions
                          productId={internalProduct.id}
                          mlStatus={product.status}
                          mlItemId={product.id}
                          onStatusChange={fetchProducts}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500 mb-2">
                          Produto não sincronizado
                        </p>
                        <div className="flex flex-col gap-2">
                          {/* ✅ BOTÃO DE EXCLUSÃO PARA PRODUTOS NÃO SINCRONIZADOS - MESMO PADRÃO */}
                          <button
                            onClick={async () => {
                              console.log(
                                "🟡 [UI] Botão excluir clicado para produto:",
                                product.id
                              );

                              if (
                                confirm(
                                  `Tem certeza que deseja excluir o produto "${product.title}" do Mercado Livre?`
                                )
                              ) {
                                try {
                                  setLoading(true);
                                  console.log("🟡 [UI] Iniciando exclusão...");

                                  const result =
                                    await mercadoLivreProductsService.deleteProduct(
                                      `temp_${Date.now()}`,
                                      product.id
                                    );

                                  console.log(
                                    "✅ [UI] Exclusão retornou:",
                                    result
                                  );

                                  if (result.success) {
                                    alert(
                                      result.message ||
                                        "Produto excluído com sucesso!"
                                    );
                                    fetchProducts();
                                  } else {
                                    alert(
                                      result.message ||
                                        "Erro ao excluir produto"
                                    );
                                  }
                                } catch (error) {
                                  console.error(
                                    "❌ [UI] Erro na exclusão:",
                                    error
                                  );
                                  alert(
                                    `Erro ao excluir produto: ${
                                      error instanceof Error
                                        ? error.message
                                        : "Erro desconhecido"
                                    }`
                                  );
                                } finally {
                                  setLoading(false);
                                }
                              }
                            }}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 text-sm font-medium py-1 px-3 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                          >
                            {loading ? "Excluindo..." : "Excluir do ML"}
                          </button>

                          <Link
                            href="/dashboard/mercadolibre/products/sync"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Sincronizar agora
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resto do código permanece igual */}
        {products.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                Nenhum produto encontrado
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Você ainda não publicou nenhum produto no Mercado Livre ou há um
                problema com a conexão.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/mercadolibre/products/sync"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sincronizar Primeiro Produto
                </Link>
              </div>
            </div>
          </div>
        )}

        {products.length > productsPerPage && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2">
                Página {currentPage} de{" "}
                {Math.ceil(products.length / productsPerPage)}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      prev + 1,
                      Math.ceil(products.length / productsPerPage)
                    )
                  )
                }
                disabled={
                  currentPage === Math.ceil(products.length / productsPerPage)
                }
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
