// src/components/dashboard/pedidos/PedidosTableSkeleton.tsx
"use client";

export function PedidosTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: 8 }).map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: 10 }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: 8 }).map((_, j) => (
                <td key={j} className="px-6 py-4 whitespace-nowrap">
                  <div className={`h-4 bg-gray-200 rounded animate-pulse ${j === 2 ? 'w-24' : j === 3 ? 'w-20' : 'w-32'}`}></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}