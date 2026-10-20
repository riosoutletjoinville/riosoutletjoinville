'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Banner {
  id: number;
  titulo: string;
  subtitulo: string;
  imagem: string; 
  link: string;
  textoBotao: string;
}

const banners: Banner[] = [
  {
    id: 1,
    titulo: "Coleção de Verão",
    subtitulo: "Descubra nossa linha premium com designs exclusivos e conforto incomparável.",
    imagem: "/banners/banner-verao.jpg", 
    link: "/colecao-verao",
    textoBotao: "Ver Coleção"
  },
  {
    id: 2,
    titulo: "Promoções Imperdíveis",
    subtitulo: "Até 50% de desconto em itens selecionados. Aproveite agora!",
    imagem: "/banners/banner-promo.jpg",
    link: "/promocoes",
    textoBotao: "Ver Ofertas"
  },
  {
    id: 3,
    titulo: "Novos Lançamentos",
    subtitulo: "As últimas tendências chegaram. Confira nossa nova coleção.",
    imagem: "/banners/banner-lancamento.jpg",
    link: "/novidades",
    textoBotao: "Descobrir"
  }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => 
      prev === 0 ? banners.length - 1 : prev - 1
    );
  };

  const goToNextSlide = () => {
    setCurrentSlide((prev) => 
      (prev + 1) % banners.length
    );
  };

  return (
    <section className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
      {/* Slides */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Imagem de fundo */}
            <div className="absolute inset-0">
              <Image
                src={banner.imagem}
                alt={banner.titulo}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
              />
              {/* Overlay escuro para melhor contraste do texto */}
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
            
            {/* Conteúdo do banner */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-4xl">
                {banner.titulo}
              </h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl">
                {banner.subtitulo}
              </p>
              <Link 
                href={banner.link}
                className="bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors text-lg font-medium"
              >
                {banner.textoBotao}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de navegação */}
      {banners.length > 1 && (
        <>
          {/* Botões anterior/próximo */}
          <button
            onClick={goToPrevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-20"
            aria-label="Slide anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button
            onClick={goToNextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors z-20"
            aria-label="Próximo slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Indicadores */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}