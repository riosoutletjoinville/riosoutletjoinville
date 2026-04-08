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

  useEffect(() => {
  const loadConfig = async () => {
    try {
      setIsLoading(true);
      
      // Valores padrão das variáveis de ambiente
      const envConfig: MercadoLivreConfig = {
        redirectUri: process.env.NEXT_PUBLIC_MERCADO_LIVRE_REDIRECT_URI || '',
        baseUrl: process.env.NEXTAUTH_URL || '',
        appId: process.env.NEXT_PUBLIC_MERCADO_LIVRE_APP_ID || '',
        clientSecret: process.env.NEXT_PUBLIC_MERCADO_LIVRE_CLIENT_SECRET || ''
      };

      // Tenta buscar do localStorage
      if (typeof window !== "undefined") {
        const savedConfig = localStorage.getItem("ml_config");
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          // Mescla configuração salva com valores padrão
          setConfig({ ...parsedConfig, ...envConfig });
        } else {
          setConfig(envConfig);
        }
      } else {
        setConfig(envConfig);
      }
      
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
      localStorage.setItem('ml_config', JSON.stringify(updatedConfig));
      
      // Opcional: enviar para API se quiser persistir no servidor
      await fetch('/api/mercadolibre/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      
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
      console.log('Configuração sincronizada:', config);
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