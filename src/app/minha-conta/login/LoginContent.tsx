// src/app/minha-conta/login/LoginContent.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShoppingBag, 
  Truck, 
  Gift, 
  User, 
  Shield, 
  ArrowRight,
  MapPin,
  Clock
} from 'lucide-react';

export default function LoginContent() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  
  const { login } = useClienteAuth();
  const router = useRouter();

  // Efeito para animação de entrada
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-on-load');
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('animate-in');
      }, index * 100);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const resultado = await login(email, senha);
      if (resultado.success) {
        router.push('/minha-conta/pedidos');
      } else {
        setErro(resultado.error || 'Email ou senha incorretos');
      }
    } catch {
      setErro('Erro ao fazer login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const beneficios = [
    {
      icone: ShoppingBag,
      titulo: 'Acompanhe pedidos',
      descricao: 'Status em tempo real'
    },
    {
      icone: Truck,
      titulo: 'Prazos de entrega',
      descricao: 'Calcule e acompanhe'
    },
    {
      icone: Gift,
      titulo: 'Programa de benefícios',
      descricao: 'Ganhe bônus especiais'
    },
    {
      icone: Shield,
      titulo: 'Compra segura',
      descricao: 'Ambiente protegido'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background com padrão sutil */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }} />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Lado Esquerdo - Fachada da Loja */}
            <div className="hidden lg:block space-y-8 animate-on-load opacity-0 translate-y-4 transition-all duration-700">
              {/* Logo e Identidade */}
              {/* Elemento Visual - Fachada */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <div className="relative h-96 bg-gray-800 flex items-center justify-center">
                  
              <div className="text-center">
                <div className="relative w-48 h-24 mx-auto mb-6">
                  <Image
                    src="/logomarca.png"
                    alt="Rios Outlet Joinville"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-3xl font-light tracking-wide text-white">
                    Rios Calçados e Acessórios Ltda                    
                  </h1>
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>CNPJ: 45.595.442/0001-66</span>
                  </div>
                  <p className="text-gray-300 text-lg">
                    Sua área exclusiva de compras e benefícios
                  </p>
                </div>
              </div>

                </div>
              </div>

              {/* Benefícios */}
              <div className="grid grid-cols-2 gap-4">
                {beneficios.map((beneficio, index) => (
                  <div 
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/10 transition-all duration-300 group"
                  >
                    <beneficio.icone className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-medium text-sm">{beneficio.titulo}</h3>
                    <p className="text-gray-400 text-xs mt-1">{beneficio.descricao}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lado Direito - Formulário de Login */}
            <div className="animate-on-load opacity-0 translate-y-4 transition-all duration-700 delay-300">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header Mobile - Logo */}
                <div className="lg:hidden text-center pt-8 pb-4 bg-gradient-to-r from-gray-900 to-gray-800">
                  <div className="relative w-40 h-16 mx-auto">
                    <Image
                      src="/logomarca.png"
                      alt="Rios Outlet Joinville"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Formulário */}
                <div className="p-8 lg:p-10">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Bem-vindo de volta!
                    </h2>
                    <p className="text-gray-500 mt-2">
                      Acesse sua conta e aproveite seus benefícios
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                      <Label htmlFor="email" className="text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="seu@email.com"
                        className="mt-1.5 h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="senha" className="text-gray-700">
                        Senha
                      </Label>
                      <Input
                        id="senha"
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        placeholder="Sua senha"
                        className="mt-1.5 h-11 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                      />
                    </div>

                    {erro && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-600 text-sm text-center">
                          {erro}
                        </p>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
                      disabled={carregando}
                    >
                      {carregando ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Entrando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Entrar na Minha Conta
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="text-center space-y-4">
                      <p className="text-sm text-gray-500">
                        Ainda não é cliente Rios Outlet?
                      </p>
                      <Link 
                        href="/" 
                        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 border-2 border-gray-900 text-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300 font-medium text-sm group"
                      >
                        Fazer primeira compra
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      
                      <div className="text-xs text-gray-400 flex items-center justify-center gap-4 mt-6">
                        <span>✓ Compra segura</span>
                        <span>✓ Pagamento protegido</span>
                        <span>✓ Atendimento local</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info adicional mobile */}
              <div className="lg:hidden mt-6 text-center text-gray-300 text-sm">
                <p>Rios Outlet - Joinville, SC</p>
                <p className="mt-1">Sua loja de confiança em moda</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-on-load {
          transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-on-load.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}