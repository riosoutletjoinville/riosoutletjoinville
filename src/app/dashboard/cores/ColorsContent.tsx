// app/dashboard/colors/page.tsx
'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface Cor {
  id: string
  nome: string
  codigo_hex: string
  created_at: string
  updated_at: string
}

export default function ColorsPage() {
  const [cores, setCores] = useState<Cor[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCor, setEditingCor] = useState<Cor | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ nome: '', codigo_hex: '' })
  
  // Estados para paginação e pesquisa
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'nome' | 'created_at'>('nome')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadCores()
  }, [])

  const loadCores = async () => {
    try {
      let query = supabase
        .from('cores')
        .select('*')

      // Aplicar ordenação
      query = query.order(sortField, { ascending: sortDirection === 'asc' })

      const { data, error } = await query

      if (error) throw error
      setCores(data || [])
    } catch (error) {
      console.error('Erro ao carregar cores:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar cores baseado no termo de pesquisa
  const filteredCores = cores.filter(cor =>
    cor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cor.codigo_hex?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calcular dados da paginação
  const totalPages = Math.ceil(filteredCores.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentItems = filteredCores.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: 'nome' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCor) {
        const { error } = await supabase
          .from('cores')
          .update(formData)
          .eq('id', editingCor.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cores')
          .insert([formData])

        if (error) throw error
      }

      setShowForm(false)
      setEditingCor(null)
      setFormData({ nome: '', codigo_hex: '' })
      await loadCores()
      setCurrentPage(1) // Voltar para a primeira página após ação
    } catch (error) {
      console.error('Erro ao salvar cor:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta cor?')) return

    try {
      const { error } = await supabase
        .from('cores')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadCores()
      // Se a página atual ficar vazia após exclusão, voltar uma página
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (error) {
      console.error('Erro ao excluir cor:', error)
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Cores</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Nova Cor
        </button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Pesquisar cores por nome ou código HEX..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // Resetar para primeira página ao pesquisar
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Mostrando {currentItems.length} de {filteredCores.length} itens</span>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {editingCor ? 'Editar Cor' : 'Nova Cor'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome*</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nome da cor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código HEX</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.codigo_hex || '#ffffff'}
                  onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                  className="h-10 w-10 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.codigo_hex}
                  onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="#FFFFFF"
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  title="Digite um código HEX válido (ex: #FF0000 ou #F00)"
                />
              </div>
              {formData.codigo_hex && (
                <p className="text-xs text-gray-500 mt-1">
                  Clique no quadrado colorido para escolher ou digite o código HEX
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingCor ? 'Atualizar' : 'Adicionar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingCor(null)
                setFormData({ nome: '', codigo_hex: '' })
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cor
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
              {currentItems.map((cor) => (
                <tr key={cor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {cor.nome}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {cor.codigo_hex && (
                        <>
                          <div 
                            className="w-8 h-8 rounded-full border border-gray-300 mr-3 shadow-sm" 
                            style={{ backgroundColor: cor.codigo_hex }}
                            title={cor.codigo_hex}
                          ></div>
                          <span className="text-sm text-gray-600 font-mono">
                            {cor.codigo_hex.toUpperCase()}
                          </span>
                        </>
                      )}
                      {!cor.codigo_hex && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(cor.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingCor(cor)
                          setFormData({ nome: cor.nome, codigo_hex: cor.codigo_hex || '' })
                          setShowForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cor.id)}
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
              <p>{`Nenhuma categoria encontrada para "${searchTerm}"`}</p>
            ) : (
              <p>Nenhuma cor cadastrada</p>
            )}
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredCores.length)} de {filteredCores.length} resultados
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