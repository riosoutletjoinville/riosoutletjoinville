// components/dashboard/pedidos/PrePedidoPreview.tsx
"use client";
import { useState, useEffect } from "react";
import { X, FileText, Download, Printer } from "lucide-react";
import Image from "next/image";
import { generatePDF } from "@/lib/generatePDF";
import { Cliente, ItemPedido } from "./PrePedidoModal";
import Swal from "sweetalert2";
import { supabase } from "@/lib/supabase";

// Adicionar interface Usuario
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  local_trabalho?: string;
  phone?: string;
}

export interface TipoPedido {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  icone?: string;
  requer_justificativa: boolean;
  afeta_estoque: boolean;
  ativo: boolean;
  created_at: string;
}

export interface PrePedidoPreviewProps {
  isOpen: boolean;
  cliente: Cliente | null;
  itens: ItemPedido[];
  total: number;
  observacoes: string;
  condicaoPagamento: string;
  status?: string;
  usuario?: Usuario | null;
  localTrabalho?: string;
  pedidoAnterior?: {
    id: string;
    saldo_restante: number;
  };
  saldoPedidoAnterior?: number;
  valorProdutosNovos?: number;
  onClose: () => void;
  onEdit: () => void;
  onConfirm: (tipoPedidoId: string, justificativaTipo: string) => void;
  onCancel: () => void;
}

