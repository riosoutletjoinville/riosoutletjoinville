// src/app/dashboard/banners/BannersContent.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase, getAdminClient } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Banner {
  id: string;
  titulo: string;
  subtitulo?: string;
  imagem_url: string;
  link?: string;
  texto_botao?: string;
  ordem: number;
  ativo: boolean;
}

export default function BannersContent() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [bannerEditando, setBannerEditando] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    titulo: "",
    subtitulo: "",
    link: "",
    texto_botao: "Ver Coleção",
    ativo: true,
    ordem: 0
  });

  useEffect(() => {
    carregarBanners();
  }, []);

  async function carregarBanners() {
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error("Erro ao carregar banners:", error);
      toast.error("Erro ao carregar banners");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploading(true);

    try {
      const adminClient = getAdminClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;

      const { data, error } = await adminClient.storage
        .from("banners")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = adminClient.storage
        .from("banners")
        .getPublicUrl(fileName);

      setBannerEditando((prev) => ({
        ...prev!,
        imagem_url: publicUrl,
      }));
      
      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!bannerEditando?.imagem_url) {
      toast.error("Selecione uma imagem para o banner");
      return;
    }

    try {
      const adminClient = getAdminClient();

      const bannerData = {
        titulo: formData.titulo,
        subtitulo: formData.subtitulo,
        link: formData.link,
        texto_botao: formData.texto_botao,
        ativo: formData.ativo,
        ordem: formData.ordem,
        imagem_url: bannerEditando.imagem_url,
      };

      if (bannerEditando?.id) {
        const { error } = await adminClient
          .from("banners")
          .update(bannerData)
          .eq("id", bannerEditando.id);

        if (error) throw error;
        toast.success("Banner atualizado com sucesso!");
      } else {
        const { error } = await adminClient
          .from("banners")
          .insert([bannerData]);

        if (error) throw error;
        toast.success("Banner criado com sucesso!");
      }

      setModalAberto(false);
      setBannerEditando(null);
      await carregarBanners();
    } catch (error) {
      console.error("Erro ao salvar banner:", error);
      toast.error("Erro ao salvar banner");
    }
  }

  async function handleDelete(banner: Banner) {
    if (!confirm(`Tem certeza que deseja excluir o banner "${banner.titulo}"?`)) {
      return;
    }

    try {
      const adminClient = getAdminClient();

      const imagePath = banner.imagem_url.split("/").pop();
      if (imagePath) {
        await adminClient.storage
          .from("banners")
          .remove([imagePath]);
      }

      const { error } = await adminClient
        .from("banners")
        .delete()
        .eq("id", banner.id);

      if (error) throw error;

      toast.success("Banner excluído com sucesso!");
      await carregarBanners();
    } catch (error) {
      console.error("Erro ao excluir banner:", error);
      toast.error("Erro ao excluir banner");
    }
  }

  async function handleDragEnd(result: any) {
    if (!result.destination || salvandoOrdem) return;

    const items = Array.from(banners);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Atualizar ordem localmente com novos números
    const novosBanners = items.map((item, index) => ({
      ...item,
      ordem: index
    }));
    
    setBanners(novosBanners);
    setSalvandoOrdem(true);
    
    // Mostrar toast de salvando
    const toastId = toast.loading("Salvando nova ordem...");

    try {
      const adminClient = getAdminClient();
      
      // Atualizar cada banner com sua nova ordem
      for (const banner of novosBanners) {
        const { error } = await adminClient
          .from("banners")
          .update({ ordem: banner.ordem })
          .eq("id", banner.id);

        if (error) throw error;
      }
      
      // Atualizar toast para sucesso
      toast.success(`Ordem atualizada! Banner movido da posição ${result.source.index + 1} para ${result.destination.index + 1}`, {
        id: toastId,
        duration: 3000
      });
      
    } catch (error) {
      console.error("Erro ao reordenar banners:", error);
      toast.error("Erro ao salvar ordem. Recarregando...", {
        id: toastId,
        duration: 4000
      });
      // Recarregar estado original em caso de erro
      await carregarBanners();
    } finally {
      setSalvandoOrdem(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Banners</h1>
        <button
          onClick={() => {
            setBannerEditando(null);
            setFormData({
              titulo: "",
              subtitulo: "",
              link: "",
              texto_botao: "Ver Coleção",
              ativo: true,
              ordem: banners.length,
            });
            setModalAberto(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Novo Banner
        </button>
      </div>

      {/* Lista de banners com drag and drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="banners">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {banners.map((banner, index) => (
                <Draggable
                  key={banner.id}
                  draggableId={banner.id}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white rounded-lg shadow border p-4 flex items-center gap-4 transition-all ${
                        snapshot.isDragging ? "shadow-lg ring-2 ring-blue-500 opacity-50" : ""
                      } ${salvandoOrdem ? "pointer-events-none opacity-60" : ""}`}
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-move text-gray-400 hover:text-gray-600 p-2"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>

                      <div className="w-32 h-20 relative flex-shrink-0">
                        <Image
                          src={banner.imagem_url}
                          alt={banner.titulo}
                          fill
                          className="object-cover rounded"
                        />
                      </div>

                      <div className="flex-grow">
                        <h3 className="font-semibold">{banner.titulo}</h3>
                        {banner.subtitulo && (
                          <p className="text-sm text-gray-600">{banner.subtitulo}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            banner.ativo 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {banner.ativo ? "Ativo" : "Inativo"}
                          </span>
                          <span className="text-gray-500 text-xs">
                            Ordem: {banner.ordem}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setBannerEditando(banner);
                            setFormData({
                              titulo: banner.titulo,
                              subtitulo: banner.subtitulo || "",
                              link: banner.link || "",
                              texto_botao: banner.texto_botao || "Ver Coleção",
                              ativo: banner.ativo,
                              ordem: banner.ordem,
                            });
                            setModalAberto(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(banner)}
                          className="text-red-600 hover:text-red-800 px-3 py-1 rounded text-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {banners.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhum banner cadastrado</p>
          <button
            onClick={() => setModalAberto(true)}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Criar primeiro banner
          </button>
        </div>
      )}

      {/* Modal de criação/edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {bannerEditando ? "Editar Banner" : "Novo Banner"}
              </h2>

              {/* Upload de imagem */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Imagem do Banner *
                </label>
                
                {bannerEditando?.imagem_url ? (
                  <div className="relative">
                    <div className="relative h-48 w-full mb-4">
                      <Image
                        src={bannerEditando.imagem_url}
                        alt="Preview"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setBannerEditando({ ...bannerEditando, imagem_url: "" })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="banner-image"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="banner-image"
                      className="cursor-pointer inline-flex items-center justify-center"
                    >
                      {uploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      ) : (
                        <div>
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span className="mt-2 block text-sm text-gray-600">
                            Clique para fazer upload da imagem
                          </span>
                          <span className="text-xs text-gray-500">
                            PNG, JPG até 5MB
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Campos do formulário */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Black November"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={formData.subtitulo}
                    onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Comece a economizar em grande estilo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Link (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: /categoria/promocoes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Texto do Botão
                  </label>
                  <input
                    type="text"
                    value={formData.texto_botao}
                    onChange={(e) => setFormData({ ...formData, texto_botao: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Campo ORDEM - AGORA VISÍVEL */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Número da Ordem
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={formData.ordem}
                    onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0, 1, 2, 3..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Defina a posição do banner. Números menores aparecem primeiro.
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                    Banner ativo
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!bannerEditando?.imagem_url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {bannerEditando?.id ? "Atualizar" : "Criar"} Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}