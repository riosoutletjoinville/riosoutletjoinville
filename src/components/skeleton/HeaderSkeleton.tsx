// components/skeleton/HeaderSkeleton.tsx
export function HeaderSkeleton() {
  return (
    <div className="bg-white border-b animate-pulse">
      <div className="container mx-auto px-4 py-4">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
      </div>
    </div>
  );
}