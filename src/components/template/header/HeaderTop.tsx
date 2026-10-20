//src/components/template/header/HeaderTop.tsx
import Link from "next/link";

export default function HeaderTop() {
  return (
    <div className="hidden md:block bg-gray-100 text-gray-600 text-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex space-x-4">
          <Link href="/desenvolvimento" className="hover:text-gray-800">
            Cartão Presente
          </Link>
          <Link href="/minha-conta/pedidos" className="hover:text-gray-800">
            Meus Pedidos
          </Link>
        </div>
        <div className="flex space-x-4">
          <Link href="/app" className="hover:text-gray-800">
           
          </Link>
          <Link href="/minha-conta" className="hover:text-gray-800">
            Área do Cliente
          </Link>
        </div>
      </div>
    </div>
  );
}