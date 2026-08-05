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
  onClose?: () => void
}

export function ExportarDuplicatasERP({
  parcelas,
  cliente,
  notaFiscal,
  prePedidoId,
  disabled = false,
  onExportSuccess,
}: ExportarDuplicatasERPProps) {
  const [exportando, setExportando] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState<"E" | "S" | "R" | "D">("S");
  const [mostrarModal, setMostrarModal] = useState(false);

  // Mapeamento de tipo de movimento
  const tiposMovimento = [
    { value: "E", label: "Entradas", descricao: "Notas fiscais de entrada (compras)" },
    { value: "S", label: "Saídas", descricao: "Notas fiscais de saída (vendas)" },
    { value: "R", label: "Serviços", descricao: "Notas fiscais de serviços" },
    { value: "D", label: "Demais Documentos", descricao: "Outros documentos" },
  ];

  // Formatar CNPJ/CPF (apenas números)
  const formatarDocumento = (doc?: string): string => {
    if (!doc) return "00.000.000/0000-00";
    return doc.replace(/\D/g, "");
  };

  // Formatar valor para o padrão do ERP (ponto como separador decimal)
  const formatarValorERP = (valor: number): string => {
    return valor.toFixed(2).replace(",", ".");
  };

  // Formatar data para o padrão do ERP (YYYYMMDD)
  const formatarDataERP = (data: string | Date): string => {
    const dataObj = typeof data === "string" ? new Date(data) : data;
    const ano = dataObj.getFullYear();
    const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
    const dia = String(dataObj.getDate()).padStart(2, "0");
    return `${ano}${mes}${dia}`;
  };

  // Formatar campo numérico com zeros à esquerda
  const formatarNumeroERP = (valor: number | string, tamanho: number): string => {
    const num = String(valor).replace(/\D/g, "");
    return num.padStart(tamanho, "0").slice(-tamanho);
  };

  // Formatar campo alfanumérico (entre aspas)
  const formatarAlfaERP = (valor: string | null | undefined): string => {
    if (!valor) return '""';
    // Remove aspas internas e caracteres especiais problemáticos
    const limpo = valor.replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, "");
    return `"${limpo}"`;
  };

  // Formatar campo numérico com separador decimal
  const formatarNumeroDecimalERP = (valor: number): string => {
    return valor.toFixed(2).replace(",", ".");
  };

  // Obter nome do cliente
  const getClienteNome = (): string => {
    if (!cliente) return "Cliente não informado";
    if (cliente.razao_social) return cliente.razao_social;
    if (cliente.nome_fantasia) return cliente.nome_fantasia;
    return `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim();
  };

  // Obter documento do cliente
  const getClienteDocumento = (): string => {
    if (!cliente) return "";
    return cliente.cnpj || cliente.cpf || "";
  };

  // Gerar linha do arquivo TXT para uma parcela
  const gerarLinhaDuplicata = (parcela: Parcela, numeroLinha: number): string => {
    const campos: string[] = [];

    // 01 - Número da Parcela/Baixa (I, 2)
    campos.push(formatarNumeroERP(parcela.numero_parcela, 2));

    // 02 - Tipo do Movimento (A, 2)
    campos.push(formatarAlfaERP(tipoMovimento));

    // 03 - CNPJ ou CPF do Cliente/Fornecedor (A, 14)
    campos.push(formatarAlfaERP(getClienteDocumento()));

    // 04 - Inscrição Estadual do Cliente/Fornecedor (I, 16)
    const ie = cliente?.inscricao_estadual || "";
    campos.push(formatarNumeroERP(ie.replace(/\D/g, ""), 16));

    // 05 - Número da NF Inicial (I, 9)
    const numNF = notaFiscal?.numero_nf || "0";
    campos.push(formatarNumeroERP(numNF, 9));

    // 06 - Número da NF Final (I, 9)
    campos.push(formatarNumeroERP(numNF, 9));

    // 07 - Data da NF (A, 8)
    const dataNF = notaFiscal?.data_emissao || new Date().toISOString();
    campos.push(formatarAlfaERP(formatarDataERP(dataNF)));

    // 08 - Estado da NF (A, 2)
    const estado = cliente?.estado || "SP";
    campos.push(formatarAlfaERP(estado));

    // 09 - Série da NF (A, 4)
    const serie = notaFiscal?.serie || "1";
    campos.push(formatarAlfaERP(serie));

    // 10 - Espécie da NF (A, 4)
    const especie = notaFiscal?.especie || "NF";
    campos.push(formatarAlfaERP(especie));

    // 11 - Modelo da NF (A, 2)
    const modelo = notaFiscal?.modelo || "55";
    campos.push(formatarAlfaERP(modelo));

    // 12 - Natureza de Operação (A, 7)
    const natureza = notaFiscal?.natureza_operacao || "1102000";
    campos.push(formatarAlfaERP(natureza));

    // 13 - Conta Débito (A, 10) - para pagamento, deixar vazio
    campos.push(formatarAlfaERP(""));

    // 14 - Conta Crédito (A, 10) - para pagamento, deixar vazio
    campos.push(formatarAlfaERP(""));

    // 15 - Histórico da Operação (A, 10) - para pagamento, deixar vazio
    campos.push(formatarAlfaERP(""));

    // 16 - Valor da Duplicata/Pagamento (N, 14.2)
    const valor = parcela.valor_parcela - (parcela.valor_pago || 0);
    campos.push(formatarNumeroDecimalERP(valor));

    // 17 - Data do Vencimento (A, 8)
    campos.push(formatarAlfaERP(formatarDataERP(parcela.data_vencimento)));

    // 18 - Data do Pagamento (A, 8) - vazio para lançamento
    campos.push(formatarAlfaERP(""));

    // 19 - Número do Cheque (I, 15) - vazio
    campos.push(formatarNumeroERP("0", 15));

    // 20 - Número da Duplicata (A, 10)
    const numDuplicata = `${prePedidoId.slice(-6)}/${parcela.numero_parcela}`;
    campos.push(formatarAlfaERP(numDuplicata));

    // 21 - Número da promissória (A, 15) - vazio
    campos.push(formatarAlfaERP(""));

    // 22 - Número do recibo (A, 15) - vazio
    campos.push(formatarAlfaERP(""));

    // 23 - Retenção PIS (N, 14.2)
    campos.push("0.00");

    // 24 - Retenção COFINS (N, 14.2)
    campos.push("0.00");

    // 25 - Retenção CSLL (N, 14.2)
    campos.push("0.00");

    // 26 - Retenção IR (N, 14.2)
    campos.push("0.00");

    // 27 - Retenção INSS (N, 14.2)
    campos.push("0.00");

    // 28 - Retenção ISS (N, 14.2)
    campos.push("0.00");

    // 29 - Retenção Funrural (N, 14.2)
    campos.push("0.00");

    // 30 - Retenção Sest/Senat (N, 14.2)
    campos.push("0.00");

    // 31 - Tipo de baixa (A, 1) - "P" para pagamento, vazio para lançamento
    campos.push('""');

    // 32 - Ordem da baixa (I, 3)
    campos.push(formatarNumeroERP(parcela.status === "pago" ? "1" : "0", 3));

    // 33 - Data de emissão (A, 8)
    campos.push(formatarAlfaERP(formatarDataERP(new Date())));

    // 34 - Observação (A, 255)
    const observacao = `Parcela ${parcela.numero_parcela} - ${getClienteNome()}`;
    campos.push(formatarAlfaERP(observacao));

    return campos.join(",");
  };

  // Gerar arquivo completo
  const gerarArquivoTXT = (): string => {
    const linhas: string[] = [];

    // Filtrar apenas parcelas pendentes (não pagas)
    const parcelasPendentes = parcelas.filter(p => p.status !== "pago");

    parcelasPendentes.forEach((parcela, index) => {
      linhas.push(gerarLinhaDuplicata(parcela, index + 1));
    });

    return linhas.join("\n");
  };

  // Fazer download do arquivo
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

  // Handler principal de exportação
  const handleExportar = async () => {
    if (parcelas.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Nenhuma parcela",
        text: "Não há parcelas para exportar.",
      });
      return;
    }

    const parcelasPendentes = parcelas.filter(p => p.status !== "pago");
    if (parcelasPendentes.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Todas pagas",
        text: "Todas as parcelas já estão pagas. Não há duplicatas a enviar.",
      });
      return;
    }

    setExportando(true);

    try {
      const conteudo = gerarArquivoTXT();
      const dataAtual = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const nomeArquivo = `duplicatas_${getClienteDocumento()}_${dataAtual}.txt`;

      downloadArquivo(conteudo, nomeArquivo);

      Swal.fire({
        icon: "success",
        title: "Exportado com sucesso!",
        text: `Arquivo gerado com ${parcelasPendentes.length} duplicata(s).`,
        timer: 3000,
        showConfirmButton: false,
      });

      onExportSuccess?.();
      setMostrarModal(false);
    } catch (error) {
      console.error("Erro ao gerar arquivo:", error);
      Swal.fire({
        icon: "error",
        title: "Erro na exportação",
        text: "Não foi possível gerar o arquivo. Tente novamente.",
      });
    } finally {
      setExportando(false);
    }
  };

  // Modal de configuração
  const ModalConfiguracao = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Exportar Duplicatas para ERP</h3>
          <button
            onClick={() => setMostrarModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Configure o tipo de movimento para as duplicatas:
          </p>

          <div className="space-y-3">
            {tiposMovimento.map((tipo) => (
              <label
                key={tipo.value}
                className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                  tipoMovimento === tipo.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="tipoMovimento"
                  value={tipo.value}
                  checked={tipoMovimento === tipo.value}
                  onChange={() => setTipoMovimento(tipo.value as any)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium">{tipo.label}</div>
                  <div className="text-xs text-gray-500">{tipo.descricao}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500">
              <strong>Resumo:</strong> Serão exportadas{" "}
              {parcelas.filter(p => p.status !== "pago").length} duplicata(s)
              para o cliente{" "}
              {cliente?.razao_social || cliente?.nome || "não informado"}.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t">
          <button
            onClick={() => setMostrarModal(false)}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {exportando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Exportar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMostrarModal(true)}
        disabled={disabled || parcelas.length === 0}
        className={`
          inline-flex items-center px-3 py-2 rounded-md text-sm font-medium
          transition-colors
          ${
            disabled || parcelas.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }
        `}
        title="Exportar duplicatas para ERP"
      >
        <FileText size={16} className="mr-2" />
        Exportar para ERP
      </button>

      {mostrarModal && <ModalConfiguracao />}
    </>
  );
}