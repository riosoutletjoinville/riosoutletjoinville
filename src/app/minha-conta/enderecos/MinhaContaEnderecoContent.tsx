// src/app/minha-conta/enderecos/page.tsx
'use client';

import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ClienteHeader from '@/components/clientes/HeaderClientes';
import { useEffect, useState } from 'react';
import { MapPin, Save, Home, Building, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface EnderecoCliente {
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export default function MinhaContaEnderecoContent() {
  const { cliente, loading, atualizarCliente } = useClienteAuth();
  const [formData, setFormData] = useState<EnderecoCliente | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData({
        endereco: cliente.endereco || '',
        numero: cliente.numero || '',
        complemento: cliente.complemento || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        cep: cliente.cep || '',
      });
    }
  }, [cliente]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formData) {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSalvando(true);
    try {
      const result = await atualizarCliente(formData);
      if (result.success) {
        toast.success('Endereço atualizado com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao atualizar endereço');
      }
    } catch (error) {
      toast.error('Erro ao atualizar endereço');
    } finally {
      setSalvando(false);
    }
  };

  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev!,
          endereco: data.logradouro || prev?.endereco,
          bairro: data.bairro || prev?.bairro,
          cidade: data.localidade || prev?.cidade,
          estado: data.uf || prev?.estado,
        }));
        toast.success('CEP encontrado!');
      } else {
        toast.error('CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Acesso Restrito</h2>
            <p className="text-gray-600 mb-6">
              Faça login para acessar sua área de cliente.
            </p>
            <Button asChild>
              <Link href="/minha-conta/login">
                Fazer Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClienteHeader activeTab="enderecos" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meus Endereços</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seu endereço de entrega.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CEP */}
              <div>
                <Label htmlFor="cep">CEP</Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    name="cep"
                    value={formData.cep || ''}
                    onChange={handleChange}
                    onBlur={(e) => buscarCep(e.target.value)}
                    placeholder="00000-000"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco || ''}
                  onChange={handleChange}
                  placeholder="Rua, Avenida..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    name="numero"
                    value={formData.numero || ''}
                    onChange={handleChange}
                    placeholder="Número"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    name="complemento"
                    value={formData.complemento || ''}
                    onChange={handleChange}
                    placeholder="Complemento (opcional)"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  name="bairro"
                  value={formData.bairro || ''}
                  onChange={handleChange}
                  placeholder="Bairro"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={formData.cidade || ''}
                    onChange={handleChange}
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    name="estado"
                    value={formData.estado || ''}
                    onChange={handleChange}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={salvando} className="gap-2">
                  <Save className="h-4 w-4" />
                  {salvando ? 'Salvando...' : 'Salvar Endereço'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}