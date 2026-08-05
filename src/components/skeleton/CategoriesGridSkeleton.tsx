// components/skeleton/CategoriesGridSkeleton.tsx

import { CategorySkeleton } from "./CategorySkeleton";

export function CategoriesGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <CategorySkeleton key={i} />
      ))}
    </div>
  );
}