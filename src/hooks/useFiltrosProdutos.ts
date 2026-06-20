// src/hooks/useFiltrosProdutos.ts
import { useState, useCallback } from 'react';

interface FiltrosAplicados {
  categorias: string[];
  tamanhos: string[];
  cores: string[];
  precoMin: number;
  precoMax: number;
}

export function useFiltrosProdutos() {
  const [filtros, setFiltros] = useState<FiltrosAplicados>({
    categorias: [],
    tamanhos: [],
    cores: [],
    precoMin: 0,
    precoMax: 1000
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const aplicarFiltros = useCallback((novosFiltros: FiltrosAplicados) => {
    setFiltros(novosFiltros);
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros({
      categorias: [],
      tamanhos: [],
      cores: [],
      precoMin: 0,
      precoMax: 1000
    });
  }, []);

  const toggleFiltros = useCallback(() => {
    setMostrarFiltros(prev => !prev);
  }, []);

  return {
    filtros,
    mostrarFiltros,
    setMostrarFiltros,
    aplicarFiltros,
    limparFiltros,
    toggleFiltros
  };
}