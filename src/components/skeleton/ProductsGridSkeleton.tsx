import { ProductSkeleton } from "./ProductSkeleton";

// components/skeleton/ProductsGridSkeleton.tsx
export function ProductsGridSkeleton({ count = 12, columns = 4 }: { count?: number; columns?: number }) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  }[columns] || "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-6`}>
      {[...Array(count)].map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}