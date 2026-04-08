'use client';

import { useState } from 'react';
import { useMercadoLivreConfig } from '@/hooks/useMercadoLivreConfig';

export default function MercadoLivreConfig() {
  const { config, isLoading, error, updateConfig, validateConfig } = useMercadoLivreConfig();
  const [formData, setFormData] = useState(config);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const validation = validateConfig();
    if (!validation.isValid) {
      alert(`Erros de configuração:\n${validation.errors.join('\n')}`);
      setIsSaving(false);
      return;
    }

    const success = await updateConfig(formData);
    if (success) {
      alert('Configuração salva com sucesso!');
      // Recarregar para aplicar as mudanças
      window.location.reload();
    } else {
      alert('Erro ao salvar configuração');
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return <div>Carregando configuração...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Configuração Mercado Livre</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            URL de Redirecionamento
          </label>
          <input
            type="url"
            value={formData.redirectUri}
            onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="https://ecommerce-gpmv.vercel.app//api/mercadolibre/callback"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            App ID
          </label>
          <input
            type="text"
            value={formData.appId}
            onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            URL Base (NEXTAUTH_URL)
          </label>
          <input
            type="url"
            value={formData.baseUrl}
            onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="https://ecommerce-gpmv.vercel.app/"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
        >
          {isSaving ? 'Salvando...' : 'Salvar Configuração'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">URL Atual:</h3>
        <code className="text-sm break-all">{config.redirectUri}</code>
        
        <h3 className="font-semibold mt-4 mb-2">Status:</h3>
        <div className={validateConfig().isValid ? 'text-green-600' : 'text-red-600'}>
          {validateConfig().isValid ? '✅ Configuração válida' : '❌ Configuração inválida'}
        </div>
      </div>
    </div>
  );
}