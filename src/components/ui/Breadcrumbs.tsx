// src/components/ui/Breadcrumbs.tsx
import Link from "next/link";

interface BreadcrumbsProps {
  items: { label: string; href: string }[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="py-4 px-4 bg-gray-100">
      <ol className="flex space-x-2 text-sm text-gray-600">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <span className="mx-2">/</span>}
            <Link href={item.href} className="hover:text-blue-600">
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}