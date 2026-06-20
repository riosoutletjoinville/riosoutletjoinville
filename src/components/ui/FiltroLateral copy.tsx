// src/components/ui/FiltroLateral.tsx - ATUALIZADO
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface FiltroLateralProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltrosChange: (filtros: FiltrosAplicados) => void;
  categoriaId?: string;
  sessaoId?: string;
  tipoPagina?: 'categoria' | 'sessao' | 'home';
}

interface FiltrosAplicados {
  categorias: string[];
  tamanhos: string[];
  cores: string[];
  marcas: string[];
  generos: string[];
  precoMin: number;
  precoMax: number;
}

interface Categoria {
  id: string;
  nome: string;
}

interface Tamanho {
  id: string;
  nome: string;
  tipo: string;
  ordem: number;
}

interface Cor {
  id: string;
  nome: string;
  codigo_hex?: string;
}

interface Marca {
  id: string;
  nome: string;
}

interface Genero {
  id: string;
  nome: string;
}

export default function FiltroLateral({ 
  isOpen, 
  onClose, 
  onFiltrosChange,
  categoriaId,
  sessaoId,
  tipoPagina = 'categoria'
}: FiltroLateralProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [generos, setGeneros] = useState<Genero[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para os filtros selecionados
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<string[]>([]);
  const [coresSelecionadas, setCoresSelecionadas] = useState<string[]>([]);
  const [marcasSelecionadas, setMarcasSelecionadas] = useState<string[]>([]);
  const [generosSelecionados, setGenerosSelecionados] = useState<string[]>([]);
  const [faixaPreco, setFaixaPreco] = useState({ min: 0, max: 1000 });

  // Estados para controles de exibição
  const [mostrarMaisCategorias, setMostrarMaisCategorias] = useState(false);
  const [mostrarMaisTamanhos, setMostrarMaisTamanhos] = useState(false);
  const [mostrarMaisCores, setMostrarMaisCores] = useState(false);
  const [mostrarMaisMarcas, setMostrarMaisMarcas] = useState(false);
  const [mostrarMaisGeneros, setMostrarMaisGeneros] = useState(false);

  const LIMITE_ITENS = 8;

  useEffect(() => {
    if (categoriaId) {
      setCategoriasSelecionadas([categoriaId]);
    }
  }, [categoriaId]);

  useEffect(() => {
    async function carregarFiltros() {
      try {
        setLoading(true);

        // Carregar categorias (exceto se já estamos em uma categoria)
        if (tipoPagina !== 'categoria') {
          const { data: categoriasData } = await supabase
            .from("categorias")
            .select("id, nome")
            .eq("exibir_no_site", true)
            .order("nome");
          setCategorias(categoriasData || []);
        }

        // Carregar tamanhos
        const { data: tamanhosData } = await supabase
          .from("tamanhos")
          .select("id, nome, tipo, ordem")
          .order("ordem", { ascending: true })
          .order("nome", { ascending: true });

        // Carregar cores
        const { data: coresData } = await supabase
          .from("cores")
          .select("id, nome, codigo_hex")
          .order("nome");

        // Carregar marcas
        const { data: marcasData } = await supabase
          .from("marcas")
          .select("id, nome")
          .order("nome");

        // Carregar gêneros
        const { data: generosData } = await supabase
          .from("generos")
          .select("id, nome")
          .order("nome");

        setTamanhos(tamanhosData || []);
        setCores(coresData || []);
        setMarcas(marcasData || []);
        setGeneros(generosData || []);

        // Carregar faixa de preço baseada no contexto
        let query = supabase
          .from("produtos")
          .select("preco")
          .eq("ativo", true);

        if (categoriaId) {
          query = query.eq("categoria_id", categoriaId);
        }

        const { data: precoData } = await query
          .order("preco", { ascending: false })
          .limit(1);

        const precoMax = precoData?.[0]?.preco || 1000;
        setFaixaPreco({ min: 0, max: precoMax });

      } catch (error) {
        console.error("Erro ao carregar filtros:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      carregarFiltros();
    }
  }, [isOpen, categoriaId, tipoPagina]);

  useEffect(() => {
    const filtros: FiltrosAplicados = {
      categorias: categoriasSelecionadas,
      tamanhos: tamanhosSelecionados,
      cores: coresSelecionadas,
      marcas: marcasSelecionadas,
      generos: generosSelecionados,
      precoMin: faixaPreco.min,
      precoMax: faixaPreco.max
    };
    
    const timeoutId = setTimeout(() => {
      onFiltrosChange(filtros);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [
    categoriasSelecionadas, 
    tamanhosSelecionados, 
    coresSelecionadas, 
    marcasSelecionadas,
    generosSelecionados,
    faixaPreco.min, 
    faixaPreco.max, 
    onFiltrosChange
  ]);

  const toggleFiltro = (
    array: string[],
    setArray: React.Dispatch<React.SetStateAction<string[]>>,
    id: string
  ) => {
    setArray(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const limparFiltros = () => {
    setCategoriasSelecionadas(categoriaId ? [categoriaId] : []);
    setTamanhosSelecionados([]);
    setCoresSelecionadas([]);
    setMarcasSelecionadas([]);
    setGenerosSelecionados([]);
    setFaixaPreco({ min: 0, max: 1000 });
    setMostrarMaisCategorias(false);
    setMostrarMaisTamanhos(false);
    setMostrarMaisCores(false);
    setMostrarMaisMarcas(false);
    setMostrarMaisGeneros(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Funções para obter itens visíveis
  const categoriasVisiveis = mostrarMaisCategorias ? categorias : categorias.slice(0, LIMITE_ITENS);
  const tamanhosVisiveis = mostrarMaisTamanhos ? tamanhos : tamanhos.slice(0, LIMITE_ITENS);
  const coresVisiveis = mostrarMaisCores ? cores : cores.slice(0, LIMITE_ITENS);
  const marcasVisiveis = mostrarMaisMarcas ? marcas : marcas.slice(0, LIMITE_ITENS);
  const generosVisiveis = mostrarMaisGeneros ? generos : generos.slice(0, LIMITE_ITENS);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="w-96 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Filtrar</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="mb-6">
              <div className="h-6 bg-gray-200 rounded mb-3 animate-pulse"></div>
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center mb-2">
                  <div className="h-4 w-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex md:relative md:inset-auto">
      {/* Overlay para mobile */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 md:hidden" 
        onClick={onClose}
      />
      
      {/* Painel de Filtros */}
      <div className="w-96 bg-white border-r border-gray-200 p-6 overflow-y-auto relative z-10 md:static md:h-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold">Filtrar</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Botão Limpar Filtros */}
        <button
          onClick={limparFiltros}
          className="w-full mb-6 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Limpar Filtros
        </button>

        {/* Filtro de Categorias (só mostra se não estiver em uma categoria específica) */}
        {tipoPagina !== 'categoria' && categorias.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Categorias</h3>
            <div className="space-y-2">
              {categoriasVisiveis.map((categoria) => (
                <label key={categoria.id} className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={categoriasSelecionadas.includes(categoria.id)}
                    onChange={() => toggleFiltro(categoriasSelecionadas, setCategoriasSelecionadas, categoria.id)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                    {categoria.nome}
                  </span>
                </label>
              ))}
              {categorias.length > LIMITE_ITENS && (
                <button
                  onClick={() => setMostrarMaisCategorias(!mostrarMaisCategorias)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  {mostrarMaisCategorias ? (
                    <>
                      <ChevronUp size={16} />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Ver mais ({categorias.length - LIMITE_ITENS})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filtro de Marcas */}
        {marcas.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Marcas</h3>
            <div className="space-y-2">
              {marcasVisiveis.map((marca) => (
                <label key={marca.id} className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={marcasSelecionadas.includes(marca.id)}
                    onChange={() => toggleFiltro(marcasSelecionadas, setMarcasSelecionadas, marca.id)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                    {marca.nome}
                  </span>
                </label>
              ))}
              {marcas.length > LIMITE_ITENS && (
                <button
                  onClick={() => setMostrarMaisMarcas(!mostrarMaisMarcas)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  {mostrarMaisMarcas ? (
                    <>
                      <ChevronUp size={16} />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Ver mais ({marcas.length - LIMITE_ITENS})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filtro de Gêneros */}
        {generos.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Gêneros</h3>
            <div className="space-y-2">
              {generosVisiveis.map((genero) => (
                <label key={genero.id} className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={generosSelecionados.includes(genero.id)}
                    onChange={() => toggleFiltro(generosSelecionados, setGenerosSelecionados, genero.id)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                    {genero.nome}
                  </span>
                </label>
              ))}
              {generos.length > LIMITE_ITENS && (
                <button
                  onClick={() => setMostrarMaisGeneros(!mostrarMaisGeneros)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  {mostrarMaisGeneros ? (
                    <>
                      <ChevronUp size={16} />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Ver mais ({generos.length - LIMITE_ITENS})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filtro de Tamanhos */}
        {tamanhos.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Tamanhos</h3>
            <div className="grid grid-cols-4 gap-2">
              {tamanhosVisiveis.map((tamanho) => (
                <label key={tamanho.id} className="relative cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tamanhosSelecionados.includes(tamanho.id)}
                    onChange={() => toggleFiltro(tamanhosSelecionados, setTamanhosSelecionados, tamanho.id)}
                    className="sr-only"
                  />
                  <div className={`
                    w-full py-2 text-xs text-center border rounded-lg transition-all
                    ${tamanhosSelecionados.includes(tamanho.id)
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-amber-300'
                    }
                  `}>
                    {tamanho.nome}
                  </div>
                </label>
              ))}
            </div>
            {tamanhos.length > LIMITE_ITENS && (
              <button
                onClick={() => setMostrarMaisTamanhos(!mostrarMaisTamanhos)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3"
              >
                {mostrarMaisTamanhos ? (
                  <>
                    <ChevronUp size={16} />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Ver mais ({tamanhos.length - LIMITE_ITENS})
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Filtro de Cores */}
        {cores.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Cores</h3>
            <div className="grid grid-cols-5 gap-3">
              {coresVisiveis.map((cor) => (
                <label key={cor.id} className="relative cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coresSelecionadas.includes(cor.id)}
                    onChange={() => toggleFiltro(coresSelecionadas, setCoresSelecionadas, cor.id)}
                    className="sr-only"
                  />
                  <div className="flex flex-col items-center">
                    <div 
                      className={`
                        w-8 h-8 rounded-full border-2 transition-all mb-1
                        ${coresSelecionadas.includes(cor.id)
                          ? 'border-amber-600 ring-2 ring-amber-200'
                          : 'border-gray-300 hover:border-amber-300'
                        }
                      `}
                      style={{ 
                        backgroundColor: cor.codigo_hex || '#ccc',
                        borderColor: coresSelecionadas.includes(cor.id) ? undefined : cor.codigo_hex 
                      }}
                    />
                    <span className="text-xs text-gray-600 truncate w-full text-center">
                      {cor.nome}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            {cores.length > LIMITE_ITENS && (
              <button
                onClick={() => setMostrarMaisCores(!mostrarMaisCores)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-3"
              >
                {mostrarMaisCores ? (
                  <>
                    <ChevronUp size={16} />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Ver mais ({cores.length - LIMITE_ITENS})
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Filtro de Preço */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">Faixa de Preço</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{formatPrice(faixaPreco.min)}</span>
              <span>{formatPrice(faixaPreco.max)}</span>
            </div>
            
            {/* Range Slider - código anterior mantido */}
            <div className="relative w-full h-8">
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-300 rounded-full transform -translate-y-1/2" />
              <div 
                className="absolute top-1/2 h-2 bg-amber-600 rounded-full transform -translate-y-1/2"
                style={{
                  left: `${(faixaPreco.min / faixaPreco.max) * 100}%`,
                  right: `${100 - (faixaPreco.max / faixaPreco.max) * 100}%`,
                }}
              />
              
              {/* Thumbs do slider - código anterior mantido */}
              <div
                className="absolute w-6 h-6 bg-white border-2 border-amber-600 rounded-full shadow-lg cursor-grab active:cursor-grabbing z-20 hover:scale-110 transition-transform"
                style={{
                  left: `${(faixaPreco.min / faixaPreco.max) * 100}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                onMouseDown={(e) => {
                  // Código do slider mantido do arquivo anterior
                  e.preventDefault();
                  const startX = e.clientX;
                  const startValue = faixaPreco.min;
                  const container = e.currentTarget.parentElement as HTMLElement;
                  const rect = container.getBoundingClientRect();
                  const rangeWidth = rect.width;

                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaPercent = (deltaX / rangeWidth) * 100;
                    const newValue = Math.max(
                      0,
                      Math.min(
                        faixaPreco.max,
                        startValue + (deltaPercent * faixaPreco.max) / 100
                      )
                    );
                    const finalValue = Math.min(newValue, faixaPreco.max - 1);
                    setFaixaPreco(prev => ({
                      ...prev,
                      min: Math.round(finalValue)
                    }));
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
              />

              <div
                className="absolute w-6 h-6 bg-white border-2 border-amber-600 rounded-full shadow-lg cursor-grab active:cursor-grabbing z-20 hover:scale-110 transition-transform"
                style={{
                  left: `${(faixaPreco.max / faixaPreco.max) * 100}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                onMouseDown={(e) => {
                  // Código do slider mantido do arquivo anterior
                  e.preventDefault();
                  const startX = e.clientX;
                  const startValue = faixaPreco.max;
                  const container = e.currentTarget.parentElement as HTMLElement;
                  const rect = container.getBoundingClientRect();
                  const rangeWidth = rect.width;

                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    const deltaX = moveEvent.clientX - startX;
                    const deltaPercent = (deltaX / rangeWidth) * 100;
                    const newValue = Math.max(
                      0,
                      Math.min(
                        faixaPreco.max,
                        startValue + (deltaPercent * faixaPreco.max) / 100
                      )
                    );
                    const finalValue = Math.max(newValue, faixaPreco.min + 1);
                    setFaixaPreco(prev => ({
                      ...prev,
                      max: Math.round(finalValue)
                    }));
                  };

                  const handleMouseUp = () => {
                    document.removeEventListener("mousemove", handleMouseMove);
                    document.removeEventListener("mouseup", handleMouseUp);
                  };

                  document.addEventListener("mousemove", handleMouseMove);
                  document.addEventListener("mouseup", handleMouseUp);
                }}
              />
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                value={faixaPreco.min}
                onChange={(e) => setFaixaPreco(prev => ({ ...prev, min: Number(e.target.value) }))}
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="Mín"
                min={0}
                max={faixaPreco.max - 1}
              />
              <span className="flex items-center text-gray-400">-</span>
              <input
                type="number"
                value={faixaPreco.max}
                onChange={(e) => setFaixaPreco(prev => ({ ...prev, max: Number(e.target.value) }))}
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                placeholder="Máx"
                min={faixaPreco.min + 1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}