// app/dashboard/sessoes/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Sun,
  Snowflake,
  Star,
  TrendingUp,
  Zap,
  Package,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import SessaoModal from "@/components/dashboard/SessaoModal";

interface SessaoEspecial {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  ativo: boolean;
  ordem: number;
  cor_fundo: string;
  cor_texto: string;
  created_at: string;
  updated_at: string;
}

// Ícones para cada tipo de sessão
const sessaoIcons: { [key: string]: any } = {
  lancamentos: Zap,
  promocoes: TrendingUp,
  "mais-vendidos": Star,
  "colecao-verao": Sun,
  "colecao-inverno": Snowflake,
  tendencias: TrendingUp,
  default: Star,
};

export default function SessoesContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sessoes, setSessoes] = useState<SessaoEspecial[]>([]);
  const [loadingSessoes, setLoadingSessoes] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSessao, setEditingSessao] = useState<SessaoEspecial | null>(
    null,
  );
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadSessoes();
    }
  }, [user]);

  const loadSessoes = async () => {
    try {
      setLoadingSessoes(true);
      const { data, error } = await supabase
        .from("sessoes_especiais")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      setSessoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
      showNotification("error", "Erro ao carregar sessões");
    } finally {
      setLoadingSessoes(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelete = async (sessao: SessaoEspecial) => {
    try {
      // Verificar se existem produtos vinculados a esta sessão
      const { count, error: countError } = await supabase
        .from("produto_sessoes")
        .select("*", { count: "exact", head: true })
        .eq("sessao_id", sessao.id);

      if (countError) throw countError;

      if (count && count > 0) {
        const result = await Swal.fire({
          title: "Atenção!",
          html: `
            <div class="text-left">
              <p>Esta sessão possui <strong>${count} produto(s)</strong> vinculado(s).</p>
              <p class="mt-2">O que deseja fazer?</p>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: "Excluir mesmo assim",
          denyButtonText: "Manter produtos",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#EF4444",
          denyButtonColor: "#3B82F6",
          reverseButtons: true,
        });

        if (result.isDenied) {
          return; // Mantém os produtos
        }

        if (!result.isConfirmed) {
          return; // Cancelou
        }

        // Se confirmou, exclui os vínculos primeiro
        const { error: deleteVinculosError } = await supabase
          .from("produto_sessoes")
          .delete()
          .eq("sessao_id", sessao.id);

        if (deleteVinculosError) throw deleteVinculosError;
      } else {
        // Confirmação direta se não houver produtos
        const result = await Swal.fire({
          title: "Excluir Sessão?",
          text: `Tem certeza que deseja excluir a sessão "${sessao.nome}"?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sim, excluir",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#EF4444",
        });

        if (!result.isConfirmed) return;
      }

      // Excluir a sessão
      const { error } = await supabase
        .from("sessoes_especiais")
        .delete()
        .eq("id", sessao.id);

      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Excluída!",
        text: "Sessão excluída com sucesso.",
        timer: 1500,
        showConfirmButton: false,
      });

      loadSessoes();
      showNotification("success", "Sessão excluída com sucesso");
    } catch (error) {
      console.error("Erro ao excluir sessão:", error);
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Não foi possível excluir a sessão.",
      });
    }
  };

  const handleToggleAtivo = async (sessao: SessaoEspecial) => {
    try {
      const { error } = await supabase
        .from("sessoes_especiais")
        .update({ ativo: !sessao.ativo })
        .eq("id", sessao.id);

      if (error) throw error;

      loadSessoes();
      showNotification(
        "success",
        `Sessão ${!sessao.ativo ? "ativada" : "desativada"} com sucesso`,
      );
    } catch (error) {
      console.error("Erro ao alterar status da sessão:", error);
      showNotification("error", "Erro ao alterar status da sessão");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    try {
      const sessaoAtual = sessoes[index];
      const sessaoAnterior = sessoes[index - 1];

      // Trocar as ordens
      const updates = [
        supabase
          .from("sessoes_especiais")
          .update({ ordem: sessaoAnterior.ordem })
          .eq("id", sessaoAtual.id),
        supabase
          .from("sessoes_especiais")
          .update({ ordem: sessaoAtual.ordem })
          .eq("id", sessaoAnterior.id),
      ];

      await Promise.all(updates);
      loadSessoes();
    } catch (error) {
      console.error("Erro ao reordenar sessões:", error);
      showNotification("error", "Erro ao reordenar sessões");
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === sessoes.length - 1) return;

    try {
      const sessaoAtual = sessoes[index];
      const sessaoProxima = sessoes[index + 1];

      // Trocar as ordens
      const updates = [
        supabase
          .from("sessoes_especiais")
          .update({ ordem: sessaoProxima.ordem })
          .eq("id", sessaoAtual.id),
        supabase
          .from("sessoes_especiais")
          .update({ ordem: sessaoAtual.ordem })
          .eq("id", sessaoProxima.id),
      ];

      await Promise.all(updates);
      loadSessoes();
    } catch (error) {
      console.error("Erro ao reordenar sessões:", error);
      showNotification("error", "Erro ao reordenar sessões");
    }
  };

  const getSessaoIcon = (slug: string) => {
    const IconComponent = sessaoIcons[slug] || sessaoIcons.default;
    return <IconComponent size={20} />;
  };

  if (loading || loadingSessoes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Notificação */}
      {notification && (
        <div
          className={`fixed top-4 right-4 flex items-center p-4 rounded-md shadow-md z-50 animate-fadeIn ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <Check size={20} className="mr-2" />
          ) : (
            <AlertCircle size={20} className="mr-2" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Package className="mr-3" size={32} />
            Sessões Especiais
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie as sessões especiais da sua loja
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSessao(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center transition-colors shadow-md"
        >
          <Plus size={20} className="mr-2" />
          Nova Sessão
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total de Sessões</p>
              <p className="text-2xl font-bold text-gray-800">
                {sessoes.length}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Sessões Ativas</p>
              <p className="text-2xl font-bold text-gray-800">
                {sessoes.filter((s) => s.ativo).length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Eye className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-gray-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Sessões Inativas</p>
              <p className="text-2xl font-bold text-gray-800">
                {sessoes.filter((s) => !s.ativo).length}
              </p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full">
              <EyeOff className="text-gray-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de sessões */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessoes.map((sessao, index) => {
                const IconComponent = getSessaoIcon(sessao.slug);

                return (
                  <tr
                    key={sessao.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      !sessao.ativo ? "bg-gray-50 opacity-75" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 w-8">
                          {sessao.ordem}
                        </span>
                        <div className="flex flex-col">
                          <button
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            disabled={index === sessoes.length - 1}
                            className="text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white mr-3"
                          style={{
                            backgroundColor: sessao.cor_fundo,
                            color: sessao.cor_texto,
                          }}
                        >
                          {IconComponent}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {sessao.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            Criado em:{" "}
                            {new Date(sessao.created_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {sessao.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                        {sessao.descricao || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: sessao.cor_fundo }}
                          title="Cor de fundo"
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: sessao.cor_texto }}
                          title="Cor do texto"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sessao.ativo
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {sessao.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleAtivo(sessao)}
                          className={`p-1 rounded transition-colors ${
                            sessao.ativo
                              ? "text-orange-600 hover:bg-orange-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={sessao.ativo ? "Desativar" : "Ativar"}
                        >
                          {sessao.ativo ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingSessao(sessao);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(sessao)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sessoes.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              Nenhuma sessão cadastrada
            </p>
            <p className="text-gray-400 mt-1">
              Comece adicionando sua primeira sessão especial
            </p>
            <button
              onClick={() => {
                setEditingSessao(null);
                setShowModal(true);
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors"
            >
              <Plus size={18} className="mr-2" />
              Nova Sessão
            </button>
          </div>
        )}
      </div>

      {/* Modal para criar/editar sessão */}
      {showModal && (
        <SessaoModal
          isOpen={showModal}
          sessao={editingSessao}
          onClose={() => {
            setShowModal(false);
            setEditingSessao(null);
          }}
          onSave={() => {
            loadSessoes();
            setShowModal(false);
            setEditingSessao(null);
            showNotification(
              "success",
              editingSessao
                ? "Sessão atualizada com sucesso"
                : "Sessão criada com sucesso",
            );
          }}
        />
      )}
    </div>
  );
}