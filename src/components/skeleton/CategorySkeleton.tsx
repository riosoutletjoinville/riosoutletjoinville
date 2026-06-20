// components/skeleton/CategorySkeleton.tsx
export function CategorySkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-200"></div>
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
    </div>
  );
}