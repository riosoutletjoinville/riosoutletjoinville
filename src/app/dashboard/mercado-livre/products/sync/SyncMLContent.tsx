// src/app/dashboard/mercadolibre/products/sync/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { mercadoLivreService } from "@/lib/mercadolibre";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Check, CheckCircle, X, Package, Filter, ChevronDown } from "lucide-react";

import MLProductActions from "@/components/dashboard/MLProductActions";
import MLButtonsProductActions from "@/components/dashboard/MLButtonsProductActions";

interface Product {
  id: string;
  titulo: string;
  modelo_prod?: string;
  preco: number;
  estoque: number;
  ativo: boolean;
  publicar_ml: boolean;
  ml_item_id?: string;
  ml_status?: string;
  produto_imagens?: Array<{
    id: string;
    url: string;
    ordem: number;
    principal: boolean;
  }>;
  imagem_principal?: string;
}

export default function SyncMLContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [filtroStatus, setFiltroStatus] = useState<string[]>([]);
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [filtroPublicarML, setFiltroPublicarML] = useState<string>("all");

  const toggleFiltroStatus = (status: string) => {
    setFiltroStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const limparFiltros = () => {
    setSearchTerm("");
    setActiveFilter("all");
    setFiltroStatus([]);
    setFiltroPublicarML("all");
  };

  const refreshProducts = () => {
    setRefreshKey((prev) => prev + 1);
    fetchProducts();
  };

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const produtosFiltrados = products.filter((product) => {
    // Filtro por texto de busca
    if (
      searchTerm &&
      !product.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Filtro por estoque
    if (activeFilter === "in-stock" && product.estoque <= 0) {
      return false;
    }
    if (activeFilter === "out-of-stock" && product.estoque > 0) {
      return false;
    }

    // Filtro por status ML
    if (
      filtroStatus.length > 0 &&
      (!product.ml_status || !filtroStatus.includes(product.ml_status))
    ) {
      return false;
    }

    // Filtro por publicar no ML
    if (filtroPublicarML === "yes" && !product.publicar_ml) {
      return false;
    }
    if (filtroPublicarML === "no" && product.publicar_ml) {
      return false;
    }

    return true;
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("produtos")
        .select(
          `
          id, 
          titulo, 
          preco, 
          estoque, 
          ativo, 
          publicar_ml,
          ml_item_id,
          ml_status,
          produto_imagens (*)
        `
        )
        .order("titulo");

      if (error) throw error;

      const productsWithImages = (data || []).map((product) => ({
        ...product,
        imagem_principal:
          product.produto_imagens?.find((img) => img.principal)?.url ||
          product.produto_imagens?.[0]?.url ||
          null,
      }));

      setProducts(productsWithImages);
    } catch (error) {
      setError("Erro ao carregar produtos");
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (productId: string, publish: boolean) => {
    try {
      const { error } = await supabase
        .from("produtos")
        .update({ publicar_ml: publish })
        .eq("id", productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, publicar_ml: publish } : p
        )
      );
    } catch (error) {
      setError("Erro ao atualizar configuração");
      console.error("Erro ao atualizar configuração:", error);
    }
  };

  const syncProduct = async (productId: string) => {
    try {
      setSyncing((prev) => [...prev, productId]);
      setError("");
      setSuccess("");

      const product = products.find((p) => p.id === productId);
      if (!product) return;

      if (product.ml_item_id) {
        await mercadoLivreService.updateProduct(productId);
        setSuccess("Produto atualizado no Mercado Livre");
      } else {
        await mercadoLivreService.publishProduct(productId);
        setSuccess("Produto publicado no Mercado Livre");
      }

      await fetchProducts();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Erro ao sincronizar: ${errorMessage}`);
      console.error("Erro ao sincronizar produto:", err);
    } finally {
      setSyncing((prev) => prev.filter((id) => id !== productId));
    }
  };

  const syncAll = async () => {
    try {
      setError("");
      setSuccess("");

      const productsToSync = products.filter((p) => p.publicar_ml && p.ativo);

      for (const product of productsToSync) {
        setSyncing((prev) => [...prev, product.id]);
        try {
          if (product.ml_item_id) {
            await mercadoLivreService.updateProduct(product.id);
          } else {
            await mercadoLivreService.publishProduct(product.id);
          }
        } catch (err) {
          console.error(`Erro ao sincronizar produto ${product.titulo}:`, err);
        } finally {
          setSyncing((prev) => prev.filter((id) => id !== product.id));
        }
      }

      setSuccess("Sincronização em lote concluída");
      await fetchProducts();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Erro na sincronização em lote: ${errorMessage}`);
    }
  };

  const totalPages = Math.ceil(produtosFiltrados.length / itemsPerPage);
  const currentProducts = produtosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Sincronizar Produtos
            </h1>
            <p className="text-gray-600">
              Gerencie a sincronização com o Mercado Livre
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={syncAll}
              disabled={syncing.length > 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md flex items-center transition-colors"
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
              Sincronizar Todos
            </button>
            <Link
              href="/dashboard/mercadolibre/products"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md flex items-center transition-colors"
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Voltar
            </Link>
          </div>          
        </div>

          {/* Filtros e busca */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Buscar produtos por nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-12 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-500" />
                  <span className="text-sm text-gray-700">Filtrar:</span>
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="in-stock">Em estoque</option>
                    <option value="out-of-stock">Sem estoque</option>
                  </select>
                </div>
              </div>

              {/* Botão para mostrar/ocultar filtros avançados */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)
                  }
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <Filter size={16} className="mr-1" />
                  Filtros Avançados
                  <ChevronDown
                    size={16}
                    className={`ml-1 transition-transform ${
                      mostrarFiltrosAvancados ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {(filtroStatus.length > 0 || filtroPublicarML !== "all") && (
                  <button
                    onClick={limparFiltros}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center"
                  >
                    <X size={16} className="mr-1" />
                    Limpar Filtros
                  </button>
                )}
              </div>

              {/* Filtros avançados */}
              {mostrarFiltrosAvancados && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  {/* Filtro por Status ML */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Status Mercado Livre
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleFiltroStatus("active")}
                        className={`px-3 py-1 text-sm border rounded-md transition-all ${
                          filtroStatus.includes("active")
                            ? "bg-green-500 text-white border-green-500 shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                        }`}
                      >
                        Ativo
                      </button>
                      <button
                        onClick={() => toggleFiltroStatus("paused")}
                        className={`px-3 py-1 text-sm border rounded-md transition-all ${
                          filtroStatus.includes("paused")
                            ? "bg-yellow-500 text-white border-yellow-500 shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                        }`}
                      >
                        Pausado
                      </button>
                      <button
                        onClick={() => toggleFiltroStatus("")}
                        className={`px-3 py-1 text-sm border rounded-md transition-all ${
                          filtroStatus.includes("")
                            ? "bg-gray-500 text-white border-gray-500 shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                        }`}
                      >
                        Não publicado
                      </button>
                    </div>
                  </div>

                  {/* Filtro por Publicar ML */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Publicar no ML
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFiltroPublicarML("all")}
                        className={`px-3 py-1 text-sm border rounded-md transition-all ${
                          filtroPublicarML === "all"
                            ? "bg-blue-500 text-white border-blue-500 shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setFiltroPublicarML("yes")}
                        className={`px-3 py-1 text-sm border rounded-md transition-all ${
                          filtroPublicarML === "yes"
                            ? "bg-green-500 text-white border-green-500 shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setFiltroPublicarML("no")}
                        className={`px-3 py-1 text-sm border rounded-md transition-all ${
                          filtroPublicarML === "no"
                            ? "bg-red-500 text-white border-red-500 shadow-md"
                            : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cards de resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total de Produtos</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {products.length.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Em Estoque</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {products
                      .filter((p) => p.estoque > 0)
                      .length.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Check className="text-green-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-red-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Sem Estoque</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {products
                      .filter((p) => p.estoque === 0)
                      .length.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <X className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-purple-500">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Publicados no ML</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {products
                      .filter((p) => p.ml_item_id)
                      .length.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <CheckCircle className="text-purple-600" size={24} />
                </div>
              </div>
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

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {success}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Imagem
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publicar ML
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 relative">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {product.imagem_principal ? (
                        <img
                          src={product.imagem_principal}
                          alt={product.titulo}
                          className="w-12 h-12 object-cover rounded"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-image.png";
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">
                            Sem imagem
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {product.titulo}
                      </div>
                      <div className="text-xs text-gray-500">{product.modelo_prod}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {product.preco.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.estoque}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.publicar_ml || false}
                          onChange={(e) =>
                            togglePublish(product.id, e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {product.ml_status ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.ml_status === "active"
                              ? "bg-green-100 text-green-800"
                              : product.ml_status === "paused"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.ml_status === "active"
                            ? "Ativo"
                            : product.ml_status === "paused"
                            ? "Pausado"
                            : product.ml_status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          Não publicado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => syncProduct(product.id)}
                          disabled={
                            !product.publicar_ml ||
                            !product.ativo ||
                            syncing.includes(product.id)
                          }
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {syncing.includes(product.id) ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Sincronizando
                            </>
                          ) : (
                            "Sincronizar"
                          )}
                        </button>
<td className="px-4 py-4 whitespace-nowrap relative z-10">
    <div className="flex flex-col space-y-2 relative">
                        {product.ml_item_id && (
                          <MLButtonsProductActions
                            productId={product.id}
                            mlStatus={product.ml_status}
                            mlItemId={product.ml_item_id}
                            onStatusChange={refreshProducts}
                          />
                        )}
    </div>
  </td>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {products.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 bg-white border-t border-gray-200 gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                  {Math.min(currentPage * itemsPerPage, products.length)} de{" "}
                  {products.length} produtos
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page =
                    Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded text-sm ${
                        currentPage === page
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50 flex items-center"
                >
                  Próxima
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {products.length === 0 && !loading && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum produto encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece adicionando alguns produtos ao seu catálogo.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Adicionar Produto
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
