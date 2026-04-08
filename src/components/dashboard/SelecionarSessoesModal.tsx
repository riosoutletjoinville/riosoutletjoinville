"use client";
import { useState, useEffect } from "react";
import { X, Check, Star, TrendingUp, Sun, Snowflake, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SessaoEspecial {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
  cor_fundo: string;
  cor_texto: string;
}

interface ProdutoSessao {
  id: string;
  produto_id: string;
  sessao_id: string;
  ordem: number;
  sessao: SessaoEspecial;
}

interface SelecionarSessoesModalProps {
  isOpen: boolean;
  produtoId: string;
  produtoTitulo: string;
  onClose: () => void;
  onSave: () => void;
}

// Ícones para cada tipo de sessão
/* eslint-disable @typescript-eslint/no-explicit-any */
const sessaoIcons: { [key: string]: any } = {
  'lancamentos': Zap,
  'promocoes': TrendingUp,
  'mais-vendidos': Star,
  'colecao-verao': Sun,
  'colecao-inverno': Snowflake,
  'tendencias': TrendingUp,
  'default': Star
};

export default function SelecionarSessoesModal({
  isOpen,
  produtoId,
  produtoTitulo,
  onClose,
  onSave,
}: SelecionarSessoesModalProps) {
  const [sessoes, setSessoes] = useState<SessaoEspecial[]>([]);
  const [sessoesSelecionadas, setSessoesSelecionadas] = useState<string[]>([]);
  const [ordens, setOrdens] = useState<{ [sessaoId: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && produtoId) {
      loadSessoes();
      loadSessoesProduto();
    }
  }, [isOpen, produtoId]);

  const loadSessoes = async () => {
    try {
      const { data, error } = await supabase
        .from("sessoes_especiais")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      setSessoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
    }
  };

  const loadSessoesProduto = async () => {
    try {
      const { data, error } = await supabase
        .from("produto_sessoes")
        .select("*, sessao:sessoes_especiais(*)")
        .eq("produto_id", produtoId);

      if (error) throw error;

      const sessoesIds = (data || []).map((ps: ProdutoSessao) => ps.sessao_id);
      const ordensMap: { [key: string]: number } = {};
      
      (data || []).forEach((ps: ProdutoSessao) => {
        ordensMap[ps.sessao_id] = ps.ordem;
      });

      setSessoesSelecionadas(sessoesIds);
      setOrdens(ordensMap);
    } catch (error) {
      console.error("Erro ao carregar sessões do produto:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSessao = (sessaoId: string) => {
    setSessoesSelecionadas(prev => 
      prev.includes(sessaoId)
        ? prev.filter(id => id !== sessaoId)
        : [...prev, sessaoId]
    );

    // Inicializa a ordem se for uma nova sessão
    if (!ordens[sessaoId]) {
      setOrdens(prev => ({
        ...prev,
        [sessaoId]: 0
      }));
    }
  };

  const handleOrdemChange = (sessaoId: string, ordem: number) => {
    setOrdens(prev => ({
      ...prev,
      [sessaoId]: Math.max(0, ordem)
    }));
  };

  const handleSave = async () => {
    if (!produtoId) return;

    setSaving(true);
    try {
      // Remove todas as sessões atuais do produto
      const { error: deleteError } = await supabase
        .from("produto_sessoes")
        .delete()
        .eq("produto_id", produtoId);

      if (deleteError) throw deleteError;

      // Adiciona as novas sessões selecionadas
      if (sessoesSelecionadas.length > 0) {
        const produtoSessoes = sessoesSelecionadas.map(sessaoId => ({
          produto_id: produtoId,
          sessao_id: sessaoId,
          ordem: ordens[sessaoId] || 0
        }));

        const { error: insertError } = await supabase
          .from("produto_sessoes")
          .insert(produtoSessoes);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar sessões:", error);
      alert("Erro ao salvar sessões do produto");
    } finally {
      setSaving(false);
    }
  };

  const getSessaoIcon = (slug: string) => {
    const IconComponent = sessaoIcons[slug] || sessaoIcons.default;
    return <IconComponent size={16} />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">Sessões do Produto</h2>
            <p className="text-sm text-gray-600 mt-1">{produtoTitulo}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Carregando sessões...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Selecione em quais sessões especiais este produto deve aparecer:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sessoes.map((sessao) => {
                  const isSelected = sessoesSelecionadas.includes(sessao.id);
                  const IconComponent = getSessaoIcon(sessao.slug);
                  
                  return (
                    <div
                      key={sessao.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                      onClick={() => toggleSessao(sessao.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: sessao.cor_fundo }}
                          >
                            {IconComponent}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {sessao.nome}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {sessao.descricao}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isSelected && (
                            <div className="bg-blue-500 text-white rounded-full p-1">
                              <Check size={16} />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Campo de ordem apenas para sessões selecionadas */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ordem de exibição:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={ordens[sessao.id] || 0}
                            onChange={(e) => handleOrdemChange(sessao.id, parseInt(e.target.value) || 0)}
                            className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs text-gray-500 ml-2">
                            (Menor número = aparece primeiro)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {sessoes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma sessão especial cadastrada.</p>
                  <p className="text-sm mt-1">
                    Configure as sessões especiais no painel administrativo.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  "Salvar Sessões"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}