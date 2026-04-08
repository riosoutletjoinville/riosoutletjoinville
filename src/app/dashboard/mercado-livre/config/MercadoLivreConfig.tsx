//src/app/dashboard/mercado-livre/config
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { useMercadoLivreConfig } from '@/hooks/useMercadoLivreConfig';

export default function MercadoLivreConfig() {
  const router = useRouter();
  const { config, isLoading, error, updateConfig, validateConfig, clearError } = useMercadoLivreConfig();
  
  const [formData, setFormData] = useState({
    redirectUri: '',
    baseUrl: '',
    appId: '',
    clientSecret: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Preencher o formulário quando a configuração carregar
  useEffect(() => {
    if (!isLoading && config) {
      setFormData({
        redirectUri: config.redirectUri || '',
        baseUrl: config.baseUrl || '',
        appId: config.appId || '',
        clientSecret: config.clientSecret || ''
      });
    }
  }, [config, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    clearError();
    setSaveStatus('idle');

    const validation = validateConfig();
    if (!validation.isValid) {
      setSaveStatus('error');
      setIsSaving(false);
      return;
    }

    try {
      const success = await updateConfig(formData);
      
      if (success) {
        setSaveStatus('success');
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/dashboard/mercadolibre');
        }, 2000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      setSaveStatus('error');
      console.error('Erro ao salvar configuração:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Restaurar valores das variáveis de ambiente
    setFormData({
      redirectUri: process.env.NEXT_PUBLIC_MERCADO_LIVRE_REDIRECT_URI || '',
      baseUrl: process.env.NEXTAUTH_URL || '',
      appId: process.env.NEXT_PUBLIC_MERCADO_LIVRE_APP_ID || '',
      clientSecret: process.env.NEXT_PUBLIC_MERCADO_LIVRE_CLIENT_SECRET || ''
    });
    clearError();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const validation = validateConfig();

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <Settings className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold">Configuração do Mercado Livre</h1>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {saveStatus === 'success' && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              ✅ Configuração salva com sucesso! Redirecionando...
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              ❌ Erro ao salvar configuração. Verifique os valores.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Base (NEXTAUTH_URL)
              </label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://riosoutlet.joinville.br"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                URL base da sua aplicação (usada para redirecionamentos)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Redirecionamento
              </label>
              <input
                type="url"
                value={formData.redirectUri}
                onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://riosoutlet.joinville.br/api/mercadolibre/callback"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Esta URL deve ser idêntica à configurada no Painel do Mercado Livre
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App ID
              </label>
              <input
                type="text"
                value={formData.appId}
                onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Secret
              </label>
              <input
                type="password"
                value={formData.clientSecret}
                onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
              >
                <Save className="h-5 w-5 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Configuração'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Restaurar Padrão
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard/mercadolibre')}
                className="flex items-center bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-medium"
              >
                Voltar
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-3">Status da Configuração:</h3>
            
            <div className={`p-3 rounded ${validation.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {validation.isValid ? (
                <div>
                  <p className="font-medium">✅ Configuração válida</p>
                  <p className="text-sm mt-1">Todas as configurações necessárias estão preenchidas.</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">❌ Configuração incompleta</p>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">URLs Configuradas:</h4>
              <div className="text-sm space-y-2">
                <p><strong>Base:</strong> {formData.baseUrl || 'Não configurado'}</p>
                <p><strong>Redirecionamento:</strong> {formData.redirectUri || 'Não configurado'}</p>
                <p><strong>App ID:</strong> {formData.appId ? 'Configurado' : 'Não configurado'}</p>
                <p><strong>Client Secret:</strong> {formData.clientSecret ? 'Configurado' : 'Não configurado'}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">💡 Importante:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>Após alterar a URL, atualize também no Painel do Mercado Livre</li>
              <li>As URLs devem ser exatamente iguais em ambos os lugares</li>
              <li>Reinicie a aplicação após mudanças significativas</li>
              <li>Teste sempre a conexão após alterar configurações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}