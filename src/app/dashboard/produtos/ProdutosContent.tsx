// src/app/dashboard/produtos/ProdutosContent.tsx
"use client";
export const dynamic = "force-dynamic";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import {
  Plus,
  Edit2Icon,
  Trash2,
  Search,
  Image,
  Layers,
  Upload,
  Star,
  Check,
  EyeOff,
  Eye,
  X,
  AlertCircle,
  Package,
  Tag,
  Grid,
  Filter,
  ChevronDown,
  Loader,
  Palette,
  Loader2,
} from "lucide-react";

import ImagensModal from "@/components/dashboard/produtos/ImagensModal";
import VariacoesModal from "@/components/dashboard/produtos/VariacoesModal";
import CoresModal from "@/components/dashboard/produtos/CoresModal";
import SelecionarSessoesModal from "@/components/dashboard/produtos/SelecionarSessoesModal";
import {
  ProdutosSkeleton,
  SummaryCardsSkeleton,
  TableSkeleton,
} from "@/components/dashboard/produtos/ProdutosSkeleton";
import CatalogoModal from "@/components/dashboard/produtos/CatalogoModal";

interface Produto {
  id: string;
  titulo: string;
  descricao: string;
  preco: number;
  preco_prod: number;
  preco_original: number;
  custo: number;
  margem_lucro: number;
  estoque: number;
  categoria: Categoria;
  marca: Marca;
  genero: Genero;
  modelo: string;
  modelo_prod: string;
  condicao: string;
  garantia: string;
  codigo_ean: string;
  ncm: string;
  cest: string;
  peso?: number;
  comprimento?: number;
  largura?: number;
  altura?: number;
  categoria_id?: string;
  marca_id?: string;
  genero_id?: string;
  variacoes: ProdutoVariacao[];
  imagens: ProdutoImagem[];
  created_at: string;
  ativo: boolean;
  visivel: boolean;
  desativado_em?: string;
  desativado_por?: string;
  motivo_desativacao?: string;
}

interface ProdutoVariacao {
  id: string;
  tamanho_id: string;
  cor_id: string;
  estoque: number;
  preco: number;
  preco_prod: number;
  codigo_ean: string;
  sku: string;
  tamanho: {
    nome: string;
  };
  cor: {
    nome: string;
    codigo_hex: string;
  };
}

interface ProdutoImagem {
  id: string;
  url: string;
  ordem: number;
  principal: boolean;
}

interface Categoria {
  id: string;
  nome: string;
}

interface Marca {
  id: string;
  nome: string;
}

interface Genero {
  id: string;
  nome: string;
}

interface Cor {
  id: string;
  nome: string;
  codigo_hex: string;
}

interface Tamanho {
  id: string;
  nome: string;
}

