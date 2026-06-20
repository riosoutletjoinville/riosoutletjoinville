// src/components/template/Footer.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import WhatsAppButton from "../ui/whatsAppButton";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Categoria {
  id: string;
  nome: string;
}

export default function Footer() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategorias() {
      try {
        const { data, error } = await supabase
          .from("categorias")
          .select("id, nome")
          .eq("exibir_no_site", true)
          .order("nome");

        if (error) {
          console.error("Erro ao buscar categorias:", error);
          return;
        }

        setCategorias(data || []);
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategorias();
  }, []);

  const empresaLinks = [
    { href: "/sobre", label: "Sobre nós" },
    { href: "/contato", label: "Contato" },
    { href: "/trocas-devolucoes", label: "Trocas e devoluções" },
    { href: "/politica-privacidade", label: "Política de privacidade" },
    { href: "/termos-uso", label: "Termos de uso" },
  ];

  const redesSociais = [
    {
      name: "Instagram",
      href: "https://www.instagram.com/riosoutletjoinville",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61583366352527",
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    }
  ];

  return (
    <footer className="bg-black text-white">
      {/* Seção Principal */}
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Logo e Descrição */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex-shrink-0 mb-6 block">
              <div className="relative w-40 md:w-56 h-12 md:h-20">
                <Image
                  src="/logomarca.jpg"
                  alt="Rios Outlet - Loja de calçados em Joinville"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              A melhor loja de calçados de Joinville para todo o Brasil!
            </p>
            <div className="text-gray-400">
              <p className="mb-2">📍 Joinville, SC</p>
              <p className="mb-2">📞 (47) 8831-8265</p>
              <p>✉️ contato@riosoutlet.com.br</p>
            </div>
          </div>

          {/* Categorias */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-8 text-white">Categorias</h3>
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 bg-gray-800 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categorias.map((categoria) => (
                  <Link
                    key={categoria.id}
                    href={`/categoria/${categoria.id}`}
                    className="text-gray-400 hover:text-white transition-colors duration-200 py-2 px-4 bg-gray-900 hover:bg-gray-800 rounded-lg text-center font-medium transform hover:scale-105 transition-transform"
                  >
                    {categoria.nome}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Empresa */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-8 text-white">Empresa</h3>
            <ul className="space-y-4">
              {empresaLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200 text-lg font-medium block py-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-8 text-white">Newsletter</h3>
            <p className="text-gray-400 mb-6 text-lg">
              Cadastre-se para receber nossas promoções e lançamentos
            </p>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition-colors duration-200 font-semibold text-lg">
                Assinar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Redes Sociais */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h4 className="text-2xl font-bold text-center mb-8 text-white">
            Siga-nos nas Redes Sociais
          </h4>
          <div className="flex justify-center space-x-8">
            {redesSociais.map((rede) => (
              <a
                key={rede.name}
                href={rede.href}
                className="text-gray-400 hover:text-white transition-colors duration-200 transform hover:scale-110 p-3 bg-gray-900 hover:bg-gray-800 rounded-full"
                aria-label={rede.name}
              >
                {rede.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Seção Desenvolvedor */}
      <div className="border-t border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-400 text-sm md:text-base">
                © {new Date().getFullYear()} Rios Outlet - Loja de Calçados.
                Todos os direitos reservados.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <span className="text-gray-400 text-xs">Desenvolvido por</span>
              <Link
                href="https://ajsservicosesolucoes.com.br/pt-BR"
                target="_blank"
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <div className="relative w-16 h-6">
                  <Image
                    src="/logo-ajs.png"
                    alt="Desenvolvido por AJS Serviços e Soluções"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <WhatsAppButton
        phoneNumber="554788318265"
        defaultMessage="Olá! Gostaria de mais informações sobre os calçados da Rios Outlet."
      />
    </footer>
  );
}
