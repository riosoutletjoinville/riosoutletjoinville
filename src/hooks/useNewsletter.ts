// src/hooks/useNewsletter.ts
import { useState } from 'react';

interface AssinaturaNewsletter {
  email: string;
  nome?: string;
}

interface UseNewsletterReturn {
  assinarNewsletter: (data: AssinaturaNewsletter) => Promise<{
    success: boolean;
    message: string;
    reativado?: boolean;
  }>;
  cancelarInscricao: (email: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  loading: boolean;
  error: string | null;
}

export function useNewsletter(): UseNewsletterReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assinarNewsletter = async (data: AssinaturaNewsletter) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/newsletter/assinatura', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao realizar inscrição');
      }

      return {
        success: true,
        message: result.message,
        reativado: result.reativado
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const cancelarInscricao = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/newsletter/assinatura?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao cancelar inscrição');
      }

      return {
        success: true,
        message: result.message
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    assinarNewsletter,
    cancelarInscricao,
    loading,
    error
  };
}