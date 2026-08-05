// src/hooks/usePaginationState.ts
import { useState, useCallback, useRef } from 'react';

interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  filters: {
    search: string;
    activeFilter: string;
    tamanhos: string[];
    cores: string[];
    generos: string[];
    categorias: string[];
    marcas: string[];
  };
}

export function usePaginationState() {
  const [state, setState] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    filters: {
      search: '',
      activeFilter: 'all',
      tamanhos: [],
      cores: [],
      generos: [],
      categorias: [],
      marcas: [],
    },
  });

  const isInitialMount = useRef(true);

  const updateFilters = useCallback((newFilters: Partial<PaginationState['filters']>) => {
    setState(prev => ({
      ...prev,
      currentPage: 1, // Reset to first page when filters change
      filters: { ...prev.filters, ...newFilters },
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const setItemsPerPage = useCallback((itemsPerPage: number) => {
    setState(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
  }, []);

  const setTotalItems = useCallback((totalItems: number) => {
    setState(prev => ({ ...prev, totalItems }));
  }, []);

  const resetPagination = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPage: 1,
      totalItems: 0,
    }));
  }, []);

  return {
    ...state,
    updateFilters,
    setPage,
    setItemsPerPage,
    setTotalItems,
    resetPagination,
    isInitialMount: isInitialMount.current,
  };
}