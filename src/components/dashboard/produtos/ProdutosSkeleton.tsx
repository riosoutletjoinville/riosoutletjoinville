// src/components/dashboard/produtos/ProdutosSkeleton.tsx
export function ProdutosSkeleton() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-36 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Filtros skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-gray-200 animate-pulse">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-8 w-20 bg-gray-200 rounded mt-2"></div>
              </div>
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela skeleton */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-t border-gray-200">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-gray-200 animate-pulse">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Produto', 'Categoria', 'Marca', 'Preço Loja', 'Estoque', 'Ações'].map((header) => (
                <th key={header} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-md mr-3"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded w-20"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded w-12"></div></td>
                <td className="px-6 py-4"><div className="flex space-x-2"><div className="h-6 w-6 bg-gray-200 rounded"></div><div className="h-6 w-6 bg-gray-200 rounded"></div></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}