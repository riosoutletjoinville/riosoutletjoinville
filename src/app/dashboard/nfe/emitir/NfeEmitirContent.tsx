// src/app/dashboard/nfe/emitir/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NFeForm } from '@/components/dashboard/NFeForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NfeEmitirContent() {
  const router = useRouter();
  const [configFiscal, setConfigFiscal] = useState(null);
  const [certificadoValido, setCertificadoValido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verificarConfiguracao();
  }, []);

  async function verificarConfiguracao() {
    setLoading(true);
    setError(null);

    try {
      // Buscar configurações fiscais usando a API
      const configResponse = await fetch('/api/configuracoes-fiscais');
      if (!configResponse.ok) {
        throw new Error('Erro ao buscar configurações fiscais');
      }
      const configData = await configResponse.json();
      setConfigFiscal(configData.configFiscal);

      // Verificar certificados válidos usando a API
      const hoje = new Date().toISOString().split('T')[0];
      const certResponse = await fetch(
        `/api/certificados/verificar?ativo=true&validade=${hoje}`
      );
      
      if (!certResponse.ok) {
        throw new Error('Erro ao verificar certificados');
      }
      
      const certData = await certResponse.json();
      setCertificadoValido(certData.certificadoValido);

    } catch (err) {
      console.error('Erro na verificação:', err);
      setError(err instanceof Error ? err.message : 'Erro ao verificar configuração');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Erro ao verificar configuração: {error}
            <Button 
              variant="link" 
              className="ml-2"
              onClick={() => verificarConfiguracao()}
            >
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!configFiscal) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Configure os dados fiscais da empresa antes de emitir NF-e.
            <Button 
              variant="link" 
              className="ml-2"
              onClick={() => router.push('/dashboard/configuracoes-fiscais')}
            >
              Ir para configurações
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!certificadoValido) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nenhum certificado A3 válido encontrado. Faça o upload do certificado.
            <Button 
              variant="link" 
              className="ml-2"
              onClick={() => router.push('/dashboard/configuracoes-fiscais')}
            >
              Enviar certificado
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Emissão de NF-e</CardTitle>
        </CardHeader>
        <CardContent>
          <NFeForm 
            configFiscal={configFiscal}
            onSuccess={() => router.push('/dashboard/nfe')}
          />
        </CardContent>
      </Card>
    </div>
  );
}