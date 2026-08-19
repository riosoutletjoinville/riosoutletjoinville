// components/dashboard/ExportarDuplicatasERP.tsx
"use client";

import { useState } from "react";
import { Download, FileText, X } from "lucide-react";
import Swal from "sweetalert2";

interface Parcela {
  id: string;
  pre_pedido_id: string;
  numero_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  status: string;
  valor_pago?: number;
}

interface Cliente {
  id?: string;
  razao_social?: string;
  nome_fantasia?: string;
  nome?: string;
  sobrenome?: string;
  cnpj?: string;
  cpf?: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

interface NotaFiscal {
  id: string;
  numero_nf: string;
  serie: string;
  modelo: string;
  especie: string;
  data_emissao: string;
  estado: string;
  natureza_operacao?: string;
  valor_total: number;
}

interface ExportarDuplicatasERPProps {
  parcelas: Parcela[];
  cliente: Cliente | null;
  notaFiscal: NotaFiscal | null;
  prePedidoId: string;
  disabled?: boolean;
  onExportSuccess?: () => void;
  onClose?: () => void;
}

export function ExportarDuplicatasERP({
  parcelas,
  cliente,
  notaFiscal,
  prePedidoId,
  onExportSuccess,
  onClose,
}: ExportarDuplicatasERPProps) {
  const [exportando, setExportando] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState<"E" | "S" | "R" | "D">("S");

  const tiposMovimento = [
    { value: "E", label: "Entradas", descricao: "Notas fiscais de entrada (compras)" },
    { value: "S", label: "Saídas", descricao: "Notas fiscais de saída (vendas)" },
    { value: "R", label: "Serviços", descricao: "Notas fiscais de serviços" },
    { value: "D", label: "Demais Documentos", descricao: "Outros documentos" },
  ];

  const formatarDocumento = (doc?: string): string => {
    if (!doc) return "00.000.000/0000-00";
    return doc.replace(/\D/g, "");
  };

  const formatarValorERP = (valor: number): string => {
    return valor.toFixed(2).replace(",", ".");
  };

  const formatarDataERP = (data: string | Date): string => {
    const dataObj = typeof data === "string"? new Date(data) : data;
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
    const dia = String(dataObj.getDate()).padStart(2, "0");
    return `${ano}${mes}${dia}`;
  };

  const formatarNumeroERP = (valor: number | string, tamanho: number): string => {
    const num = String(valor).replace(/\D/g, "");
    return num.padStart(tamanho, "0").slice(-tamanho);
  };

  const formatarAlfaERP = (valor: string | null | undefined): string => {
    if (!valor) return '""';
    const limpo = valor.replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, "");
    return `"${limpo}"`;
  };

  const formatarNumeroDecimalERP = (valor: number): string => {
    return valor.toFixed(2).replace(",", ".");
  };

