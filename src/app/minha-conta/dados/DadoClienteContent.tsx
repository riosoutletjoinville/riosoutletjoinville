// src/app/minha-conta/dados/page.tsx
'use client';

import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ClienteHeader from '@/components/clientes/HeaderClientes';
import { useEffect, useState } from 'react';
import { User, Save, Mail, Phone, MapPin, Building, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ClienteDados {
  id: string;
  nome?: string;
  sobrenome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipo_cliente: 'fisica' | 'juridica';
}

export default function DadosClienteContent() {
  const { cliente, loading, atualizarCliente } = useClienteAuth();
  const [formData, setFormData] = useState<ClienteDados | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (cliente) {
      setFormData(cliente as ClienteDados);
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
        toast.success('Dados atualizados com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao atualizar dados');
      }
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setSalvando(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isFisica = formData.tipo_cliente === 'fisica';

  return (
    <div className="min-h-screen bg-gray-50">
      <ClienteHeader activeTab="dados" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meus Dados</h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas informações pessoais e de contato.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isFisica ? (
                // Pessoa Física
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={formData.nome || ''}
                      onChange={handleChange}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sobrenome">Sobrenome</Label>
                    <Input
                      id="sobrenome"
                      name="sobrenome"
                      value={formData.sobrenome || ''}
                      onChange={handleChange}
                      placeholder="Seu sobrenome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      value={formData.cpf || ''}
                      onChange={handleChange}
                      placeholder="000.000.000-00"
                      disabled
                    />
                  </div>
                </div>
              ) : (
                // Pessoa Jurídica
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razao_social">Razão Social</Label>
                    <Input
                      id="razao_social"
                      name="razao_social"
                      value={formData.razao_social || ''}
                      onChange={handleChange}
                      placeholder="Razão Social da empresa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                    <Input
                      id="nome_fantasia"
                      name="nome_fantasia"
                      value={formData.nome_fantasia || ''}
                      onChange={handleChange}
                      placeholder="Nome Fantasia"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      name="cnpj"
                      value={formData.cnpj || ''}
                      onChange={handleChange}
                      placeholder="00.000.000/0000-00"
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                    <Input
                      id="inscricao_estadual"
                      name="inscricao_estadual"
                      value={formData.inscricao_estadual || ''}
                      onChange={handleChange}
                      placeholder="Inscrição Estadual"
                    />
                  </div>
                </div>
              )}

              {/* Contato */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formData.telefone || ''}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      name="endereco"
                      value={formData.endereco || ''}
                      onChange={handleChange}
                      placeholder="Rua, Avenida..."
                    />
                  </div>
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
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      name="complemento"
                      value={formData.complemento || ''}
                      onChange={handleChange}
                      placeholder="Complemento"
                    />
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
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      name="cep"
                      value={formData.cep || ''}
                      onChange={handleChange}
                      placeholder="00000-000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={salvando} className="gap-2">
                  <Save className="h-4 w-4" />
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}