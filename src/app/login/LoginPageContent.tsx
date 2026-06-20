// app/login/LoadingPageContent.tsx
'use client'

import '@/app/globals.css';
import LoginForm from '@/components/auth/LoginForm';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ShoppingBag, 
  Truck, 
  Gift, 
  Shield, 
  ArrowRight,
  MapPin,
  Clock,
  BarChart3,
  Users,
  Package,
  TrendingUp
} from 'lucide-react';

export function LoginPageContent() {
  const beneficiosAdmin = [
    {
      icone: BarChart3,
      titulo: 'Gestão de Vendas',
      descricao: 'Relatórios completos'
    },
    {
      icone: Package,
      titulo: 'Controle de Estoque',
      descricao: 'Em tempo real'
    },
    {
      icone: Users,
      titulo: 'Clientes',
      descricao: 'Base organizada'
    },
    {
      icone: TrendingUp,
      titulo: 'Métricas',
      descricao: 'Desempenho do negócio'
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
            
            {/* Lado Esquerdo - Fachada Admin */}
            <div className="hidden lg:block space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <div className="relative h-96 bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative w-48 h-24 mx-auto mb-6">
                      <Image
                        src="/logomarca/logotranspbranca.png"
                        alt="Rios Outlet Joinville"
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <h1 className="text-3xl font-light tracking-wide text-white">
                        Área Administrativa
                      </h1>
                      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                        <MapPin className="w-4 h-4" />
                        <span>Rios Calçados e Acessórios Ltda</span>
                      </div>
                      <p className="text-gray-300 text-lg">
                        Gestão completa da sua loja
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Benefícios Admin */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="grid grid-cols-2 gap-4"
              >
                {beneficiosAdmin.map((beneficio, index) => (
                  <div 
                    key={index}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/10 transition-all duration-300 group"
                  >
                    <beneficio.icone className="w-8 h-8 text-gray-300 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-medium text-sm">{beneficio.titulo}</h3>
                    <p className="text-gray-400 text-xs mt-1">{beneficio.descricao}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Lado Direito - Formulário de Login Admin */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
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
                      <Shield className="w-8 h-8 text-gray-600" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Acesso Administrativo
                    </h2>
                    <p className="text-gray-500 mt-2">
                      Entre com suas credenciais de administrador
                    </p>
                  </div>

                  <LoginForm />

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="text-center space-y-4">
                      <div className="text-xs text-gray-400 flex items-center justify-center gap-4">
                        <span>✓ Sistema seguro</span>
                        <span>✓ Dados protegidos</span>
                        <span>✓ Suporte 24/7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info adicional mobile */}
              <div className="lg:hidden mt-6 text-center text-gray-300 text-sm">
                <p>Área administrativa - Rios Outlet Joinville</p>
                <p className="mt-1">Gestão completa do seu negócio</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}