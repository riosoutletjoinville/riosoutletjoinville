// components/dashboard/ModalPagamentoParcial.tsx
import { useState } from "react";

// Definição da interface Parcela localmente (ou importe do arquivo principal)
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

interface ModalPagamentoParcialProps {
  isOpen: boolean;
  onClose: () => void;
  parcela: Parcela;
  onConfirm: (data: {
    valorPagamento: number;
    formaPagamento: string;
    dataPagamento: string;
    observacao: string;
  }) => Promise<void>;
}

export function ModalPagamentoParcial({ isOpen, onClose, parcela, onConfirm }: ModalPagamentoParcialProps) {
  const [valorPagamento, setValorPagamento] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0]);
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saldoRestante = parcela.saldo_restante ?? parcela.valor_parcela;

  // Função para formatar valor como moeda brasileira
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

  // Função para converter valor formatado para número
  const converterParaNumero = (valorFormatado: string): number => {
    const valorNumerico = valorFormatado.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(valorNumerico) || 0;
  };

  // Manipular mudança no input com máscara
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value;
    
    // Remove tudo que não for número
    valor = valor.replace(/\D/g, "");
    
    // Converte para centavos
    if (valor && valor !== "0") {
      const valorNumerico = (parseInt(valor, 10) / 100).toFixed(2);
      valor = `R$ ${valorNumerico.replace(".", ",")}`;
    } else {
      valor = "";
    }
    
    setValorPagamento(valor);
    setError("");
  };

  // Validar valor antes de confirmar
  const handleConfirm = async () => {
    const valorNumerico = converterParaNumero(valorPagamento);
    
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
        valorPagamento: valorNumerico,
        formaPagamento,
        dataPagamento,
        observacao,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            Pagamento Parcial - Parcela {parcela.numero_parcela}
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saldo Restante
              </label>
              <p className="text-lg font-semibold text-blue-600">
                {formatarMoeda(saldoRestante)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Pagamento
              </label>
              <input
                type="text"
                value={valorPagamento}
                onChange={handleValorChange}
                placeholder="R$ 0,00"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
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
                Observação (opcional)
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
                placeholder="Observação sobre este pagamento..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
            >
              {loading ? "Processando..." : "Registrar Pagamento"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}