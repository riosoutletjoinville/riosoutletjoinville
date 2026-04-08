// app/components/dashboard/VariacoesModal.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  X,
  Plus,
  Trash2,
  Edit,
  Minus,
  BarChart3,
  Download,
} from "lucide-react";
import Swal from "sweetalert2";

interface ProdutoVariacao {
  id: string;
  tamanho_id: string;
  cor_id: string;
  estoque: number;
  preco: number;
  codigo_ean: string;
  sku: string;
  tamanho: { nome: string };
  cor: { nome: string; codigo_hex: string };
  produto_id: string;
}

interface Tamanho {
  id: string;
  nome: string;
  ordem: number;
  created_at: string;
}

interface Cor {
  id: string;
  nome: string;
  codigo_hex: string;
  created_at: string;
}

interface VariacoesModalProps {
  produtoId: string;
  onClose: () => void;
  onSave: () => void;
}

interface BaixaEstoque {
  id: string;
  variacao_id: string;
  produto_id: string;
  quantidade: number;
  motivo: string;
  observacao: string;
  preco_unitario: number;
  data_baixa: string;
  created_at: string;
  usuario_id: string;
  usuario_nome?: string;
  usuario_email?: string;
  variacao: {
    tamanho: { nome: string };
    cor: { nome: string; codigo_hex: string };
  };
  usuario?: {
    nome?: string;
    email?: string;
  };
}

interface BaixaEstoqueData {
  variacao_id: string;
  produto_id: string;
  quantidade: number;
  motivo: string;
  observacao: string;
  preco_unitario: number;
  data_baixa: string;
  usuario_id?: string;
}

import { useAuth } from "@/contexts/AuthContext";

