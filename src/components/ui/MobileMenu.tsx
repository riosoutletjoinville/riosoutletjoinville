'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import HeaderBottom from '../template/header/HeaderBottom';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Previne scroll do body quando o menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <button 
        className="md:hidden p-2 rounded-md hover:bg-gray-100 mr-2 z-60"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Abrir menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>
      
      {/* Menu Mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Overlay de fundo */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Painel do menu */}
          <div className="absolute top-0 left-0 w-3/4 h-full bg-white shadow-lg z-50 animate-slideIn overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <span className="font-bold text-lg">Menu</span>
              <button 
                className="p-2 rounded-md hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            
            {/* HeaderBottom Mobile - Versão Desktop dentro do menu */}
            <div className="p-4">
              <HeaderBottom />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}