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
  tipo_cliente?: string;
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
  ufEmitente?: string;
  codigoFilial?: string;
  disabled?: boolean;
  onExportSuccess?: () => void;
  onClose?: () => void;
}

export function ExportarDuplicatasERP({
  parcelas,
  cliente,
  notaFiscal,
  prePedidoId,
  ufEmitente = "SC",
  codigoFilial = "617",
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

  const somenteDigitos = (v?: string | null): string => (v || "").replace(/\D/g, "");

  const formatarNumero = (v: number | string, tamanho: number): string => {
    const n = somenteDigitos(String(v));
    return n.padStart(tamanho, "0").slice(-tamanho);
  };

  const formatarDataSCI = (d: string | Date | null | undefined): string => {
    if (!d) return "";
    const dt = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dt.getTime())) return "";
    const a = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const dia = String(dt.getDate()).padStart(2, "0");
    return `${a}${m}${dia}`;
  };

  const formatarValorSCI = (valor: number): string => {
    const abs = Math.abs(valor);
    const int = Math.floor(abs);
    const cent = Math.round((abs - int) * 100);
    const sinal = valor < 0 ? "-" : "";
    return `${sinal}${String(int).padStart(15, "0")}.${String(cent).padStart(2, "0")}`;
  };

  const aspas = (v?: string | null): string => {
    if (v === null || v === undefined) return '""';
    const limpo = String(v).replace(/"/g, '""').replace(/\r?\n/g, " ").trim();
    return `"${limpo}"`;
  };

  const tipoMovimentoSCI = (): string => {
    if (tipoMovimento === "S") return "PS";
    if (tipoMovimento === "E") return "PE";
    if (tipoMovimento === "R") return "PR";
    return "PD";
  };

  const statusSCI = (status: string): string => {
    const map: Record<string, string> = {
      pendente: "P",
      pago: "Q",
      atrasado: "A",
      cancelado: "C",
      parcial: "R",
    };
    return map[status?.toLowerCase()] || "P";
  };

  const cfopSCI = (ufDest: string): string => {
    const ue = (ufEmitente || "").toUpperCase();
    const ud = (ufDest || "").toUpperCase();
    const interestadual = ue && ud && ue !== ud;

    if (tipoMovimento === "S") {
      return interestadual ? "6101000" : "5101000";
    }
    if (tipoMovimento === "E") {
      return interestadual ? "2101000" : "1101000";
    }
    return interestadual ? "6101000" : "5101000";
  };

  const getClienteNome = (): string => {
    if (!cliente) return "Cliente não informado";
    if (cliente.tipo_cliente === "juridica" && cliente.razao_social) return cliente.razao_social;
    if (cliente.razao_social) return cliente.razao_social;
    const nome = `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim();
    return nome || cliente.nome_fantasia || "Cliente";
  };

  const getClienteDocumento = (): string => {
    if (!cliente) return "";
    if (cliente.tipo_cliente === "juridica") return cliente.cnpj || cliente.cpf || "";
    return cliente.cpf || cliente.cnpj || "";
  };

  const getClienteUF = (): string => {
    const uf = (cliente?.estado || "").trim().toUpperCase();
    return uf.length === 2 ? uf : "";
  };

  const gerarLinhaSCI = (parcela: Parcela): string => {
    const campos: string[] = [];

    campos.push(formatarNumero(parcela.numero_parcela, 2));
    campos.push(aspas(tipoMovimentoSCI()));
    campos.push(aspas(somenteDigitos(getClienteDocumento())));
    campos.push(formatarNumero(somenteDigitos(cliente?.inscricao_estadual || ""), 16));

    const numNF = somenteDigitos(notaFiscal?.numero_nf || "0");
    campos.push(formatarNumero(numNF, 9));
    campos.push(formatarNumero(numNF, 9));

    const dataEmissao = notaFiscal?.data_emissao
      ? formatarDataSCI(notaFiscal.data_emissao)
      : formatarDataSCI(new Date());
    campos.push(aspas(dataEmissao));

    const ufDest = getClienteUF();
    campos.push(aspas(ufDest));
    campos.push(aspas(notaFiscal?.serie || "1"));
    campos.push(aspas("NFe"));
    campos.push(aspas(notaFiscal?.modelo || "55"));
    campos.push(aspas(cfopSCI(ufDest)));
    campos.push(aspas(codigoFilial));
    campos.push(aspas("16"));

    const totalParcelas = parcelas.length || 1;
    const descricao = `${formatarNumero(parcela.numero_parcela, 2)}/${formatarNumero(totalParcelas, 2)} Entr`;
    campos.push(aspas(descricao));

    const valorLiquido = (parcela.valor_parcela || 0) - (parcela.valor_pago || 0);
    campos.push(formatarValorSCI(valorLiquido));
    campos.push(aspas(""));
    campos.push(aspas(formatarDataSCI(parcela.data_vencimento)));
    campos.push(formatarNumero("0", 15));

    for (let i = 0; i < 8; i++) {
      campos.push("00000000000000.00");
    }

    campos.push(aspas(statusSCI(parcela.status)));
    campos.push(formatarNumero(parcela.numero_parcela, 3));

    return campos.join(",");
  };

  const gerarArquivoTXT = (): string => {
    const pendentes = parcelas.filter((p) => p.status !== "pago");
    return pendentes.map((p) => gerarLinhaSCI(p)).join("\n");
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

    const pendentes = parcelas.filter((p) => p.status !== "pago");
    if (pendentes.length === 0) {
      Swal.fire({ icon: "info", title: "Todas pagas", text: "Todas as parcelas já estão pagas." });
      return;
    }

    if (!cliente) {
      Swal.fire({ icon: "error", title: "Cliente não encontrado", text: "Não foi possível identificar o cliente do pedido." });
      return;
    }

    const uf = getClienteUF();
    if (!uf) {
      Swal.fire({
        icon: "error",
        title: "UF do cliente não cadastrada",
        html: `O cliente <b>${getClienteNome()}</b> (${getClienteDocumento() || "documento não informado"}) não tem <b>UF</b> cadastrada.<br><br>Corrija o cadastro antes de exportar.`,
      });
      return;
    }

    if (!getClienteDocumento()) {
      Swal.fire({ icon: "error", title: "Documento não cadastrado", text: `O cliente ${getClienteNome()} não tem CPF/CNPJ cadastrado.` });
      return;
    }

    setExportando(true);
    try {
      const conteudo = gerarArquivoTXT();
      const dataAtual = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const docLimpo = somenteDigitos(getClienteDocumento());
      const nomeArquivo = `duplicatas_${docLimpo}_${dataAtual}.txt`;

      downloadArquivo(conteudo, nomeArquivo);

      Swal.fire({
        icon: "success",
        title: "Exportado!",
        text: `${pendentes.length} duplicata(s) exportada(s).`,
        timer: 3000,
        showConfirmButton: false,
      });

      onExportSuccess?.();
    } catch (e) {
      console.error("Erro ao gerar arquivo:", e);
      Swal.fire({ icon: "error", title: "Erro na exportação", text: "Não foi possível gerar o arquivo." });
    } finally {
      setExportando(false);
    }
  };

  const ufCliente = getClienteUF();

  return (
    <div className="bg-white rounded-lg w-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          <FileText className="mr-2" size={18} />
          Exportar Duplicatas para ERP
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Fechar">
          <X size={20} />
        </button>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 mb-4">Configure o tipo de movimento:</p>

        <div className="space-y-3">
          {tiposMovimento.map((tipo) => (
            <label
              key={tipo.value}
              className={`flex items-start p-3 border rounded-lg cursor-pointer ${
                tipoMovimento === tipo.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
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
                <div className="font-medium text-sm">{tipo.label}</div>
                <div className="text-xs text-gray-500">{tipo.descricao}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1">
          <div><strong>Cliente:</strong> {getClienteNome()}</div>
          <div><strong>Documento:</strong> {getClienteDocumento() || <span className="text-red-600 font-semibold">não cadastrado</span>}</div>
          <div>
            <strong>UF:</strong>{" "}
            {ufCliente ? (
              <span className="text-green-700 font-semibold">{ufCliente}</span>
            ) : (
              <span className="text-red-600 font-semibold">não cadastrada</span>
            )}
          </div>
          <div><strong>Duplicatas:</strong> {parcelas.filter((p) => p.status !== "pago").length}</div>
          <div><strong>Tipo SCI:</strong> {tipoMovimentoSCI()} | <strong>CFOP:</strong> {cfopSCI(ufCliente)}</div>
        </div>

        {!ufCliente && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            O cliente não tem <b>UF</b> cadastrada. A exportação está bloqueada até que o cadastro seja corrigido.
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 p-4 border-t">
        <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
          Cancelar
        </button>
        <button
          onClick={handleExportar}
          disabled={exportando || !ufCliente}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {exportando ? "Gerando..." : (<><Download size={16} className="mr-2" />Exportar</>)}
        </button>
      </div>
    </div>
  );
}