export default function VariacoesModal({
  produtoId,
  onClose,
  onSave,
}: VariacoesModalProps) {
  const { user } = useAuth();
  const [variacoes, setVariacoes] = useState<ProdutoVariacao[]>([]);
  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingVariacao, setEditingVariacao] =
    useState<ProdutoVariacao | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [selectedVariacao, setSelectedVariacao] =
    useState<ProdutoVariacao | null>(null);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [baixas, setBaixas] = useState<BaixaEstoque[]>([]);
  const [filtrosRelatorio, setFiltrosRelatorio] = useState({
    search: "",
    motivo: "all",
    startDate: "",
    endDate: "",
  });

  const showAlert = (
    title: string,
    message: string,
    icon: "success" | "error" | "warning" | "info" = "info"
  ) => {
    Swal.fire({
      title,
      text: message,
      icon,
      confirmButtonText: "OK",
      confirmButtonColor: "#2563eb",
    });
  };

  const loadData = useCallback(async () => {
    try {
      const [variacoesRes, tamanhosRes, coresRes] = await Promise.all([
        supabase
          .from("produto_variacoes")
          .select(
            `
            *,
            tamanho:tamanhos(*),
            cor:cores(*)
          `
          )
          .eq("produto_id", produtoId)
          .order("created_at", { ascending: true }),
        supabase
          .from("tamanhos")
          .select("*")
          .order("ordem", { ascending: true }),
        supabase.from("cores").select("*").order("nome", { ascending: true }),
      ]);

      if (variacoesRes.error) throw variacoesRes.error;
      if (tamanhosRes.error) throw tamanhosRes.error;
      if (coresRes.error) throw coresRes.error;

      setVariacoes(variacoesRes.data || []);
      setTamanhos(tamanhosRes.data || []);
      setCores(coresRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      showAlert(
        "Erro",
        "Não foi possível carregar os dados das variações",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [produtoId]);

  const loadBaixas = useCallback(async () => {
    try {
      let query = supabase
        .from("baixas_estoque")
        .select(
          `
        *,
        variacao:produto_variacoes(
          tamanho:tamanhos(nome),
          cor:cores(nome, codigo_hex)
        )
      `
        )
        .eq("produto_id", produtoId)
        .order("data_baixa", { ascending: false });

      if (filtrosRelatorio.motivo !== "all") {
        query = query.eq("motivo", filtrosRelatorio.motivo);
      }

      if (filtrosRelatorio.startDate) {
        query = query.gte("data_baixa", filtrosRelatorio.startDate);
      }

      if (filtrosRelatorio.endDate) {
        query = query.lte("data_baixa", `${filtrosRelatorio.endDate}T23:59:59`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBaixas(data || []);
    } catch (error) {
      console.error("Erro ao carregar baixas:", error);
      showAlert(
        "Erro",
        "Não foi possível carregar o relatório de baixas",
        "error"
      );
    }
  }, [produtoId, filtrosRelatorio]);

  const getUserName = (baixa: BaixaEstoque) => {
    return (
      baixa.usuario?.nome ||
      baixa.usuario?.email ||
      baixa.usuario_id ||
      "Sistema"
    );
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (showRelatorio) {
      loadBaixas();
    }
  }, [showRelatorio, loadBaixas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const corId = formData.get("cor_id") as string;

    const variacaoData = {
      produto_id: produtoId,
      tamanho_id: formData.get("tamanho_id") as string,
      cor_id: corId === "" ? null : corId,
      estoque: parseInt(formData.get("estoque") as string),
      preco: parseFloat(formData.get("preco") as string),
      codigo_ean: formData.get("codigo_ean") as string,
      sku: formData.get("sku") as string,
    };

    try {
      if (editingVariacao) {
        const { error } = await supabase
          .from("produto_variacoes")
          .update(variacaoData)
          .eq("id", editingVariacao.id);

        if (error) throw error;
        showAlert("Sucesso", "Variação atualizada com sucesso!", "success");
      } else {
        const { error } = await supabase
          .from("produto_variacoes")
          .insert([variacaoData]);

        if (error) throw error;
        showAlert("Sucesso", "Variação criada com sucesso!", "success");
      }

      setShowForm(false);
      setEditingVariacao(null);
      await loadData();
      onSave();
    } catch (error) {
      console.error("Erro ao salvar variação:", error);
      showAlert("Erro", "Não foi possível salvar a variação", "error");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: "Esta ação não pode be desfeita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from("produto_variacoes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      await loadData();
      onSave();
      showAlert("Excluído", "Variação excluída com sucesso!", "success");
    } catch (error) {
      console.error("Erro ao excluir variação:", error);
      showAlert("Erro", "Não foi possível excluir a variação", "error");
    }
  };

  const handleBaixaEstoque = async (motivo: "venda" | "defeito" | "doacao") => {
    if (!editingVariacao) return;

    const form = document.querySelector("form");
    const formData = new FormData(form as HTMLFormElement);
    const quantidade = parseInt(formData.get("estoque") as string);

    if (quantidade < 0) {
      showAlert("Atenção", "Quantidade não pode ser negativa", "warning");
      return;
    }

    if (!quantidade || quantidade <= 0) {
      showAlert(
        "Atenção",
        "Digite uma quantidade válida para baixa",
        "warning"
      );
      return;
    }

    if (quantidade > editingVariacao.estoque) {
      showAlert(
        "Atenção",
        "Quantidade não pode ser maior que o estoque atual",
        "warning"
      );
      return;
    }

    const motivoText = {
      venda: "venda",
      defeito: "defeito de fábrica/uso",
      doacao: "doação/brinde",
    }[motivo];

    const result = await Swal.fire({
      title: `Confirmar baixa de estoque?`,
      html: `Deseja registrar a baixa de <b>${quantidade}</b> unidades por <b>${motivoText}</b>?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, confirmar!",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("nome, email")
        .eq("id", user?.id)
        .single();

      let usuarioNome = user?.email || "Usuário";
      let usuarioEmail = user?.email || "";

      if (!userError && userData) {
        usuarioNome = userData.nome || usuarioNome;
        usuarioEmail = userData.email || usuarioEmail;
      }

      const baixaData = {
        variacao_id: editingVariacao.id,
        produto_id: editingVariacao.produto_id,
        quantidade,
        motivo,
        observacao: `Baixa registrada no editor de variações - ${motivoText}`,
        preco_unitario: editingVariacao.preco,
        data_baixa: new Date().toISOString(),
        usuario_id: user?.id || "",
        usuario_nome: usuarioNome,
        usuario_email: usuarioEmail,
      };

      // Registrar a baixa
      const { error: baixaError } = await supabase
        .from("baixas_estoque")
        .insert([baixaData]);

      if (baixaError) throw baixaError;

      // Atualizar o estoque
      const novoEstoque = editingVariacao.estoque - quantidade;
      const { error: updateError } = await supabase
        .from("produto_variacoes")
        .update({ estoque: novoEstoque })
        .eq("id", editingVariacao.id);

      if (updateError) throw updateError;

      showAlert(
        "Sucesso",
        `Baixa de ${quantidade} unidades registrada por ${motivoText}`,
        "success"
      );
      setShowForm(false);
      setEditingVariacao(null);
      await loadData();
      onSave();
    } catch (error) {
      console.error("Erro ao registrar baixa:", error);
      showAlert("Erro", "Erro ao registrar baixa", "error");
    }
  };

  const handleBaixaEstoqueModal = async (baixaData: BaixaEstoqueData) => {
    try {
      // Busque os dados reais do usuário logado
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("nome, email")
        .eq("id", user?.id)
        .single();

      let usuarioNome = user?.email || "Usuário";
      let usuarioEmail = user?.email || "";

      if (!userError && userData) {
        usuarioNome = userData.nome || usuarioNome;
        usuarioEmail = userData.email || usuarioEmail;
      }

      const baixaDataComUsuario = {
        ...baixaData,
        usuario_id: user?.id || "",
        usuario_nome: usuarioNome,
        usuario_email: usuarioEmail,
      };

      // Registrar a baixa no histórico
      const { error: baixaError } = await supabase
        .from("baixas_estoque")
        .insert([baixaDataComUsuario]);

      if (baixaError) throw baixaError;

      // Atualizar o estoque da variação
      const { error: updateError } = await supabase
        .from("produto_variacoes")
        .update({ estoque: selectedVariacao!.estoque - baixaData.quantidade })
        .eq("id", selectedVariacao!.id);

      if (updateError) throw updateError;

      setShowBaixaModal(false);
      setSelectedVariacao(null);
      await loadData();
      onSave();
      showAlert(
        "Sucesso",
        "Baixa de estoque registrada com sucesso!",
        "success"
      );
    } catch (error) {
      console.error("Erro ao processar baixa:", error);
      showAlert("Erro", "Erro ao processar baixa de estoque", "error");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Data",
      "Tamanho",
      "Cor",
      "Quantidade",
      "Motivo",
      "Preço Unitário",
      "Valor Total",
      "Observação",
      "Usuário",
    ];

    const csvData = baixas.map((baixa) => [
      new Date(baixa.data_baixa).toLocaleDateString("pt-BR"),
      baixa.variacao.tamanho.nome,
      baixa.variacao.cor?.nome || "-",
      baixa.quantidade,
      formatMotivo(baixa.motivo),
      baixa.preco_unitario.toFixed(2).replace(".", ","),
      (baixa.quantidade * baixa.preco_unitario).toFixed(2).replace(".", ","),
      baixa.observacao || "",
      getUserName(baixa),
    ]);

    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      [
        headers.join(";"),
        ...csvData.map((row) => row.map((field) => `"${field}"`).join(";")),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `baixas-estoque-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert("Exportado", "Relatório exportado com sucesso!", "success");
  };

  const formatMotivo = (motivo: string) => {
    const motivos = {
      venda: "Venda",
      defeito: "Defeito de Fábrica/Uso",
      doacao: "Doação/Brinde",
    };
    return motivos[motivo as keyof typeof motivos] || motivo;
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Gerenciar Variações</h2>
          <div className="flex space-x-2">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="mb-6 bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Plus size={20} className="mr-2" />
                Nova Variação
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 bg-gray-50 p-4 rounded-lg"
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingVariacao ? "Editar Variação" : "Nova Variação"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tamanho*
                </label>
                <select
                  name="tamanho_id"
                  defaultValue={editingVariacao?.tamanho_id}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Selecione um tamanho</option>
                  {tamanhos.map((tamanho) => (
                    <option key={tamanho.id} value={tamanho.id}>
                      {tamanho.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cor
                </label>
                <select
                  name="cor_id"
                  defaultValue={editingVariacao?.cor_id}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Selecione uma cor</option>
                  {cores.map((cor) => (
                    <option key={cor.id} value={cor.id}>
                      {cor.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estoque*
                </label>
                <input
                  type="number"
                  name="estoque"
                  defaultValue={editingVariacao?.estoque}
                  required
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                {editingVariacao ? "Atualizar" : "Adicionar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingVariacao(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md"
              >
                Cancelar
              </button>

              {editingVariacao && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingVariacao.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                >
                  Excluir
                </button>
              )}
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tamanho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {variacoes.map((variacao) => (
                <tr key={variacao.id}>
                  <td className="px-6 py-4 font-medium">
                    {variacao.tamanho.nome}
                  </td>
                  <td className="px-6 py-4">
                    {variacao.cor ? (
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300 mr-2"
                          style={{ backgroundColor: variacao.cor.codigo_hex }}
                        />
                        {variacao.cor.nome}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        variacao.estoque > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {variacao.estoque}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {variacao.preco
                      ? `R$ ${variacao.preco.toFixed(2)}`
                      : "Padrão"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingVariacao(variacao);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVariacao(variacao);
                          setShowBaixaModal(true);
                        }}
                        className="text-orange-600 hover:text-orange-800"
                        title="Baixa de Estoque"
                        disabled={variacao.estoque <= 0}
                      >
                        <Minus size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(variacao.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {variacoes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma variação cadastrada</p>
              <p className="text-sm">
                Adicione variações de tamanho e cor para este produto
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md"
          >
            Fechar
          </button>
        </div>
      </div>

      {showBaixaModal && selectedVariacao && (
        <BaixaEstoqueModal
          isOpen={showBaixaModal}
          onClose={() => {
            setShowBaixaModal(false);
            setSelectedVariacao(null);
          }}
          variacao={selectedVariacao}
          onSave={handleBaixaEstoqueModal}
        />
      )}

      {showRelatorio && (
        <RelatorioBaixasModal
          isOpen={showRelatorio}
          onClose={() => setShowRelatorio(false)}
          baixas={baixas}
          filtros={filtrosRelatorio}
          onFiltrosChange={setFiltrosRelatorio}
          onExport={exportToCSV}
          onReload={loadBaixas}
          getUserName={getUserName}
          formatMotivo={formatMotivo}
        />
      )}
    </div>
  );
}

function BaixaEstoqueModal({
  isOpen,
  onClose,
  variacao,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  variacao: ProdutoVariacao;
  onSave: (data: BaixaEstoqueData) => void;
}) {
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState<"venda" | "defeito" | "doacao" | "">("");
  const [erro, setErro] = useState("");

  const showAlert = (
    title: string,
    message: string,
    icon: "success" | "error" | "warning" | "info" = "info"
  ) => {
    Swal.fire({
      title,
      text: message,
      icon,
      confirmButtonText: "OK",
      confirmButtonColor: "#2563eb",
    });
  };

  const validateForm = () => {
    if (quantidade < 0) {
      setErro("A quantidade deve ser maior que zero");
      return false;
    }
    if (quantidade > variacao.estoque) {
      setErro("Quantidade não pode ser maior que o estoque disponível");
      return false;
    }
    if (!motivo) {
      setErro("Selecione um motivo para a baixa");
      return false;
    }
    setErro("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const baixaData = {
        variacao_id: variacao.id,
        produto_id: variacao.produto_id,
        quantidade,
        motivo,
        observacao,
        preco_unitario: variacao.preco || 0,
        data_baixa: new Date().toISOString(),
      };

      await onSave(baixaData);
      setQuantidade(1);
      setObservacao("");
      setMotivo("");
    } catch (error) {
      console.error("Erro ao registrar baixa:", error);
      setErro("Erro ao registrar baixa. Tente novamente.");
      showAlert("Erro", "Não foi possível registrar a baixa", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Registrar Baixa de Estoque</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="font-medium">Variação selecionada:</p>
          <p className="text-sm">
            {variacao.tamanho.nome} - {variacao.cor?.nome || "Sem cor"}
          </p>
          <p className="text-sm">Estoque atual: {variacao.estoque}</p>
          <p className="text-sm">
            Preço:{" "}
            {variacao.preco
              ? `R$ ${variacao.preco.toFixed(2)}`
              : "Preço padrão"}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantidade*
            </label>
            <input
              type="number"
              min="1"
              max={variacao.estoque}
              value={quantidade}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setQuantidade(value);
              }}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Motivo*
            </label>
            <select
              value={motivo}
              onChange={(e) =>
                setMotivo(e.target.value as "venda" | "defeito" | "doacao" | "")
              }
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              disabled={loading}
            >
              <option value="">Selecione um motivo</option>
              <option value="venda">Venda</option>
              <option value="defeito">Defeito de Fábrica/Uso</option>
              <option value="doacao">Doação/Brinde</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Detalhes sobre a baixa de estoque..."
              disabled={loading}
            />
          </div>

          {erro && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {erro}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                loading ||
                quantidade <= 0 ||
                quantidade > variacao.estoque ||
                !motivo
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                "Registrar Baixa"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatorioBaixasModal({
  isOpen,
  onClose,
  baixas,
  filtros,
  onFiltrosChange,
  onExport,
  onReload,
  getUserName,
  formatMotivo,
}: {
  isOpen: boolean;
  onClose: () => void;
  baixas: BaixaEstoque[];
  filtros: {
    search: string;
    motivo: string;
    startDate: string;
    endDate: string;
  };
  onFiltrosChange: (filtros: {
    search: string;
    motivo: string;
    startDate: string;
    endDate: string;
  }) => void;
  onExport: () => void;
  onReload: () => void;
  getUserName: (baixa: BaixaEstoque) => string;
  formatMotivo: (motivo: string) => string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            Relatório de Baixas de Estoque
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Motivo
              </label>
              <select
                value={filtros.motivo}
                onChange={(e) =>
                  onFiltrosChange({ ...filtros, motivo: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Todos os motivos</option>
                <option value="venda">Venda</option>
                <option value="defeito">Defeito</option>
                <option value="doacao">Doação/Brinde</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data Início
              </label>
              <input
                type="date"
                value={filtros.startDate}
                onChange={(e) =>
                  onFiltrosChange({ ...filtros, startDate: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.endDate}
                onChange={(e) =>
                  onFiltrosChange({ ...filtros, endDate: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {baixas.length} registros encontrados
            </span>
            <div className="flex space-x-2">
              <button
                onClick={onReload}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Atualizar
              </button>
              <button
                onClick={onExport}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download size={16} className="mr-2" />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tamanho
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Cor
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantidade
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Motivo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Preço Unitário
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Valor Total
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Observação
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuário
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {baixas.map((baixa) => (
                <tr key={baixa.id}>
                  <td className="px-4 py-2">
                    {new Date(baixa.data_baixa).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">{baixa.variacao.tamanho.nome}</td>
                  <td className="px-4 py-2">
                    {baixa.variacao.cor?.nome || "-"}
                  </td>
                  <td className="px-4 py-2">{baixa.quantidade}</td>
                  <td className="px-4 py-2">{formatMotivo(baixa.motivo)}</td>
                  <td className="px-4 py-2">
                    R$ {baixa.preco_unitario.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    R$ {(baixa.quantidade * baixa.preco_unitario).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">
                    {baixa.observacao || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {getUserName(baixa)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {baixas.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma baixa de estoque encontrada</p>
              <p className="text-sm">
                Tente ajustar os filtros ou registrar novas baixas
              </p>
            </div>
          )}
        </div>

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
