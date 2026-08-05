// components/ui/ExpandableText.tsx
"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  showCharsRemaining?: boolean;
  scrollToId?: string; // ID do elemento para scroll ao fechar
}

export default function ExpandableText({ 
  text, 
  maxLength = 250, 
  className = "",
  showCharsRemaining = true,
  scrollToId = "selecao-variante" // ID padrão
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToggle = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Se estiver fechando (ver menos), rola suavemente até o elemento
    if (!newExpandedState && scrollToId) {
      const element = document.getElementById(scrollToId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }
  };
  
  if (!text) return null;
  
  const shouldTruncate = text.length > maxLength;
  
  // Se não precisa truncar, mostra texto completo sem botão
  if (!shouldTruncate) {
    return (
      <div className={className}>
        <h2 className="text-lg font-semibold mb-2">Descrição</h2>
        <p className="text-gray-700 whitespace-pre-line">
          {text}
        </p>
      </div>
    );
  }
  
  const displayText = isExpanded ? text : text.slice(0, maxLength) + "...";
  const charsRemaining = text.length - maxLength;
  
  return (
    <div className={className}>
      <h2 className="text-lg font-semibold mb-2">Descrição</h2>
      <div className="relative">
        <p className="text-gray-700 whitespace-pre-line">
          {displayText}
        </p>
        {!isExpanded && text.length > maxLength && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
      </div>
      <button
        onClick={handleToggle}
        className="mt-2 text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors flex items-center gap-1"
      >
        {isExpanded ? (
          <>Ver menos ↑</>
        ) : (
          <>
            Ver mais ↓
            {showCharsRemaining && (
              <span className="text-xs text-gray-500">
                ({charsRemaining} caracteres restantes)
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}