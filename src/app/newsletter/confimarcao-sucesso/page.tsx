// src/app/newsletter/confirmacao-sucesso/page.tsx
import Link from 'next/link';
export const dynamic = 'force-dynamic';

export default function ConfirmacaoSucesso() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Inscrição Confirmada!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Obrigado por se inscrever em nossa newsletter. Agora você receberá nossas 
          melhores ofertas e novidades em primeira mão.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            Continuar Comprando
          </Link>
          
          <Link
            href="/produtos"
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Ver Produtos
          </Link>
        </div>
      </div>
    </div>
  );
}