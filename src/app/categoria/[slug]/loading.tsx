// app/categoria/[slug]/loading.tsx
export default function CategoriaLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          
          {/* Subcategorias Skeleton */}
          <div className="mt-6">
            <div className="h-5 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-24 h-10 bg-gray-200 rounded-full animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className="h-5 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}