// app/%28site%29/know-how/loading.tsx
export default function KnowHowLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center min-h-100">
        {/* Spinner */}
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-amber-100 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Texto com animação de pontinhos */}
        <p className="mt-6 text-gray-600 font-medium">
          Buscando produtos
          <span className="inline-flex ml-1">
            <span className="animate-bounce [animation-delay:-0.3s]">.</span>
            <span className="animate-bounce [animation-delay:-0.15s]">.</span>
            <span className="animate-bounce">.</span>
          </span>
        </p>
        
        {/* Sugestão visual do que está sendo buscado */}
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Isso pode levar alguns segundos...</span>
        </div>
      </div>
    </div>
  );
}