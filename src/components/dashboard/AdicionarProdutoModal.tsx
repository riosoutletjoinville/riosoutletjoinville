// components/dashboard/AdicionarProdutoModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Produto {
  id: string;
  titulo: string;
  preco_prod: number;
  codigo: string;
  ncm: string;
  modelo_prod?: string;
  imagem_principal?: string;
  estoque: number;
  imagens?: ProdutoImagem[];
}

interface ProdutoImagem {
  id: string;
  url: string;
  ordem: number;
  principal: boolean;
}

interface Tamanho {
  id: string;
  nome: string;
  ordem: number;
}

interface VariacaoEstoque {
  tamanho_id: string;
  estoque: number;
  tamanho: Tamanho;
}


interface AdicionarProdutoModalProps {
  isOpen: boolean;
  produtos: Produto[];
  onAdd: (
    produto: Produto,
    quantidades: { [tamanho: string]: number },
    desconto: number,
    filial: string,
    embargue: string,
    variacoes?: { id: string; tamanho: string; cor?: string; quantidade: number; }[] 
  ) => void;
  onClose: () => void;
}

interface Cor {
  id: string;
  nome: string;
  codigo_hex: string;
}

interface VariacaoEstoque {
  id: string;
  tamanho_id: string;
  cor_id: string | null;
  estoque: number;
  tamanho: Tamanho;
  cor: Cor | null;
}

