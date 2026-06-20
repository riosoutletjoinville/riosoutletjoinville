// src/components/clientes/HeaderClientes.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, User, Package, MapPin, FileText, Home } from 'lucide-react';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';
import Image from 'next/image';

interface ClienteHeaderProps {
  activeTab?: 'pedidos' | 'dados' | 'enderecos' | 'nfe';
}

export default function ClienteHeader({ activeTab = 'pedidos' }: ClienteHeaderProps) {
  const { cliente, logout } = useClienteAuth();

  if (!cliente) return null;

  const navItems = [
    { href: '/minha-conta/pedidos', label: 'Meus Pedidos', icon: Package, tab: 'pedidos' },
    { href: '/minha-conta/dados', label: 'Meus Dados', icon: User, tab: 'dados' },
    { href: '/minha-conta/enderecos', label: 'Endereços', icon: MapPin, tab: 'enderecos' },
    { href: '/minha-conta/nfe', label: 'Minhas NF-e', icon: FileText, tab: 'nfe' },
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center py-4 gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="relative h-12 w-auto">
              <Image
                src="/logomarca/logo.png"
                alt="Rios Outlet - Loja de calçados em Joinville"
                width={150}
                height={48}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 text-gray-700 hover:bg-gray-100`}
            >
              <Home className="h-4 w-4" />
              Loja
            </Link>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                Olá, {cliente.nome || cliente.razao_social?.split(' ')[0] || 'Cliente'}
              </p>
              <p className="text-xs text-gray-500">
                {cliente.email}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Navegação Mobile */}
        <div className="md:hidden flex overflow-x-auto pb-2 gap-1">
          <Link
            href="/"
            className="px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 text-gray-700 hover:bg-gray-100"
          >
            <Home className="h-3 w-3" />
            Loja
          </Link>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-3 w-3" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}