export default function PrePedidoPreview({
  isOpen,
  cliente,
  itens,
  total,
  observacoes,
  condicaoPagamento,
  status = "confirmado",
  usuario,
  localTrabalho,
  pedidoAnterior,
  saldoPedidoAnterior = 0,
  valorProdutosNovos = 0,
  onClose,
  onConfirm,
  onEdit,
  onCancel,
}: PrePedidoPreviewProps) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [tiposPedido, setTiposPedido] = useState<TipoPedido[]>([]);
  const [tipoPedidoSelecionado, setTipoPedidoSelecionado] =
    useState<TipoPedido | null>(null);
  const [justificativaTipo, setJustificativaTipo] = useState("");

  const calcularValorProdutosNovos = (): number => {
    if (valorProdutosNovos && valorProdutosNovos > 0) return valorProdutosNovos;
    return itens.reduce(
      (sum: number, item: ItemPedido) => sum + item.subtotal,
      0
    );
  };

  const valorProdutos: number = calcularValorProdutosNovos();
  const temPedidoAnterior: boolean = (saldoPedidoAnterior || 0) > 0;

  const handleConfirm = async () => {
    if (!onConfirm) return;

    if (!tipoPedidoSelecionado) {
      Swal.fire("Atenção", "Por favor, selecione o tipo do pedido.", "warning");
      return;
    }

    if (
      tipoPedidoSelecionado.requer_justificativa &&
      !justificativaTipo.trim()
    ) {
      Swal.fire(
        "Atenção",
        "Por favor, informe a justificativa para este tipo de pedido.",
        "warning"
      );
      return;
    }

    setLoading(true);
    try {
      await onConfirm(tipoPedidoSelecionado.id, justificativaTipo);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setLoading(true);
    try {
      await onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!cliente) return;
    setExporting(true);
    try {
      await generatePDF(
        {
          cliente: cliente!,
          itens,
          total,
          observacoes,
          condicaoPagamento,
          numeroPedido: `PP-${Date.now()}`,
          vendedor: usuario || undefined,
          localTrabalho: localTrabalho || "",
        },
        "PREVIEW"
      );
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      Swal.fire("Erro", "Não foi possível exportar o PDF", "error");
    } finally {
      setExporting(false);
    }
  };

  const loadTiposPedido = async () => {
    try {
      const { data, error } = await supabase
        .from("tipos_pedido")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;

      const tipos = data || [];
      setTiposPedido(tipos);

      if (tipos.length > 0 && !tipoPedidoSelecionado) {
        const tipoPadrao =
          tipos.find((tipo) => tipo.nome === "venda_normal") || tipos[0];
        setTipoPedidoSelecionado(tipoPadrao);
      }
    } catch (error) {
      console.error("Erro ao carregar tipos de pedido:", error);
    }
  };

  const handleClose = () => {
    setTipoPedidoSelecionado(null);
    setJustificativaTipo("");
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      loadTiposPedido();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho Fixo com Botões */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                Pré-Pedido - Visualização
              </h2>
              {status && (
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    status
                  )}`}
                >
                  {status.toUpperCase()}
                </span>
              )}
            </div>

            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Botões de Ação no Cabeçalho */}
          <div className="flex flex-wrap gap-3 justify-between items-center">
            {/*<div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <Download size={16} className="mr-2" />
                {exporting ? "Exportando..." : "Exportar PDF"}
              </button>

              {status === "rascunho" && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Editar
                </button>
              )}
            </div>*/}

            <div className="flex gap-2">
              {/* Botão de cancelamento - visível apenas para status rascunho/confirmado */}
              {(status === "rascunho" || status === "confirmado") && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Cancelando..." : "Cancelar Pré-Pedido"}
                </button>
              )}

              {/* Botão de confirmar - visível apenas para status confirmado */}
              {status === "confirmado" && (
                <button
                  onClick={handleConfirm}
                  disabled={
                    !cliente ||
                    itens.length === 0 ||
                    loading ||
                    !tipoPedidoSelecionado ||
                    (tipoPedidoSelecionado.requer_justificativa &&
                      !justificativaTipo.trim())
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  <FileText size={16} className="mr-2" />
                  {loading ? "Confirmando..." : "Confirmar Pedido"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Cabeçalho com informações do cliente */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Cliente</h3>
            {cliente ? (
              <div>
                {cliente.tipo_cliente === "juridica" ? (
                  <>
                    <p className="font-semibold">{cliente.razao_social}</p>
                    {cliente.nome_fantasia && (
                      <p className="text-sm text-gray-600">
                        Nome fantasia: {cliente.nome_fantasia}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      CNPJ: {cliente.cnpj}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">
                      {cliente.nome} {cliente.sobrenome}
                    </p>
                    <p className="text-sm text-gray-600">CPF: {cliente.cpf}</p>
                  </>
                )}
                <p className="text-sm text-gray-600">Email: {cliente.email}</p>
                <p className="text-sm text-gray-600">
                  Telefone: {cliente.telefone}
                </p>
                {cliente.endereco && (
                  <p className="text-sm text-gray-600">
                    {cliente.endereco}
                    {cliente.numero && `, ${cliente.numero}`}
                    {cliente.complemento && ` - ${cliente.complemento}`}
                    {cliente.bairro && `, ${cliente.bairro}`}
                    {cliente.cidade && `, ${cliente.cidade}`}
                    {cliente.estado && ` - ${cliente.estado}`}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-600">Nenhum cliente selecionado</p>
            )}
          </div>

          {/* Usuário Responsável */}
          {usuario && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Usuário Responsável</h3>
              <div>
                <p className="font-semibold">{usuario.nome}</p>
                <p className="text-sm text-gray-600">Email: {usuario.email}</p>
                {usuario.phone && (
                  <p className="text-sm text-gray-600">
                    Telefone: {usuario.phone}
                  </p>
                )}
                <p className="text-sm text-gray-600">Tipo: {usuario.tipo}</p>
                {usuario.local_trabalho && (
                  <p className="text-sm text-gray-600">
                    Local: {usuario.local_trabalho}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Local de Trabalho */}
          {localTrabalho && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Local de Trabalho</h3>
              <p>{localTrabalho}</p>
            </div>
          )}

          {/* Pedido Anterior Vinculado */}
          {temPedidoAnterior && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium mb-3 text-blue-800">
                Pedido Anterior Vinculado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número do Pedido</p>
                  <p className="font-semibold">{pedidoAnterior?.id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    Saldo Restante Incluído
                  </p>
                  <p className="font-semibold text-blue-600">
                    R$ {saldoPedidoAnterior.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Condição de Pagamento */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Condição de Pagamento</h3>
            <p className="font-semibold">
              {condicaoPagamento || "Não especificada"}
            </p>
          </div>

          {/* Observações */}
          {observacoes && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Observações</h3>
              <p className="whitespace-pre-wrap">{observacoes}</p>
            </div>
          )}

          {/* Itens do pedido */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Itens do Pedido</h3>
            {itens.length === 0 ? (
              <p className="text-red-600">Nenhum item adicionado</p>
            ) : (
              <div className="space-y-3">
                {itens.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-1">
                        {item.produto.imagem_principal && (
                          <Image
                            src={item.produto.imagem_principal}
                            alt={item.produto.titulo}
                            width={64}
                            height={64}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold">{item.produto.titulo}</p>
                          <p className="text-sm text-gray-600">
                            Código: {item.produto.codigo} | NCM:{" "}
                            {item.produto.ncm}
                          </p>
                          <p className="text-sm">
                            {Object.entries(item.tamanhos)
                              .filter(([_, qtd]) => qtd > 0)
                              .map(([tamanho, qtd]) => `${tamanho}: ${qtd}`)
                              .join(", ")}
                          </p>
                          <p className="text-sm text-gray-600">
                            Desconto: {item.desconto}% | Filial: {item.filial} |
                            Embargue: {item.embargue}
                          </p>
                        </div>
                      </div>
                      <div className="text-right min-w-[120px]">
                        <p className="font-semibold">
                          R$ {item.subtotal.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          R$ {item.preco_unitario.toFixed(2)} ×{" "}
                          {item.quantidade}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumo Financeiro */}
          <div className="border-t pt-4 mb-6">
            <div className="space-y-2">
              {/* Valor dos Produtos Novos */}
              <div className="flex justify-between">
                <span className="text-gray-600">Valor dos Produtos:</span>
                <span className="font-medium">
                  R$ {valorProdutos.toFixed(2)}
                </span>
              </div>

              {/* Saldo do Pedido Anterior (se houver) */}
              {temPedidoAnterior && (
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Saldo do Pedido Anterior:
                  </span>
                  <span className="font-medium text-blue-600">
                    R$ {saldoPedidoAnterior.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Linha divisória se houver pedido anterior */}
              {temPedidoAnterior && <div className="border-t pt-2"></div>}

              {/* Total Geral */}
              <div className="flex justify-between items-center text-lg font-semibold pt-2">
                <span>Total a Parcelar:</span>
                <span className="text-xl">R$ {total.toFixed(2)}</span>
              </div>

              {/* Informação sobre a composição */}
              {temPedidoAnterior && (
                <p className="text-xs text-gray-500 mt-2">
                  * O total inclui {valorProdutos.toFixed(2)} em produtos novos
                  + {saldoPedidoAnterior.toFixed(2)} de saldo do pedido anterior
                </p>
              )}
            </div>
          </div>

          {/* Seção Tipo de Pedido */}
          <div className="w-full">
            <div className="mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Tipo de Pedido
              </h3>

              <div className="space-y-4">
                {/* Seleção do Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione o tipo do pedido
                  </label>
                  <select
                    value={tipoPedidoSelecionado?.id || ""}
                    onChange={(e) => {
                      const tipo = tiposPedido.find(
                        (t) => t.id === e.target.value
                      );
                      setTipoPedidoSelecionado(tipo || null);
                      if (!tipo?.requer_justificativa) {
                        setJustificativaTipo(""); // Limpar justificativa se não for necessária
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                  >
                    <option value="">Selecione o tipo...</option>
                    {tiposPedido.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Informações do Tipo Selecionado */}
                {tipoPedidoSelecionado && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{
                              backgroundColor: tipoPedidoSelecionado.cor,
                            }}
                          ></div>
                          <span className="font-semibold text-gray-900">
                            {tipoPedidoSelecionado.nome}
                          </span>
                        </div>
                        {tipoPedidoSelecionado.descricao && (
                          <p className="text-sm text-gray-600 mb-2">
                            {tipoPedidoSelecionado.descricao}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span
                            className={`px-2 py-1 rounded ${
                              tipoPedidoSelecionado.afeta_estoque
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tipoPedidoSelecionado.afeta_estoque
                              ? "Afeta estoque"
                              : "Não afeta estoque"}
                          </span>
                          {tipoPedidoSelecionado.requer_justificativa && (
                            <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                              Requer justificativa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Campo de Justificativa se necessário */}
                    {tipoPedidoSelecionado.requer_justificativa && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Justificativa *
                        </label>
                        <textarea
                          value={justificativaTipo}
                          onChange={(e) => setJustificativaTipo(e.target.value)}
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder={`Explique o motivo para pedido do tipo "${tipoPedidoSelecionado.nome}"...`}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Esta justificativa será registrada no histórico do
                          pedido.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Validação */}
                {tipoPedidoSelecionado?.requer_justificativa &&
                  !justificativaTipo.trim() && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Justificativa obrigatória para este tipo de pedido
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Função para obter a cor do status
const getStatusColor = (status: string) => {
  const colorMap: { [key: string]: string } = {
    rascunho: "bg-gray-100 text-gray-800",
    confirmado: "bg-blue-100 text-blue-800",
    convertido: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
  };
  return colorMap[status] || "bg-gray-100 text-gray-800";
};
