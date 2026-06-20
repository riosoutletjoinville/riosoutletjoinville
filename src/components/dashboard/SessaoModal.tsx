// components/dashboard/SessaoModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Check, AlertCircle } from "lucide-react";
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

interface SessaoModalProps {
  isOpen: boolean;
  sessao: SessaoEspecial | null;
  onClose: () => void;
  onSave: () => void;
}

// Cores predefinidas para facilitar a escolha
const coresPredefinidas = {
  fundo: [
    { nome: "Azul", valor: "#3B82F6" },
    { nome: "Vermelho", valor: "#EF4444" },
    { nome: "Verde", valor: "#10B981" },
    { nome: "Amarelo", valor: "#F59E0B" },
    { nome: "Roxo", valor: "#8B5CF6" },
    { nome: "Rosa", valor: "#EC4899" },
    { nome: "Cinza", valor: "#6B7280" },
    { nome: "Preto", valor: "#1F2937" },
  ],
  texto: [
    { nome: "Branco", valor: "#FFFFFF" },
    { nome: "Preto", valor: "#000000" },
    { nome: "Cinza Claro", valor: "#F3F4F6" },
    { nome: "Cinza Escuro", valor: "#374151" },
  ],
};

export default function SessaoModal({
  isOpen,
  sessao,
  onClose,
  onSave,
}: SessaoModalProps) {
  const [formData, setFormData] = useState({
    nome: "",
    slug: "",
    descricao: "",
    ativo: true,
    ordem: 0,
    cor_fundo: "#3B82F6",
    cor_texto: "#FFFFFF",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (sessao) {
      setFormData({
        nome: sessao.nome || "",
        slug: sessao.slug || "",
        descricao: sessao.descricao || "",
        ativo: sessao.ativo !== undefined ? sessao.ativo : true,
        ordem: sessao.ordem || 0,
        cor_fundo: sessao.cor_fundo || "#3B82F6",
        cor_texto: sessao.cor_texto || "#FFFFFF",
      });
      setSlugManuallyEdited(true);
    } else {
      // Reset para nova sessão
      setFormData({
        nome: "",
        slug: "",
        descricao: "",
        ativo: true,
        ordem: 0,
        cor_fundo: "#3B82F6",
        cor_texto: "#FFFFFF",
      });
      setSlugManuallyEdited(false);
    }
    setError(null);
  }, [sessao, isOpen]);

  // Gerar slug automaticamente a partir do nome
  const gerarSlug = (texto: string): string => {
    return texto
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoNome = e.target.value;
    setFormData((prev) => ({
      ...prev,
      nome: novoNome,
    }));

    // Atualizar slug apenas se não foi editado manualmente
    if (!slugManuallyEdited) {
      setFormData((prev) => ({
        ...prev,
        slug: gerarSlug(novoNome),
      }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novoSlug = gerarSlug(e.target.value);
    setFormData((prev) => ({ ...prev, slug: novoSlug }));
    setSlugManuallyEdited(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validar campos obrigatórios
      if (!formData.nome.trim()) {
        throw new Error("O nome da sessão é obrigatório");
      }
      if (!formData.slug.trim()) {
        throw new Error("O slug é obrigatório");
      }

      // Verificar se o slug já existe (apenas se for uma nova sessão ou se o slug foi alterado)
      let query = supabase
        .from("sessoes_especiais")
        .select("id")
        .eq("slug", formData.slug);

      if (sessao?.id) {
        query = query.neq("id", sessao.id);
      }

      const { data: slugExists, error: slugError } = await query.maybeSingle();

      if (slugError) throw slugError;

      if (slugExists) {
        throw new Error(
          "Este slug já está em uso. Por favor, escolha outro.",
        );
      }

      // Preparar dados para salvar
      const dadosParaSalvar = {
        ...formData,
        // Garantir que a ordem seja um número
        ordem: Number(formData.ordem) || 0,
      };

      let result;
      if (sessao?.id) {
        // Atualizar sessão existente
        result = await supabase
          .from("sessoes_especiais")
          .update(dadosParaSalvar)
          .eq("id", sessao.id);
      } else {
        // Inserir nova sessão
        result = await supabase
          .from("sessoes_especiais")
          .insert([dadosParaSalvar]);
      }

      const { error } = result;

      if (error) throw error;

      onSave();
    } catch (error: any) {
      console.error("Erro ao salvar sessão:", error);
      setError(error.message || "Erro ao salvar sessão");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {sessao ? "Editar Sessão" : "Nova Sessão"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {sessao
                ? "Altere as informações da sessão especial"
                : "Crie uma nova sessão especial para destacar produtos"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
            <AlertCircle size={20} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Sessão *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={handleNomeChange}
              placeholder="Ex: Lançamentos, Promoções, Mais Vendidos..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Nome que aparecerá para os clientes
            </p>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={handleSlugChange}
              placeholder="ex: lancamentos"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              URL amigável para a sessão. Use apenas letras minúsculas, números e hífens.
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descricao: e.target.value }))
              }
              rows={3}
              placeholder="Breve descrição da sessão..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Ordem */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordem de Exibição
            </label>
            <input
              type="number"
              min="0"
              value={formData.ordem}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  ordem: parseInt(e.target.value) || 0,
                }))
              }
              className="w-32 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Menor número = aparece primeiro
            </p>
          </div>

          {/* Cores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cor de Fundo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor de Fundo
              </label>
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="color"
                  value={formData.cor_fundo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cor_fundo: e.target.value,
                    }))
                  }
                  className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.cor_fundo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cor_fundo: e.target.value,
                    }))
                  }
                  placeholder="#RRGGBB"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm uppercase"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {coresPredefinidas.fundo.map((cor) => (
                  <button
                    key={cor.valor}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, cor_fundo: cor.valor }))
                    }
                    className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: cor.valor }}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>

            {/* Cor do Texto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor do Texto
              </label>
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="color"
                  value={formData.cor_texto}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cor_texto: e.target.value,
                    }))
                  }
                  className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.cor_texto}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cor_texto: e.target.value,
                    }))
                  }
                  placeholder="#RRGGBB"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm uppercase"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {coresPredefinidas.texto.map((cor) => (
                  <button
                    key={cor.valor}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, cor_texto: cor.valor }))
                    }
                    className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: cor.valor }}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Prévia */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Prévia:</h4>
            <div
              className="inline-flex items-center px-4 py-2 rounded-full"
              style={{
                backgroundColor: formData.cor_fundo,
                color: formData.cor_texto,
              }}
            >
              <span className="font-medium">{formData.nome || "Nome da Sessão"}</span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, ativo: e.target.checked }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
              Sessão ativa (visível no site)
            </label>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Check size={18} className="mr-2" />
                  {sessao ? "Atualizar Sessão" : "Criar Sessão"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}