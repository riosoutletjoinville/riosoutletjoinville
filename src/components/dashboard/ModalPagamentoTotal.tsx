// components/dashboard/ModalPagamentoTotal.tsx
import { useState } from "react";

interface Parcela {
  id: string;
  pre_pedido_id: string;
  numero_parcela: number;
  valor_parcela: number;
  valor_original?: number;
  saldo_restante?: number;
  data_vencimento: string;
  status: "pendente" | "pago" | "atrasado" | "cancelado" | "parcial";
  data_pagamento?: string;
  valor_pago?: number;
  observacao?: string;
  negociado?: boolean;
  observacao_negociacao?: string;
  pre_pedido?: {
    id: string;
    cliente: any;
    total: number;
  };
}

interface ModalPagamentoTotalProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: Parcela;
  onConfirm: (data: {
    valorPago: number;
    dataPagamento: string;
    formaPagamento: string;
  }) => Promise<void>;
}

export function ModalPagamentoTotal({ isOpen, onClose, parcela, onConfirm }: ModalPagamentoTotalProps) {
  const [valorPago, setValorPago] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saldoRestante = parcela.saldo_restante ?? parcela.valor_parcela;

  const formatarMoeda = (valor: string | number): string => {
    let valorNumerico: number;
    
    if (typeof valor === "string") {
      valorNumerico = parseFloat(valor);
    } else {
      valorNumerico = valor;
    }
    
    if (isNaN(valorNumerico)) return "R$ 0,00";
    
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valorNumerico);
  };

  const converterParaNumero = (valorFormatado: string): number => {
    const valorNumerico = valorFormatado.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(valorNumerico) || 0;
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value;
    valor = valor.replace(/\D/g, "");
    
    if (valor && valor !== "0") {
      const valorNumerico = (parseInt(valor, 10) / 100).toFixed(2);
      valor = `R$ ${valorNumerico.replace(".", ",")}`;
    } else {
      valor = "";
    }
    
    setValorPago(valor);
    setError("");
  };

  const handleConfirm = async () => {
    const valorNumerico = converterParaNumero(valorPago);
    
    if (valorNumerico <= 0) {
      setError("Por favor, insira um valor válido");
      return;
    }
    
    if (valorNumerico > saldoRestante) {
      setError(`Valor não pode ser maior que o saldo restante (${formatarMoeda(saldoRestante)})`);
      return;
    }
    
    if (!dataPagamento) {
      setError("Por favor, insira uma data de pagamento");
      return;
    }
    
    setLoading(true);
    try {
      await onConfirm({
        valorPago: valorNumerico,
        dataPagamento,
        formaPagamento,
      });
      onClose();
    } catch (err) {
      setError("Erro ao processar pagamento");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            Pagamento Total - Parcela {parcela.numero_parcela}
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor da Parcela
              </label>
              <p className="text-lg font-semibold text-blue-600">
                {formatarMoeda(parcela.valor_parcela)}
              </p>
            </div>
            
            <div className="bg-green-50 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saldo Restante
              </label>
              <p className="text-lg font-semibold text-green-600">
                {formatarMoeda(saldoRestante)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor a Pagar
              </label>
              <input
                type="text"
                value={valorPago}
                onChange={handleValorChange}
                placeholder="R$ 0,00"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Pagamento
              </label>
              <input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300"
            >
              {loading ? "Processando..." : "Confirmar Pagamento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}