export default function ProdutosContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showVariacoesModal, setShowVariacoesModal] = useState(false);
  const [showImagensModal, setShowImagensModal] = useState(false);
  const [currentProdutoId, setCurrentProdutoId] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [imagensProduto, setImagensProduto] = useState<ProdutoImagem[]>([]);
  const [coresSelecionadas, setCoresSelecionadas] = useState<string[]>([]);
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<string[]>(
    [],
  );

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  const [produtoDesativando, setProdutoDesativando] = useState<string | null>(
    null,
  );
  const [precoFormatado, setPrecoFormatado] = useState("");
  const [precoOriginalFormatado, setPrecoOriginalFormatado] = useState("");
  const [custoFormatado, setCustoFormatado] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showCoresModal, setShowCoresModal] = useState(false);
  const [pesquisaTexto, setPesquisaTexto] = useState("");
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalEmEstoque, setTotalEmEstoque] = useState(0);
  const [totalSemEstoque, setTotalSemEstoque] = useState(0);

  const [filtroTamanhos, setFiltroTamanhos] = useState<string[]>([]);
  const [filtroCores, setFiltroCores] = useState<string[]>([]);
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [filtroGeneros, setFiltroGeneros] = useState<string[]>([]);
  const [filtroCategorias, setFiltroCategorias] = useState<string[]>([]);
  const [filtroMarcas, setFiltroMarcas] = useState<string[]>([]);
  const [mostrarPrecosCatalogo, setMostrarPrecosCatalogo] = useState(true);

  const [precoProdFormatado, setPrecoProdFormatado] = useState("");

  const [showCatalogo, setShowCatalogo] = useState(false);

  const [showSessoesModal, setShowSessoesModal] = useState(false);
  const [produtoParaSessoes, setProdutoParaSessoes] = useState<{
    id: string;
    titulo: string;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // estado para controle de loading silencioso
  const [silentLoading, setSilentLoading] = useState(false);

  // Função para exibir notificações temporárias
  const handleDesativarProduto = async (produtoId: string) => {
    try {
      const { value: motivo } = await Swal.fire({
        title: "Desativar Produto",
        input: "textarea",
        inputLabel: "Motivo da desativação",
        inputPlaceholder: "Digite o motivo para desativar este produto...",
        inputAttributes: {
          "aria-label": "Digite o motivo da desativação",
        },
        showCancelButton: true,
        confirmButtonText: "Desativar",
        cancelButtonText: "Cancelar",
        inputValidator: (value) => {
          if (!value) {
            return "Por favor, informe o motivo da desativação";
          }
        },
      });

      if (!motivo) return;

      setProdutoDesativando(produtoId);

      const { error } = await supabase
        .from("produtos")
        .update({
          ativo: false,
          desativado_em: new Date().toISOString(),
          desativado_por: user?.id,
          motivo_desativacao: motivo,
        })
        .eq("id", produtoId);

      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Produto Desativado!",
        text: "O produto foi desativado com sucesso.",
        timer: 2000,
        showConfirmButton: false,
      });

      loadProdutos();
    } catch (error) {
      console.error("Erro ao desativar produto:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível desativar o produto.",
      });
    } finally {
      setProdutoDesativando(null);
    }
  };

  // Ocultar produtos sem estoque
  const ocultarProdutosSemEstoque = async () => {
    try {
      const result = await Swal.fire({
        title: "Ocultar Produtos sem Estoque",
        html: `
        <div class="text-left">
          <p>Esta ação irá:</p>
          <ul class="list-disc list-inside mt-2 text-sm">
            <li>Verificar TODOS os produtos ativos</li>
            <li>Calcular o estoque total somando todas as variações</li>
            <li>Ocultar do site (visivel = false) os produtos com estoque total = 0</li>
            <li>Produtos com estoque > 0 permanecerão visíveis</li>
          </ul>
          <p class="mt-3 text-yellow-600 font-medium">⚠️ Esta ação não pode ser desfeita automaticamente!</p>
          <p class="text-sm text-gray-600 mt-2">Para reverter, será necessário reativar manualmente cada produto.</p>
        </div>
      `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, ocultar produtos sem estoque",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#EF4444",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      setLoadingProdutos(true);

      // 1. Buscar todos os produtos ativos (visíveis)
      const { data: produtosAtivos, error: fetchError } = await supabase
        .from("produtos")
        .select(
          `
        id,
        titulo,
        visivel,
        variacoes:produto_variacoes(estoque)
      `,
        )
        .eq("ativo", true)
        .eq("visivel", true);

      if (fetchError) throw fetchError;

      if (!produtosAtivos || produtosAtivos.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Nenhum produto ativo",
          text: "Não há produtos ativos e visíveis para processar.",
        });
        setLoadingProdutos(false);
        return;
      }

      // 2. Calcular estoque total e identificar produtos a ocultar
      const produtosParaOcultar: {
        id: string;
        titulo: string;
        estoqueTotal: number;
      }[] = [];

      for (const produto of produtosAtivos) {
        // Soma o estoque de todas as variações
        const estoqueTotal =
          produto.variacoes?.reduce(
            (sum: number, variacao: any) => sum + (variacao.estoque || 0),
            0,
          ) || 0;

        if (estoqueTotal === 0) {
          produtosParaOcultar.push({
            id: produto.id,
            titulo: produto.titulo,
            estoqueTotal: 0,
          });
        }
      }

      // 3. Se não há produtos para ocultar
      if (produtosParaOcultar.length === 0) {
        Swal.fire({
          icon: "success",
          title: "Nenhum produto encontrado",
          text: "Todos os produtos ativos possuem estoque disponível!",
          timer: 2000,
          showConfirmButton: false,
        });
        setLoadingProdutos(false);
        return;
      }

      // 4. Confirmar quais produtos serão ocultados
      const { isConfirmed: confirmarOcultacao } = await Swal.fire({
        title: `Ocultar ${produtosParaOcultar.length} produto(s)?`,
        html: `
        <div class="text-left max-h-60 overflow-y-auto">
          <p class="font-medium mb-2">Produtos que serão ocultados:</p>
          <ul class="list-disc list-inside text-sm">
            ${produtosParaOcultar
              .slice(0, 10)
              .map(
                (p) => `
              <li>${p.titulo}</li>
            `,
              )
              .join("")}
            ${produtosParaOcultar.length > 10 ? `<li class="text-gray-500">... e mais ${produtosParaOcultar.length - 10} produto(s)</li>` : ""}
          </ul>
        </div>
      `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: `Sim, ocultar ${produtosParaOcultar.length} produto(s)`,
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#EF4444",
      });

      if (!confirmarOcultacao) {
        setLoadingProdutos(false);
        return;
      }

      // 5. Atualizar os produtos em lote
      let sucessos = 0;
      let erros = 0;
      const errosLista: string[] = [];

      // Processar em lotes de 50 para não sobrecarregar
      const batchSize = 50;
      for (let i = 0; i < produtosParaOcultar.length; i += batchSize) {
        const batch = produtosParaOcultar.slice(i, i + batchSize);
        const idsParaOcultar = batch.map((p) => p.id);

        const { error: updateError } = await supabase
          .from("produtos")
          .update({
            visivel: false,
            updated_at: new Date().toISOString(),
          })
          .in("id", idsParaOcultar);

        if (updateError) {
          erros += batch.length;
          errosLista.push(
            `Erro ao ocultar lote ${i / batchSize + 1}: ${updateError.message}`,
          );
        } else {
          sucessos += batch.length;
        }
      }

      // 6. Mostrar resultado final
      if (erros > 0) {
        Swal.fire({
          icon: "warning",
          title: "Processo concluído com erros",
          html: `
          <div class="text-left">
            <p>✅ Ocultados: ${sucessos} produto(s)</p>
            <p>❌ Falhas: ${erros} produto(s)</p>
            ${errosLista.length > 0 ? `<p class="text-red-600 text-sm mt-2">Erros: ${errosLista[0]}</p>` : ""}
          </div>
        `,
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Produtos ocultados!",
          html: `
          <div class="text-center">
            <p class="text-lg font-bold">${sucessos} produto(s) foram ocultados do site</p>
            <p class="text-sm text-gray-600 mt-2">Produtos com estoque zerado agora estão invisíveis no catálogo.</p>
          </div>
        `,
          timer: 3000,
          showConfirmButton: false,
        });
      }

      // Recarregar a lista de produtos
      loadProdutos();
    } catch (error) {
      console.error("Erro ao ocultar produtos sem estoque:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Ocorreu um erro ao processar a solicitação.",
      });
    } finally {
      setLoadingProdutos(false);
    }
  };

  // Função para alternar visibilidade do produto
  const handleToggleVisibilidade = async (
    produtoId: string,
    visivelAtual: boolean,
  ) => {
    try {
      const novoEstado = !visivelAtual;
      const acao = novoEstado ? "exibir" : "ocultar";

      const result = await Swal.fire({
        title: `${novoEstado ? "Exibir" : "Ocultar"} Produto`,
        text: `Deseja ${novoEstado ? "exibir" : "ocultar"} este produto no site?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: `Sim, ${acao}`,
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) return;

      const { error } = await supabase
        .from("produtos")
        .update({ visivel: novoEstado })
        .eq("id", produtoId);

      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: `Produto ${novoEstado ? "visível" : "oculto"} no site.`,
        timer: 2000,
        showConfirmButton: false,
      });

      loadProdutos(); // Recarregar lista
    } catch (error) {
      console.error("Erro ao alterar visibilidade:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível alterar a visibilidade do produto.",
      });
    }
  };

  const handleReativarProduto = async (produtoId: string) => {
    try {
      const result = await Swal.fire({
        title: "Reativar Produto",
        text: "Deseja reativar este produto?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sim, reativar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#10B981",
      });

      if (!result.isConfirmed) return;

      const { error } = await supabase
        .from("produtos")
        .update({
          ativo: true,
          desativado_em: null,
          desativado_por: null,
          motivo_desativacao: null,
        })
        .eq("id", produtoId);

      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Produto Reativado!",
        text: "O produto foi reativado com sucesso.",
        timer: 2000,
        showConfirmButton: false,
      });

      loadProdutos();
    } catch (error) {
      console.error("Erro ao reativar produto:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível reativar o produto.",
      });
    }
  };

  // Função para alterar a quantidade de itens por página

  const handleItemsPerPageChange = (value: number) => {
    console.log("handleItemsPerPageChange chamado:", value);
    setItemsPerPage(value);
    setCurrentPage(1);
    setLoadingProdutos(true);
    loadProdutos(1);
  };

  // Função principal para carregar produtos com filtros, pesquisa e paginação

  const loadProdutos = useCallback(
    async (
      page?: number,
      pesquisa?: string,
      search?: string,
      filter?: string,
      tamanhosFiltro?: string[],
      coresFiltro?: string[],
      generosFiltro?: string[],
      categoriasFiltro?: string[],
      marcasFiltro?: string[],
      isSilent = false,
    ) => {
      // Evitar chamadas simultâneas
      if (isRefreshing) return;

      setIsRefreshing(true);

      // Só mostra loading se NÃO for silencioso
      if (!isSilent) {
        setLoadingProdutos(true);
      } else {
        setSilentLoading(true);
      }

      // Determinar parâmetros
      const targetPage = page !== undefined ? page : currentPage;
      const targetPesquisa = pesquisa !== undefined ? pesquisa : pesquisaTexto;
      const targetSearch = search !== undefined ? search : searchTerm;
      const targetFilter = filter !== undefined ? filter : activeFilter;
      const targetTamanhos =
        tamanhosFiltro !== undefined ? tamanhosFiltro : filtroTamanhos;
      const targetCores = coresFiltro !== undefined ? coresFiltro : filtroCores;
      const targetGeneros =
        generosFiltro !== undefined ? generosFiltro : filtroGeneros;
      const targetCategorias =
        categoriasFiltro !== undefined ? categoriasFiltro : filtroCategorias;
      const targetMarcas =
        marcasFiltro !== undefined ? marcasFiltro : filtroMarcas;

      try {
        console.log("=== LOAD PRODUTOS ===");
        console.log("Página solicitada:", targetPage);
        console.log("Página atual state:", currentPage);

        const from = (targetPage - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        let query = supabase
          .from("produtos")
          .select(
            `
          *,
          categoria:categorias(nome, id),
          marca:marcas(nome, id),
          genero:generos(nome, id),
          variacoes:produto_variacoes(
            id,
            tamanho_id,
            cor_id,
            estoque,
            preco,
            preco_prod,
            codigo_ean,
            sku,
            tamanho:tamanhos(nome),
            cor:cores(nome, codigo_hex)
          ),
          imagens:produto_imagens(*)
        `,
            { count: "exact" },
          )
          .eq("ativo", true)
          .order("created_at", { ascending: false });

        // Aplicar pesquisa
        if (targetPesquisa) {
          query = query.or(
            `titulo.ilike.%${targetPesquisa}%,descricao.ilike.%${targetPesquisa}%`,
          );

          const { data: categoriasMatch } = await supabase
            .from("categorias")
            .select("id")
            .ilike("nome", `%${targetPesquisa}%`);

          const { data: marcasMatch } = await supabase
            .from("marcas")
            .select("id")
            .ilike("nome", `%${targetPesquisa}%`);

          const categoriaIds = categoriasMatch?.map((c) => c.id) || [];
          const marcaIds = marcasMatch?.map((m) => m.id) || [];

          if (categoriaIds.length > 0 || marcaIds.length > 0) {
            const orConditions = [];
            if (categoriaIds.length > 0) {
              orConditions.push(`categoria_id.in.(${categoriaIds.join(",")})`);
            }
            if (marcaIds.length > 0) {
              orConditions.push(`marca_id.in.(${marcaIds.join(",")})`);
            }
            query = query.or(orConditions.join(","));
          }
        }

        // Aplicar filtros
        if (targetFilter === "in-stock") {
          query = query.gt("estoque", 0);
        } else if (targetFilter === "out-of-stock") {
          query = query.eq("estoque", 0);
        }

        if (targetCategorias.length > 0) {
          query = query.in("categoria_id", targetCategorias);
        }

        if (targetMarcas.length > 0) {
          query = query.in("marca_id", targetMarcas);
        }

        if (targetGeneros.length > 0) {
          query = query.in("genero_id", targetGeneros);
        }

        if (targetTamanhos.length > 0) {
          const { data: produtosComTamanhos } = await supabase
            .from("produto_variacoes")
            .select("produto_id")
            .in("tamanho_id", targetTamanhos);

          if (produtosComTamanhos && produtosComTamanhos.length > 0) {
            const produtoIds = [
              ...new Set(produtosComTamanhos.map((p) => p.produto_id)),
            ];
            query = query.in("id", produtoIds);
          } else {
            setProdutos([]);
            setTotalItems(0);
            setLoadingProdutos(false);
            setIsRefreshing(false);
            return;
          }
        }

        if (targetCores.length > 0) {
          const { data: produtosComCores } = await supabase
            .from("produto_variacoes")
            .select("produto_id")
            .in("cor_id", targetCores);

          if (produtosComCores && produtosComCores.length > 0) {
            const produtoIds = [
              ...new Set(produtosComCores.map((p) => p.produto_id)),
            ];
            query = query.in("id", produtoIds);
          } else {
            setProdutos([]);
            setTotalItems(0);
            setLoadingProdutos(false);
            setIsRefreshing(false);
            return;
          }
        }

        if (targetFilter === "visible") {
          query = query.eq("visivel", true);
        } else if (targetFilter === "hidden") {
          query = query.eq("visivel", false);
        }

        console.log("Executando query - Range:", from, "to:", to);
        const { data, error, count } = await query.range(from, to);

        if (error) throw error;

        console.log("Resultado - Count:", count, "Data length:", data?.length);

        setProdutos(data || []);
        setTotalItems(count || 0);

        // Atualizar página atual apenas se necessário e se for diferente
        const newPage = Math.min(
          targetPage,
          Math.max(1, Math.ceil((count || 0) / itemsPerPage)),
        );
        if (newPage !== currentPage) {
          console.log("Atualizando página de", currentPage, "para", newPage);
          setCurrentPage(newPage);
        } else if (page !== undefined && page !== currentPage) {
          setCurrentPage(page);
        }

        // Atualizar totais dos cards
        const { data: totalEstoqueData } = await supabase
          .from("produtos")
          .select("estoque");

        const { data: emEstoqueData } = await supabase
          .from("produtos")
          .select("estoque")
          .gt("estoque", 0);

        const { data: semEstoqueData } = await supabase
          .from("produtos")
          .select("estoque")
          .eq("estoque", 0);

        const totalEmEstoqueSum =
          emEstoqueData?.reduce(
            (sum, produto) => sum + (produto.estoque || 0),
            0,
          ) || 0;
        const totalSemEstoqueCount = semEstoqueData?.length || 0;

        setTotalProdutos(totalEstoqueData?.length || 0);
        setTotalEmEstoque(totalEmEstoqueSum);
        setTotalSemEstoque(totalSemEstoqueCount);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        showNotification("error", "Erro ao carregar produtos");
      } finally {
        setLoadingProdutos(false);
        setSilentLoading(false);
        setIsRefreshing(false);
        setIsInitialLoad(false);
      }
    },
    [
      itemsPerPage,
      currentPage,
      pesquisaTexto,
      searchTerm,
      activeFilter,
      filtroTamanhos,
      filtroCores,
      filtroGeneros,
      filtroCategorias,
      filtroMarcas,
      isRefreshing,
    ],
  );

  // 3. CORRIJA a função handlePageChange
  const handlePageChange = (page: number) => {
    if (page < 1) return;
    if (totalPages > 0 && page > totalPages) return;
    if (page === currentPage) return;
    if (isRefreshing) return;

    console.log("handlePageChange chamado para página:", page);
    setLoadingProdutos(true);
    loadProdutos(
      page,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
    );
  };

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Carregar produtos, categorias, marcas e gêneros ao montar o componente
  useEffect(() => {
    if (user && isInitialLoad) {
      console.log("Carregamento inicial");
      setLoadingProdutos(true);
      loadProdutos(1);
      loadCategorias();
      loadMarcas();
      loadGeneros();
      loadCores();
      loadTamanhos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Carregar imagens, tamanhos e cores do produto ao abrir modal de edição
  useEffect(() => {
    if (editingProduto && editingProduto.imagens) {
      setImagensProduto(editingProduto.imagens);
    }

    if (editingProduto && editingProduto.variacoes) {
      // Carregar tamanhos (sem duplicatas)
      const tamanhosIds = [
        ...new Set(
          editingProduto.variacoes
            .filter((v) => v.tamanho_id)
            .map((v) => v.tamanho_id),
        ),
      ];
      setTamanhosSelecionados(tamanhosIds);

      // ⭐ NOVO: Carregar cores selecionadas
      const coresIds = [
        ...new Set(
          editingProduto.variacoes.filter((v) => v.cor_id).map((v) => v.cor_id),
        ),
      ];
      setCoresSelecionadas(coresIds);

      // Preencher preços
      setPrecoFormatado(editingProduto.preco.toFixed(2).replace(".", ","));

      setPrecoProdFormatado(
        editingProduto.preco_prod?.toFixed(2).replace(".", ",") || "",
      );
      setCustoFormatado(
        (editingProduto.custo || 0).toFixed(2).replace(".", ","),
      );

      if (editingProduto.preco_original) {
        setPrecoOriginalFormatado(
          editingProduto.preco_original.toFixed(2).replace(".", ","),
        );
      }
    } else {
      setTamanhosSelecionados([]);
      setCoresSelecionadas([]);
      setPrecoFormatado("");
      setPrecoOriginalFormatado("");
      setCustoFormatado("");
    }
  }, [editingProduto]);

  // Limpar estados relacionados ao produto ao fechar modal
  useEffect(() => {
    if (!showModal) {
      setTimeout(() => {
        setPrecoFormatado("");
        setPrecoProdFormatado("");
        setPrecoOriginalFormatado("");
        setCustoFormatado("");
        setCoresSelecionadas([]);
        setTamanhosSelecionados([]);
        setImagensProduto([]);
      }, 300);
    }
  }, [showModal]);

  // Preencher campos do formulário ao abrir modal de edição
  useEffect(() => {
    if (showModal && editingProduto) {
      const form = document.querySelector("form");
      if (form) {
        setTimeout(() => {
          Object.entries(editingProduto).forEach(([key, value]) => {
            const input = form.elements.namedItem(key) as HTMLInputElement;
            if (input && value !== null && value !== undefined) {
              input.value = value.toString();
            }
          });
        }, 100);
      }
    }
  }, [showModal, editingProduto]);

  useEffect(() => {
    if (!loadingProdutos) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage, loadingProdutos]);

  useEffect(() => {
    if (tamanhosSelecionados.length > 0 && editingProduto) {
      let estoqueTotal = 0;

      tamanhosSelecionados.forEach((tamanhoId) => {
        const quantidadeInput = document.querySelector(
          `input[name="quantidade_${tamanhoId}"]`,
        ) as HTMLInputElement;
        if (quantidadeInput) {
          estoqueTotal += parseInt(quantidadeInput.value) || 0;
        }
      });

      const estoqueInput = document.querySelector(
        'input[name="estoque"]',
      ) as HTMLInputElement;
      if (estoqueInput) {
        estoqueInput.value = estoqueTotal.toString();
      }
    }
  }, [tamanhosSelecionados, editingProduto]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Usuário no cliente:", user);
    };
    checkAuth();
  }, []);

  const [pesquisaInput, setPesquisaInput] = useState("");
  const loadProdutosRef = useRef(loadProdutos);

  useEffect(() => {
    if (user && !isInitialLoad) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeoutId = setTimeout(() => {
        if (pesquisaInput !== pesquisaTexto) {
          console.log("Pesquisa com debounce:", pesquisaInput);
          setPesquisaTexto(pesquisaInput);
          setLoadingProdutos(true);
          loadProdutos(1, pesquisaInput, pesquisaInput);
        }
      }, 800);
      setSearchTimeout(timeoutId);

      return () => {
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pesquisaInput, user, isInitialLoad]);

  // Adicione esta função para buscar manualmente (ao pressionar Enter)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setPesquisaTexto(pesquisaInput);
    setLoadingProdutos(true);
    loadProdutos(
      1,
      pesquisaInput,
      pesquisaInput,
      activeFilter,
      filtroTamanhos,
      filtroCores,
      filtroGeneros,
      filtroCategorias,
      filtroMarcas,
    );
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const limparFiltros = () => {
    setFiltroTamanhos([]);
    setFiltroCores([]);
    setFiltroGeneros([]);
    setFiltroCategorias([]);
    setFiltroMarcas([]);
    setActiveFilter("all");
    setSearchTerm("");
    setPesquisaInput("");
    setPesquisaTexto("");
    setLoadingProdutos(true);
    loadProdutos(1, "", "", "all", [], [], [], [], [], true);
  };

  const loadCategorias = async () => {
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .order("nome");
    setCategorias(data || []);
  };

  const loadMarcas = async () => {
    const { data } = await supabase.from("marcas").select("*").order("nome");
    setMarcas(data || []);
  };

  const loadGeneros = async () => {
    const { data } = await supabase.from("generos").select("*").order("nome");
    setGeneros(data || []);
  };

  const loadCores = async () => {
    const { data } = await supabase.from("cores").select("*").order("nome");
    setCores(data || []);
  };

  const loadTamanhos = async () => {
    const { data } = await supabase.from("tamanhos").select("*").order("nome");
    setTamanhos(data || []);
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: pedidos, error: pedidosError } = await supabase
        .from("pedido_itens")
        .select("id")
        .eq("produto_id", id)
        .limit(1);

      if (pedidosError) throw pedidosError;

      if (pedidos && pedidos.length > 0) {
        await Swal.fire({
          icon: "warning",
          title: "Não é possível excluir",
          html: `
        <div class="text-left">
          <p>Este produto possui <strong>${pedidos.length} pedido(s)</strong> associado(s).</p>
          <p class="mt-2">Para manter a integridade dos dados históricos, recomendamos:</p>
          <ul class="list-disc list-inside mt-2 text-sm">
            <li><strong>Desativar</strong> o produto em vez de excluir</li>
            <li>O produto não aparecerá mais no catálogo</li>
            <li>Os pedidos existentes serão preservados</li>
          </ul>
        </div>
      `,
          confirmButtonText: "Entendi",
          confirmButtonColor: "#3B82F6",
        });
        return;
      }

      // excluir variações, imagens e características relacionadas
      const tabelasRelacionadas = [
        "processamento_ml",
        "produto_variacoes",
        "produto_imagens",
        "produto_caracteristicas",
      ];

      for (const tabela of tabelasRelacionadas) {
        const { error } = await supabase
          .from(tabela)
          .delete()
          .eq("produto_id", id);

        if (error && !error.message.includes("No rows found")) {
          console.warn(`Erro ao limpar ${tabela}:`, error);
        }
      }

      // CONFIRMAÇÃO FINAL
      const result = await Swal.fire({
        title: "Excluir Permanentemente?",
        text: "Esta ação não pode ser desfeita. Tem certeza que deseja excluir o produto?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, excluir",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#EF4444",
        reverseButtons: true,
      });

      if (!result.isConfirmed) return;

      // EXCLUIR PRODUTO
      const { error } = await supabase.from("produtos").delete().eq("id", id);

      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Excluído!",
        text: "Produto excluído com sucesso.",
        timer: 1500,
        showConfirmButton: false,
      });

      loadProdutos();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível excluir o produto devido a vínculos existentes.",
      });
    }
  };

  // Função para gerar slug base (sem verificação de duplicidade)
  const gerarSlug = (titulo: string): string => {
    return titulo
      .toLowerCase()
      .trim()
      .normalize("NFD") // Remove acentos
      .replace(/[\u0300-\u036f]/g, "") // Remove caracteres acentuados
      .replace(/[^\w\s-]/g, "") // Remove caracteres especiais
      .replace(/[\s_-]+/g, "-") // Substitui espaços e underscores por hífens
      .replace(/^-+|-+$/g, ""); // Remove hífens do início e fim
  };

  // Função aprimorada para gerar slug único
  const gerarSlugUnico = async (
    titulo: string,
    produtoId?: string,
  ): Promise<string> => {
    const slugBase = gerarSlug(titulo);
    let slug = slugBase;
    let contador = 1;

    while (true) {
      let query = supabase.from("produtos").select("id").eq("slug", slug);

      // Se estiver editando, exclui o próprio produto da verificação
      if (produtoId) {
        query = query.neq("id", produtoId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Erro ao verificar slug:", error);
        // Em caso de erro, retorna o slug base mesmo
        return slugBase;
      }

      if (!data) {
        break; // Slug disponível
      }

      // Slug já existe, tenta com número
      slug = `${slugBase}-${contador}`;
      contador++;
    }

    return slug;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🟢 Iniciando handleSubmit");

    // Verificação de variações antigas
    const hasOldVariationsWithoutColor =
      editingProduto &&
      editingProduto.variacoes &&
      editingProduto.variacoes.length > 0 &&
      editingProduto.variacoes.some((v) => !v.cor_id);

    if (hasOldVariationsWithoutColor && coresSelecionadas.length === 0) {
      console.log(
        "🟡 Produto com variações antigas sem cor e nenhuma cor selecionada",
      );
      const result = await Swal.fire({
        title: "Atenção!",
        html: `
      <div class="text-left">
        <p>Este produto possui <strong>${editingProduto.variacoes.length} variação(ões)</strong> do sistema antigo (sem cor definida).</p>
        <p class="mt-2">Se continuar sem selecionar cores:</p>
        <ul class="list-disc list-inside mt-2 text-sm">
          <li>Todas as variações atuais serão <strong>excluídas</strong></li>
          <li>O <strong>estoque será zerado</strong></li>
          <li>Será necessário recadastrar as variações com cores</li>
        </ul>
        <p class="mt-3 font-medium">Deseja continuar?</p>
      </div>
    `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, continuar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#EF4444",
        reverseButtons: true,
      });

      if (!result.isConfirmed) {
        console.log("🔴 Usuário cancelou a ação devido a variações antigas");
        return; // Interrompe o envio se usuário cancelar
      }
    }

    // Validação de preço
    if (!precoFormatado) {
      console.log("🔴 Preço não preenchido");
      showNotification("error", "Preço é obrigatório");
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const codigoEan = (formData.get("codigo_ean") as string)?.trim();
    const ncm = (formData.get("ncm") as string)?.trim();
    const cest = (formData.get("cest") as string)?.trim();

    // Validações de comprimento dos campos
    if (codigoEan && codigoEan.length !== 13) {
      showNotification("error", "Código EAN deve ter exatamente 13 caracteres");
      return;
    }

    if (ncm && ncm.length !== 8) {
      showNotification("error", "NCM deve ter exatamente 8 caracteres");
      return;
    }

    if (cest && cest.length !== 7) {
      showNotification("error", "CEST deve ter exatamente 7 caracteres");
      return;
    }

    // Convertendo preços
    const preco = removerMascaraPreco(precoFormatado);
    const preco_prod = removerMascaraPreco(precoProdFormatado);
    const custo = removerMascaraPreco(custoFormatado);
    const preco_original = precoOriginalFormatado
      ? removerMascaraPreco(precoOriginalFormatado)
      : null;

    console.log("💰 Preços convertidos:", {
      preco,
      preco_prod,
      custo,
      preco_original,
    });

    if (preco <= 0 || preco_prod <= 0 || custo < 0) {
      console.log("🔴 Preços inválidos");
      showNotification("error", "Preços devem ser maiores que zero");
      return;
    }

    // Cálculo do estoque total
    let estoqueTotal = 0;
    const tamanhosUnicos = [...new Set(tamanhosSelecionados)];

    if (tamanhosUnicos.length > 0 && coresSelecionadas.length > 0) {
      console.log("📦 Calculando estoque por variações...");
      for (const tamanhoId of tamanhosUnicos) {
        for (const corId of coresSelecionadas) {
          const quantidade =
            parseInt(
              formData.get(`quantidade_${tamanhoId}_${corId}`) as string,
            ) || 0;
          console.log(
            `Tamanho: ${tamanhoId}, Cor: ${corId}, Qtd: ${quantidade}`,
          );
          estoqueTotal += quantidade;
        }
      }
      console.log("✅ Estoque total por variações:", estoqueTotal);
    } else {
      const estoquePrincipal = parseInt(formData.get("estoque") as string) || 0;
      estoqueTotal = estoquePrincipal;
      console.log("📦 Usando estoque principal:", estoquePrincipal);
    }

    console.log("🎯 Estoque final a ser salvo:", estoqueTotal);

    // Preparar dados do produto
    const slug = await gerarSlugUnico(
      formData.get("titulo") as string,
      editingProduto?.id,
    );

    const produtoData = {
      titulo: formData.get("titulo") as string,
      descricao: formData.get("descricao") as string,
      preco: preco,
      preco_prod: preco_prod,
      preco_original: preco_original,
      custo: custo,
      margem_lucro: parseFloat(formData.get("margem_lucro") as string) || 0,
      estoque: estoqueTotal,
      categoria_id: formData.get("categoria_id") as string,
      marca_id: formData.get("marca_id") as string,
      genero_id: formData.get("genero_id") as string,
      modelo_prod: formData.get("modelo_prod") as string,
      modelo: formData.get("modelo") as string,
      condicao: formData.get("condicao") as string,
      garantia: formData.get("garantia") as string,
      codigo_ean: codigoEan,
      ncm: ncm,
      cest: cest,
      peso: parseFloat(formData.get("peso") as string) || null,
      comprimento: parseFloat(formData.get("comprimento") as string) || null,
      largura: parseFloat(formData.get("largura") as string) || null,
      altura: parseFloat(formData.get("altura") as string) || null,
      slug: slug,
    };

    console.log("📝 Dados do produto a serem salvos:", produtoData);

    try {
      let produtoId = editingProduto?.id;
      let result;

      if (editingProduto) {
        console.log("🔄 Atualizando produto:", editingProduto.id);
        result = await supabase
          .from("produtos")
          .update(produtoData)
          .eq("id", editingProduto.id)
          .select();
      } else {
        console.log("🆕 Criando novo produto");
        result = await supabase.from("produtos").insert([produtoData]).select();
      }

      const { data, error } = result;

      if (error) {
        console.error("❌ Erro ao salvar produto:", error);
        throw error;
      }

      console.log("✅ Produto salvo com sucesso:", data);

      if (data && data.length > 0) {
        produtoId = data[0].id;
      }

      // Processar variações se houver tamanhos e cores selecionados
      if (
        produtoId &&
        tamanhosUnicos.length > 0 &&
        coresSelecionadas.length > 0
      ) {
        console.log("🔄 Processando variações...");

        // Remove variações existentes
        await supabase
          .from("produto_variacoes")
          .delete()
          .eq("produto_id", produtoId);

        // Cria novas variações apenas para combinações com estoque > 0
        const variacoesToInsert = [];

        for (const tamanhoId of tamanhosUnicos) {
          for (const corId of coresSelecionadas) {
            const quantidade =
              parseInt(
                formData.get(`quantidade_${tamanhoId}_${corId}`) as string,
              ) || 0;

            if (quantidade > 0) {
              const tamanho = tamanhos.find((t) => t.id === tamanhoId);
              const cor = cores.find((c) => c.id === corId);

              variacoesToInsert.push({
                produto_id: produtoId,
                tamanho_id: tamanhoId,
                cor_id: corId,
                estoque: quantidade,
                preco: produtoData.preco,
                preco_prod: produtoData.preco_prod,
                codigo_ean: produtoData.codigo_ean,
                sku: `${produtoData.codigo_ean}_${tamanho?.nome || ""}_${
                  cor?.nome || ""
                }`.replace(/\s+/g, "_"),
              });
            }
          }
        }

        if (variacoesToInsert.length > 0) {
          console.log(
            `📥 Inserindo ${variacoesToInsert.length} variações com estoque`,
          );
          const { error: variacoesError } = await supabase
            .from("produto_variacoes")
            .insert(variacoesToInsert);

          if (variacoesError) {
            console.error("❌ Erro ao salvar variações:", variacoesError);
            throw variacoesError;
          }
          console.log("✅ Variações salvas com sucesso");
        } else {
          console.log("ℹ️  Nenhuma variação com estoque para salvar");
        }
      }

      showNotification(
        "success",
        editingProduto
          ? "Produto atualizado com sucesso"
          : "Produto criado com sucesso",
      );

      setShowModal(false);
      setEditingProduto(null);
      setImagensProduto([]);
      setCoresSelecionadas([]);
      setTamanhosSelecionados([]);
      setPrecoFormatado("");
      setPrecoOriginalFormatado("");

      // Recarrega os produtos
      console.log("🔄 Recarregando lista de produtos...");
      loadProdutos();
    } catch (error) {
      console.error("💥 Erro completo ao salvar produto:", error);
      if (error instanceof Error) {
        showNotification("error", `Erro ao salvar produto: ${error.message}`);
      } else {
        showNotification("error", "Erro ao salvar produto");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduto) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          alert("Por favor, selecione apenas arquivos de imagem");
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert("A imagem deve ter no máximo 5MB");
          continue;
        }

        const publicUrl = await uploadImage(file, editingProduto.id);

        const { data, error } = await supabase
          .from("produto_imagens")
          .insert([
            {
              produto_id: editingProduto.id,
              url: publicUrl,
              ordem: imagensProduto.length + i,
              principal: imagensProduto.length === 0,
            },
          ])
          .select();

        if (error) throw error;

        setImagensProduto((prev) => [...prev, ...data]);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      showNotification("error", "Erro ao fazer upload da imagem");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const uploadImage = async (
    file: File,
    produtoId: string,
  ): Promise<string> => {
    try {
      // Gera um nome único para o arquivo
      const fileExt = file.name.split(".").pop();
      const fileName = `${produtoId}/${Math.random()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("produtos") // Nome do bucket no Supabase Storage
        .upload(fileName, file);

      if (error) throw error;

      // Obtém a URL pública da imagem
      const {
        data: { publicUrl },
      } = supabase.storage.from("produtos").getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      throw new Error("Falha no upload da imagem");
    }
  };

  const handleDeleteImage = async (imagemId: string, imageUrl: string) => {
    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;

    try {
      await deleteImage(imageUrl);

      const { error } = await supabase
        .from("produto_imagens")
        .delete()
        .eq("id", imagemId);

      if (error) throw error;

      setImagensProduto((prev) => prev.filter((img) => img.id !== imagemId));
      showNotification("success", "Imagem excluída com sucesso");
    } catch (error) {
      console.error("Erro ao excluir imagem:", error);
      showNotification("error", "Erro ao excluir imagem");
    }
  };

  const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
      // Extrai o caminho do arquivo da URL
      const urlParts = imageUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const produtoId = urlParts[urlParts.length - 2];
      const filePath = `${produtoId}/${fileName}`;

      const { error } = await supabase.storage
        .from("produtos")
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao excluir imagem do storage:", error);
      throw new Error("Falha ao excluir imagem");
    }
  };

  const setAsPrincipal = async (imagemId: string) => {
    try {
      // Remove principal de todas as imagens
      await supabase
        .from("produto_imagens")
        .update({ principal: false })
        .eq("produto_id", editingProduto?.id);

      // Define a nova principal
      const { error } = await supabase
        .from("produto_imagens")
        .update({ principal: true })
        .eq("id", imagemId);

      if (error) throw error;

      // Atualiza o estado local
      setImagensProduto((prev) =>
        prev.map((img) => ({
          ...img,
          principal: img.id === imagemId,
        })),
      );
      showNotification("success", "Imagem principal definida");
    } catch (error) {
      console.error("Erro ao definir imagem principal:", error);
      showNotification("error", "Erro ao definir imagem principal");
    }
  };

  const toggleFiltroTamanho = (tamanhoId: string) => {
    const novosTamanhos = filtroTamanhos.includes(tamanhoId)
      ? filtroTamanhos.filter((id) => id !== tamanhoId)
      : [...filtroTamanhos, tamanhoId];

    setFiltroTamanhos(novosTamanhos);
    //setLoadingProdutos(true);

    loadProdutos(
      1,
      pesquisaTexto,
      searchTerm,
      activeFilter,
      novosTamanhos,
      filtroCores,
      filtroGeneros,
      filtroCategorias,
      filtroMarcas,
      true, // isSilent = true
    );
  };

  const toggleFiltroCor = (corId: string) => {
    const novasCores = filtroCores.includes(corId)
      ? filtroCores.filter((id) => id !== corId)
      : [...filtroCores, corId];

    setFiltroCores(novasCores);
    //setLoadingProdutos(true);
    loadProdutos(
      1,
      pesquisaTexto,
      searchTerm,
      activeFilter,
      filtroTamanhos,
      novasCores,
      filtroGeneros,
      filtroCategorias,
      filtroMarcas,
      true,
    );
  };

  const toggleCorSelecionada = (corId: string) => {
    setCoresSelecionadas((prev) =>
      prev.includes(corId)
        ? prev.filter((id) => id !== corId)
        : [...prev, corId],
    );
  };

  const toggleTamanhoSelecionado = (tamanhoId: string) => {
    setTamanhosSelecionados((prev) =>
      prev.includes(tamanhoId)
        ? prev.filter((id) => id !== tamanhoId)
        : [...prev, tamanhoId],
    );
  };

  const toggleFiltroGenero = (generoId: string) => {
    const novosGeneros = filtroGeneros.includes(generoId)
      ? filtroGeneros.filter((id) => id !== generoId)
      : [...filtroGeneros, generoId];

    setFiltroGeneros(novosGeneros);
    // setLoadingProdutos(true);

    loadProdutos(
      1,
      pesquisaTexto,
      searchTerm,
      activeFilter,
      filtroTamanhos,
      filtroCores,
      novosGeneros,
      filtroCategorias,
      filtroMarcas,
      true,
    );
  };

  const toggleFiltroCategoria = (categoriaId: string) => {
    const novasCategorias = filtroCategorias.includes(categoriaId)
      ? filtroCategorias.filter((id) => id !== categoriaId)
      : [...filtroCategorias, categoriaId];

    setFiltroCategorias(novasCategorias);
    //setLoadingProdutos(true);

    loadProdutos(
      1,
      pesquisaTexto,
      searchTerm,
      activeFilter,
      filtroTamanhos,
      filtroCores,
      filtroGeneros,
      novasCategorias,
      filtroMarcas,
      true,
    );
  };

  const toggleFiltroMarca = (marcaId: string) => {
    const novasMarcas = filtroMarcas.includes(marcaId)
      ? filtroMarcas.filter((id) => id !== marcaId)
      : [...filtroMarcas, marcaId];

    setFiltroMarcas(novasMarcas);
    //setLoadingProdutos(true);

    loadProdutos(
      1,
      pesquisaTexto,
      searchTerm,
      activeFilter,
      filtroTamanhos,
      filtroCores,
      filtroGeneros,
      filtroCategorias,
      novasMarcas,
      true,
    );
  };

  const formatarValorInput = (valor: string): string => {
    // Remove tudo exceto números
    const cleaned = valor.replace(/\D/g, "");

    // Se estiver vazio, retorna vazio
    if (cleaned === "") return "";

    // Converte para número e divide por 100 para ter decimais corretos
    const numberValue = parseInt(cleaned) / 100;

    // Formata para o padrão brasileiro com 2 casas decimais
    return numberValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const removerMascaraPreco = (valorFormatado: string): number => {
    if (!valorFormatado) return 0;

    // Remove pontos (separadores de milhar) e converte vírgula para ponto
    const valorLimpo = valorFormatado.replace(/\./g, "").replace(",", ".");

    const numero = parseFloat(valorLimpo);
    return isNaN(numero) ? 0 : numero;
  };

  useEffect(() => {
    if (editingProduto && editingProduto.imagens) {
      setImagensProduto(editingProduto.imagens);
    }

    // Carrega os tamanhos selecionados quando editar um produto
    if (editingProduto && editingProduto.variacoes) {
      const tamanhosIds = [
        ...new Set(
          editingProduto.variacoes
            .filter((v) => v.tamanho_id)
            .map((v) => v.tamanho_id),
        ),
      ];
      setTamanhosSelecionados(tamanhosIds);

      // Preenche os preços formatados CORRETAMENTE - VALORES ORIGINAIS
      setPrecoFormatado(editingProduto.preco.toFixed(2).replace(".", ","));
      setCustoFormatado(
        (editingProduto.custo || 0).toFixed(2).replace(".", ","),
      );

      if (editingProduto.preco_original) {
        setPrecoOriginalFormatado(
          editingProduto.preco_original.toFixed(2).replace(".", ","),
        );
      }
    } else {
      setTamanhosSelecionados([]);
      setPrecoFormatado("");
      setPrecoOriginalFormatado("");
      setCustoFormatado("");
    }
  }, [editingProduto]);

  useEffect(() => {
    console.log("Editing produto:", editingProduto);
    console.log("Categorias:", categorias);
    console.log("Marcas:", marcas);
    console.log("Generos:", generos);
  }, [editingProduto, categorias, marcas, generos]);

  const filteredByStock = produtos;

  if (loading || loadingProdutos)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ProdutosSkeleton />
      </div>
    );

  if (!user) return null;

  const Pagination = () => {
    if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-white gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">Itens por página:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={loadingProdutos}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages || 1} • Total: {totalItems}{" "}
            itens
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loadingProdutos}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Anterior
          </button>

          <div className="hidden sm:flex space-x-1">
            {startPage > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={loadingProdutos}
                  className="w-8 h-8 rounded-md border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
                >
                  1
                </button>
                {startPage > 2 && <span className="px-2 py-1">...</span>}
              </>
            )}

            {pages.map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={loadingProdutos}
                className={`w-8 h-8 rounded-md text-sm transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="px-2 py-1">...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={loadingProdutos}
                  className="w-8 h-8 rounded-md border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={
              currentPage === totalPages || totalPages === 0 || loadingProdutos
            }
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Próxima
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Notificação */}
      {notification && (
        <div
          className={`fixed top-4 right-4 flex items-center p-4 rounded-md shadow-md z-50 animate-fadeIn ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <Check size={20} className="mr-2" />
          ) : (
            <AlertCircle size={20} className="mr-2" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Package className="mr-3" size={32} />
            Produtos
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie o catálogo de produtos da sua loja
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors shadow-md"
        >
          <Plus size={20} className="mr-2" />
          Novo Produto
        </button>

        <button
          onClick={ocultarProdutosSemEstoque}
          className="px-3 py-1.5 text-sm rounded-md transition-all bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
          title="Ocultar produtos com estoque zerado"
        >
          <EyeOff size={14} />
          Ocultar sem estoque
        </button>
        <button
          onClick={() => setShowCatalogo(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center transition-colors shadow-md"
        >
          <Layers size={20} className="mr-2" />
          Gerar Catálogo
        </button>
      </div>

      {/* Filtros e busca */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Buscar produtos por nome, categoria, marca..."
                  value={pesquisaInput}
                  onChange={(e) => setPesquisaInput(e.target.value)}
                  className="pl-10 pr-12 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {pesquisaInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setPesquisaInput("");
                      setPesquisaTexto("");
                      setLoadingProdutos(true);
                      loadProdutos(1, "", "", activeFilter, [], [], [], [], []);
                    }}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
                >
                  {loadingProdutos ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                </button>
              </form>
            </div>

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-700">Filtrar:</span>
              <select
                value={activeFilter}
                onChange={(e) => {
                  const newFilter = e.target.value;
                  setActiveFilter(newFilter);
                  loadProdutos(
                    1,
                    pesquisaTexto,
                    pesquisaTexto,
                    newFilter,
                    filtroTamanhos,
                    filtroCores,
                    filtroGeneros,
                    filtroCategorias,
                    filtroMarcas,
                    true, // Silencioso
                  );
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos</option>
                <option value="visible">Visíveis no site</option>
                <option value="hidden">Ocultos do site</option>
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

            {(filtroTamanhos.length > 0 || filtroCores.length > 0) && (
              <button
                onClick={limparFiltros}
                className="text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <X size={16} className="mr-1" />
                Limpar Filtros
              </button>
            )}
          </div>

          {/* Filtros avançados (Tamanhos e Cores) */}
          {mostrarFiltrosAvancados && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
              {/* Filtro por Tamanhos */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Grid size={16} className="mr-1" />
                  Tamanhos
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tamanhos.map((tamanho) => (
                    <button
                      key={tamanho.id}
                      type="button"
                      onClick={() => toggleFiltroTamanho(tamanho.id)}
                      className={`px-3 py-1 text-sm border rounded-md transition-all ${
                        filtroTamanhos.includes(tamanho.id)
                          ? "bg-blue-500 text-white border-blue-500 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                      }`}
                    >
                      {tamanho.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro por Cores */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Palette size={16} className="mr-1" />
                  Cores
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {cores.map((cor) => (
                    <button
                      key={cor.id}
                      type="button"
                      onClick={() => toggleFiltroCor(cor.id)}
                      className={`flex items-center p-2 border rounded-md transition-all ${
                        filtroCores.includes(cor.id)
                          ? "ring-2 ring-blue-500 shadow-md"
                          : "hover:shadow-md"
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full mr-2 border border-gray-300 shadow-sm"
                        style={{ backgroundColor: cor.codigo_hex || "#ccc" }}
                      ></div>
                      <span className="text-xs truncate">{cor.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* NOVO: Filtro por Gêneros */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Tag size={16} className="mr-1" />
                  Gêneros
                </h3>
                <div className="flex flex-wrap gap-2">
                  {generos.map((genero) => (
                    <button
                      key={genero.id}
                      type="button"
                      onClick={() => toggleFiltroGenero(genero.id)}
                      className={`px-3 py-1 text-sm border rounded-md transition-all ${
                        filtroGeneros.includes(genero.id)
                          ? "bg-blue-500 text-white border-blue-500 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                      }`}
                    >
                      {genero.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* NOVO: Filtro por Categorias */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Layers size={16} className="mr-1" />
                  Categorias
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.id}
                      type="button"
                      onClick={() => toggleFiltroCategoria(categoria.id)}
                      className={`px-3 py-1 text-sm border rounded-md transition-all ${
                        filtroCategorias.includes(categoria.id)
                          ? "bg-blue-500 text-white border-blue-500 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                      }`}
                    >
                      {categoria.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* NOVO: Filtro por Marcas */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Star size={16} className="mr-1" />
                  Marcas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {marcas.map((marca) => (
                    <button
                      key={marca.id}
                      type="button"
                      onClick={() => toggleFiltroMarca(marca.id)}
                      className={`px-3 py-1 text-sm border rounded-md transition-all ${
                        filtroMarcas.includes(marca.id)
                          ? "bg-blue-500 text-white border-blue-500 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:shadow-md"
                      }`}
                    >
                      {marca.nome}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      {loadingProdutos && isInitialLoad ? (
        <SummaryCardsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total de Produtos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {totalItems.toLocaleString("pt-BR")} unid.
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
                  {totalEmEstoque.toLocaleString("pt-BR")} unid.
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
                  {totalSemEstoque.toLocaleString("pt-BR")} unid.
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <X className="text-red-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Tabela de produtos */}
      {loadingProdutos && isInitialLoad ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço Loja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estoque
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {produtos.map((produto) => (
                  <tr
                    key={produto.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {produto.imagens && produto.imagens.length > 0 ? (
                          <img
                            src={produto.imagens[0].url}
                            alt={produto.titulo}
                            className="h-10 w-10 rounded-md object-cover mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center mr-3">
                            <Image size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 line-clamp-1">
                            {produto.titulo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {produto.modelo_prod}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {produto.categoria?.nome || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {produto.marca?.nome || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-green-600">
                          R${" "}
                          {produto.preco_prod
                            ? produto.preco_prod.toFixed(2)
                            : "0,00"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            produto.estoque > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {produto.estoque}
                        </span>
                        {produto.variacoes && produto.variacoes.length > 0 && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({produto.variacoes.length} variações)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {/* Botão de Visibilidade */}
                        <button
                          onClick={() =>
                            handleToggleVisibilidade(
                              produto.id,
                              produto.visivel,
                            )
                          }
                          className={`p-1 rounded transition-colors ${
                            produto.visivel
                              ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                          }`}
                          title={
                            produto.visivel
                              ? "Ocultar do site"
                              : "Exibir no site"
                          }
                        >
                          {produto.visivel ? (
                            <Eye size={18} />
                          ) : (
                            <EyeOff size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduto(produto);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2Icon size={18} />
                        </button>
                        {produto.variacoes && produto.variacoes.length > 0 && (
                          <button
                            onClick={() => {
                              setCurrentProdutoId(produto.id);
                              setShowVariacoesModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 transition-colors"
                            title="Variações"
                          >
                            <Layers size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setProdutoParaSessoes({
                              id: produto.id,
                              titulo: produto.titulo,
                            });
                            setShowSessoesModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Gerenciar Sessões"
                        >
                          <Layers size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentProdutoId(produto.id);
                            setShowImagensModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-50 transition-colors"
                          title="Imagens"
                        >
                          <Image size={18} />
                        </button>
                        {/* Botão Ativar/Desativar */}
                        {produto.ativo ? (
                          <button
                            onClick={() => handleDesativarProduto(produto.id)}
                            disabled={produtoDesativando === produto.id}
                            className="text-orange-600 hover:text-orange-800 disabled:opacity-50"
                            title="Desativar Produto"
                          >
                            {produtoDesativando === produto.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <EyeOff size={18} />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReativarProduto(produto.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Ativar Produto"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(produto.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredByStock.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                Nenhum produto encontrado
              </p>
              <p className="text-gray-400 mt-1">
                {searchTerm
                  ? "Tente ajustar os termos de busca"
                  : "Comece adicionando seu primeiro produto"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors"
                >
                  <Plus size={18} className="mr-2" />
                  Adicionar Produto
                </button>
              )}
            </div>
          )}
          {/* Paginação */}
          {totalItems > 0 && <Pagination />}
        </div>
      )}
      {/* Modal para produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingProduto ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduto(null);
                  setCoresSelecionadas([]);
                  setTamanhosSelecionados([]);
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            {/* Aviso para produtos antigos sem variações */}
            {editingProduto &&
              (!editingProduto.variacoes ||
                editingProduto.variacoes.length === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <div className="flex items-center">
                    <AlertCircle size={20} className="text-yellow-600 mr-2" />
                    <span className="text-yellow-800 font-medium">
                      Produto com sistema antigo
                    </span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Este produto foi cadastrado antes do sistema de variações.
                    Para manter o estoque, selecione pelo menos{" "}
                    <strong>um tamanho e uma cor</strong> abaixo.
                  </p>
                </div>
              )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título*
                  </label>
                  <input
                    type="text"
                    name="titulo"
                    defaultValue={editingProduto?.titulo}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo ML
                  </label>
                  <input
                    type="text"
                    name="modelo"
                    defaultValue={editingProduto?.modelo}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo Produto
                  </label>
                  <input
                    type="text"
                    name="modelo_prod"
                    defaultValue={editingProduto?.modelo_prod}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria*
                  </label>
                  <select
                    name="categoria_id"
                    defaultValue={editingProduto?.categoria?.id || ""}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    name="descricao"
                    defaultValue={editingProduto?.descricao}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca*
                  </label>
                  <select
                    name="marca_id"
                    defaultValue={editingProduto?.marca?.id || ""}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione uma marca</option>
                    {marcas.map((marca) => (
                      <option key={marca.id} value={marca.id}>
                        {marca.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gênero*
                  </label>
                  <select
                    name="genero_id"
                    defaultValue={editingProduto?.genero?.id || ""}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um gênero</option>
                    {generos.map((genero) => (
                      <option key={genero.id} value={genero.id}>
                        {genero.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Margem de Lucro (%)
                  </label>
                  <input
                    type="number"
                    name="margem_lucro"
                    step="0.01"
                    min="0"
                    max="100"
                    defaultValue={editingProduto?.margem_lucro || 0}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Campo Custo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custo
                  </label>
                  <input
                    type="text"
                    name="custo"
                    value={custoFormatado}
                    onChange={(e) => {
                      const valorFormatado = formatarValorInput(e.target.value);
                      setCustoFormatado(valorFormatado);
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>

                {/* Campo Preço */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço ML*
                  </label>
                  <input
                    type="text"
                    name="preco"
                    value={precoFormatado}
                    onChange={(e) => {
                      const valorFormatado = formatarValorInput(e.target.value);
                      setPrecoFormatado(valorFormatado);
                    }}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>
                {/* Campo Preço Produto*/}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Loja*
                  </label>
                  <input
                    type="text"
                    name="preco_prod"
                    value={precoProdFormatado}
                    onChange={(e) => {
                      const valorFormatado = formatarValorInput(e.target.value);
                      setPrecoProdFormatado(valorFormatado);
                    }}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>

                {/* Campo Preço Original */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Original
                  </label>
                  <input
                    type="text"
                    name="preco_original"
                    value={precoOriginalFormatado}
                    onChange={(e) => {
                      const valorFormatado = formatarValorInput(e.target.value);
                      setPrecoOriginalFormatado(valorFormatado);
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque
                  </label>
                  <input
                    type="number"
                    name="estoque"
                    min="0"
                    defaultValue={editingProduto?.estoque}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condição
                  </label>
                  <select
                    name="condicao"
                    defaultValue={editingProduto?.condicao || "novo"}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="novo">Novo</option>
                    <option value="usado">Usado</option>
                    <option value="recondicionado">Recondicionado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Garantia
                  </label>
                  <input
                    type="text"
                    name="garantia"
                    defaultValue={editingProduto?.garantia}
                    placeholder="Ex: 3 meses"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Campo Código EAN */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código EAN
                  </label>
                  <input
                    type="text"
                    name="codigo_ean"
                    defaultValue={editingProduto?.codigo_ean}
                    minLength={13}
                    maxLength={13}
                    pattern="[0-9]{13}"
                    title="O código EAN deve ter exatamente 13 dígitos numéricos"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Campo NCM */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NCM
                  </label>
                  <input
                    type="text"
                    name="ncm"
                    defaultValue={editingProduto?.ncm}
                    minLength={8}
                    maxLength={8}
                    pattern="[0-9]{8}"
                    title="O código NCM deve ter exatamente 8 dígitos numéricos"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Campo CEST */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEST
                  </label>
                  <input
                    type="text"
                    name="cest"
                    defaultValue={editingProduto?.cest}
                    minLength={7}
                    maxLength={7}
                    pattern="[0-9]{7}"
                    title="O código CEST deve ter exatamente 7 dígitos numéricos"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    name="peso"
                    step="0.01"
                    min="0"
                    defaultValue={editingProduto?.peso}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comprimento (cm)
                  </label>
                  <input
                    type="number"
                    name="comprimento"
                    step="0.01"
                    min="0"
                    defaultValue={editingProduto?.comprimento}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Largura (cm)
                  </label>
                  <input
                    type="number"
                    name="largura"
                    step="0.01"
                    min="0"
                    defaultValue={editingProduto?.largura}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Altura (cm)
                  </label>
                  <input
                    type="number"
                    name="altura"
                    step="0.01"
                    min="0"
                    defaultValue={editingProduto?.altura}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* SEÇÃO DE CORES */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                  Cores Disponíveis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {cores.map((cor) => (
                    <div
                      key={cor.id}
                      className={`relative border rounded-lg p-2 cursor-pointer transition-all ${
                        coresSelecionadas.includes(cor.id)
                          ? "ring-2 ring-blue-500 shadow-md"
                          : "hover:shadow-md"
                      }`}
                      onClick={() => toggleCorSelecionada(cor.id)}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full border border-gray-300 mb-2 shadow-sm"
                          style={{ backgroundColor: cor.codigo_hex || "#ccc" }}
                        ></div>
                        <span className="text-sm text-center font-medium">
                          {cor.nome}
                        </span>
                      </div>
                      {coresSelecionadas.includes(cor.id) && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {cores.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Nenhuma cor cadastrada. Cadastre cores primeiro.
                  </p>
                )}
              </div>

              {/* SEÇÃO DE TAMANHOS */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Grid size={18} className="mr-2" />
                  Tamanhos Disponíveis
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tamanhos.map((tamanho) => (
                    <div
                      key={tamanho.id}
                      className={`px-3 py-2 border rounded-md cursor-pointer transition-all ${
                        tamanhosSelecionados.includes(tamanho.id)
                          ? "bg-blue-500 text-white shadow-md"
                          : "bg-white text-gray-700 hover:shadow-md"
                      }`}
                      onClick={() => toggleTamanhoSelecionado(tamanho.id)}
                    >
                      {tamanho.nome}
                    </div>
                  ))}
                </div>
                {tamanhos.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Nenhum tamanho cadastrado. Cadastre tamanhos primeiro.
                  </p>
                )}
              </div>

              {/* SEÇÃO DE QUANTIDADE POR TAMANHO E COR - ESTILO VARIACOESMODAL */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Package size={18} className="mr-2" />
                  Estoque por Variações (Tamanho e Cor)
                </h3>

                {tamanhosSelecionados.length > 0 &&
                coresSelecionadas.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Tamanho
                          </th>
                          {coresSelecionadas.map((corId) => {
                            const cor = cores.find((c) => c.id === corId);
                            return cor ? (
                              <th
                                key={cor.id}
                                className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                              >
                                <div className="flex items-center justify-center">
                                  <div
                                    className="w-4 h-4 rounded-full border border-gray-300 mr-1"
                                    style={{ backgroundColor: cor.codigo_hex }}
                                  />
                                  {cor.nome}
                                </div>
                              </th>
                            ) : null;
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tamanhosSelecionados.map((tamanhoId) => {
                          const tamanho = tamanhos.find(
                            (t) => t.id === tamanhoId,
                          );
                          return tamanho ? (
                            <tr key={tamanho.id}>
                              <td className="px-4 py-3 font-medium">
                                {tamanho.nome}
                              </td>
                              {coresSelecionadas.map((corId) => {
                                const cor = cores.find((c) => c.id === corId);
                                const variacaoExistente =
                                  editingProduto?.variacoes?.find(
                                    (v) =>
                                      v.tamanho_id === tamanhoId &&
                                      v.cor_id === corId,
                                  );

                                return cor ? (
                                  <td
                                    key={cor.id}
                                    className="px-4 py-3 text-center"
                                  >
                                    <input
                                      type="number"
                                      min="0"
                                      name={`quantidade_${tamanhoId}_${corId}`}
                                      defaultValue={
                                        variacaoExistente?.estoque || 0
                                      }
                                      className="w-20 border border-gray-300 rounded-md px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="0"
                                    />
                                  </td>
                                ) : null;
                              })}
                            </tr>
                          ) : null;
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Selecione pelo menos um tamanho e uma cor para definir o
                    estoque por variação
                  </p>
                )}
              </div>

              {/* SEÇÃO DE IMAGENS INTEGRADA */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Image size={18} className="mr-2" />
                  Imagens do Produto
                </h3>

                {/* Upload de imagens */}
                {editingProduto && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adicionar Imagens
                    </label>
                    <div className="flex items-center">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors">
                          <Upload size={18} className="mr-2" />
                          Selecionar imagens
                        </div>
                      </label>
                      {uploading && (
                        <div className="ml-4 flex items-center text-gray-500">
                          <Loader size={18} className="animate-spin mr-2" />
                          <span>Enviando...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos: JPG, PNG, GIF. Máximo: 5MB por imagem.
                    </p>
                  </div>
                )}

                {/* Grid de imagens */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagensProduto.map((imagem) => (
                    <div
                      key={imagem.id}
                      className="relative group border rounded-lg p-2 bg-gray-50"
                    >
                      <img
                        src={imagem.url}
                        alt={`Imagem do produto`}
                        className="w-full h-32 object-cover rounded"
                      />

                      {/* Overlay com ações */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setAsPrincipal(imagem.id)}
                            className={`p-2 rounded-full ${
                              imagem.principal
                                ? "bg-yellow-500 text-white"
                                : "bg-white text-gray-700 hover:bg-yellow-50"
                            }`}
                            title={
                              imagem.principal
                                ? "Imagem principal"
                                : "Definir como principal"
                            }
                          >
                            <Star
                              size={16}
                              fill={imagem.principal ? "currentColor" : "none"}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteImage(imagem.id, imagem.url)
                            }
                            className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50"
                            title="Excluir imagem"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Indicador de imagem principal */}
                      {imagem.principal && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Principal
                        </div>
                      )}
                    </div>
                  ))}

                  {imagensProduto.length === 0 && editingProduto && (
                    <div className="col-span-full text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                      <Image size={48} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Nenhuma imagem adicionada</p>
                      <p className="text-xs mt-1">
                        Adicione imagens para melhor apresentação do produto
                      </p>
                    </div>
                  )}

                  {!editingProduto && (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <p className="text-sm">
                        Salve o produto primeiro para adicionar imagens
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduto(null);
                    setCoresSelecionadas([]);
                    setTamanhosSelecionados([]);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  {editingProduto ? "Atualizar Produto" : "Criar Produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSessoesModal && produtoParaSessoes && (
        <SelecionarSessoesModal
          isOpen={showSessoesModal}
          produtoId={produtoParaSessoes.id}
          produtoTitulo={produtoParaSessoes.titulo}
          onClose={() => {
            setShowSessoesModal(false);
            setProdutoParaSessoes(null);
          }}
          onSave={() => {
            loadProdutos();
            setShowSessoesModal(false);
            setProdutoParaSessoes(null);
          }}
        />
      )}

      {/* Modal para cores - NOVO */}
      {showCoresModal && (
        <CoresModal
          onClose={() => setShowCoresModal(false)}
          onSave={() => {
            loadCores(); // Recarrega as cores após salvar
            setShowCoresModal(false);
          }}
        />
      )}

      {/* Modal para variações */}
      {showVariacoesModal && (
        <VariacoesModal
          produtoId={currentProdutoId}
          onClose={() => setShowVariacoesModal(false)}
          onSave={loadProdutos}
        />
      )}

      {/* Modal para imagens */}
      {showImagensModal && (
        <ImagensModal
          produtoId={currentProdutoId}
          onClose={() => setShowImagensModal(false)}
          onSave={loadProdutos}
        />
      )}
        
      {showCatalogo && (
        <CatalogoModal
          isOpen={showCatalogo}
          onClose={() => setShowCatalogo(false)}
          filtros={{
            categorias: filtroCategorias,
            marcas: filtroMarcas,
            generos: filtroGeneros,
            tamanhos: filtroTamanhos,
            cores: filtroCores,
          }}
          dadosComplementares={{
            categorias,
            marcas,
            generos,
            tamanhos,
            cores,
          }}
        />
      )}
    </div>
  );
}
