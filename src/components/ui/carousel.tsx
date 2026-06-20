"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Banner {
  id: string;
  titulo: string;
  subtitulo?: string;
  imagem_url: string;
  link?: string;
  texto_botao?: string;
  ativo: boolean;
  ordem: number;
}

interface HeroCarouselProps {
  banners?: Banner[];
}

export default function HeroCarousel({ banners = [] }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides =
    banners.length > 0
      ? banners
      : [
          {
            id: "1",
            titulo: "Black November",
            subtitulo: "Comece a economizar em grande estilo.",
            imagem_url: "/banners/banner-sandalias.jpg",
            texto_botao: "Ver Coleção",
            ativo: true,
            ordem: 1,
          },
          {
            id: "2",
            titulo: "Ofertas Especiais",
            subtitulo: "Conforto para sua prática de esporte.",
            imagem_url: "/banners/banner-tenis.jpg",
            texto_botao: "Comprar Agora",
            ativo: true,
            ordem: 2,
          },
          {
            id: "3",
            titulo: "Liberdade em Suas Escolhas.",
            subtitulo: "Estilo e Casualidade.",
            imagem_url: "/banners/banner-tenis-1.jpg",
            texto_botao: "Comprar Agora",
            ativo: true,
            ordem: 3,
          },
        ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  if (slides.length === 0) {
    return (
      <div className="relative w-full h-64 md:h-96 bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">Carregando banners...</p>
      </div>
    );
  }
  return (
    <div className="relative w-full h-64 md:h-[670px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="relative w-full h-full">
            <Image
              src={slide.imagem_url}
              alt={slide.titulo}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Overlay sutil */}
              <div className="absolute inset-0 bg-black/10"></div>

              <div className="relative text-center text-black z-10">
                <h2 className="text-4xl md:text-7xl font-bold mb-4 drop-shadow-[0_4px_12px_rgba(255,255,255,0.8)]">
                  {slide.titulo}
                </h2>
                {slide.subtitulo && (
                  <p className="text-2xl md:text-5xl mb-6 drop-shadow-[0_4px_8px_rgba(255,255,255,0.8)]">
                    {slide.subtitulo}
                  </p>
                )}
                {slide.texto_botao && (
                  <Link
                    href={slide.link || "#"}
                    className="inline-block text-4xl bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-2xl"
                  >
                    {slide.texto_botao}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* Navigation buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 transition-all"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 rounded-full p-2 transition-all"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? "bg-white" : "bg-white bg-opacity-50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
