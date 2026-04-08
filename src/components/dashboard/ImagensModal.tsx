// Updated ImagensModal.tsx
// components/dashboard/ImagensModal.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase, uploadImage, deleteImage } from "@/lib/supabase";
import { X, Upload, Trash2, Star, Palette } from "lucide-react";

interface ProdutoImagem {
  id: string;
  url: string;
  ordem: number;
  principal: boolean;
  cor?: { id: string; nome: string; codigo_hex: string };  // NEW: Include color info
}

interface ImagensModalProps {
  produtoId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ImagensModal({
  produtoId,
  onClose,
  onSave,
}: ImagensModalProps) {
  const [imagens, setImagens] = useState<ProdutoImagem[]>([]);
  const [cores, setCores] = useState<{ id: string; nome: string; codigo_hex: string }[]>([]);  // NEW: Load colors
  const [selectedCorId, setSelectedCorId] = useState<string | null>(null);  // NEW: Selected color for upload
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [produtoId]);

  const loadData = async () => {
    try {
      // Load images with color join
      const { data: imagensData, error: imagensError } = await supabase
        .from("produto_imagens")
        .select(`
          *,
          cor:cores(id, nome, codigo_hex)
        `)
        .eq("produto_id", produtoId)
        .order("ordem", { ascending: true });

      if (imagensError) throw imagensError;

      // Load all colors for the product (or global colors)
      const { data: coresData, error: coresError } = await supabase
        .from("cores")
        .select("*")
        .order("nome", { ascending: true });

      if (coresError) throw coresError;

      setImagens(imagensData || []);
      setCores(coresData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadImagens = async (corId?: string | null) => {
    try {
      let query = supabase
        .from("produto_imagens")
        .select(`
          *,
          cor:cores(id, nome, codigo_hex)
        `)
        .eq("produto_id", produtoId)
        .order("ordem", { ascending: true });

      if (corId) {
        query = query.eq("cor_id", corId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setImagens(data || []);
    } catch (error) {
      console.error("Erro ao carregar imagens:", error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Verifica se o arquivo é uma imagem
        if (!file.type.startsWith("image/")) {
          alert("Por favor, selecione apenas arquivos de imagem");
          continue;
        }

        // Verifica o tamanho do arquivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("A imagem deve ter no máximo 5MB");
          continue;
        }

        const publicUrl = await uploadImage(file, produtoId);

        const insertData = {
          produto_id: produtoId,
          cor_id: selectedCorId || null,  // NEW: Associate with selected color
          url: publicUrl,
          ordem: imagens.length + i,
          principal: imagens.length === 0 && !selectedCorId, // Principal only if no color selected
        };

        const { error } = await supabase.from("produto_imagens").insert([insertData]);

        if (error) {
          console.error("Erro ao salvar imagem no banco:", error);
          continue;
        }
      }

      await loadImagens(selectedCorId);  // Reload for selected color
      onSave();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert(
        "Erro ao fazer upload da imagem. Verifique se o bucket está configurado."
      );
    } finally {
      setUploading(false);
      // Limpa o input de arquivo
      e.target.value = "";
    }
  };

  const handleDelete = async (imagemId: string, imageUrl: string) => {
    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;

    try {
      // Deleta do storage
      await deleteImage(imageUrl);

      // Deleta do banco
      const { error } = await supabase
        .from("produto_imagens")
        .delete()
        .eq("id", imagemId);

      if (error) throw error;

      await loadImagens(selectedCorId);
      onSave();
    } catch (error) {
      console.error("Erro ao excluir imagem:", error);
    }
  };

  const setAsPrincipal = async (imagemId: string) => {
    try {
      // Remove principal de todas as imagens da mesma cor (or global if no cor)
      let query = supabase
        .from("produto_imagens")
        .update({ principal: false })
        .eq("produto_id", produtoId);

      if (selectedCorId) {
        query = query.eq("cor_id", selectedCorId);
      }

      await query;

      // Define a nova principal
      const { error } = await supabase
        .from("produto_imagens")
        .update({ principal: true })
        .eq("id", imagemId);

      if (error) throw error;

      await loadImagens(selectedCorId);
      onSave();
    } catch (error) {
      console.error("Erro ao definir imagem principal:", error);
    }
  };

  const reorderImages = async (fromIndex: number, toIndex: number) => {
    const newImagens = [...imagens];
    const [moved] = newImagens.splice(fromIndex, 1);
    newImagens.splice(toIndex, 0, moved);

    // Atualiza a ordem no banco
    const updates = newImagens.map((img, index) => ({
      id: img.id,
      ordem: index,
    }));

    for (const update of updates) {
      const { error } = await supabase
        .from("produto_imagens")
        .update({ ordem: update.ordem })
        .eq("id", update.id);

      if (error) throw error;
    }

    setImagens(newImagens);
    onSave();
  };

  const handleColorChange = (corId: string | null) => {
    setSelectedCorId(corId);
    loadImagens(corId);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Gerenciar Imagens</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* NEW: Color Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Cor
          </label>
          <select
            value={selectedCorId || ""}
            onChange={(e) => handleColorChange(e.target.value || null)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Todas as Cores / Geral</option>
            {cores.map((cor) => (
              <option key={cor.id} value={cor.id}>
                {cor.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Upload de imagens */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adicionar Imagens {selectedCorId && `(para cor selecionada)`}
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {uploading && (
            <p className="text-sm text-gray-500 mt-2">Fazendo upload...</p>
          )}
        </div>

        {/* NEW: Color Indicators in Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {imagens.map((imagem, index) => (
            <div
              key={imagem.id}
              className="relative group border rounded-lg p-2"
            >
              <img
                src={imagem.url}
                alt={`Imagem ${index + 1} ${imagem.cor?.nome || 'Geral'}`}
                className="w-full h-48 object-cover rounded"
              />

              {/* NEW: Color Badge */}
              {imagem.cor && (
                <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-medium shadow">
                  <Palette size={12} className="inline mr-1" />
                  {imagem.cor.nome}
                </div>
              )}

              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAsPrincipal(imagem.id)}
                    className={`p-2 rounded-full ${
                      imagem.principal
                        ? "bg-yellow-500 text-white"
                        : "bg-white text-gray-700 hover:bg-yellow-50"
                    }`}
                    title={
                      imagem.principal
                        ? "Imagem principal"
                        : "Definir como principal"
                    }
                  >
                    <Star
                      size={16}
                      fill={imagem.principal ? "currentColor" : "none"}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(imagem.id, imagem.url)}
                    className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50"
                    title="Excluir imagem"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Indicador de imagem principal */}
              {imagem.principal && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
                  Principal
                </div>
              )}

              {/* Controles de ordenação */}
              <div className="flex justify-between mt-2">
                <button
                  onClick={() => reorderImages(index, index - 1)}
                  disabled={index === 0}
                  className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  ↑
                </button>
                <span className="text-sm text-gray-500">#{index + 1}</span>
                <button
                  onClick={() => reorderImages(index, index + 1)}
                  disabled={index === imagens.length - 1}
                  className="text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>

        {imagens.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Nenhuma imagem cadastrada {selectedCorId && `para esta cor`}</p>
            <p className="text-sm">Faça upload de imagens para este produto</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
