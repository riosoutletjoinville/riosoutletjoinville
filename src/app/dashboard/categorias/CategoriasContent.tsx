// app/dashboard/categories/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  FolderTree,
} from "lucide-react";
import { SlowBuffer } from "buffer";

interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  ml_category_id: string;
  created_at: string;
  exibir_no_site: boolean;
  categoria_pai_id: string | null;
  slug: string;
  subcategorias?: Categoria[];
}

export default function CategoriesContent() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [expandedCategorias, setExpandedCategorias] = useState<Set<string>>(
    new Set(),
  );

  // Estado para o formulário
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ml_category_id: "",
    exibir_no_site: true,
    categoria_pai_id: "",
    slug: "",
  });

  // Estados para paginação e pesquisa
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterExibirNoSite, setFilterExibirNoSite] = useState<
    "all" | "visible" | "hidden"
  >("all");

  // Carregar categorias com hierarquia
  const loadCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");

      if (error) throw error;

      // Organizar em árvore
      const categoriasMap = new Map();
      const categoriasArvore: Categoria[] = [];

      // Primeiro, mapear todas as categorias
      data?.forEach((cat) => {
        categoriasMap.set(cat.id, { ...cat, subcategorias: [] });
      });

      // Depois, organizar hierarquia
      data?.forEach((cat) => {
        const categoria = categoriasMap.get(cat.id);
        if (cat.categoria_pai_id) {
          const pai = categoriasMap.get(cat.categoria_pai_id);
          if (pai) {
            pai.subcategorias.push(categoria);
          }
        } else {
          categoriasArvore.push(categoria);
        }
      });

      setCategorias(categoriasArvore);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

  // Filtrar categorias
  const filterCategorias = (categorias: Categoria[]): Categoria[] => {
    return categorias
      .filter((cat) => {
        const matchesSearch =
          searchTerm === "" ||
          cat.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesVisibility =
          filterExibirNoSite === "all" ||
          (filterExibirNoSite === "visible" && cat.exibir_no_site) ||
          (filterExibirNoSite === "hidden" && !cat.exibir_no_site);

        return matchesSearch && matchesVisibility;
      })
      .map((cat) => ({
        ...cat,
        subcategorias: filterCategorias(cat.subcategorias || []),
      }));
  };

  const filteredCategorias = filterCategorias(categorias);

  // Paginação
  const flattenCategorias = (cats: Categoria[]): Categoria[] => {
    return cats.reduce((acc, cat) => {
      acc.push(cat);
      if (cat.subcategorias && cat.subcategorias.length > 0) {
        acc.push(...flattenCategorias(cat.subcategorias));
      }
      return acc;
    }, [] as Categoria[]);
  };

  const flatList = flattenCategorias(filteredCategorias);
  const totalPages = Math.ceil(flatList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = flatList.slice(startIndex, startIndex + itemsPerPage);

  // Função para gerar slug base (sem verificação de duplicidade)
  const gerarSlug = (nome: string): string => {
    return nome
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
    nome: string,
    categoriaId?: string,
  ): Promise<string> => {
    const slugBase = gerarSlug(nome);
    let slug = slugBase;
    let contador = 1;

    while (true) {
      let query = supabase.from("categorias").select("id").eq("slug", slug);

      // Se estiver editando, exclui o próprio produto da verificação
      if (categoriaId) {
        query = query.neq("id", categoriaId);
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

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const slug = await gerarSlugUnico(
      formData.nome,
      editingCategoria?.id
    );

    const categoriaData = {
      ...formData,
      categoria_pai_id: formData.categoria_pai_id || null,
      slug: slug, // 👈 IMPORTANTE: substituir o slug pelo novo gerado
    };

    if (editingCategoria) {
      const { error } = await supabase
        .from("categorias")
        .update(categoriaData)
        .eq("id", editingCategoria.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("categorias")
        .insert([categoriaData]);

      if (error) throw error;
    }
    
    setShowForm(false);
    setEditingCategoria(null);
    setFormData({
      nome: "",
      descricao: "",
      ml_category_id: "",
      exibir_no_site: true,
      categoria_pai_id: "",
      slug: "", // Aqui pode ser vazio mesmo, pois vai ser gerado novamente
    });
    await loadCategorias();
    setCurrentPage(1);
  } catch (error) {
    console.error("Erro ao salvar categoria:", error);
  }
};

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir esta categoria? Todas as subcategorias serão excluídas também.",
      )
    )
      return;

    try {
      const { error } = await supabase.from("categorias").delete().eq("id", id);

      if (error) throw error;

      await loadCategorias();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
    }
  };

  const toggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from("categorias")
        .update({ exibir_no_site: !currentVisibility })
        .eq("id", id);

      if (error) throw error;

      await loadCategorias();
    } catch (error) {
      console.error("Erro ao alterar visibilidade:", error);
    }
  };

  const toggleExpand = (categoriaId: string) => {
    const newExpanded = new Set(expandedCategorias);
    if (newExpanded.has(categoriaId)) {
      newExpanded.delete(categoriaId);
    } else {
      newExpanded.add(categoriaId);
    }
    setExpandedCategorias(newExpanded);
  };

  const getCategoriasParaSelect = (): {
    id: string;
    nome: string;
    nivel: number;
  }[] => {
    const result: { id: string; nome: string; nivel: number }[] = [];

    const addCategoria = (cat: Categoria, nivel: number) => {
      result.push({ id: cat.id, nome: cat.nome, nivel });
      if (cat.subcategorias) {
        cat.subcategorias.forEach((sub) => addCategoria(sub, nivel + 1));
      }
    };

    categorias.forEach((cat) => addCategoria(cat, 0));
    return result;
  };

  const renderCategoriaRow = (categoria: Categoria, depth: number = 0) => {
    const isExpanded = expandedCategorias.has(categoria.id);
    const hasSubcategorias =
      categoria.subcategorias && categoria.subcategorias.length > 0;

    return (
      <>
        <tr key={categoria.id} className="hover:bg-gray-50">
          <td className="px-6 py-4">
            <div
              style={{ marginLeft: `${depth * 24}px` }}
              className="flex items-center"
            >
              {hasSubcategorias && (
                <button
                  onClick={() => toggleExpand(categoria.id)}
                  className="mr-2 text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRightIcon size={18} />
                  )}
                </button>
              )}
              {!hasSubcategorias && depth > 0 && <span className="w-5 mr-2" />}
              <FolderTree
                size={16}
                className={`mr-2 ${depth > 0 ? "text-gray-400" : "text-amber-500"}`}
              />
              <span
                className={
                  depth > 0 ? "text-gray-600" : "font-medium text-gray-900"
                }
              >
                {categoria.nome}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 text-gray-600 max-w-md">
            <div className="line-clamp-2">{categoria.descricao || "-"}</div>
          </td>
          <td className="px-6 py-4">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                categoria.exibir_no_site
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {categoria.exibir_no_site ? "Visível" : "Oculto"}
            </span>
          </td>
          <td className="px-6 py-4 text-gray-600">
            {new Date(categoria.created_at).toLocaleDateString("pt-BR")}
          </td>
          <td className="px-6 py-4">
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  toggleVisibility(categoria.id, categoria.exibir_no_site)
                }
                className={`p-1 rounded transition-colors ${
                  categoria.exibir_no_site
                    ? "text-green-600 hover:text-green-800 hover:bg-green-50"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
                title={
                  categoria.exibir_no_site
                    ? "Ocultar no site"
                    : "Exibir no site"
                }
              >
                {categoria.exibir_no_site ? (
                  <Eye size={16} />
                ) : (
                  <EyeOff size={16} />
                )}
              </button>
              <button
                onClick={() => {
                  setEditingCategoria(categoria);
                  setFormData({
                    nome: categoria.nome,
                    descricao: categoria.descricao || "",
                    ml_category_id: categoria.ml_category_id || "",
                    exibir_no_site: categoria.exibir_no_site,
                    categoria_pai_id: categoria.categoria_pai_id || "",
                    slug: categoria.slug,
                  });
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                title="Editar"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(categoria.id)}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded &&
          hasSubcategorias &&
          categoria.subcategorias?.map((sub) =>
            renderCategoriaRow(sub, depth + 1),
          )}
      </>
    );
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Categorias</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nova Categoria
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Pesquisar categorias..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Status:
            </label>
            <select
              value={filterExibirNoSite}
              onChange={(e) => {
                setFilterExibirNoSite(
                  e.target.value as "all" | "visible" | "hidden",
                );
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="visible">Visíveis no site</option>
              <option value="hidden">Ocultos no site</option>
            </select>
          </div>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome*
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Nome da categoria"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria Pai
              </label>
              <select
                value={formData.categoria_pai_id}
                onChange={(e) =>
                  setFormData({ ...formData, categoria_pai_id: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhuma (Categoria Principal)</option>
                {getCategoriasParaSelect()
                  .filter((c) => c.id !== editingCategoria?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {"—".repeat(cat.nivel)} {cat.nome}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Mercado Livre
              </label>
              <input
                type="text"
                value={formData.ml_category_id}
                onChange={(e) =>
                  setFormData({ ...formData, ml_category_id: e.target.value })
                }
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="MLB271700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Descrição da categoria"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.exibir_no_site}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exibir_no_site: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Exibir no site público
                </span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingCategoria ? "Atualizar" : "Adicionar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingCategoria(null);
                setFormData({
                  nome: "",
                  descricao: "",
                  ml_category_id: "",
                  exibir_no_site: true,
                  categoria_pai_id: "",
                  slug: "",
                });
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((cat) => renderCategoriaRow(cat))}
            </tbody>
          </table>
        </div>

        {flatList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhuma categoria encontrada
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a{" "}
                {Math.min(startIndex + itemsPerPage, flatList.length)} de{" "}
                {flatList.length} resultados
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
