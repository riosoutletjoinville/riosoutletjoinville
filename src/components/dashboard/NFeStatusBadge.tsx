// src/components/dashboard/NFeStatusBadge.tsx
'use client';

import { cn } from '@/lib/utils';

interface NFeStatusBadgeProps {
  status: string;
  showLabel?: boolean; // Adicionar esta prop opcional
  className?: string;
}

export function NFeStatusBadge({ status, showLabel = false, className }: NFeStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      pendente: {
        label: 'Pendente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      processando: {
        label: 'Processando',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      },
      autorizada: {
        label: 'Autorizada',
        color: 'bg-green-100 text-green-800 border-green-200'
      },
      cancelada: {
        label: 'Cancelada',
        color: 'bg-red-100 text-red-800 border-red-200'
      },
      rejeitada: {
        label: 'Rejeitada',
        color: 'bg-orange-100 text-orange-800 border-orange-200'
      },
      denegada: {
        label: 'Denegada',
        color: 'bg-purple-100 text-purple-800 border-purple-200'
      }
    };

    return configs[status] || {
      label: status,
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.color,
        className
      )}
    >
      {showLabel ? config.label : status}
    </span>
  );
}