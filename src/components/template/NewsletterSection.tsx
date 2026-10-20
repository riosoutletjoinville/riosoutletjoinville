// src/components/template/NewsletterSection.tsx
"use client";

import { useState } from 'react';
import { useNewsletter } from '@/hooks/useNewsletter';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [mostrarNome, setMostrarNome] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const { assinarNewsletter, loading, error } = useNewsletter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await assinarNewsletter({ email, nome: mostrarNome ? nome : undefined });
    
    if (result.success) {
      setMensagem(result.message);
      setEmail('');
      setNome('');
      setMostrarNome(false);
    } else {
      setMensagem(result.message);
    }
  };

  return (
    <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-16 px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Fique por dentro das novidades
        </h2>
        <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
          Cadastre-se para receber nossas promoções exclusivas, lançamentos e ofertas especiais. 
          Não perca as melhores oportunidades!
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              className="flex-1 px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading}
              className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cadastrando...' : 'Assinar'}
            </button>
          </div>

          {!mostrarNome && (
            <button
              type="button"
              onClick={() => setMostrarNome(true)}
              className="text-amber-400 hover:text-amber-300 text-sm transition-colors"
            >
              + Adicionar nome (opcional)
            </button>
          )}

          {mostrarNome && (
            <div className="mt-4 animate-fadeIn">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          )}

          {/* Mensagens de feedback */}
          {(mensagem || error) && (
            <div className={`mt-4 p-3 rounded-lg ${
              error ? 'bg-red-900 text-red-100' : 'bg-green-900 text-green-100'
            }`}>
              {mensagem || error}
            </div>
          )}

          <p className="text-gray-400 text-xs mt-4">
            Ao se inscrever, você concorda com nossa{' '}
            <a href="/politica-privacidade" className="text-amber-400 hover:text-amber-300 underline">
              Política de Privacidade
            </a>
            . Você pode cancelar a qualquer momento.
          </p>
        </form>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-gray-300">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Ofertas exclusivas</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Primeiro acesso</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Sem spam</span>
          </div>
        </div>
      </div>
    </section>
  );
}