// app/dashboard/products/page.tsx
"use client";
export const dynamic = 'force-dynamic';

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

import ImagensModal from "@/components/dashboard/ImagensModal";
import VariacoesModal from "@/components/dashboard/VariacoesModal";
import CoresModal from "@/components/dashboard/CoresModal";
import SelecionarSessoesModal from "@/components/dashboard/SelecionarSessoesModal";

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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setLoadingProdutos(true);
      setCurrentPage(page);
      loadProdutos(page);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setLoadingProdutos(true);
    loadProdutos(1);
  };

  const loadProdutos = useCallback(
    async (
      page = currentPage,
      pesquisa = pesquisaTexto,
      search = searchTerm,
      filter = activeFilter,
      tamanhosFiltro = filtroTamanhos,
      coresFiltro = filtroCores,
      generosFiltro = filtroGeneros,
      categoriasFiltro = filtroCategorias,
      marcasFiltro = filtroMarcas,
    ) => {
      try {
        console.log("=== PARÂMETROS DA QUERY ===");
        console.log("Página:", page);
        console.log("Search:", search);
        console.log("Filtro:", filter);
        console.log("Tamanhos filtro:", tamanhosFiltro);
        console.log("Cores filtro:", coresFiltro);
        console.log("Gêneros filtro:", generosFiltro);
        console.log("Categorias filtro:", categoriasFiltro);
        console.log("Marcas filtro:", marcasFiltro);
        console.log("==========================");
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data: produtosData } = await supabase.from(
          "view_produtos_busca",
        ).select(`
            *,
            variacoes:produto_variacoes(
              *,
              tamanho:tamanhos(nome),
              cor:cores(nome, codigo_hex)
            ),
            imagens:produto_imagens(
              *,
              cor:cores(nome, codigo_hex)
            )
          `);

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

        if (pesquisa) {
          // Busca básica nos campos principais
          query = query.or(
            `titulo.ilike.%${pesquisa}%,descricao.ilike.%${pesquisa}%`,
          );

          // Busca em categorias relacionadas
          const { data: categoriasMatch } = await supabase
            .from("categorias")
            .select("id")
            .ilike("nome", `%${pesquisa}%`);

          // Busca em marcas relacionadas
          const { data: marcasMatch } = await supabase
            .from("marcas")
            .select("id")
            .ilike("nome", `%${pesquisa}%`);

          const categoriaIds = categoriasMatch?.map((c) => c.id) || [];
          const marcaIds = marcasMatch?.map((m) => m.id) || [];

          // Se encontrou categorias ou marcas, adiciona filtro OR
          if (categoriaIds.length > 0 || marcaIds.length > 0) {
            const orConditions = [];

            if (categoriaIds.length > 0) {
              orConditions.push(`categoria_id.in.(${categoriaIds.join(",")})`);
            }

            if (marcaIds.length > 0) {
              orConditions.push(`marca_id.in.(${marcaIds.join(",")})`);
            }

            // Adiciona as condições OR à query existente
            query = query.or(orConditions.join(","));
          }
        }

        if (search) {
          query = query.or(
            `titulo.ilike.%${search}%,descricao.ilike.%${search}%`,
          );

          // Para buscar em tabelas relacionadas, precisamos fazer subqueries
          const { data: categoriasMatch } = await supabase
            .from("categorias")
            .select("id")
            .ilike("nome", `%${search}%`);

          const { data: marcasMatch } = await supabase
            .from("marcas")
            .select("id")
            .ilike("nome", `%${search}%`);

          const categoriaIds = categoriasMatch?.map((c) => c.id) || [];
          const marcaIds = marcasMatch?.map((m) => m.id) || [];

          if (categoriaIds.length > 0 || marcaIds.length > 0) {
            query = query.or(
              `categoria_id.in.(${categoriaIds.join(
                ",",
              )}),marca_id.in.(${marcaIds.join(",")})`,
            );
          }
        }
        // Aplicar filtro de estoque
        if (filter === "in-stock") {
          query = query.gt("estoque", 0);
        } else if (filter === "out-of-stock") {
          query = query.eq("estoque", 0);
        }

        // Aplicar filtro por categorias
        if (categoriasFiltro.length > 0) {
          query = query.in("categoria_id", categoriasFiltro);
        }

        // Aplicar filtro por marcas
        if (marcasFiltro.length > 0) {
          query = query.in("marca_id", marcasFiltro);
        }

        // Aplicar filtro por gêneros
        if (generosFiltro.length > 0) {
          query = query.in("genero_id", generosFiltro);
        }

        // Aplicar filtro por tamanhos
        if (tamanhosFiltro.length > 0) {
          // Primeiro obtém os IDs dos produtos que têm as variações com os tamanhos selecionados
          const { data: produtosComTamanhos, error: errorTamanhos } =
            await supabase
              .from("produto_variacoes")
              .select("produto_id")
              .in("tamanho_id", tamanhosFiltro);

          if (errorTamanhos) {
            console.error(
              "Erro ao buscar produtos por tamanho:",
              errorTamanhos,
            );
            throw errorTamanhos;
          }

          if (produtosComTamanhos && produtosComTamanhos.length > 0) {
            const produtoIds = [
              ...new Set(produtosComTamanhos.map((p) => p.produto_id)),
            ];
            query = query.in("id", produtoIds);
          } else {
            // Se não encontrar produtos com esses tamanhos, retorna array vazio
            setProdutos([]);
            setTotalItems(0);
            setLoadingProdutos(false);
            return;
          }
        }

        // Aplicar filtro por cores
        if (coresFiltro.length > 0) {
          // Primeiro obtém os IDs dos produtos que têm as variações com as cores selecionadas
          const { data: produtosComCores, error: errorCores } = await supabase
            .from("produto_variacoes")
            .select("produto_id")
            .in("cor_id", coresFiltro);

          if (errorCores) {
            console.error("Erro ao buscar produtos por cor:", errorCores);
            throw errorCores;
          }

          if (produtosComCores && produtosComCores.length > 0) {
            const produtoIds = [
              ...new Set(produtosComCores.map((p) => p.produto_id)),
            ];
            query = query.in("id", produtoIds);
          } else {
            // Se não encontrar produtos com essas cores, retorna array vazio
            setProdutos([]);
            setTotalItems(0);
            setLoadingProdutos(false);
            return;
          }
        }
        //aplica filtro de produtos visiveis
        if (filter === "visible") {
          query = query.eq("visivel", true);
        } else if (filter === "hidden") {
          query = query.eq("visivel", false);
        }
        // Adicione estas linhas:
        console.log("=== QUERY SUPABASE ===");
        console.log("Query object:", query);
        console.log("From:", from, "To:", to);
        console.log("========================");

        const { data, error, count } = await query.range(from, to);
        console.log("✅ RESULTADO FINAL:");
        console.log("Data:", data);
        console.log("Error:", error);
        console.log("Count:", count);

        if (error) {
          console.error("Erro na query:", error);
          throw error;
        }

        setProdutos(data || []);
        setTotalItems(count || 0);
        setCurrentPage(page);

        //Consultas para somar o estoque total (sem filtros para obter totais gerais)
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

        // Calcular totais
        const totalEstoque =
          totalEstoqueData?.reduce(
            (sum, produto) => sum + (produto.estoque || 0),
            0,
          ) || 0;
        const totalEmEstoque =
          emEstoqueData?.reduce(
            (sum, produto) => sum + (produto.estoque || 0),
            0,
          ) || 0;
        const totalSemEstoque = semEstoqueData?.length || 0;

        setTotalProdutos(totalEstoque);
        setTotalEmEstoque(totalEmEstoque);
        setTotalSemEstoque(totalSemEstoque);
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        showNotification("error", "Erro ao carregar produtos");
      } finally {
        setLoadingProdutos(false);
      }
    },
    [
      itemsPerPage,
      pesquisaTexto,
      searchTerm,
      activeFilter,
      filtroTamanhos,
      filtroCores,
      filtroGeneros,
      filtroCategorias,
      filtroMarcas,
    ],
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadProdutos(1);
      loadCategorias();
      loadMarcas();
      loadGeneros();
      loadCores();
      loadTamanhos();
    }
  }, [user, loadProdutos]);

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
      setCoresSelecionadas([]); // ⭐ LIMPAR CORES TAMBÉM
      setPrecoFormatado("");
      setPrecoOriginalFormatado("");
      setCustoFormatado("");
    }
  }, [editingProduto]);

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
    if (user) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeoutId = setTimeout(() => {
        if (pesquisaInput !== pesquisaTexto) {
          setPesquisaTexto(pesquisaInput);
          setLoadingProdutos(true);
          loadProdutosRef.current(
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
        }
      }, 800);
      setSearchTimeout(timeoutId);

      return () => {
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
      };
    }
  }, [
    pesquisaInput,
    activeFilter,
    filtroTamanhos,
    filtroCores,
    filtroGeneros,
    filtroCategorias,
    filtroMarcas,
    user,
    pesquisaTexto,
  ]);

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

  const toggleFiltroTamanho = (tamanhoId: string) => {
    setFiltroTamanhos((prev) =>
      prev.includes(tamanhoId)
        ? prev.filter((id) => id !== tamanhoId)
        : [...prev, tamanhoId],
    );
  };

  const toggleFiltroCor = (corId: string) => {
    setFiltroCores((prev) =>
      prev.includes(corId)
        ? prev.filter((id) => id !== corId)
        : [...prev, corId],
    );
  };

  const limparFiltros = () => {
    setFiltroTamanhos([]);
    setFiltroCores([]);
    setFiltroGeneros([]);
    setFiltroCategorias([]);
    setFiltroMarcas([]);
    setActiveFilter("all");
    setSearchTerm("");
    setLoadingProdutos(true);
    loadProdutos(1, "", "", "all", [], [], [], [], []);
  };

  const toggleFiltroGenero = (generoId: string) => {
    setFiltroGeneros((prev) =>
      prev.includes(generoId)
        ? prev.filter((id) => id !== generoId)
        : [...prev, generoId],
    );
  };

  const toggleFiltroCategoria = (categoriaId: string) => {
    setFiltroCategorias((prev) =>
      prev.includes(categoriaId)
        ? prev.filter((id) => id !== categoriaId)
        : [...prev, categoriaId],
    );
  };

  const toggleFiltroMarca = (marcaId: string) => {
    setFiltroMarcas((prev) =>
      prev.includes(marcaId)
        ? prev.filter((id) => id !== marcaId)
        : [...prev, marcaId],
    );
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

      // ⭐ EXCLUIR REGISTROS RELACIONADOS PRIMEIRO
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

  const filteredProdutos = produtos.filter(
    (produto) =>
      produto.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.marca.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredByStock = produtos.filter((produto) => {
    if (activeFilter === "in-stock") return produto.estoque > 0;
    if (activeFilter === "out-of-stock") return produto.estoque === 0;
    return true;
  });

  if (loading || loadingProdutos)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  if (!user) return null;

  const Pagination = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200 bg-white gap-4">
      <div className="flex items-center space-x-2 mb-4 sm:mb-0">
        <span className="text-sm text-gray-700">Itens por página:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">
          Página {currentPage} de {totalPages} • Total: {totalItems} itens
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Anterior
        </button>

        {/* Números de página */}
        <div className="hidden sm:flex space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-8 h-8 rounded-md text-sm ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span className="px-2 py-1">...</span>
          )}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <button
              onClick={() => handlePageChange(totalPages)}
              className="w-8 h-8 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
            >
              {totalPages}
            </button>
          )}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );

  const CatalogoModal = () => {
    const [produtosCatalogo, setProdutosCatalogo] = useState<Produto[]>([]);
    const [loadingCatalogo, setLoadingCatalogo] = useState(true);
    const logoUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logomarca.jpg`;
    const [printWindow, setPrintWindow] = useState<Window | null>(null);

    useEffect(() => {
      if (showCatalogo) {
        const loadProdutosCatalogo = async () => {
          try {
            setLoadingCatalogo(true);

            // Primeiro, buscar produtos base com filtros simples
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
              )
              .eq("ativo", true)
              .gt("estoque", 0);

            // Aplicar filtro por categorias
            if (filtroCategorias.length > 0) {
              query = query.in("categoria_id", filtroCategorias);
            }

            // Aplicar filtro por marcas
            if (filtroMarcas.length > 0) {
              query = query.in("marca_id", filtroMarcas);
            }

            // Aplicar filtro por gêneros
            if (filtroGeneros.length > 0) {
              query = query.in("genero_id", filtroGeneros);
            }

            const { data: produtosBase, error } = await query;

            if (error) throw error;

            // Aplicar filtros de tamanhos e cores no lado do cliente
            const produtosFiltrados =
              produtosBase?.filter((produto) => {
                // Filtro por tamanhos - apenas produtos que têm variações com os tamanhos filtrados
                if (filtroTamanhos.length > 0) {
                  const temTamanhoFiltrado = produto.variacoes?.some(
                    (v: ProdutoVariacao) =>
                      v.tamanho_id &&
                      filtroTamanhos.includes(v.tamanho_id) &&
                      v.estoque > 0,
                  );
                  if (!temTamanhoFiltrado) return false;
                }

                // Filtro por cores - apenas produtos que têm variações com as cores filtradas
                if (filtroCores.length > 0) {
                  const temCorFiltrada = produto.variacoes?.some(
                    (v: ProdutoVariacao) =>
                      v.cor_id &&
                      filtroCores.includes(v.cor_id) &&
                      v.estoque > 0,
                  );
                  if (!temCorFiltrada) return false;
                }

                return true;
              }) || [];

            setProdutosCatalogo(produtosFiltrados);

            // Mostrar alerta se não houver produtos
            if (
              produtosFiltrados.length === 0 &&
              (filtroTamanhos.length > 0 ||
                filtroCores.length > 0 ||
                filtroCategorias.length > 0 ||
                filtroMarcas.length > 0 ||
                filtroGeneros.length > 0)
            ) {
              setTimeout(() => {
                Swal.fire({
                  icon: "info",
                  title: "Nenhum produto encontrado",
                  html: `
                  <div class="text-left">
                    <p>Não foram encontrados produtos que correspondam a todos os filtros aplicados:</p>
                    <ul class="list-disc list-inside mt-2 text-sm">
                      ${
                        filtroTamanhos.length > 0
                          ? `<li><strong>Tamanhos:</strong> ${filtroTamanhos
                              .map(
                                (id) => tamanhos.find((t) => t.id === id)?.nome,
                              )
                              .join(", ")}</li>`
                          : ""
                      }
                      ${
                        filtroCores.length > 0
                          ? `<li><strong>Cores:</strong> ${filtroCores
                              .map((id) => cores.find((c) => c.id === id)?.nome)
                              .join(", ")}</li>`
                          : ""
                      }
                      ${
                        filtroCategorias.length > 0
                          ? `<li><strong>Categorias:</strong> ${filtroCategorias
                              .map(
                                (id) =>
                                  categorias.find((c) => c.id === id)?.nome,
                              )
                              .join(", ")}</li>`
                          : ""
                      }
                      ${
                        filtroMarcas.length > 0
                          ? `<li><strong>Marcas:</strong> ${filtroMarcas
                              .map(
                                (id) => marcas.find((m) => m.id === id)?.nome,
                              )
                              .join(", ")}</li>`
                          : ""
                      }
                      ${
                        filtroGeneros.length > 0
                          ? `<li><strong>Gêneros:</strong> ${filtroGeneros
                              .map(
                                (id) => generos.find((g) => g.id === id)?.nome,
                              )
                              .join(", ")}</li>`
                          : ""
                      }
                    </ul>
                    <p class="mt-3 text-sm">Sugestões:</p>
                    <ul class="list-disc list-inside text-sm">
                      <li>Remover alguns filtros</li>
                      <li>Verificar a disponibilidade em estoque</li>
                      <li>Expandir os critérios de busca</li>
                    </ul>
                  </div>
                `,
                  confirmButtonText: "Ajustar Filtros",
                  confirmButtonColor: "#3B82F6",
                });
              }, 500);
            }
          } catch (error) {
            console.error("Erro ao carregar produtos para catálogo:", error);
            showNotification("error", "Erro ao carregar catálogo");
          } finally {
            setLoadingCatalogo(false);
          }
        };

        loadProdutosCatalogo();
      }
    }, [
      showCatalogo,
      filtroTamanhos,
      filtroCores,
      filtroCategorias,
      filtroMarcas,
      filtroGeneros,
    ]);

    const formatarPrecoCatalogo = (
      preco_prod: number,
      precoOriginal?: number,
    ) => {
      if (!mostrarPrecosCatalogo) {
        return <span className="text-green-600 font-bold">Consulte</span>;
      }

      if (precoOriginal && precoOriginal > preco_prod) {
        return (
          <>
            <span className="text-green-600 font-bold">
              R$ {preco_prod.toFixed(2)}
            </span>
            <span className="text-gray-500 text-sm line-through ml-2">
              R$ {precoOriginal.toFixed(2)}
            </span>
          </>
        );
      }
      return (
        <span className="text-green-600 font-bold">
          R$ {preco_prod.toFixed(2)}
        </span>
      );
    };

    const handlePrint = () => {
      const printContent = document.getElementById("catalogo-print");
      if (!printContent) return;

      const newPrintWindow = window.open("", "_blank");
      if (!newPrintWindow) return;

      setPrintWindow(newPrintWindow);

      const mostrarPrecos = mostrarPrecosCatalogo;

      // Aplicar filtros diretamente nos produtos para impressão
      const produtosFiltrados = produtosCatalogo.filter((produto) => {
        // Filtro por tamanhos - apenas produtos que têm pelo menos uma variação com os tamanhos filtrados
        if (filtroTamanhos.length > 0) {
          const temTamanhoFiltrado = produto.variacoes?.some(
            (v) =>
              v.tamanho_id &&
              filtroTamanhos.includes(v.tamanho_id) &&
              v.estoque > 0,
          );
          if (!temTamanhoFiltrado) return false;
        }

        // Filtro por cores - apenas produtos que têm pelo menos uma variação com as cores filtradas
        if (filtroCores.length > 0) {
          const temCorFiltrada = produto.variacoes?.some(
            (v) => v.cor_id && filtroCores.includes(v.cor_id) && v.estoque > 0,
          );
          if (!temCorFiltrada) return false;
        }

        // Filtro por categorias
        if (filtroCategorias.length > 0 && produto.categoria_id) {
          if (!filtroCategorias.includes(produto.categoria_id)) return false;
        }

        // Filtro por marcas
        if (filtroMarcas.length > 0 && produto.marca_id) {
          if (!filtroMarcas.includes(produto.marca_id)) return false;
        }

        // Filtro por gêneros
        if (filtroGeneros.length > 0 && produto.genero_id) {
          if (!filtroGeneros.includes(produto.genero_id)) return false;
        }

        return true;
      });

      // Verificar se há produtos após aplicar todos os filtros
      if (produtosFiltrados.length === 0) {
        newPrintWindow.close();
        Swal.fire({
          icon: "warning",
          title: "Nenhum produto encontrado",
          text: "Não há produtos que correspondam aos filtros aplicados. Tente ajustar os critérios de filtro.",
          confirmButtonText: "Entendi",
          confirmButtonColor: "#3B82F6",
        });
        return;
      }

      // Fechar modal após impressão/cancelamento
      const handlePrintClose = () => {
        setShowCatalogo(false);
        setPrintWindow(null);
      };

      // Monitorar quando a janela é fechada
      newPrintWindow.addEventListener("beforeunload", handlePrintClose);

      // Estilos para impressão
      const styles = `
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .header-logo {
              max-height: 8vh;
              margin-bottom: 15px;
            }
            .catalogo-page {
              padding: 15px;
              min-height: 91vh;
              display: flex;
              flex-direction: column;
            }
            .first-page {
              justify-content: flex-start;
              page-break-after: always; /* Sempre quebra após a primeira página */
            }
            .other-page {
              justify-content: space-between;
              page-break-after: auto; /* Quebra automática apenas se necessário */
            }
            .catalogo-page:last-child {
              page-break-after: avoid; /* Evita quebra após a última página */
            }
            .catalogo-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
              width: 100%;
            }
            .first-page .catalogo-grid {
              grid-template-rows: repeat(2, auto);
              height: auto;
            }
            .other-page .catalogo-grid {
              grid-template-rows: repeat(3, auto);
              flex-grow: 1;
            }
            .titulo-catalogo {
              text-align: center;
              font-size: 1.8rem;
              text-decoration: underline;
              margin-bottom: 25px;
              color: white !important;
              font-size: 1px !important;
              opacity: 0.01 !important;
            }
            .catalogo-item {
              border: 1px solid #ddd;
              border-radius: 6px;
              padding: 10px;
              page-break-inside: avoid;
              break-inside: avoid;
              display: flex;
              flex-direction: column;
              height: fit-content;
              min-height: 280px;
            }
            .catalogo-image-container {
              height: 130px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 8px;
              overflow: hidden;
              background-color: #f8f9fa;
            }
            .catalogo-image {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              border-radius: 4px;
            }
            .catalogo-title {
              font-weight: bold;
              font-size: 13px;
              margin-bottom: 4px;
              line-height: 1.2;
              min-height: 32px;
            }
            .catalogo-info {
              font-size: 11px;
              color: #666;
              margin-bottom: 2px;
              line-height: 1.2;
            }
            .catalogo-price {
              font-weight: bold;
              color: #16a34a;
              font-size: 13px;
              margin: 4px 0;
            }
            .catalogo-original-price {
              text-decoration: line-through;
              color: #999;
              font-size: 11px;
              margin-left: 5px;
            }
            .catalogo-stock {
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 8px;
              display: inline-block;
              margin-top: 4px;
            }
            .stock-available {
              background-color: #dcfce7 !important;
              color: #166534 !important;
              border: 1px solid #bbf7d0;
            }
            .stock-unavailable {
              background-color: #fee2e2 !important;
              color: #991b1b !important;
              border: 1px solid #fecaca;
            }
            .catalogo-sizes {
              margin-top: 6px;
            }
            .size-tag {
              display: inline-block;
              background-color: #f3f4f6 !important;
              color: #374151 !important;
              padding: 1px 4px;
              border-radius: 3px;
              font-size: 9px;
              margin: 1px;
              border: 1px solid #e5e7eb;
            }
            .catalogo-colors {
              margin-top: 6px;
            }
            .color-item {
              display: flex;
              align-items: center;
              margin: 1px 0;
            }
            .color-dot-print {
              width: 10px !important;
              height: 10px !important;
              border-radius: 50% !important;
              display: inline-block !important;
              margin-right: 3px !important;
              border: 1px solid #ddd !important;
            }
            .color-name {
              font-size: 9px;
              color: #666;
            }
            .no-print {
              display: none !important;
            }
            .catalogo-price-hidden {
              font-weight: bold;
              color: #16a34a;
              font-size: 13px;
            }
            
            /* Garantir que as cores sejam exibidas na impressão */
            .color-dot-print {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .size-tag, .catalogo-stock {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            @page {
              size: A4 portrait;
              margin: 1cm;
            }
            
            /* Remover cabeçalho e rodapé do navegador */
            @page {
              margin: 0;
            }
            body {
              margin: 1.5cm;
            }          
            .last-page {
              page-break-after: avoid !important;
            }
          }
          
          /* Estilos para visualização na tela */
          .screen-view {
            font-family: Arial, sans-serif;
          }
          .screen-view .catalogo-page {
            margin-bottom: 20px;
          }
          .screen-view .catalogo-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          .screen-view .catalogo-item {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 10px;
            background: white;
          }
        </style>
      `;

      const itemsPerPageFirst = 6;
      const itemsPerPageOther = 9;
      const pages = [];

      const firstPageProducts = produtosFiltrados.slice(0, itemsPerPageFirst);
      const remainingProducts = produtosFiltrados.slice(itemsPerPageFirst);

      // Gerar primeira página
      if (firstPageProducts.length > 0) {
        const firstPageContent = firstPageProducts
          .map((produto) => generateProductHTML(produto, mostrarPrecos))
          .join("");

        pages.push(`
          <div class="catalogo-page first-page">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${logoUrl}" alt="Logo" class="header-logo" style="max-height: 80px;">
              <h3>CATÁLOGO DE PRODUTOS</h3>
            </div>
            <div class="catalogo-grid">
              ${firstPageContent}
            </div>
          </div>
        `);
      }

      const totalPages = Math.ceil(
        remainingProducts.length / itemsPerPageOther,
      );

      for (
        let i = 0;
        i < remainingProducts.length && i < remainingProducts.length;
        i += itemsPerPageOther
      ) {
        const pageIndex = Math.floor(i / itemsPerPageOther) + 1;
        const isLastPage = pageIndex === totalPages;
        const pageProducts = remainingProducts.slice(i, i + itemsPerPageOther);

        if (pageProducts.length > 0) {
          const pageContent = pageProducts
            .map((produto) => generateProductHTML(produto, mostrarPrecos))
            .join("");

          pages.push(`
            <div class="catalogo-page other-page ${
              isLastPage ? "last-page" : ""
            }">
              <div class="catalogo-grid">
                ${pageContent}
              </div>
            </div>
          `);
        }
      }

      newPrintWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Catálogo de Produtos</title>
          <meta charset="utf-8">
          ${styles}
        </head>
        <body class="screen-view">
          ${pages.join("")}
          <script>
            // Fechar a janela após impressão ou cancelamento
            window.onafterprint = function() {
              window.close();
            };
            
            // Também fechar se o usuário sair sem imprimir
            window.addEventListener('beforeunload', function() {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage('printClosed', '*');
              }
            });
            
            // Iniciar impressão após carregamento
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);

      newPrintWindow.document.close();

      // Fechar modal quando a janela de impressão for fechada
      const checkPrintWindow = setInterval(() => {
        if (newPrintWindow.closed) {
          clearInterval(checkPrintWindow);
          setShowCatalogo(false);
          setPrintWindow(null);
        }
      }, 500);

      // Também escutar mensagens do window
      window.addEventListener("message", function (event) {
        if (event.data === "printClosed") {
          setShowCatalogo(false);
          setPrintWindow(null);
        }
      });
    };

    // Função auxiliar para gerar HTML do produto
    const generateProductHTML = (produto: Produto, mostrarPrecos: boolean) => {
      // Obter tamanhos únicos com estoque e que correspondam aos filtros
      const tamanhosUnicos = Array.from(
        new Set(
          produto.variacoes
            ?.filter((v) => {
              // Aplicar filtro de tamanhos
              if (filtroTamanhos.length > 0) {
                return filtroTamanhos.includes(v.tamanho_id) && v.estoque > 0;
              }
              return v.estoque > 0;
            })
            .map((v) => v.tamanho?.nome)
            .filter(Boolean),
        ),
      );

      // Obter cores únicas com estoque e que correspondam aos filtros
      const coresUnicas = Array.from(
        new Map(
          produto.variacoes
            ?.filter((v) => {
              // Aplicar filtro de cores
              if (filtroCores.length > 0) {
                return filtroCores.includes(v.cor_id) && v.cor && v.estoque > 0;
              }
              return v.cor && v.estoque > 0;
            })
            .map((v) => [v.cor_id, v.cor]),
        ).values(),
      );

      return `
      <div class="catalogo-item">
        <div class="catalogo-image-container">
          ${
            produto.imagens && produto.imagens.length > 0
              ? `<img src="${produto.imagens[0].url}" alt="${produto.titulo}" class="catalogo-image" 
                  onload="this.style.opacity=1" 
                  style="opacity:0; transition: opacity 0.3s;" />`
              : `<div class="catalogo-image" style="background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 11px;">Sem imagem</div>`
          }
        </div>
        <div class="catalogo-title">${produto.titulo}</div>
        <div class="catalogo-info">${produto.marca?.nome || "N/A"} • ${
          produto.categoria?.nome || "N/A"
        }</div>
        <div class="catalogo-info">${produto.modelo_prod || "N/A"} | Ref: ${
          produto.codigo_ean || "N/A"
        }</div>
        <div>
          ${
            mostrarPrecos
              ? produto.preco_original && produto.preco_original > produto.preco
                ? `<span class="catalogo-price">R$ ${produto.preco.toFixed(
                    2,
                  )}</span>
                   <span class="catalogo-original-price">R$ ${produto.preco_original.toFixed(
                     2,
                   )}</span>`
                : `<span class="catalogo-price">R$ ${produto.preco.toFixed(
                    2,
                  )}</span>`
              : `<span class="catalogo-price-hidden">Consulte</span>`
          }
          <span class="catalogo-stock ${
            produto.estoque > 0 ? "stock-available" : "stock-unavailable"
          }">
            ${produto.estoque > 0 ? "Em estoque" : "Sem estoque"}
          </span>
        </div>
        ${
          tamanhosUnicos.length > 0
            ? `<div class="catalogo-sizes">
               <div class="catalogo-info">Tamanhos:</div>
               <div>${tamanhosUnicos
                 .map((tamanho) => `<span class="size-tag">${tamanho}</span>`)
                 .join(" ")}
               </div>
             </div>`
            : ""
        }
        ${
          coresUnicas.length > 0
            ? `<div class="catalogo-colors">
               <div class="catalogo-info">Cores:</div>
               ${coresUnicas
                 .map(
                   (cor) => `
                   <div class="color-item">
                     <div class="color-dot-print" style="background-color: ${
                       cor.codigo_hex || "#ccc"
                     } !important;"></div>
                     <span class="color-name">${cor.nome || "N/A"}</span>
                   </div>
                 `,
                 )
                 .join("")}
             </div>`
            : '<div class="catalogo-colors"><div class="catalogo-info">Cores: N/A</div></div>'
        }
      </div>
    `;
    };

    if (!showCatalogo) return null;

    if (loadingCatalogo) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto catalogo-modal">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-center mt-4">Carregando catálogo...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Catálogo de Produtos
            </h2>
            <div className="flex space-x-2">
              {/* Checkbox para mostrar/ocultar preços */}
              <label className="flex items-center text-sm text-gray-700 no-print">
                <input
                  type="checkbox"
                  checked={mostrarPrecosCatalogo}
                  onChange={(e) => setMostrarPrecosCatalogo(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Mostrar Preços
              </label>
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center no-print"
              >
                <Layers size={18} className="mr-2" />
                Imprimir/PDF
              </button>
              <button
                onClick={() => setShowCatalogo(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors no-print"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div
            id="catalogo-print"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {produtosCatalogo.map((produto) => (
              <div
                key={produto.id}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                {/* Imagem do produto */}
                <div className="mb-4">
                  {produto.imagens && produto.imagens.length > 0 ? (
                    <img
                      src={produto.imagens[0].url}
                      alt={produto.titulo}
                      className="w-full h-48 object-cover rounded-md"
                      style={{
                        maxWidth: "100%",
                        height: "auto",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
                      <Image size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Informações do produto */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-gray-800">
                    {produto.titulo}
                  </h3>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {produto.marca?.nome}
                    </span>
                    <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {produto.categoria?.nome}
                    </span>
                  </div>

                  <div className="text-sm text-gray-700">
                    <p>{produto.modelo_prod}</p>
                    <p>Ref: {produto.codigo_ean || "N/A"}</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      {mostrarPrecosCatalogo ? (
                        formatarPrecoCatalogo(
                          produto.preco_prod,
                          produto.preco_original,
                        )
                      ) : (
                        <span className="text-green-600 font-bold">
                          Consulte
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        produto.estoque > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {produto.estoque > 0 ? "Em estoque" : "Sem estoque"}
                    </span>
                  </div>

                  {/* Tamanhos disponíveis: apenas os filtrados */}
                  {produto.variacoes && produto.variacoes.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Tamanhos:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(
                          new Set(
                            produto.variacoes
                              .filter((v) => {
                                // Aplicar filtro de tamanhos
                                if (filtroTamanhos.length > 0) {
                                  return (
                                    filtroTamanhos.includes(v.tamanho_id) &&
                                    v.estoque > 0
                                  );
                                }
                                return v.estoque > 0;
                              })
                              .map((v) => v.tamanho?.nome)
                              .filter(Boolean),
                          ),
                        ).map((tamanho, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {tamanho}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cores disponíveis */}
                  {produto.variacoes &&
                    produto.variacoes.some((v) => v.cor && v.estoque > 0) && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Cores:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(
                            new Map(
                              produto.variacoes
                                .filter((v) => {
                                  // Aplicar filtro de cores
                                  if (filtroCores.length > 0) {
                                    return (
                                      filtroCores.includes(v.cor_id) &&
                                      v.cor &&
                                      v.estoque > 0
                                    );
                                  }
                                  return v.cor && v.estoque > 0;
                                })
                                .map((v) => [v.cor_id, v.cor]),
                            ).values(),
                          ).map((cor, index) => (
                            <div key={index} className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300 mr-1"
                                style={{
                                  backgroundColor: cor.codigo_hex || "#ccc",
                                }}
                                title={cor.nome}
                              ></div>
                              <span className="text-xs text-gray-600">
                                {cor.nome || "N/A"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          {produtosCatalogo.length === 0 && (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                Nenhum produto disponível para o catálogo
              </p>
            </div>
          )}
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
                  setActiveFilter(e.target.value);
                  setLoadingProdutos(true);
                  loadProdutos(
                    1,
                    pesquisaTexto,
                    pesquisaTexto,
                    e.target.value,
                    [],
                    [],
                    [],
                    [],
                    [],
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

      {/* Tabela de produtos */}
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
              {filteredByStock.slice(0, itemsPerPage).map((produto) => (
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
                          handleToggleVisibilidade(produto.id, produto.visivel)
                        }
                        className={`p-1 rounded transition-colors ${
                          produto.visivel
                            ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                        }`}
                        title={
                          produto.visivel ? "Ocultar do site" : "Exibir no site"
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
      <CatalogoModal />
    </div>
  );
}
