// src/components/ui/ProdutoGallery.tsx
"use client";

import { useState } from "react";
import ProductImage from "./ProductImage";

interface Imagem {
  id: string;
  url: string;
  principal: boolean;
  ordem: number;
}

interface ImageGalleryProps {
  imagens: Imagem[];
  titulo: string;
}

export default function ImageGallery({ imagens, titulo }: ImageGalleryProps) {
  const [imagemAtual, setImagemAtual] = useState<Imagem>(imagens[0]);

  return (
    <div>
      {/* Imagem Principal */}
      <div className="relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200">
        <ProductImage
          src={imagemAtual.url}
          alt={`${titulo} - imagem principal`}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Miniaturas */}
      {imagens.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-4">
          {imagens.map((imagem) => (
            <button
              key={imagem.id}
              onClick={() => setImagemAtual(imagem)}
              className={`relative aspect-square bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                imagemAtual.id === imagem.id
                  ? "border-amber-500 shadow-md"
                  : "border-gray-200 hover:border-amber-300"
              }`}
            >
              <ProductImage
                src={imagem.url}
                alt={`${titulo} - miniatura`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}