  const getClienteNome = (): string => {
    if (!cliente) return "Cliente não informado";
    if (cliente.razao_social) return cliente.razao_social;
    if (cliente.nome_fantasia) return cliente.nome_fantasia;
    return `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim();
  };

  const getClienteDocumento = (): string => {
    if (!cliente) return "";
    return cliente.cnpj || cliente.cpf || "";
  };

  const gerarLinhaDuplicata = (parcela: Parcela): string => {
    const campos: string[] = [];
    campos.push(formatarNumeroERP(parcela.numero_parcela, 2));
    campos.push(formatarAlfaERP(tipoMovimento));
    campos.push(formatarAlfaERP(getClienteDocumento()));
    const ie = cliente?.inscricao_estadual || "";
    campos.push(formatarNumeroERP(ie.replace(/\D/g, ""), 16));
    const numNF = notaFiscal?.numero_nf || "0";
    campos.push(formatarNumeroERP(numNF, 9));
    campos.push(formatarNumeroERP(numNF, 9));
    const dataNF = notaFiscal?.data_emissao || new Date().toISOString();
    campos.push(formatarAlfaERP(formatarDataERP(dataNF)));
    const estado = cliente?.estado || "SP";
    campos.push(formatarAlfaERP(estado));
    const serie = notaFiscal?.serie || "1";
    campos.push(formatarAlfaERP(serie));
    const especie = notaFiscal?.especie || "NF";
    campos.push(formatarAlfaERP(especie));
    const modelo = notaFiscal?.modelo || "55";
    campos.push(formatarAlfaERP(modelo));
    const natureza = notaFiscal?.natureza_operacao || "1102000";
    campos.push(formatarAlfaERP(natureza));
    campos.push(formatarAlfaERP(""));
    campos.push(formatarAlfaERP(""));
    campos.push(formatarAlfaERP(""));
    const valor = parcela.valor_parcela - (parcela.valor_pago || 0);
    campos.push(formatarNumeroDecimalERP(valor));
    campos.push(formatarAlfaERP(formatarDataERP(parcela.data_vencimento)));
    campos.push(formatarAlfaERP(parcela.status));
    const observacao = `Parcela ${parcela.numero_parcela} - Pedido ${prePedidoId}`;
    campos.push(formatarAlfaERP(observacao));
    return campos.join(",");
  };

  const gerarArquivoTXT = (): string => {
    const parcelasPendentes = parcelas.filter(p => p.status!== "pago");
    return parcelasPendentes.map(p => gerarLinhaDuplicata(p)).join("\n");
  };

  const downloadArquivo = (conteudo: string, nomeArquivo: string) => {
    const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportar = async () => {
    if (parcelas.length === 0) {
      Swal.fire({ icon: "warning", title: "Nenhuma parcela", text: "Não há parcelas para exportar." });
      return;
    }
    const parcelasPendentes = parcelas.filter(p => p.status!== "pago");
    if (parcelasPendentes.length === 0) {
      Swal.fire({ icon: "info", title: "Todas pagas", text: "Todas as parcelas já estão pagas." });
      return;
    }
    setExportando(true);
    try {
      const conteudo = gerarArquivoTXT();
      const dataAtual = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const nomeArquivo = `duplicatas_${getClienteDocumento()}_${dataAtual}.txt`;
      downloadArquivo(conteudo, nomeArquivo);
      Swal.fire({ icon: "success", title: "Exportado!", text: `${parcelasPendentes.length} duplicata(s)`, timer: 3000, showConfirmButton: false });
      onExportSuccess?.();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Erro", text: "Não foi possível gerar o arquivo." });
    } finally {
      setExportando(false);
    }
  };

  // AGORA É SÓ CONTEÚDO, SEM BOTÃO INTERMEDIÁRIO
  return (
    <div className="bg-white rounded-lg w-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <FileText className="mr-2" size={18} />
          Exportar Duplicatas para ERP
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4">
          Configure o tipo de movimento:
        </p>
        <div className="space-y-3">
          {tiposMovimento.map((tipo) => (
            <label key={tipo.value} className={`flex items-start p-3 border rounded-lg cursor-pointer ${tipoMovimento === tipo.value? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
              <input type="radio" name="tipoMovimento" value={tipo.value} checked={tipoMovimento === tipo.value} onChange={() => setTipoMovimento(tipo.value as any)} className="mt-1 mr-3" />
              <div>
                <div className="font-medium text-sm">{tipo.label}</div>
                <div className="text-xs text-gray-500">{tipo.descricao}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <strong>Resumo:</strong> {parcelas.filter(p => p.status!== "pago").length} duplicata(s) - {cliente?.razao_social || cliente?.nome || "cliente"}
        </div>
      </div>

      <div className="flex justify-end gap-3 p-4 border-t">
        <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
        <button onClick={handleExportar} disabled={exportando} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
          {exportando? "Gerando..." : <><Download size={16} className="mr-2" />Exportar</>}
        </button>
      </div>
    </div>
  );
}