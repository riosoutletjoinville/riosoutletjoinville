// components/dashboard/SelecionarCondicaoPagamentoModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, Save, Plus, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

interface CondicaoPagamento {
  id: string;
  nome: string;
  descricao: string;
  numero_parcelas: number;
  intervalo_dias: number;
  ativo: boolean;
}

interface Parcela {
  numero: number;
  valor: number;
  data_vencimento: string;
}

interface SelecionarCondicaoPagamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (condicaoId: string, parcelas: Parcela[]) => void;
  valorTotal: number;
  condicaoSelecionada?: string;
}

export default function SelecionarCondicaoPagamentoModal({
  isOpen,
  onClose,
  onSelect,
  valorTotal,
  condicaoSelecionada,
}: SelecionarCondicaoPagamentoModalProps) {
  const [condicoes, setCondicoes] = useState<CondicaoPagamento[]>([]);
  const [condicaoSelecionadaId, setCondicaoSelecionadaId] = useState<string>("");
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarCustomizado, setMostrarCustomizado] = useState(false);
  const [customParcelas, setCustomParcelas] = useState(1);
  const [customIntervalo, setCustomIntervalo] = useState(30);
  const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState<string>("");
  const [usarDataPersonalizada, setUsarDataPersonalizada] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCondicoesPagamento();
      // Define a data padrão da primeira parcela (próximo dia útil ou hoje)
      const hoje = new Date();
      setDataPrimeiraParcela(hoje.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (condicaoSelecionadaId && valorTotal > 0) {
      calcularParcelas(condicaoSelecionadaId);
    }
  }, [condicaoSelecionadaId, valorTotal, dataPrimeiraParcela, usarDataPersonalizada]);

  useEffect(() => {
    if (mostrarCustomizado && valorTotal > 0) {
      calcularParcelasCustomizadas();
    }
  }, [mostrarCustomizado, customParcelas, customIntervalo, dataPrimeiraParcela, usarDataPersonalizada, valorTotal]);

  const loadCondicoesPagamento = async () => {
    try {
      const { data, error } = await supabase
        .from("condicoes_pagamento")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setCondicoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar condições de pagamento:", error);
    }
  };

  const calcularParcelas = (condicaoId: string) => {
    const condicao = condicoes.find(c => c.id === condicaoId);
    if (!condicao) return;

    const novasParcelas: Parcela[] = [];
    const valorParcela = valorTotal / condicao.numero_parcelas;
    
    // Usa data personalizada ou data atual como base
    const dataBase = usarDataPersonalizada && dataPrimeiraParcela 
      ? new Date(dataPrimeiraParcela)
      : new Date();

    for (let i = 0; i < condicao.numero_parcelas; i++) {
      const dataVencimento = new Date(dataBase);
      
      if (i === 0) {
        // Primeira parcela usa a data base (personalizada ou atual)
        if (usarDataPersonalizada) {
          dataVencimento.setDate(dataVencimento.getDate());
        }
      } else {
        // Para as demais parcelas, avança meses mantendo o dia do mês
        dataVencimento.setMonth(dataVencimento.getMonth() + (condicao.intervalo_dias / 30) * i);
        
        // Se o dia original não existe no mês (ex: 31 em fevereiro), ajusta para o último dia do mês
        const diaOriginal = dataBase.getDate();
        const ultimoDiaMes = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth() + 1, 0).getDate();
        
        if (diaOriginal > ultimoDiaMes) {
          dataVencimento.setDate(ultimoDiaMes);
        } else {
          dataVencimento.setDate(diaOriginal);
        }
      }
      
      novasParcelas.push({
        numero: i + 1,
        valor: valorParcela,
        data_vencimento: dataVencimento.toISOString().split('T')[0]
      });
    }

    setParcelas(novasParcelas);
  };

  const calcularParcelasCustomizadas = () => {
    const novasParcelas: Parcela[] = [];
    const valorParcela = valorTotal / customParcelas;
    
    // Usa data personalizada ou data atual como base
    const dataBase = usarDataPersonalizada && dataPrimeiraParcela 
      ? new Date(dataPrimeiraParcela)
      : new Date();

    for (let i = 0; i < customParcelas; i++) {
      const dataVencimento = new Date(dataBase);
      
      if (i === 0) {
        // Primeira parcela usa a data base (personalizada ou atual)
        if (usarDataPersonalizada) {
          dataVencimento.setDate(dataVencimento.getDate());
        }
      } else {
        // Para as demais parcelas, avança meses mantendo o dia do mês
        dataVencimento.setMonth(dataVencimento.getMonth() + (customIntervalo / 30) * i);
        
        // Se o dia original não existe no mês (ex: 31 em fevereiro), ajusta para o último dia do mês
        const diaOriginal = dataBase.getDate();
        const ultimoDiaMes = new Date(dataVencimento.getFullYear(), dataVencimento.getMonth() + 1, 0).getDate();
        
        if (diaOriginal > ultimoDiaMes) {
          dataVencimento.setDate(ultimoDiaMes);
        } else {
          dataVencimento.setDate(diaOriginal);
        }
      }
      
      novasParcelas.push({
        numero: i + 1,
        valor: valorParcela,
        data_vencimento: dataVencimento.toISOString().split('T')[0]
      });
    }

    setParcelas(novasParcelas);
  };

  const handleSelecionar = () => {
    if (mostrarCustomizado) {
      onSelect("custom", parcelas);
    } else if (condicaoSelecionadaId) {
      onSelect(condicaoSelecionadaId, parcelas);
    } else {
      Swal.fire("Atenção", "Selecione uma condição de pagamento", "warning");
      return;
    }
    onClose();
  };

  // Função para obter a data mínima (hoje)
  const getDataMinima = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Condição de Pagamento</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold">Valor Total: R$ {valorTotal.toFixed(2)}</p>
        </div>

        {/* Opção de Data Personalizada */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Data da Primeira Parcela
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="usarDataPersonalizada"
                checked={usarDataPersonalizada}
                onChange={(e) => setUsarDataPersonalizada(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="usarDataPersonalizada" className="text-sm font-medium">
                Personalizar data
              </label>
            </div>
          </div>

          {usarDataPersonalizada && (
            <div className="mt-3">
              <label className="block text-sm font-medium mb-2">
                Data da Primeira Parcela:
              </label>
              <input
                type="date"
                value={dataPrimeiraParcela}
                onChange={(e) => setDataPrimeiraParcela(e.target.value)}
                min={getDataMinima()}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                As demais parcelas serão geradas no mesmo dia dos meses seguintes
              </p>
            </div>
          )}

          {!usarDataPersonalizada && (
            <p className="text-sm text-gray-600">
              Primeira parcela será gerada para hoje, demais parcelas nos meses seguintes
            </p>
          )}
        </div>

        {/* Condições Pré-definidas */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Condições de Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {condicoes.map((condicao) => (
              <button
                key={condicao.id}
                onClick={() => {
                  setCondicaoSelecionadaId(condicao.id);
                  setMostrarCustomizado(false);
                }}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  condicaoSelecionadaId === condicao.id && !mostrarCustomizado
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold">{condicao.nome}</div>
                <div className="text-sm text-gray-600">{condicao.descricao}</div>
                <div className="text-sm text-gray-600">
                  {condicao.numero_parcelas} parcela(s) - {condicao.intervalo_dias} dias
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Condição Customizada */}
        <div className="mb-6">
          <button
            onClick={() => setMostrarCustomizado(!mostrarCustomizado)}
            className={`w-full p-4 border rounded-lg text-left transition-colors ${
              mostrarCustomizado
                ? "border-green-500 bg-green-50"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="font-semibold flex items-center">
              <Plus size={20} className="mr-2" />
              Condição Personalizada
            </div>
          </button>

          {mostrarCustomizado && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Número de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={customParcelas}
                    onChange={(e) => setCustomParcelas(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Intervalo (dias)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={customIntervalo}
                    onChange={(e) => setCustomIntervalo(parseInt(e.target.value) || 30)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recomendado: 30, 60, 90 dias
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview das Parcelas */}
        {parcelas.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Preview das Parcelas</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Parcela</th>
                    <th className="px-4 py-2 text-left">Valor</th>
                    <th className="px-4 py-2 text-left">Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelas.map((parcela) => (
                    <tr key={parcela.numero} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{parcela.numero}</td>
                      <td className="px-4 py-2">R$ {parcela.valor.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        {new Date(parcela.data_vencimento).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSelecionar}
            disabled={parcelas.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
          >
            <Save size={20} className="mr-2" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}