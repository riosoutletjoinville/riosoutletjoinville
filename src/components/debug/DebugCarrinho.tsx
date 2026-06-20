//src/components/debug/DebugCarrinho.tsx
'use client';

import { useCarrinho } from '@/hooks/useCarrinho';

export default function DebugCarrinho() {
  const { carrinho, totalItens, isLoaded } = useCarrinho();

  if (!isLoaded) return <div>Carregando carrinho...</div>;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <h3 className="font-bold mb-2">DEBUG Carrinho</h3>
      <p>Total Itens: {totalItens}</p>
      <p>Itens no array: {carrinho.length}</p>
      <div className="mt-2 max-h-32 overflow-y-auto">
        {carrinho.map((item, index) => (
          <div key={index} className="border-t pt-1 mt-1">
            <p>{item.titulo}</p>
            <p>Qtd: {item.quantidade} - R$ {item.preco_unitario}</p>
          </div>
        ))}
      </div>
    </div>
  );
}