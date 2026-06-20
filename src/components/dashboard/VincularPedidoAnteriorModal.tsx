// components/dashboard/VincularPedidoAnteriorModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, Search, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

export interface Cliente {
  id: string;
  tipo_cliente: "juridica" | "fisica";
  nome_fantasia?: string;
  nome?: string;
  sobrenome?: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
}

export interface Pedido {
  id: string;
  total: number;
  status: string;
  created_at: string;
  cliente: Cliente;
  pre_pedido_id?: string;
  saldo_restante: number;
}

export interface VincularPedidoAnteriorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (pedido: Pedido, saldoRestante: number)=> void | Promise<void>;
  clienteId: string;
  pedidoAtualId?: string;
}

export default function VincularPedidoAnteriorModal({
  isOpen,
  onClose,
  onSelect,
  clienteId,
  pedidoAtualId,
}: VincularPedidoAnteriorModalProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen && clienteId) {
      loadPedidosCliente();
    }
  }, [isOpen, clienteId]);

  const loadPedidosCliente = async () => {
    try {
      setLoading(true);

      // Primeiro, buscar os pedidos do cliente
      const { data: pedidosData, error } = await supabase
        .from("pedidos")
        .select(
          `
          id,
          total,
          status,
          created_at,
          cliente:clientes(
            id,tipo_cliente,
            razao_social,
            nome_fantasia,
            nome,
            sobrenome
          ),
          pre_pedido_id
        `
        )
        .eq("cliente_id", clienteId)
        .eq("status", "confirmado")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calcular saldo restante para cada pedido
      const pedidosComSaldo = await Promise.all(
        (pedidosData || []).map(async (pedido) => {
          // Tratamento de cliente: pegue [0] e garanta tipo_cliente
          const clienteCorrigido =
            pedido.cliente && pedido.cliente.length > 0
              ? {
                  ...pedido.cliente[0],
                  tipo_cliente: pedido.cliente[0].tipo_cliente || "fisica", // <-- Default; ajuste se necessário
                }
              : {
                  id: "",
                  tipo_cliente: "fisica" as const,
                  nome: "Cliente não encontrado",
                };
          const saldoRestante = await calcularSaldoRestante(
            pedido.pre_pedido_id
          );
          return {
            ...pedido,
            cliente: clienteCorrigido,
            saldo_restante: saldoRestante,
          };
        })
      );

      // Filtrar apenas pedidos com saldo restante
      const pedidosComSaldoRestante = pedidosComSaldo.filter(
        (pedido) => (pedido.saldo_restante || 0) > 0
      );

      setPedidos(pedidosComSaldoRestante);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      Swal.fire(
        "Erro",
        "Não foi possível carregar os pedidos anteriores",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const calcularSaldoRestante = async (
    prePedidoId: string
  ): Promise<number> => {
    if (!prePedidoId) return 0;

    try {
      const { data: parcelas, error } = await supabase
        .from("pre_pedido_parcelas")
        .select("valor_parcela, status")
        .eq("pre_pedido_id", prePedidoId)
        .in("status", ["pendente", "atrasado"]);

      if (error) throw error;

      return (parcelas || []).reduce(
        (total: number, parcela: { valor_parcela: number }) =>
          total + parcela.valor_parcela,
        0
      );
    } catch (error) {
      console.error("Erro ao calcular saldo:", error);
      return 0;
    }
  };

  const handleSelecionarPedido = (pedido: Pedido) => {
    onSelect(pedido, pedido.saldo_restante);
    onClose();
  };

  const filteredPedidos = pedidos.filter((pedido) =>
    pedido.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Vincular Pedido Anterior</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar pedido por ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando pedidos...</p>
          </div>
        ) : filteredPedidos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto mb-4" size={48} />
            <p>Nenhum pedido anterior com saldo pendente encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelecionarPedido(pedido)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Pedido: {pedido.id}</p>
                    <p className="text-sm text-gray-600">
                      Data:{" "}
                      {new Date(pedido.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-sm text-gray-600">
                      Total Original: R$ {pedido.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      Saldo: R$ {pedido.saldo_restante?.toFixed(2)}
                    </p>
                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      Pendente
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
