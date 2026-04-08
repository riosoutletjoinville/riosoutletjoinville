// src/app/minha-conta/login/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function LoginContent() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  
  const { login } = useClienteAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const resultado = await login(email, senha);
      if (resultado.success) {
        router.push('/minha-conta/pedidos');
      } else {
        setErro(resultado.error || 'Erro ao fazer login');
      }
    } catch {
      // 👈 Remover o parâmetro 'error' já que não está sendo usado
      setErro('Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Acesse sua conta</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>
            
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="Sua senha"
              />
            </div>

            {erro && (
              <div className="text-red-600 text-sm text-center">{erro}</div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={carregando}
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Ainda não tem uma conta?{' '}
              <Link 
                href="/checkout" 
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Fazer primeiro pedido
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}