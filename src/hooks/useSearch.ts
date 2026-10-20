// src/hooks/useSearch.ts
import { useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-client";

interface ProdutoSearch {
  id: string;
  titulo: string;
  preco: number;
  preco_original: number | null;
  slug: string;
  imagem_url?: string;
  categoria_nome?: string;
  marca_nome?: string;
}

interface SearchResult {
  products: ProdutoSearch[];
  suggestions: string[];
  total: number;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult>({
    products: [],
    suggestions: [],
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Função para normalizar texto (remover acentos, converter para minúsculo)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Função para calcular similaridade (Levenshtein distance simplificada)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const normalized1 = normalizeText(str1);
    const normalized2 = normalizeText(str2);
    
    if (normalized1 === normalized2) return 1;
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.8;
    
    // Verificar palavras individuais
    const words1 = normalized1.split(" ");
    const words2 = normalized2.split(" ");
    
    let matchCount = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
          matchCount++;
          break;
        }
      }
    }
    
    return matchCount / Math.max(words1.length, words2.length);
  };

  // Busca principal
  const search = useCallback(async (query: string, limit: number = 20) => {
    if (!query.trim() || query.trim().length < 2) {
      setResults({ products: [], suggestions: [], total: 0 });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const normalizedQuery = normalizeText(query);
      const queryWords = normalizedQuery.split(" ").filter(w => w.length > 1);

      // Busca no banco com ILIKE (busca aproximada)
      let supabaseQuery = supabase
        .from("produtos")
        .select(`
          id,
          titulo,
          preco,
          preco_original,
          slug,
          categoria:categorias!categoria_id(nome),
          marca:marcas!marca_id(nome)
        `)
        .eq("ativo", true)
        .eq("visivel", true)
        .limit(50); // Buscar mais resultados para filtrar depois

      // Adicionar condições de busca
      const searchConditions = queryWords.map(word => 
        `titulo.ilike.%${word}%`
      ).join(',');
      
      if (searchConditions) {
        supabaseQuery = supabaseQuery.or(searchConditions);
      }

      const { data: produtosData, error } = await supabaseQuery;

      if (error) throw error;

      if (!produtosData || produtosData.length === 0) {
        setResults({ products: [], suggestions: [], total: 0 });
        setIsLoading(false);
        return;
      }

      // Calcular score de similaridade para cada produto
      const productsWithScore = await Promise.all(
        produtosData.map(async (produto) => {
          // Buscar imagem
          const { data: imagemData } = await supabase
            .from("produto_imagens")
            .select("url")
            .eq("produto_id", produto.id)
            .order("principal", { ascending: false })
            .order("ordem", { ascending: true })
            .limit(1)
            .single();

          const similarity = calculateSimilarity(produto.titulo, query);
          
          return {
            id: produto.id,
            titulo: produto.titulo,
            preco: produto.preco,
            preco_original: produto.preco_original,
            slug: produto.slug,
            imagem_url: imagemData?.url || null,
            categoria_nome: (produto.categoria as any)?.nome,
            marca_nome: (produto.marca as any)?.nome,
            similarity,
          };
        })
      );

      // Ordenar por similaridade e depois por preço
      const sortedProducts = productsWithScore
        .sort((a, b) => {
          if (a.similarity !== b.similarity) {
            return b.similarity - a.similarity;
          }
          return a.preco - b.preco;
        })
        .slice(0, limit);

      // Gerar sugestões baseadas nos títulos dos produtos
      const suggestions = Array.from(
        new Set(
          sortedProducts
            .slice(0, 10)
            .flatMap(p => p.titulo.split(" ").slice(0, 3))
            .filter(word => word.length > 3 && normalizeText(word).includes(normalizedQuery))
            .slice(0, 5)
        )
      );

      setResults({
        products: sortedProducts,
        suggestions,
        total: produtosData.length,
      });

      // Salvar no histórico de busca
      if (query.trim()) {
        setSearchHistory(prev => {
          const newHistory = [query, ...prev.filter(h => h !== query)].slice(0, 10);
          localStorage.setItem("search_history", JSON.stringify(newHistory));
          return newHistory;
        });
      }
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar histórico do localStorage
  const loadSearchHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem("search_history");
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  }, []);

  // Limpar histórico
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem("search_history");
  }, []);

  // Busca com debounce
  const debouncedSearch = useCallback((query: string, delay: number = 500) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!query.trim() || query.trim().length < 2) {
      setResults({ products: [], suggestions: [], total: 0 });
      return;
    }

    timeoutRef.current = setTimeout(() => {
      search(query);
    }, delay);
  }, [search]);

  return {
    results,
    isLoading,
    search,
    debouncedSearch,
    searchHistory,
    loadSearchHistory,
    clearSearchHistory,
  };
}