// src/components/dashboard/EmissaoNFModal.tsx

"use client";

import { useState } from "react";
import { NFeEmissionData } from "@/types/mercadolibre-nfe";

interface EmissaoNFModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    items: Array<{
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
    }>;
    buyer: {
      id: string;
      nickname: string;
      email: string;
    };
    total_amount: number;
  };
  accessToken: string;
}

export function EmissaoNFModal({
  isOpen,
  onClose,
  order,
  accessToken,
}: EmissaoNFModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    series: 1,
    customer_tax_id: "",
    customer_legal_name: "",
    customer_email: order.buyer.email,
    customer_zip_code: "",
    customer_street: "",
    customer_number: "",
    customer_neighborhood: "",
    customer_city: "",
    customer_state: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const invoiceData: NFeEmissionData = {
        order_id: order.id,
        access_token: accessToken,
        invoice_data: {
          type: "invoice",
          series: formData.series,
          number: Math.floor(Math.random() * 10000), // Gerar número sequencial
          issued_date: new Date().toISOString(),
          items: order.items.map((item) => ({
            item_code: item.id,
            description: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            tax_rate: 0.12, // ICMS exemplo
          })),
          customer: {
            tax_payer_id: formData.customer_tax_id,
            legal_name: formData.customer_legal_name,
            email: formData.customer_email,
            address: {
              zip_code: formData.customer_zip_code,
              street_name: formData.customer_street,
              street_number: formData.customer_number,
              neighborhood: formData.customer_neighborhood,
              city: formData.customer_city,
              state: formData.customer_state,
            },
          },
          total: {
            gross: order.total_amount,
            discounts: 0,
            taxes: order.total_amount * 0.12,
            net: order.total_amount,
          },
        },
      };

      const response = await fetch("/api/mercadolibre/nfe/emissao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error("Erro na emissão da NF");
      }

      const result = await response.json();
      alert("NF emitida com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao emitir NF");
    } finally {
      setIsLoading(false);
    }
  };

  /**const handleEmitirNFe = async (order: Pedido) => {
    try {
      setNfeLoading(true);

      // Buscar dados completos do pedido para a NF
      const { data: pedidoCompleto, error } = await supabase
        .from("pedidos")
        .select(
          `
        *,
        cliente:clientes (*),
        pedido_itens (
          *,
          produto:produtos (*)
        )
      `
        )
        .eq("id", order.id)
        .single();

      if (error) throw error;

      // Adaptar os dados para o formato esperado pelo modal
      const orderDataForModal = {
        id: pedidoCompleto.id,
        items: (pedidoCompleto.pedido_itens || []).map((item: any) => ({
          id: item.produto_id,
          title: item.produto?.titulo || "Produto sem nome",
          quantity: item.quantidade,
          unit_price: item.preco_unitario,
        })),
        buyer: {
          id: pedidoCompleto.cliente_id,
          nickname:
            pedidoCompleto.cliente?.nome_fantasia ||
            pedidoCompleto.cliente?.razao_social ||
            "Cliente",
          email: pedidoCompleto.cliente?.email || "",
        },
        total_amount: pedidoCompleto.total,
      };

      setSelectedOrderForNFe(orderDataForModal as any);
      setShowNFeModal(true);
    } catch (error) {
      console.error("Erro ao preparar emissão de NF:", error);
      Swal.fire("Erro", "Não foi possível preparar a emissão da NF", "error");
    } finally {
      setNfeLoading(false);
    }
  };
*/
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Emitir Nota Fiscal</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos do formulário */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                CPF/CNPJ do Cliente
              </label>
              <input
                type="text"
                value={formData.customer_tax_id}
                onChange={(e) =>
                  setFormData({ ...formData, customer_tax_id: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Razão Social
              </label>
              <input
                type="text"
                value={formData.customer_legal_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customer_legal_name: e.target.value,
                  })
                }
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>

          {/* Mais campos de endereço... */}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Emitindo..." : "Emitir NF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
