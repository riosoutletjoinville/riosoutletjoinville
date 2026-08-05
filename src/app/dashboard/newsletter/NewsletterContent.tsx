// src/app/dashboard/newsletter/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Assinante {
  id: string;
  email: string;
  nome: string | null;
  ativo: boolean;
  confirmado: boolean;
  data_inscricao: string;
}

export default function NewsletterContent() {
  const [assinantes, setAssinantes] = useState<Assinante[]>([]);
  const [loading, setLoading] = useState(true);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    ativos: 0,
    confirmados: 0
  });

  useEffect(() => {
    carregarAssinantes();
  }, []);

  const carregarAssinantes = async () => {
    const { data, error } = await supabase
      .from('newsletter_assinantes')
      .select('*')
      .order('data_inscricao', { ascending: false });

    if (error) {
      console.error('Erro ao carregar assinantes:', error);
      return;
    }

    setAssinantes(data || []);

    // Calcular estatísticas
    const total = data?.length || 0;
    const ativos = data?.filter(a => a.ativo).length || 0;
    const confirmados = data?.filter(a => a.confirmado).length || 0;

    setEstatisticas({ total, ativos, confirmados });
    setLoading(false);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestão de Newsletter</h1>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Total de Inscritos</h3>
          <p className="text-2xl font-bold text-blue-600">{estatisticas.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Ativos</h3>
          <p className="text-2xl font-bold text-green-600">{estatisticas.ativos}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Confirmados</h3>
          <p className="text-2xl font-bold text-purple-600">{estatisticas.confirmados}</p>
        </div>
      </div>

      {/* Lista de Assinantes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Lista de Assinantes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">E-mail</th>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {assinantes.map((assinante) => (
                <tr key={assinante.id} className="border-t">
                  <td className="px-4 py-2">{assinante.email}</td>
                  <td className="px-4 py-2">{assinante.nome || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      assinante.ativo && assinante.confirmado 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assinante.ativo && assinante.confirmado ? 'Ativo' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {new Date(assinante.data_inscricao).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}