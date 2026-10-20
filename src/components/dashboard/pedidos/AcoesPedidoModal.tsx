// components/dashboard/pedidos/AcoesPedidoModal.tsx
"use client";
import { useState } from "react";
import {
  X,
  AlertTriangle,
  RefreshCw,
  Gift,
  Shield,
  LucideIcon,
} from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";
import { getBrasiliaISOString } from "@/lib/dateUtils";

interface PedidoItem {
  id: string;
  produto_id: string;
  variacao_id?: string;
  quantidade: number;
  preco_unitario: number;
}

interface Pedido {
  id: string;
  status: string;
  total: number;
  tipo_cancelamento?: string;
  motivo_cancelamento?: string;
  tipo_pedido_id?: string;
  observacoes?: string;
  pedido_itens?: PedidoItem[];
  updated_at?: string;
}

interface AcoesPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedido: Pedido;
  onActionComplete: () => void;
}

interface AcaoDisponivel {
  id: string;
  nome: string;
  descricao: string;
  icone: LucideIcon;
  cor: string;
  bgCor: string;
}

export default function AcoesPedidoModal({
  isOpen,
  onClose,
  pedido,
  onActionComplete,
}: AcoesPedidoModalProps) {
  const [loading, setLoading] = useState(false);
  const [acaoSelecionada, setAcaoSelecionada] = useState<string>("");
  const [justificativa, setJustificativa] = useState("");

  const acoesDisponiveis: AcaoDisponivel[] = [
    {
      id: "cancelamento_cliente",
      nome: "Cancelamento por Arrependimento",
      descricao: "Cliente se arrependeu da compra",
      icone: AlertTriangle,
      cor: "text-red-600",
      bgCor: "bg-red-50",
    },
    {
      id: "defeito_fabricacao",
      nome: "Defeito de Fabricação",
      descricao: "Produto com defeito identificado",
      icone: Shield,
      cor: "text-orange-600",
      bgCor: "bg-orange-50",
    },
    {
      id: "troca_produto",
      nome: "Troca de Produto",
      descricao: "Cliente deseja trocar o produto",
      icone: RefreshCw,
      cor: "text-blue-600",
      bgCor: "bg-blue-50",
    },
    {
      id: "doacao",
      nome: "Conversão para Doação",
      descricao: "Converter pedido para doação",
      icone: Gift,
      cor: "text-purple-600",
      bgCor: "bg-purple-50",
    },
  ];

  const handleExecutarAcao = async () => {
  if (!justificativa.trim()) {
    Swal.fire(
      "Atenção",
      "Por favor, informe a justificativa da ação.",
      "warning"
    );
    return;
  }

  setLoading(true);
  try {
    switch (acaoSelecionada) {
      case "cancelamento_cliente":
        await handleCancelamentoArrependimento();
        break;
      case "defeito_fabricacao":
        await handleDefeitoFabricacao();
        break;
      case "troca_produto":
        await handleTrocaProduto();
        break;
      case "doacao":
        await handleConversaoDoacao();
        break;
      default:
        throw new Error("Ação não reconhecida");
    }

    Swal.fire("Sucesso!", "Ação executada com sucesso.", "success");
    onActionComplete();
    onClose();
  } catch (error) {
    console.error("Erro ao executar ação:", error);
    
    // Tratamento específico para erro da API
    if (error instanceof Error && error.message.includes("não pode ser cancelado")) {
      Swal.fire(
        "Cancelamento não permitido",
        error.message,
        "error"
      );
    } else {
      Swal.fire("Erro", "Não foi possível executar a ação.", "error");
    }
  } finally {
    setLoading(false);
  }
};


const handleCancelamentoArrependimento = async (): Promise<void> => {
  console.log("🔄 Cancelando pedido via API:", pedido.id);

  // Chamar a API de cancelamento
  const response = await fetch(`/api/pedidos/${pedido.id}/cancelar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      motivo: justificativa,
      tipo_cancelamento: "arrependimento",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Verificar se o erro tem detalhes específicos
    if (data.statusAtual) {
      throw new Error(
        `Pedido com status "${data.statusAtual}" não pode ser cancelado. Status permitidos: confirmado, pendente, processando`
      );
    }
    throw new Error(data.error || "Erro ao cancelar pedido");
  }

  // Mostrar detalhes do cancelamento
  if (data.detalhes?.erros_estoque?.length > 0) {
    console.warn("⚠️ Avisos no cancelamento:", data.detalhes.erros_estoque);
    // Poderia mostrar um aviso, mas não interrompe o fluxo
  }

  console.log("✅ Pedido cancelado com sucesso:", data);
};

  const handleDefeitoFabricacao = async (): Promise<void> => {
    // Atualizar apenas observações e status
    const { error } = await supabase
      .from("pedidos")
      .update({
        status: "defeito_fabricacao",
        observacoes: `DEFEITO DE FABRICAÇÃO: ${justificativa}\n${pedido.observacoes || ""}`,
        updated_at: getBrasiliaISOString(),
      })
      .eq("id", pedido.id);

    if (error) throw error;
  };

  const handleTrocaProduto = async (): Promise<void> => {
    const { error } = await supabase
      .from("pedidos")
      .update({
        status: "troca_solicitada",
        observacoes: `TROCA SOLICITADA: ${justificativa}\n${pedido.observacoes || ""}`,
        updated_at: getBrasiliaISOString(),
      })
      .eq("id", pedido.id);

    if (error) throw error;
  };

  const handleConversaoDoacao = async (): Promise<void> => {
    // Para doação, não baixamos estoque novamente, apenas marcamos o status
    const { error } = await supabase
      .from("pedidos")
      .update({
        status: "doacao",
        observacoes: `DOAÇÃO: ${justificativa}\n${pedido.observacoes || ""}`,
        updated_at: getBrasiliaISOString(),
      })
      .eq("id", pedido.id);

    if (error) throw error;
  };

  // Função auxiliar para incrementar estoque (caso o RPC não exista)
  const incrementEstoque = async (produtoId: string, quantidade: number) => {
    // Buscar estoque atual
    const { data: produto } = await supabase
      .from("produtos")
      .select("estoque")
      .eq("id", produtoId)
      .single();

    if (!produto) throw new Error("Produto não encontrado");

    // Atualizar com novo valor
    const { error } = await supabase
      .from("produtos")
      .update({
        estoque: (produto.estoque || 0) + quantidade,
        updated_at: getBrasiliaISOString(),
      })
      .eq("id", produtoId);

    if (error) throw error;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Ações do Pedido</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione a Ação
            </label>
            <div className="grid grid-cols-1 gap-3">
              {acoesDisponiveis.map((acao) => {
                const Icone = acao.icone;
                return (
                  <button
                    key={acao.id}
                    onClick={() => setAcaoSelecionada(acao.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      acaoSelecionada === acao.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    } ${acao.bgCor}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icone className={`h-6 w-6 ${acao.cor}`} />
                      <div>
                        <p className="font-semibold">{acao.nome}</p>
                        <p className="text-sm text-gray-600">
                          {acao.descricao}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {acaoSelecionada && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Justificativa/Observações
              </label>
              <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descreva o motivo desta ação..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExecutarAcao}
            disabled={!acaoSelecionada || !justificativa.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Executando..." : "Executar Ação"}
          </button>
        </div>
      </div>
    </div>
  );
}