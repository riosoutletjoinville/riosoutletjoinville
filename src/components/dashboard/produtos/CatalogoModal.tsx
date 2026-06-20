// src/components/dashboard/produtos/CatalogoModal.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import { X, Image, Package, Layers } from "lucide-react";

interface Produto {
  id: string;
  titulo: string;
  descricao: string;
  preco: number;
  preco_prod: number;
  preco_original: number;
  custo: number;
  margem_lucro: number;
  estoque: number;
  categoria: { nome: string; id: string };
  marca: { nome: string; id: string };
  genero: { nome: string; id: string };
  modelo: string;
  modelo_prod: string;
  condicao: string;
  garantia: string;
  codigo_ean: string;
  ncm: string;
  cest: string;
  peso?: number;
  comprimento?: number;
  largura?: number;
  altura?: number;
  categoria_id?: string;
  marca_id?: string;
  genero_id?: string;
  variacoes: ProdutoVariacao[];
  imagens: ProdutoImagem[];
  created_at: string;
  ativo: boolean;
  visivel: boolean;
  desativado_em?: string;
  desativado_por?: string;
  motivo_desativacao?: string;
}

interface ProdutoVariacao {
  id: string;
  tamanho_id: string;
  cor_id: string;
  estoque: number;
  preco: number;
  preco_prod: number;
  codigo_ean: string;
  sku: string;
  tamanho: { nome: string };
  cor: { nome: string; codigo_hex: string };
}

interface ProdutoImagem {
  id: string;
  url: string;
  ordem: number;
  principal: boolean;
}

interface CatalogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  filtros: {
    categorias: string[];
    marcas: string[];
    generos: string[];
    tamanhos: string[];
    cores: string[];
  };
  dadosComplementares: {
    categorias: { id: string; nome: string }[];
    marcas: { id: string; nome: string }[];
    generos: { id: string; nome: string }[];
    tamanhos: { id: string; nome: string }[];
    cores: { id: string; nome: string; codigo_hex: string }[];
  };
}

// Interface para cache
interface CatalogoCache {
  produtos: Produto[];
  filtrosKey: string;
  timestamp: number;
}

