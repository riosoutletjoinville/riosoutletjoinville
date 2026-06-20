import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface UsuarioPerfil {
  id: string
  nome: string
  email: string
  tipo: 'admin' | 'usuario' | 'vendedor' | 'contador'
  ativo: boolean
  local_trabalho?: string
  phone?: string
}

export function useUsuarioPerfil() {
  const { user } = useAuth()
  const [perfil, setPerfil] = useState<UsuarioPerfil | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function carregarPerfil() {
      if (!user) {
        setPerfil(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch('/api/usuario/perfil')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao carregar perfil')
        }

        setPerfil(data.perfil)
      } catch (err) {
        console.error('Erro ao carregar perfil:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    carregarPerfil()
  }, [user])

  return { perfil, loading, error }
}