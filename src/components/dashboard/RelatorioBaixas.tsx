// app/components/dashboard/RelatorioBaixas.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, X, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BaixaEstoque {
  id: string;
  variacao_id: string;
  produto_id: string;
  quantidade: number;
  motivo: string;
  observacao: string;
  preco_unitario: number;
  data_baixa: string;
  produto: {
    titulo: string;
  };
  variacao: {
    tamanho: string;
    cor: string;
  };
}

interface RelatorioBaixasProps {
  isOpen: boolean;
  onClose: () => void;
  variacaoId?: string;
}

export default function RelatorioBaixas({
  isOpen,
  onClose,
  variacaoId,
}: RelatorioBaixasProps) {
  const [baixas, setBaixas] = useState<BaixaEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState({
    start: "",
    end: "",
  });
  const [motivoFilter, setMotivoFilter] = useState("all");

  useEffect(() => {
    if (isOpen) {
      loadBaixas();
    }
  }, [isOpen, variacaoId]);

  const loadBaixas = async () => {
    try {
      let query = supabase
        .from("baixas_estoque")
        .select(`
          *,
          produto:produtos(titulo),
          variacao:produto_variacoes(tamanho, cor)
        `)
        .order("data_baixa", { ascending: false });

      if (variacaoId) {
        query = query.eq("variacao_id", variacaoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBaixas(data || []);
    } catch (error) {
      console.error("Erro ao carregar baixas:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBaixas = baixas.filter((baixa) => {
    const matchesSearch = baixa.produto.titulo
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    const matchesMotivo = motivoFilter === "all" || baixa.motivo === motivoFilter;
    
    const matchesDate = 
      (!dateFilter.start || baixa.data_baixa >= dateFilter.start) &&
      (!dateFilter.end || baixa.data_baixa <= dateFilter.end + "T23:59:59");
    
    return matchesSearch && matchesMotivo && matchesDate;
  });

  const exportToCSV = () => {
    const headers = [
      "Data",
      "Produto",
      "Tamanho",
      "Cor",
      "Quantidade",
      "Motivo",
      "Preço Unitário",
      "Valor Total",
      "Observação"
    ];

    const csvData = filteredBaixas.map(baixa => [
      new Date(baixa.data_baixa).toLocaleDateString("pt-BR"),
      baixa.produto.titulo,
      baixa.variacao.tamanho,
      baixa.variacao.cor || "-",
      baixa.quantidade,
      formatMotivo(baixa.motivo),
      `R$ ${baixa.preco_unitario.toFixed(2)}`,
      `R$ ${(baixa.quantidade * baixa.preco_unitario).toFixed(2)}`,
      baixa.observacao || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `baixas-estoque-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMotivo = (motivo: string) => {
    const motivos = {
      venda: "Venda",
      defeito: "Defeito de Fábrica/Uso",
      doacao: "Doação/Brinde"
    };
    return motivos[motivo as keyof typeof motivos] || motivo;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Relatório de Baixas de Estoque
            {variacaoId && " - Variação Específica"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo
              </label>
              <select
                value={motivoFilter}
                onChange={(e) => setMotivoFilter(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os motivos</option>
                <option value="venda">Venda</option>
                <option value="defeito">Defeito</option>
                <option value="doacao">Doação/Brinde</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  placeholder="Início"
                />
                <input
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                  placeholder="Fim"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {filteredBaixas.length} registros encontrados
            </span>
            <button
              onClick={exportToCSV}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download size={16} className="mr-2" />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tamanho</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBaixas.map((baixa) => (
                <tr key={baixa.id}>
                  <td className="px-4 py-2 text-sm">{new Date(baixa.data_baixa).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-2 text-sm font-medium">{baixa.produto.titulo}</td>
                  <td className="px-4 py-2 text-sm">{baixa.variacao.tamanho}</td>
                  <td className="px-4 py-2 text-sm">{baixa.variacao.cor || "-"}</td>
                  <td className="px-4 py-2 text-sm">{baixa.quantidade}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      baixa.motivo === "venda" ? "bg-green-100 text-green-800" :
                      baixa.motivo === "defeito" ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {formatMotivo(baixa.motivo)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">R$ {baixa.preco_unitario.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm font-medium">
                    R$ {(baixa.quantidade * baixa.preco_unitario).toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{baixa.observacao || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBaixas.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma baixa de estoque encontrada
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}