export default function CatalogoModal({
  isOpen,
  onClose,
  filtros,
  dadosComplementares,
}: CatalogoModalProps) {
  const [produtosCatalogo, setProdutosCatalogo] = useState<Produto[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [mostrarPrecosCatalogo, setMostrarPrecosCatalogo] = useState(true);
  const [printWindow, setPrintWindow] = useState<Window | null>(null);
  
  // Refs para controle de cache e inicialização
  const cacheRef = useRef<CatalogoCache | null>(null);
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const hasLoadedOnceRef = useRef(false);

  const logoUrl = `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/logomarca.jpg`;

  // Gerar chave única para os filtros atuais
  const getFiltrosKey = () => {
    return JSON.stringify({
      categorias: [...filtros.categorias].sort(),
      marcas: [...filtros.marcas].sort(),
      generos: [...filtros.generos].sort(),
      tamanhos: [...filtros.tamanhos].sort(),
      cores: [...filtros.cores].sort(),
    });
  };

  // Verificar se o cache é válido (menos de 5 minutos)
  const isCacheValid = (cachedData: CatalogoCache | null) => {
    if (!cachedData) return false;
    const fiveMinutes = 5 * 60 * 1000;
    const isValid = (Date.now() - cachedData.timestamp) < fiveMinutes;
    return isValid;
  };

  const hasActiveFilters = () => {
    return (
      filtros.tamanhos.length > 0 ||
      filtros.cores.length > 0 ||
      filtros.categorias.length > 0 ||
      filtros.marcas.length > 0 ||
      filtros.generos.length > 0
    );
  };

  const showNoProductsAlert = () => {
    setTimeout(() => {
      if (!isMountedRef.current) return;
      Swal.fire({
        icon: "info",
        title: "Nenhum produto encontrado",
        html: `
          <div class="text-left">
            <p>Não foram encontrados produtos que correspondam a todos os filtros aplicados:</p>
            <ul class="list-disc list-inside mt-2 text-sm">
              ${
                filtros.tamanhos.length > 0
                  ? `<li><strong>Tamanhos:</strong> ${filtros.tamanhos
                      .map(
                        (id) =>
                          dadosComplementares.tamanhos.find((t) => t.id === id)
                            ?.nome,
                      )
                      .join(", ")}</li>`
                  : ""
              }
              ${
                filtros.cores.length > 0
                  ? `<li><strong>Cores:</strong> ${filtros.cores
                      .map(
                        (id) =>
                          dadosComplementares.cores.find((c) => c.id === id)
                            ?.nome,
                      )
                      .join(", ")}</li>`
                  : ""
              }
              ${
                filtros.categorias.length > 0
                  ? `<li><strong>Categorias:</strong> ${filtros.categorias
                      .map(
                        (id) =>
                          dadosComplementares.categorias.find(
                            (c) => c.id === id,
                          )?.nome,
                      )
                      .join(", ")}</li>`
                  : ""
              }
              ${
                filtros.marcas.length > 0
                  ? `<li><strong>Marcas:</strong> ${filtros.marcas
                      .map(
                        (id) =>
                          dadosComplementares.marcas.find((m) => m.id === id)
                            ?.nome,
                      )
                      .join(", ")}</li>`
                  : ""
              }
              ${
                filtros.generos.length > 0
                  ? `<li><strong>Gêneros:</strong> ${filtros.generos
                      .map(
                        (id) =>
                          dadosComplementares.generos.find((g) => g.id === id)
                            ?.nome,
                      )
                      .join(", ")}</li>`
                  : ""
              }
            </ul>
            <p class="mt-3 text-sm">Sugestões:</p>
            <ul class="list-disc list-inside text-sm">
              <li>Remover alguns filtros</li>
              <li>Verificar a disponibilidade em estoque</li>
              <li>Expandir os critérios de busca</li>
            </ul>
          </div>
        `,
        confirmButtonText: "Ajustar Filtros",
        confirmButtonColor: "#3B82F6",
      });
    }, 500);
  };

  const loadProdutosCatalogo = async () => {
    // Evitar chamadas simultâneas
    if (isLoadingRef.current) return;
    
    try {
      const currentFiltrosKey = getFiltrosKey();
      
      // Verificar cache primeiro
      if (cacheRef.current && isCacheValid(cacheRef.current)) {
        // Verificar se os filtros são os mesmos
        if (cacheRef.current.filtrosKey === currentFiltrosKey) {
          console.log("📦 Usando cache do catálogo");
          if (isMountedRef.current) {
            setProdutosCatalogo(cacheRef.current.produtos);
            setLoadingCatalogo(false);
          }
          
          // Mostrar alerta se não houver produtos e tiver filtros ativos
          if (cacheRef.current.produtos.length === 0 && hasActiveFilters()) {
            showNoProductsAlert();
          }
          return;
        }
      }

      // Se chegou aqui, precisa carregar do servidor
      console.log("🔄 Carregando catálogo do servidor...");
      isLoadingRef.current = true;
      if (isMountedRef.current) {
        setLoadingCatalogo(true);
      }

      // Primeiro, buscar produtos base com filtros simples
      let query = supabase
        .from("produtos")
        .select(
          `
          *,
          categoria:categorias(nome, id),
          marca:marcas(nome, id),
          genero:generos(nome, id),
          variacoes:produto_variacoes(
            id,
            tamanho_id,
            cor_id,
            estoque,
            preco,
            preco_prod,
            codigo_ean,
            sku,
            tamanho:tamanhos(nome),
            cor:cores(nome, codigo_hex)
          ),
          imagens:produto_imagens(*)
        `,
        )
        .eq("ativo", true)
        .gt("estoque", 0);

      // Aplicar filtro por categorias
      if (filtros.categorias.length > 0) {
        query = query.in("categoria_id", filtros.categorias);
      }

      // Aplicar filtro por marcas
      if (filtros.marcas.length > 0) {
        query = query.in("marca_id", filtros.marcas);
      }

      // Aplicar filtro por gêneros
      if (filtros.generos.length > 0) {
        query = query.in("genero_id", filtros.generos);
      }

      const { data: produtosBase, error } = await query;

      if (error) throw error;

      // Aplicar filtros de tamanhos e cores no lado do cliente
      const produtosFiltrados =
        produtosBase?.filter((produto) => {
          // Filtro por tamanhos - apenas produtos que têm variações com os tamanhos filtrados
          if (filtros.tamanhos.length > 0) {
            const temTamanhoFiltrado = produto.variacoes?.some(
              (v: ProdutoVariacao) =>
                v.tamanho_id &&
                filtros.tamanhos.includes(v.tamanho_id) &&
                v.estoque > 0,
            );
            if (!temTamanhoFiltrado) return false;
          }

          // Filtro por cores - apenas produtos que têm variações com as cores filtradas
          if (filtros.cores.length > 0) {
            const temCorFiltrada = produto.variacoes?.some(
              (v: ProdutoVariacao) =>
                v.cor_id && filtros.cores.includes(v.cor_id) && v.estoque > 0,
            );
            if (!temCorFiltrada) return false;
          }

          return true;
        }) || [];

      // Salvar no cache
      cacheRef.current = {
        produtos: produtosFiltrados,
        filtrosKey: currentFiltrosKey,
        timestamp: Date.now(),
      };
      hasLoadedOnceRef.current = true;

      if (isMountedRef.current) {
        setProdutosCatalogo(produtosFiltrados);
        setLoadingCatalogo(false);
      }

      // Mostrar alerta se não houver produtos
      if (produtosFiltrados.length === 0 && hasActiveFilters()) {
        showNoProductsAlert();
      }
    } catch (error) {
      console.error("Erro ao carregar produtos para catálogo:", error);
      if (isMountedRef.current) {
        setLoadingCatalogo(false);
      }
    } finally {
      isLoadingRef.current = false;
    }
  };

  const formatarPrecoCatalogo = (
    preco_prod: number,
    precoOriginal?: number,
  ) => {
    if (!mostrarPrecosCatalogo) {
      return <span className="text-green-600 font-bold">Consulte</span>;
    }

    if (precoOriginal && precoOriginal > preco_prod) {
      return (
        <>
          <span className="text-green-600 font-bold">
            R$ {preco_prod.toFixed(2)}
          </span>
          <span className="text-gray-500 text-sm line-through ml-2">
            R$ {precoOriginal.toFixed(2)}
          </span>
        </>
      );
    }
    return (
      <span className="text-green-600 font-bold">
        R$ {preco_prod.toFixed(2)}
      </span>
    );
  };

  const generateProductHTML = (produto: Produto, mostrarPrecos: boolean) => {
    // Obter tamanhos únicos com estoque e que correspondam aos filtros
    const tamanhosUnicos = Array.from(
      new Set(
        produto.variacoes
          ?.filter((v) => {
            if (filtros.tamanhos.length > 0) {
              return filtros.tamanhos.includes(v.tamanho_id) && v.estoque > 0;
            }
            return v.estoque > 0;
          })
          .map((v) => v.tamanho?.nome)
          .filter(Boolean),
      ),
    );

    // Obter cores únicas com estoque e que correspondam aos filtros
    const coresUnicas = Array.from(
      new Map(
        produto.variacoes
          ?.filter((v) => {
            if (filtros.cores.length > 0) {
              return filtros.cores.includes(v.cor_id) && v.cor && v.estoque > 0;
            }
            return v.cor && v.estoque > 0;
          })
          .map((v) => [v.cor_id, v.cor]),
      ).values(),
    );

    return `
    <div class="catalogo-item">
      <div class="catalogo-image-container">
        ${
          produto.imagens && produto.imagens.length > 0
            ? `<img src="${produto.imagens[0].url}" alt="${produto.titulo}" class="catalogo-image" 
                onload="this.style.opacity=1" 
                style="opacity:0; transition: opacity 0.3s;" />`
            : `<div class="catalogo-image" style="background-color: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 11px;">Sem imagem</div>`
        }
      </div>
      <div class="catalogo-title">${produto.titulo}</div>
      <div class="catalogo-info">${produto.marca?.nome || "N/A"} • ${
      produto.categoria?.nome || "N/A"
    }</div>
      <div class="catalogo-info">${produto.modelo_prod || "N/A"} | Ref: ${
      produto.codigo_ean || "N/A"
    }</div>
      <div>
        ${
          mostrarPrecos
            ? produto.preco_original && produto.preco_original > produto.preco
              ? `<span class="catalogo-price">R$ ${produto.preco.toFixed(
                  2,
                )}</span>
                 <span class="catalogo-original-price">R$ ${produto.preco_original.toFixed(
                   2,
                 )}</span>`
              : `<span class="catalogo-price">R$ ${produto.preco.toFixed(2)}</span>`
            : `<span class="catalogo-price-hidden">Consulte</span>`
        }
        <span class="catalogo-stock ${
          produto.estoque > 0 ? "stock-available" : "stock-unavailable"
        }">
          ${produto.estoque > 0 ? "Em estoque" : "Sem estoque"}
        </span>
      </div>
      ${
        tamanhosUnicos.length > 0
          ? `<div class="catalogo-sizes">
             <div class="catalogo-info">Tamanhos:</div>
             <div>${tamanhosUnicos
               .map((tamanho) => `<span class="size-tag">${tamanho}</span>`)
               .join(" ")}
             </div>
           </div>`
          : ""
      }
      ${
        coresUnicas.length > 0
          ? `<div class="catalogo-colors">
             <div class="catalogo-info">Cores:</div>
             ${coresUnicas
               .map(
                 (cor) => `
                 <div class="color-item">
                   <div class="color-dot-print" style="background-color: ${
                     cor.codigo_hex || "#ccc"
                   } !important;"></div>
                   <span class="color-name">${cor.nome || "N/A"}</span>
                 </div>
               `,
               )
               .join("")}
           </div>`
          : '<div class="catalogo-colors"><div class="catalogo-info">Cores: N/A</div></div>'
      }
    </div>
  `;
  };

  const handlePrint = () => {
    const printContent = document.getElementById("catalogo-print");
    if (!printContent) return;

    const newPrintWindow = window.open("", "_blank");
    if (!newPrintWindow) return;

    setPrintWindow(newPrintWindow);

    const mostrarPrecos = mostrarPrecosCatalogo;

    // Aplicar filtros diretamente nos produtos para impressão
    const produtosFiltrados = produtosCatalogo.filter((produto) => {
      if (filtros.tamanhos.length > 0) {
        const temTamanhoFiltrado = produto.variacoes?.some(
          (v) =>
            v.tamanho_id &&
            filtros.tamanhos.includes(v.tamanho_id) &&
            v.estoque > 0,
        );
        if (!temTamanhoFiltrado) return false;
      }

      if (filtros.cores.length > 0) {
        const temCorFiltrada = produto.variacoes?.some(
          (v) => v.cor_id && filtros.cores.includes(v.cor_id) && v.estoque > 0,
        );
        if (!temCorFiltrada) return false;
      }

      if (filtros.categorias.length > 0 && produto.categoria_id) {
        if (!filtros.categorias.includes(produto.categoria_id)) return false;
      }

      if (filtros.marcas.length > 0 && produto.marca_id) {
        if (!filtros.marcas.includes(produto.marca_id)) return false;
      }

      if (filtros.generos.length > 0 && produto.genero_id) {
        if (!filtros.generos.includes(produto.genero_id)) return false;
      }

      return true;
    });

    if (produtosFiltrados.length === 0) {
      newPrintWindow.close();
      Swal.fire({
        icon: "warning",
        title: "Nenhum produto encontrado",
        text: "Não há produtos que correspondam aos filtros aplicados. Tente ajustar os critérios de filtro.",
        confirmButtonText: "Entendi",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }

    const handlePrintClose = () => {
      onClose();
      setPrintWindow(null);
    };

    newPrintWindow.addEventListener("beforeunload", handlePrintClose);

    const styles = `
      <style>
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .header-logo {
            max-height: 8vh;
            margin-bottom: 15px;
          }
          .catalogo-page {
            padding: 15px;
            min-height: 91vh;
            display: flex;
            flex-direction: column;
          }
          .first-page {
            justify-content: flex-start;
            page-break-after: always;
          }
          .other-page {
            justify-content: space-between;
            page-break-after: auto;
          }
          .catalogo-page:last-child {
            page-break-after: avoid;
          }
          .catalogo-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            width: 100%;
          }
          .first-page .catalogo-grid {
            grid-template-rows: repeat(2, auto);
            height: auto;
          }
          .other-page .catalogo-grid {
            grid-template-rows: repeat(3, auto);
            flex-grow: 1;
          }
          .titulo-catalogo {
            text-align: center;
            font-size: 1.8rem;
            text-decoration: underline;
            margin-bottom: 25px;
            color: white !important;
            font-size: 1px !important;
            opacity: 0.01 !important;
          }
          .catalogo-item {
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
            display: flex;
            flex-direction: column;
            height: fit-content;
            min-height: 280px;
          }
          .catalogo-image-container {
            height: 130px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            overflow: hidden;
            background-color: #f8f9fa;
          }
          .catalogo-image {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            border-radius: 4px;
          }
          .catalogo-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 4px;
            line-height: 1.2;
            min-height: 32px;
          }
          .catalogo-info {
            font-size: 11px;
            color: #666;
            margin-bottom: 2px;
            line-height: 1.2;
          }
          .catalogo-price {
            font-weight: bold;
            color: #16a34a;
            font-size: 13px;
            margin: 4px 0;
          }
          .catalogo-original-price {
            text-decoration: line-through;
            color: #999;
            font-size: 11px;
            margin-left: 5px;
          }
          .catalogo-stock {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 8px;
            display: inline-block;
            margin-top: 4px;
          }
          .stock-available {
            background-color: #dcfce7 !important;
            color: #166534 !important;
            border: 1px solid #bbf7d0;
          }
          .stock-unavailable {
            background-color: #fee2e2 !important;
            color: #991b1b !important;
            border: 1px solid #fecaca;
          }
          .catalogo-sizes {
            margin-top: 6px;
          }
          .size-tag {
            display: inline-block;
            background-color: #f3f4f6 !important;
            color: #374151 !important;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 9px;
            margin: 1px;
            border: 1px solid #e5e7eb;
          }
          .catalogo-colors {
            margin-top: 6px;
          }
          .color-item {
            display: flex;
            align-items: center;
            margin: 1px 0;
          }
          .color-dot-print {
            width: 10px !important;
            height: 10px !important;
            border-radius: 50% !important;
            display: inline-block !important;
            margin-right: 3px !important;
            border: 1px solid #ddd !important;
          }
          .color-name {
            font-size: 9px;
            color: #666;
          }
          .no-print {
            display: none !important;
          }
          .catalogo-price-hidden {
            font-weight: bold;
            color: #16a34a;
            font-size: 13px;
          }
          
          .color-dot-print {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .size-tag, .catalogo-stock {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          @page {
            size: A4 portrait;
            margin: 1cm;
          }
          
          @page {
            margin: 0;
          }
          body {
            margin: 1.5cm;
          }          
          .last-page {
            page-break-after: avoid !important;
          }
        }
        
        .screen-view {
          font-family: Arial, sans-serif;
        }
        .screen-view .catalogo-page {
          margin-bottom: 20px;
        }
        .screen-view .catalogo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .screen-view .catalogo-item {
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 10px;
          background: white;
        }
      </style>
    `;

    const itemsPerPageFirst = 6;
    const itemsPerPageOther = 9;
    const pages = [];

    const firstPageProducts = produtosFiltrados.slice(0, itemsPerPageFirst);
    const remainingProducts = produtosFiltrados.slice(itemsPerPageFirst);

    if (firstPageProducts.length > 0) {
      const firstPageContent = firstPageProducts
        .map((produto) => generateProductHTML(produto, mostrarPrecos))
        .join("");

      pages.push(`
        <div class="catalogo-page first-page">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="Logo" class="header-logo" style="max-height: 80px;">
            <h3>CATÁLOGO DE PRODUTOS</h3>
          </div>
          <div class="catalogo-grid">
            ${firstPageContent}
          </div>
        </div>
      `);
    }

    const totalPages = Math.ceil(remainingProducts.length / itemsPerPageOther);

    for (
      let i = 0;
      i < remainingProducts.length && i < remainingProducts.length;
      i += itemsPerPageOther
    ) {
      const pageIndex = Math.floor(i / itemsPerPageOther) + 1;
      const isLastPage = pageIndex === totalPages;
      const pageProducts = remainingProducts.slice(i, i + itemsPerPageOther);

      if (pageProducts.length > 0) {
        const pageContent = pageProducts
          .map((produto) => generateProductHTML(produto, mostrarPrecos))
          .join("");

        pages.push(`
          <div class="catalogo-page other-page ${
            isLastPage ? "last-page" : ""
          }">
            <div class="catalogo-grid">
              ${pageContent}
            </div>
          </div>
        `);
      }
    }

    newPrintWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Catálogo de Produtos</title>
          <meta charset="utf-8">
          ${styles}
        </head>
        <body class="screen-view">
          ${pages.join("")}
          <script>
            window.onafterprint = function() {
              window.close();
            };
            
            window.addEventListener('beforeunload', function() {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage('printClosed', '*');
              }
            });
            
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);

    newPrintWindow.document.close();

    const checkPrintWindow = setInterval(() => {
      if (newPrintWindow.closed) {
        clearInterval(checkPrintWindow);
        onClose();
        setPrintWindow(null);
      }
    }, 500);

    window.addEventListener("message", function (event) {
      if (event.data === "printClosed") {
        onClose();
        setPrintWindow(null);
      }
    });
  };

  // Efeito para carregar dados SOMENTE quando o modal ESTIVER ABERTO
  useEffect(() => {
    if (!isOpen) return;
    
    // Verificar se tem cache válido
    const currentFiltrosKey = getFiltrosKey();
    const hasValidCache = cacheRef.current && 
                         isCacheValid(cacheRef.current) && 
                         cacheRef.current.filtrosKey === currentFiltrosKey;
    
    if (hasValidCache && cacheRef.current) {
      // Se tem cache válido, usa ele imediatamente
      console.log("📦 Restaurando cache ao abrir modal");
      setProdutosCatalogo(cacheRef.current.produtos);
      setLoadingCatalogo(false);
    } else if (!hasLoadedOnceRef.current) {
      // Se nunca carregou antes, carrega do servidor
      setLoadingCatalogo(true);
      loadProdutosCatalogo();
    }
  }, [isOpen]);

  // Efeito separado para recarregar quando os filtros mudarem (apenas se o modal estiver aberto)
  useEffect(() => {
    if (!isOpen) return;
    
    // Quando os filtros mudam, verifica se precisa recarregar
    const currentFiltrosKey = getFiltrosKey();
    const hasValidCache = cacheRef.current && 
                         isCacheValid(cacheRef.current) && 
                         cacheRef.current.filtrosKey === currentFiltrosKey;
    
    if (!hasValidCache) {
      setLoadingCatalogo(true);
      loadProdutosCatalogo();
    }
  }, [filtros.categorias, filtros.marcas, filtros.generos, filtros.tamanhos, filtros.cores, isOpen]);

  // Cleanup do mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // SE O MODAL NÃO ESTIVER ABERTO, NÃO RENDERIZA NADA
  if (!isOpen) return null;

  // SÓ MOSTRA LOADING SE ESTIVER CARREGANDO E NÃO TIVER PRODUTOS
  if (loadingCatalogo && produtosCatalogo.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4">Carregando catálogo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Catálogo de Produtos
          </h2>
          <div className="flex space-x-2">
            <label className="flex items-center text-sm text-gray-700 no-print">
              <input
                type="checkbox"
                checked={mostrarPrecosCatalogo}
                onChange={(e) => setMostrarPrecosCatalogo(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Mostrar Preços
            </label>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center no-print"
            >
              <Layers size={18} className="mr-2" />
              Imprimir/PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors no-print"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div
          id="catalogo-print"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {produtosCatalogo.map((produto) => (
            <div
              key={produto.id}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="mb-4">
                {produto.imagens && produto.imagens.length > 0 ? (
                  <img
                    src={produto.imagens[0].url}
                    alt={produto.titulo}
                    className="w-full h-48 object-cover rounded-md"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 rounded-md flex items-center justify-center">
                    <Image size={32} className="text-gray-400" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg text-gray-800">
                  {produto.titulo}
                </h3>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {produto.marca?.nome}
                  </span>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {produto.categoria?.nome}
                  </span>
                </div>

                <div className="text-sm text-gray-700">
                  <p>{produto.modelo_prod}</p>
                  <p>Ref: {produto.codigo_ean || "N/A"}</p>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    {formatarPrecoCatalogo(
                      produto.preco_prod,
                      produto.preco_original,
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      produto.estoque > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {produto.estoque > 0 ? "Em estoque" : "Sem estoque"}
                  </span>
                </div>

                {produto.variacoes && produto.variacoes.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Tamanhos:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(
                        new Set(
                          produto.variacoes
                            .filter((v) => {
                              if (filtros.tamanhos.length > 0) {
                                return (
                                  filtros.tamanhos.includes(v.tamanho_id) &&
                                  v.estoque > 0
                                );
                              }
                              return v.estoque > 0;
                            })
                            .map((v) => v.tamanho?.nome)
                            .filter(Boolean),
                        ),
                      ).map((tamanho, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tamanho}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {produto.variacoes &&
                  produto.variacoes.some((v) => v.cor && v.estoque > 0) && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Cores:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          new Map(
                            produto.variacoes
                              .filter((v) => {
                                if (filtros.cores.length > 0) {
                                  return (
                                    filtros.cores.includes(v.cor_id) &&
                                    v.cor &&
                                    v.estoque > 0
                                  );
                                }
                                return v.cor && v.estoque > 0;
                              })
                              .map((v) => [v.cor_id, v.cor]),
                          ).values(),
                        ).map((cor, index) => (
                          <div key={index} className="flex items-center">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300 mr-1"
                              style={{
                                backgroundColor: cor.codigo_hex || "#ccc",
                              }}
                              title={cor.nome}
                            ></div>
                            <span className="text-xs text-gray-600">
                              {cor.nome || "N/A"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>

        {produtosCatalogo.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              Nenhum produto disponível para o catálogo
            </p>
            {hasActiveFilters() && (
              <p className="text-gray-400 text-sm mt-2">
                Tente remover alguns filtros para ver mais produtos
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}