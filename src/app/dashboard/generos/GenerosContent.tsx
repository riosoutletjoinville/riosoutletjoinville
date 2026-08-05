// app/dashboard/genders/page.tsx
'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface Genero {
  id: string
  nome: string
  created_at: string
  slug: string  // ADICIONADO: campo slug
}

export default function GenerosContent() {
  const [generos, setGeneros] = useState<Genero[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGenero, setEditingGenero] = useState<Genero | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ 
    nome: '',
    slug: '' // ADICIONADO: campo slug no estado do formulário
  })
  
  // Estados para paginação e pesquisa
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'nome' | 'created_at'>('nome')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadGeneros()
  }, [sortField, sortDirection]) // ADICIONADO: recarregar quando ordenação mudar

  const loadGeneros = async () => {
    try {
      let query = supabase
        .from('generos')
        .select('*')

      // Aplicar ordenação
      query = query.order(sortField, { ascending: sortDirection === 'asc' })

      const { data, error } = await query

      if (error) throw error
      setGeneros(data || [])
    } catch (error) {
      console.error('Erro ao carregar gêneros:', error)
    } finally {
      setLoading(false)
    }
  }

  // ADICIONADO: Função para gerar slug base
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

  // ADICIONADO: Função para gerar slug único para gêneros
  const gerarSlugUnico = async (
    nome: string,
    generoId?: string,
  ): Promise<string> => {
    const slugBase = gerarSlug(nome);
    let slug = slugBase;
    let contador = 1;

    while (true) {
      let query = supabase.from("generos").select("id").eq("slug", slug);

      if (generoId) {
        query = query.neq("id", generoId);
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

  // Filtrar gêneros baseado no termo de pesquisa
  const filteredGeneros = generos.filter(genero =>
    genero.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular dados da paginação
  const totalPages = Math.ceil(filteredGeneros.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = filteredGeneros.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: 'nome' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    // A ordenação será aplicada automaticamente pelo useEffect
  }

  // MODIFICADO: handleSubmit com slug
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Gerar slug automaticamente a partir do nome
      const slug = await gerarSlugUnico(
        formData.nome,
        editingGenero?.id
      );

      const generoData = {
        nome: formData.nome,
        slug: slug, // Incluir o slug gerado
      };

      if (editingGenero) {
        const { error } = await supabase
          .from('generos')
          .update(generoData)
          .eq('id', editingGenero.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('generos')
          .insert([generoData])

        if (error) throw error
      }

      setShowForm(false)
      setEditingGenero(null)
      setFormData({ 
        nome: '',
        slug: '' // Reset do slug
      })
      await loadGeneros()
      setCurrentPage(1)
    } catch (error) {
      console.error('Erro ao salvar gênero:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este gênero?')) return

    try {
      const { error } = await supabase
        .from('generos')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadGeneros()
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (error) {
      console.error('Erro ao excluir gênero:', error)
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gêneros</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Gênero
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Pesquisar gêneros..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Mostrando {currentItems.length} de {filteredGeneros.length} itens</span>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingGenero ? 'Editar Gênero' : 'Novo Gênero'}
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Masculino, Feminino, Unissex"
              />
            </div>
            
            {/* MODIFICADO: Campo slug removido - é gerado automaticamente */}
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingGenero ? 'Atualizar' : 'Adicionar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingGenero(null)
                setFormData({ 
                  nome: '',
                  slug: '' // Reset do slug
                })
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('nome')}
                >
                  <div className="flex items-center">
                    Nome
                    {sortField === 'nome' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                {/* ADICIONADO: Nova coluna para o slug */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Criado em
                    {sortField === 'created_at' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((genero) => (
                <tr key={genero.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {genero.nome}
                  </td>
                  {/* ADICIONADO: Exibição do slug */}
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                    {genero.slug || '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(genero.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingGenero(genero)
                          setFormData({ 
                            nome: genero.nome,
                            slug: genero.slug // Manter slug ao editar
                          })
                          setShowForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(genero.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? (
              <p>{`Nenhum gênero encontrado para "${searchTerm}"`}</p>
            ) : (
              <p>Nenhum gênero cadastrado</p>
            )}
          </div>
        )}

        {/* Paginação (manter igual) */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredGeneros.length)} de {filteredGeneros.length} resultados
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = currentPage <= 3 
                      ? i + 1 
                      : currentPage >= totalPages - 2 
                      ? totalPages - 4 + i 
                      : currentPage - 2 + i
                    
                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-md text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                          } transition-colors`}
                        >
                          {pageNum}
                        </button>
                      )
                    }
                    return null
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-2">...</span>
                  )}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {totalPages}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}