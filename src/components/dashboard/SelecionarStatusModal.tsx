// components/dashboard/SelecionarStatusModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";

interface StatusPedido {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  cor: string;
  ordem: number;
}

interface Pedido {
  id: string;
  status_pedido?: {
    id: string;
    nome: string;
    categoria: string;
    descricao: string;
    cor: string;
    ordem: number;
  };
}

interface SelecionarStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido;
  onStatusChange: (statusId: string, observacoes?: string) => void;
}

export default function SelecionarStatusModal({
  isOpen,
  onClose,
  pedido,
  onStatusChange,
}: SelecionarStatusModalProps) {
  const [statusList, setStatusList] = useState<StatusPedido[]>([]);
  const [statusSelecionado, setStatusSelecionado] = useState<StatusPedido | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStatusPedido();
    }
  }, [isOpen]);

  const loadStatusPedido = async () => {
    try {
      const { data, error } = await supabase
        .from("status_pedido")
        .select("*")
        .eq("ativo", true)
        .order("ordem");

      if (error) throw error;
      setStatusList(data || []);
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    }
  };

  const handleConfirmarStatus = async () => {
    if (!statusSelecionado) {
      Swal.fire("Atenção", "Selecione um status para continuar", "warning");
      return;
    }

    setLoading(true);
    try {
      await onStatusChange(statusSelecionado.id, observacoes);
      Swal.fire("Sucesso!", "Status atualizado com sucesso", "success");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      Swal.fire("Erro", "Não foi possível atualizar o status", "error");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (categoria: string) => {
    switch (categoria) {
      case "concluido":
        return CheckCircle;
      case "problema":
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Alterar Status do Pedido</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Atual
            </label>
            {pedido.status_pedido ? (
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pedido.status_pedido.cor }}
                ></div>
                <span>{pedido.status_pedido.nome}</span>
              </div>
            ) : (
              <p className="text-gray-500">Não definido</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Novo Status
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {statusList.map((status) => {
                const Icon = getStatusIcon(status.categoria);
                return (
                  <button
                    key={status.id}
                    onClick={() => setStatusSelecionado(status)}
                    className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                      statusSelecionado?.id === status.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className="h-5 w-5"
                        style={{ color: status.cor }}
                      />
                      <div>
                        <p className="font-semibold">{status.nome}</p>
                        <p className="text-sm text-gray-600">{status.descricao}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações (Opcional)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Adicione observações sobre a mudança de status..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmarStatus}
            disabled={!statusSelecionado || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Atualizando..." : "Confirmar Status"}
          </button>
        </div>
      </div>
    </div>
  );
}