export default function AdicionarProdutoModal({
  isOpen,
  produtos,
  onAdd,
  onClose,
}: AdicionarProdutoModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(
    null
  );
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [variacoesEstoque, setVariacoesEstoque] = useState<VariacaoEstoque[]>(
    []
  );
  const [quantidades, setQuantidades] = useState<{ [tamanho: string]: number }>(
    {}
  );
  const [desconto, setDesconto] = useState(0);
  const [filial, setFilial] = useState("Matriz");
  const [embargue, setEmbargue] = useState("30 dias");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const produtosComEstoque = produtos.filter((produto) => produto.estoque > 0);

  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return "";

    // Se já é uma URL completa, retorna diretamente
    if (imagePath.startsWith("http")) return imagePath;

    // Se é um caminho do Supabase Storage, constrói a URL completa
    if (imagePath.startsWith("produtos/")) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${imagePath}`;
    }

    return imagePath;
  };

  // useEffect para quando o modal abre ou a lista de produtos muda
  useEffect(() => {
    if (isOpen) {
      loadTamanhos();
      // Reseta para a primeira página
      setCurrentPage(1);
      if (!searchTerm) {
        setProdutosFiltrados(produtosComEstoque.slice(0, itemsPerPage));
      }
    }
  }, [isOpen]);

  // useEffect apenas para busca
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtrados = produtosComEstoque.filter(
        (produto) =>
          produto.titulo.toLowerCase().includes(term) ||
          (produto.codigo && produto.codigo.toLowerCase().includes(term)) ||
          (produto.modelo_prod &&
            produto.modelo_prod.toLowerCase().includes(term))
      );
      setProdutosFiltrados(filtrados.slice(0, currentPage * itemsPerPage));
    }
  }, [searchTerm, produtosComEstoque]);
  
  useEffect(() => {
    if (!searchTerm) {
      setProdutosFiltrados(
        produtosComEstoque.slice(0, currentPage * itemsPerPage)
      );
    }
  }, [currentPage, produtosComEstoque]); 

  const loadTamanhos = async () => {
    try {
      // Se já carregou os tamanhos, não carregue novamente
      if (tamanhos.length > 0) return;

      const { data, error } = await supabase
        .from("tamanhos")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;

      // Verifique se os dados são diferentes antes de atualizar o estado
      if (JSON.stringify(data) !== JSON.stringify(tamanhos)) {
        setTamanhos(data || []);
      }

      const quantidadesIniciais: { [tamanho: string]: number } = {};
      data?.forEach((tamanho) => {
        quantidadesIniciais[tamanho.nome] = 0;
      });

      // Verifique se as quantidades são diferentes antes de atualizar
      if (JSON.stringify(quantidadesIniciais) !== JSON.stringify(quantidades)) {
        setQuantidades(quantidadesIniciais);
      }
    } catch (error) {
      console.error("Erro ao carregar tamanhos:", error);
    }
  };

  const loadEstoquePorTamanho = async (produtoId: string) => {
    try {
      const { data, error } = await supabase
        .from("produto_variacoes")
        .select(
          `
        id,
        tamanho_id,
        cor_id,
        estoque,
        tamanhos (id, nome, ordem),
        cores (id, nome, codigo_hex)
      `
        )
        .eq("produto_id", produtoId)
        .gt("estoque", 0)
        .order("estoque", { ascending: false });

      if (error) throw error;

      console.log("Variações carregadas:", data);

      const variacoesFormatadas: VariacaoEstoque[] = (data || []).map(
        (item) => ({
          id: item.id,
          tamanho_id: item.tamanho_id,
          cor_id: item.cor_id,
          estoque: item.estoque,
          tamanho: Array.isArray(item.tamanhos)
            ? item.tamanhos[0]
            : item.tamanhos,
          cor: Array.isArray(item.cores) ? item.cores[0] : item.cores,
        })
      );

      setVariacoesEstoque(variacoesFormatadas);

      // Inicializar quantidades como zero para cada variação
      const novasQuantidades: { [key: string]: number } = {};
      variacoesFormatadas.forEach((variacao) => {
        const chave = variacao.id;
        novasQuantidades[chave] = 0;
      });

      setQuantidades(novasQuantidades);
    } catch (error) {
      console.error("Erro ao carregar estoque por tamanho:", error);
    }
  };

  const handleQuantidadeChange = (variacaoId: string, valor: number) => {
    const variacao = variacoesEstoque.find((v) => v.id === variacaoId);
    const estoqueMaximo = variacao ? variacao.estoque : 0;

    setQuantidades((prev) => ({
      ...prev,
      [variacaoId]: Math.max(0, Math.min(valor, estoqueMaximo)),
    }));
  };

  const handleSelecionarProduto = async (produto: Produto) => {
    setProdutoSelecionado(produto);
    await loadEstoquePorTamanho(produto.id);
  };

  
const handleAdicionar = () => {
  if (!produtoSelecionado) return;

  // Verificar se há pelo menos uma quantidade selecionada
  const temQuantidade = Object.values(quantidades).some((qtd) => qtd > 0);
  if (!temQuantidade) {
    alert("Selecione pelo menos uma quantidade para o produto");
    return;
  }

  // Verificar estoque para cada variação selecionada
  for (const [variacaoId, quantidade] of Object.entries(quantidades)) {
    if (quantidade > 0) {
      const variacao = variacoesEstoque.find((v) => v.id === variacaoId);
      if (variacao && quantidade > variacao.estoque) {
        const descricaoVariacao = variacao.cor
          ? `${variacao.tamanho.nome} (${variacao.cor.nome})`
          : variacao.tamanho.nome;

        alert(
          `Quantidade para ${descricaoVariacao} excede o estoque disponível (${variacao.estoque})`
        );
        return;
      }
    }
  }

  // 🔥 NOVO: Criar array de variações com IDs
  const variacoesArray = Object.entries(quantidades)
    .filter(([_, quantidade]) => quantidade > 0)
    .map(([variacaoId, quantidade]) => {
      const variacao = variacoesEstoque.find(v => v.id === variacaoId);
      return {
        id: variacaoId,
        tamanho: variacao?.tamanho.nome || '',
        cor: variacao?.cor?.nome,
        quantidade: quantidade
      };
    });

  // Criar objeto de quantidades no formato antigo (para compatibilidade)
  const quantidadesFormatadas: { [tamanho: string]: number } = {};
  variacoesArray.forEach(v => {
    const chave = v.cor ? `${v.tamanho}_${v.cor}` : v.tamanho;
    quantidadesFormatadas[chave] = v.quantidade;
  });

  // 🔥 NOVO: Passar as variações completas junto com os dados
  onAdd(
    produtoSelecionado,
    quantidadesFormatadas,
    desconto,
    filial,
    embargue,
    variacoesArray  
  );
  
  setProdutoSelecionado(null);
  setQuantidades({});
  setDesconto(0);
  setFilial("Matriz");
  setEmbargue("30 dias");
  setVariacoesEstoque([]);
};

  const loadMoreProducts = () => {
    const nextPage = currentPage + 1;
    const startIndex = 0; // Sempre começa do início
    const endIndex = nextPage * itemsPerPage;

    let produtosParaMostrar;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      produtosParaMostrar = produtosComEstoque.filter(
        (produto) =>
          produto.titulo.toLowerCase().includes(term) ||
          (produto.codigo && produto.codigo.toLowerCase().includes(term)) ||
          (produto.modelo_prod &&
            produto.modelo_prod.toLowerCase().includes(term))
      );
    } else {
      produtosParaMostrar = produtosComEstoque;
    }

    setProdutosFiltrados(produtosParaMostrar.slice(startIndex, endIndex));
    setCurrentPage(nextPage);
  };
  const quantidadeTotal = Object.values(quantidades).reduce(
    (sum, qtd) => sum + qtd,
    0
  );
  const precoComDesconto = produtoSelecionado
    ? produtoSelecionado.preco_prod * (1 - desconto / 100)
    : 0;
  const subtotal = quantidadeTotal * precoComDesconto;

  const hasMoreProducts = (() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const totalFiltrados = produtosComEstoque.filter(
        (p) =>
          p.titulo.toLowerCase().includes(term) ||
          (p.codigo && p.codigo.toLowerCase().includes(term)) ||
          (p.modelo_prod && p.modelo_prod.toLowerCase().includes(term))
      ).length;
      return produtosFiltrados.length < totalFiltrados;
    } else {
      return produtosFiltrados.length < produtosComEstoque.length;
    }
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {produtoSelecionado
              ? `Adicionar ${produtoSelecionado.titulo}`
              : "Selecionar Produto"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {!produtoSelecionado ? (
          <>
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar produtos por nome, código ou modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-4 pr-4 py-2 border border-gray-300 rounded-md w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              {produtosFiltrados.map((produto) => (
                <div
                  key={produto.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelecionarProduto(produto)}
                >
                  <div className="flex items-center space-x-4">
                    {produto.imagem_principal && (
                      <img
                        src={getImageUrl(produto.imagem_principal)}
                        alt={produto.titulo}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{produto.titulo}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            Código: {produto.codigo}
                          </p>
                          <p className="text-sm text-gray-600">
                            Modelo: {produto.modelo_prod || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">
                            NCM: {produto.ncm}
                          </p>
                          <p className="text-sm text-green-600">
                            Estoque: {produto.estoque} unidades
                          </p>
                        </div>
                        <p className="text-sm font-medium">
                          R$ {produto.preco_prod.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {hasMoreProducts && (
              <div className="text-center mb-4">
                <button
                  onClick={loadMoreProducts}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Carregar Mais Produtos
                </button>
              </div>
            )}

            {produtosFiltrados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhum produto com estoque disponível encontrado</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4 mb-4">
                {produtoSelecionado.imagem_principal && (
                  <img
                    src={produtoSelecionado.imagem_principal}
                    alt={produtoSelecionado.titulo}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {produtoSelecionado.titulo}
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600">
                        Código: {produtoSelecionado.codigo}
                      </p>
                      <p className="text-gray-600">
                        Modelo: {produtoSelecionado.modelo_prod || "N/A"}
                      </p>
                      <p className="text-gray-600">
                        NCM: {produtoSelecionado.ncm}
                      </p>
                      <p className="text-green-600">
                        Estoque total: {produtoSelecionado.estoque} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        R$ {produtoSelecionado.preco_prod.toFixed(2)}
                      </p>
                      {desconto > 0 && (
                        <p className="text-sm text-green-600">
                          Com desconto: R$ {precoComDesconto.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setProdutoSelecionado(null);
                  setVariacoesEstoque([]);
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Voltar para lista de produtos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desconto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={desconto}
                  onChange={(e) => setDesconto(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filial
                </label>
                <select
                  value={filial}
                  onChange={(e) => setFilial(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="Matriz">Matriz</option>
                  <option value="Filial 1">Filial 1</option>
                  <option value="Filial 2">Filial 2</option>
                  <option value="Filial 3">Filial 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prazo de Embargue
                </label>
                <select
                  value={embargue}
                  onChange={(e) => setEmbargue(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="30 dias">30 dias</option>
                  <option value="45 dias">45 dias</option>
                  <option value="60 dias">60 dias</option>
                  <option value="90 dias">90 dias</option>
                  <option value="Pronta entrega">Pronta entrega</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">
                Selecionar Tamanhos, Cores e Quantidades
              </h3>

              {variacoesEstoque.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p>
                    Nenhuma variação disponível em estoque para este produto
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {variacoesEstoque.map((variacao) => (
                    <div
                      key={variacao.id}
                      className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {/* Cabeçalho com Tamanho e Cor - AGORA COM TEXTO EXPLÍCITO */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {variacao.tamanho.nome}
                        </span>
                        {variacao.cor && (
                          <div className="flex items-center space-x-1">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                              style={{
                                backgroundColor:
                                  variacao.cor.codigo_hex || "#cccccc",
                              }}
                              title={variacao.cor.nome || "Sem cor"}
                            />
                          </div>
                        )}
                      </div>

                      {/* Nome da cor AGORA MAIS DESTACADO */}
                      {variacao.cor && (
                        <div className="text-xs font-medium text-gray-700 mb-2 text-center">
                          Cor: {variacao.cor.nome}
                        </div>
                      )}

                      {/* Se não tiver cor, mostrar "Sem cor" */}
                      {!variacao.cor && (
                        <div className="text-xs text-gray-500 mb-2 text-center">
                          Sem cor específica
                        </div>
                      )}

                      {/* Estoque disponível */}
                      <p className="text-xs text-green-600 mb-2 text-center">
                        Estoque: {variacao.estoque}
                      </p>

                      {/* Controles de quantidade */}
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() =>
                            handleQuantidadeChange(
                              variacao.id,
                              (quantidades[variacao.id] || 0) - 1
                            )
                          }
                          className="p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                          disabled={(quantidades[variacao.id] || 0) <= 0}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {quantidades[variacao.id] || 0}
                        </span>
                        <button
                          onClick={() =>
                            handleQuantidadeChange(
                              variacao.id,
                              (quantidades[variacao.id] || 0) + 1
                            )
                          }
                          className="p-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                          disabled={
                            (quantidades[variacao.id] || 0) >= variacao.estoque
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {quantidadeTotal > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">
                      Total: {quantidadeTotal} unidades
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {Object.entries(quantidades)
                        .filter(([_, qtd]) => qtd > 0)
                        .map(([variacaoId, qtd]) => {
                          const variacao = variacoesEstoque.find(
                            (v) => v.id === variacaoId
                          );
                          if (!variacao) return "";

                          const descricao = variacao.cor
                            ? `${variacao.tamanho.nome} (${variacao.cor.nome})`
                            : variacao.tamanho.nome;

                          return `${descricao}: ${qtd}`;
                        })
                        .join(", ")}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Desconto: {desconto}% | Preço com desconto: R${" "}
                      {precoComDesconto.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-lg font-semibold">
                    R$ {subtotal.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setProdutoSelecionado(null);
                  setVariacoesEstoque([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdicionar}
                disabled={
                  quantidadeTotal === 0 || variacoesEstoque.length === 0
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar ao Pedido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
