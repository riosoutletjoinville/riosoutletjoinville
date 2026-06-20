"use client";
import { useState } from "react";
import { X, Save } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface BaixaEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  variacao: {
    id: string;
    tamanho: string;
    cor: string;
    estoque: number;
    preco: number;
    produto_id: string;
    produto_titulo: string;
  };
  onSave: (baixaData: {
    variacao_id: string;
    produto_id: string;
    quantidade: number;
    motivo: string;
    observacao: string;
    preco_unitario: number;
    data_baixa: string;
    usuario_id: string;
    usuario_nome?: string;
    usuario_email?: string;
  }) => void;
}

export default function BaixaEstoqueModal({
  isOpen,
  onClose,
  variacao,
  onSave,
}: BaixaEstoqueModalProps) {
  const { user } = useAuth();
  const [quantidade, setQuantidade] = useState(1);
  const [motivo, setMotivo] = useState<"venda" | "defeito" | "doacao" | "">("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
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
        variacao_id: variacao.id,
        produto_id: variacao.produto_id,
        quantidade,
        motivo,
        observacao,
        preco_unitario: variacao.preco,
        data_baixa: new Date().toISOString(),
        usuario_id: user?.id || "",
        usuario_nome: usuarioNome,
        usuario_email: usuarioEmail,
      };

      await onSave(baixaData);
      showAlert("Sucesso", "Baixa registrada com sucesso!", "success");
      onClose();
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
          <h2 className="text-xl font-semibold text-gray-800">
            Registrar Baixa de Estoque
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="font-medium">{variacao.produto_titulo}</p>
          <p className="text-sm text-gray-600">
            {variacao.tamanho} - {variacao.cor || "Sem cor"}
          </p>
          <p className="text-sm text-gray-600">
            Estoque atual: {variacao.estoque}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da Baixa*
            </label>
            <select
              value={motivo}
              onChange={(e) =>
                setMotivo(e.target.value as "venda" | "defeito" | "doacao" | "")
              }
              required
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Selecione um motivo</option>
              <option value="venda">Venda</option>
              <option value="defeito">Defeito de Fábrica/Uso</option>
              <option value="doacao">Doação/Brinde</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Registrar Baixa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}