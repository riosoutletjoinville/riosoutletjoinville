// src/components/ui/LoadingBar.tsx - VERSÃO MELHORADA
"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentModule, setCurrentModule] = useState<string>("");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    let startTime: number;

    const startLoading = () => {
      startTime = Date.now();
      setIsLoading(true);
      setProgress(0);
      
      // Animar progresso suavemente
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        // Progresso aumenta mais devagar no início, mais rápido no final
        const newProgress = Math.min(90, Math.floor(Math.pow(elapsed / 30, 1.5)));
        setProgress(newProgress);
      }, 50);
    };

    const endLoading = () => {
      if (interval) clearInterval(interval);
      setProgress(100);
      timeout = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        setCurrentModule("");
      }, 200);
    };

    // Determinar módulo atual baseado na rota
    const getModuleName = (path: string) => {
      // Mapeamento exato primeiro
      const exactModules: Record<string, string> = {
        '/dashboard': 'Dashboard',
        '/dashboard/produtos': 'Produtos',
        '/dashboard/pedidos': 'Pedidos',
        '/dashboard/clientes': 'Clientes',
        '/dashboard/financeiro': 'Financeiro',
        '/dashboard/relatorios': 'Relatórios',
        '/dashboard/contador': 'Contador',
        '/dashboard/nfe': 'NF-e',
        '/dashboard/notificacoes': 'Notificações',
        '/dashboard/newsletter': 'Newsletter',
        '/dashboard/mercado-livre/auth': 'Mercado Livre',
        '/dashboard/mercado-livre/config': 'Configuração ML',
        '/dashboard/banners': 'Banners',
        '/dashboard/sessoes': 'Sessões',
        '/dashboard/categorias': 'Categorias',
        '/dashboard/marcas': 'Marcas',
        '/dashboard/cores': 'Cores',
        '/dashboard/tamanhos': 'Tamanhos',
        '/dashboard/generos': 'Gêneros',
        '/dashboard/admin/users': 'Usuários',
        '/dashboard/configuracoes-fiscais': 'Configurações Fiscais'
      };
      
      if (exactModules[path]) return exactModules[path];
      
      // Correspondência parcial para sub-rotas
      for (const [key, value] of Object.entries(exactModules)) {
        if (path.startsWith(key) && key !== '/dashboard') {
          return value;
        }
      }
      
      return 'Módulo';
    };

    startLoading();
    setCurrentModule(getModuleName(pathname));
    
    // Pequeno delay para garantir que a navegação ocorreu
    const navigationTimeout = setTimeout(() => {
      endLoading();
    }, 400);

    return () => {
      clearTimeout(navigationTimeout);
      if (timeout) clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [pathname, searchParams]);

  if (!isLoading && progress === 0) return null;

  return (
    <>
      {/* Barra de progresso no topo */}
      <div className="fixed top-0 left-0 right-0 z-[9999]">
        <div 
          className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-200 ease-out shadow-lg"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Indicador de carregamento flutuante */}
      {isLoading && currentModule && progress < 100 && (
        <div className="fixed bottom-4 right-4 z-[9999]">
          <div className="bg-black/90 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full shadow-xl flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Carregando {currentModule}...</span>
            <span className="text-xs text-gray-300">{progress}%</span>
          </div>
        </div>
      )}
    </>
  );
}