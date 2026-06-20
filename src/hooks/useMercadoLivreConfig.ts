// src/hooks/useMercadoLivreConfig.ts
import { useState, useEffect } from 'react';

export interface MercadoLivreConfig {
  redirectUri: string;
  baseUrl: string;
  appId: string;
  clientSecret: string;
}

export const useMercadoLivreConfig = () => {
  const [config, setConfig] = useState<MercadoLivreConfig>({
    redirectUri: '',
    baseUrl: '',
    appId: '',
    clientSecret: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // src/hooks/useMercadoLivreConfig.ts
useEffect(() => {
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      // ✅ USAR APENAS variáveis de ambiente
      const envConfig: MercadoLivreConfig = {
        redirectUri: process.env.NEXT_PUBLIC_MERCADO_LIVRE_REDIRECT_URI || '',
        baseUrl: process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || '',
        appId: process.env.NEXT_PUBLIC_MERCADO_LIVRE_APP_ID || '',
        clientSecret: process.env.NEXT_PUBLIC_MERCADO_LIVRE_CLIENT_SECRET || ''
      };

      console.log('🔧 Configuração carregada do .env:', {
        appId: envConfig.appId,
        redirectUri: envConfig.redirectUri,
        baseUrl: envConfig.baseUrl
      });

      // ✅ NÃO usar localStorage para configuração
      setConfig(envConfig);
      
    } catch (err) {
      setError('Erro ao carregar configuração');
      console.error('Erro no hook useMercadoLivreConfig:', err);
    } finally {
      setIsLoading(false);
    }
  };

  loadConfig();
}, []);
  const updateConfig = async (newConfig: Partial<MercadoLivreConfig>) => {
    try {
      setIsLoading(true);
      const updatedConfig = { ...config, ...newConfig };
      
      setConfig(updatedConfig);
      
      // ❌ REMOVA o localStorage - use apenas variáveis de ambiente
      // localStorage.setItem('ml_config', JSON.stringify(updatedConfig));
      
      console.warn('⚠️ Configurações atualizadas apenas em memória. Para persistir, atualize o .env');
      
      return true;
    } catch (err) {
      setError('Erro ao atualizar configuração');
      console.error('Erro ao atualizar configuração:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const syncWithMercadoLivre = async (): Promise<boolean> => {
    try {
      console.log('Configuração atual:', config);
      return true;
    } catch (err) {
      console.error('Erro ao sincronizar com Mercado Livre:', err);
      return false;
    }
  };

  const validateConfig = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!config.redirectUri) errors.push('URL de redirecionamento não configurada');
    if (!config.appId) errors.push('App ID não configurado');
    if (!config.clientSecret) errors.push('Client Secret não configurado');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  return {
    config,
    isLoading,
    error,
    updateConfig,
    syncWithMercadoLivre,
    validateConfig,
    clearError: () => setError(null)
  };
};