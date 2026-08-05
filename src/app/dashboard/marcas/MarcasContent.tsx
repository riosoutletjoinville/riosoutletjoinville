// app/dashboard/brands/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { supabase, getAdminClient } from "@/lib/supabase";
import { 
  Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search, 
  Upload, X, Image as ImageIcon 
} from "lucide-react";

interface Marca {
  id: string;
  nome: string;
  created_at: string;
  slug: string; 
  logo_url?: string; 
}

export default function MarcasContent() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    nome: "",
    slug: "", // ADICIONADO
    logo_url: "", // ADICIONADO
  });
  const adminClient = getAdminClient();
  // Estados para upload de imagem
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Estados para paginação e pesquisa
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  // Função para gerar slug base
  const gerarSlug = (nome: string): string => {
    return nome
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Função para gerar slug único para marcas
  const gerarSlugUnico = async (
    nome: string,
    marcaId?: string,
  ): Promise<string> => {
    const slugBase = gerarSlug(nome);
    let slug = slugBase;
    let contador = 1;

    while (true) {
      let query = supabase.from("marcas").select("id").eq("slug", slug);

      if (marcaId) {
        query = query.neq("id", marcaId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("Erro ao verificar slug:", error);
        return slugBase;
      }

      if (!data) {
        break;
      }

      slug = `${slugBase}-${contador}`;
      contador++;
    }

    return slug;
  };

  // Função para upload de imagem
  const uploadImage = async (file: File, marcaId: string, slug: string): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Arquivo deve ser uma imagem');
      }
      
      // Validar tamanho (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('Imagem deve ter no máximo 2MB');
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${slug}-${Date.now()}.${fileExt}`;
      const filePath = `brands/${fileName}`;

      // Fazer upload para o bucket 'images-marcas' (assumindo que já existe)
      const { error: uploadError } = await adminClient.storage
        .from('images-marcas')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública da imagem
      const { data: { publicUrl } } = adminClient.storage
        .from('images-marcas')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Função para deletar imagem do storage
  const deleteImage = async (imageUrl: string) => {
    try {
      // Extrair o path da URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `brands/${fileName}`;

      const { error } = await adminClient.storage
        .from('images-marcas')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
    }
  };

  const loadMarcas = useCallback(async () => {
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from("marcas")
        .select("*", { count: "exact" })
        .order("nome", { ascending: true });

      if (searchTerm.trim() !== "") {
        query = query.ilike("nome", `%${searchTerm}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setMarcas(data || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error("Erro ao carregar marcas:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    loadMarcas();
  }, [loadMarcas]);

  // MODIFICADO: handleSubmit com slug e imagem
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Gerar slug automaticamente
      const slug = await gerarSlugUnico(
        formData.nome,
        editingMarca?.id
      );

      let logo_url = formData.logo_url;

      // Se houver nova imagem selecionada, fazer upload
      if (selectedFile) {
        // Se estiver editando e já tiver imagem, deletar a antiga
        if (editingMarca?.logo_url) {
          await deleteImage(editingMarca.logo_url);
        }
        
        // Fazer upload da nova imagem (usando o slug e ID temporário ou real)
        const tempId = editingMarca?.id || 'temp';
        logo_url = await uploadImage(selectedFile, tempId, slug);
      }

      const marcaData = {
        nome: formData.nome,
        slug: slug,
        logo_url: logo_url || null,
      };

      if (editingMarca) {
        const { error } = await supabase
          .from("marcas")
          .update(marcaData)
          .eq("id", editingMarca.id);

        if (error) throw error;
      } else {
        const { data: newMarca, error } = await supabase
          .from("marcas")
          .insert([marcaData])
          .select()
          .single();

        if (error) throw error;

        // Se tiver imagem e foi upload com ID temporário, não precisa renomear
        // pois o nome já contém o slug
      }

      // Reset do formulário
      setShowForm(false);
      setEditingMarca(null);
      setFormData({ 
        nome: "",
        slug: "",
        logo_url: ""
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      
      await loadMarcas();
    } catch (error) {
      console.error("Erro ao salvar marca:", error);
      alert(error instanceof Error ? error.message : "Erro ao salvar marca");
    }
  };

  // MODIFICADO: handleDelete com exclusão de imagem
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta marca?")) return;

    try {
      // Buscar a marca para pegar a URL da imagem
      const { data: marca } = await supabase
        .from("marcas")
        .select("logo_url")
        .eq("id", id)
        .single();

      // Deletar a imagem se existir
      if (marca?.logo_url) {
        await deleteImage(marca.logo_url);
      }

      // Deletar a marca
      const { error } = await supabase.from("marcas").delete().eq("id", id);

      if (error) throw error;

      await loadMarcas();
    } catch (error) {
      console.error("Erro ao excluir marca:", error);
    }
  };

  // Handler para seleção de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Handler para remover imagem selecionada
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  // Limpar preview ao desmontar
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Cálculos para paginação
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Marcas</h1>
          <p className="text-gray-600 mt-1">
            Total de {totalItems} marcas {searchTerm ? "encontradas" : "cadastradas"}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nova Marca
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Pesquisar marcas..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              {searchTerm ? "Resultados da pesquisa" : "Todas as marcas"}
            </span>
          </div>
        </div>
      </div>

      {/* Formulário com upload de imagem */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingMarca ? "Editar Marca" : "Nova Marca"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nome da marca"
                />
              </div>

              {/* Campo de upload de imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo da Marca
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  {previewUrl || (editingMarca?.logo_url && !selectedFile) ? (
                    <div className="relative">
                      <img
                        src={previewUrl || editingMarca?.logo_url || ''}
                        alt="Preview"
                        className="w-24 h-24 object-contain border rounded-md"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                      <ImageIcon className="text-gray-400" size={32} />
                    </div>
                  )}
                  
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={uploading}
                    />
                    <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center">
                      <Upload size={16} className="mr-2" />
                      {uploading ? 'Enviando...' : 'Escolher imagem'}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Formatos: JPG, PNG, GIF. Tamanho máximo: 2MB
                </p>
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-700 mb-2">Informações</h4>
              <p className="text-sm text-gray-600">
                • O slug será gerado automaticamente a partir do nome
              </p>
              {editingMarca && (
                <p className="text-sm text-gray-600 mt-2">
                  Slug atual: <code className="bg-gray-200 px-1 py-0.5 rounded">{editingMarca.slug}</code>
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Enviando...' : (editingMarca ? "Atualizar" : "Adicionar")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingMarca(null);
                setFormData({ 
                  nome: "",
                  slug: "",
                  logo_url: ""
                });
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabela com imagem */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {marcas.map((marca) => (
                <tr
                  key={marca.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    {marca.logo_url ? (
                      <img
                        src={marca.logo_url}
                        alt={marca.nome}
                        className="w-10 h-10 object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                        <ImageIcon className="text-gray-400" size={16} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {marca.nome}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                    {marca.slug || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(marca.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingMarca(marca);
                          setFormData({ 
                            nome: marca.nome,
                            slug: marca.slug,
                            logo_url: marca.logo_url || ""
                          });
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(marca.id)}
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

        {marcas.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? (
              <p>{`Nenhuma marca encontrada para "${searchTerm}"`}</p>
            ) : (
              <p>Nenhuma marca cadastrada</p>
            )}
          </div>
        )}

        {/* Paginação (manter igual) */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <span className="text-sm text-gray-700">Itens por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) =>
                  handleItemsPerPageChange(Number(e.target.value))
                }
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages} • Total: {totalItems}{" "}
                {searchTerm ? "resultados" : "marcas"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="hidden sm:flex space-x-1">
                {getPageNumbers().map((pageNum) => (
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
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                title="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}