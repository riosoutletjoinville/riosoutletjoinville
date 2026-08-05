// src/app/minha-conta/MinhaContaContent.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClienteAuth } from '@/contexts/ClienteAuthContext';

export default function MinhaContaContent() {
  const { cliente, loading } = useClienteAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (cliente) {
        router.push('/minha-conta/pedidos');
      } else {
        router.push('/minha-conta/login');
      }
    }
  }, [cliente, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}