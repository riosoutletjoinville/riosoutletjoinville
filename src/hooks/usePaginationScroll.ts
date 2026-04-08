// hooks/usePaginationScroll.ts
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function usePaginationScroll() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigateToPage = (page: number) => {
    // Criar novos parâmetros
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());

    // Atualizar a URL sem recarregar a página
    router.push(`${pathname}?${params.toString()}`, { scroll: false });

    // Rolar suavemente até a seção de produtos
    setTimeout(() => {
      const element = document.getElementById('produtos-section');
      if (element) {
        const headerOffset = 100; // Altura do header fixo
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100); // Pequeno delay para garantir que os novos produtos foram renderizados
  };

  return { navigateToPage };
}