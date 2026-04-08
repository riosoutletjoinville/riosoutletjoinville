'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Plus, Trash2, Edit } from 'lucide-react'

interface Cor {
  id: string
  nome: string
  codigo_hex: string
  created_at: string
}

export default function CoresModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [cores, setCores] = useState<Cor[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCor, setEditingCor] = useState<Cor | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ nome: '', codigo_hex: '#000000' })

  useEffect(() => {
    loadCores()
  }, [])

  const loadCores = async () => {
    try {
      const { data, error } = await supabase
        .from('cores')
        .select('*')
        .order('nome', { ascending: true })

      if (error) throw error
      setCores(data || [])
    } catch (error) {
      console.error('Erro ao carregar cores:', error)
    } finally {
      setLoading(false)
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
      setFormData({ nome: '', codigo_hex: '#000000' })
      await loadCores()
      onSave()
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
      onSave()
    } catch (error) {
      console.error('Erro ao excluir cor:', error)
    }
  }

  if (loading) return <div>Carregando...</div>

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Gerenciar Cores</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Nova Cor
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              {editingCor ? 'Editar Cor' : 'Nova Cor'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome*</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Ex: Preto, Azul Marinho"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.codigo_hex}
                    onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={formData.codigo_hex}
                    onChange={(e) => setFormData({ ...formData, codigo_hex: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editingCor ? 'Atualizar' : 'Adicionar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCor(null)
                  setFormData({ nome: '', codigo_hex: '#000000' })
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cores.map((cor) => (
                <tr key={cor.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-300 mr-2"
                        style={{ backgroundColor: cor.codigo_hex }}
                      />
                      <span className="font-medium">{cor.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{cor.codigo_hex}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingCor(cor)
                          setFormData({ nome: cor.nome, codigo_hex: cor.codigo_hex })
                          setShowForm(true)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cor.id)}
                        className="text-red-600 hover:text-red-800"
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

          {cores.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma cor cadastrada</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}