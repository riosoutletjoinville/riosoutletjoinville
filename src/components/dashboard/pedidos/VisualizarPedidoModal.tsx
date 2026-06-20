// src/components/dashboard/pedidos/VisualizarPedidoModal.tsx
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState, useEffect } from "react";
import { X, Package, User, Calendar, DollarSign, Truck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface VisualizarPedidoModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: string;
}

interface PedidoDetalhado {
  id: string;
  total: number;
  status: string;
  data_pedido: string;
  condicao_pagamento: string;
  observacoes: string;
  local_trabalho_ped: string;
  vendedor_nome: string;
  vendedor_email: string;
  vendedor_telefone: string;
  origem_pedido: string;
  tipo_checkout: string;
  payment_id: string;
  frete_valor: number;
  frete_gratis: boolean;
  cep_entrega: string;
  opcao_frete: string;
  prazo_entrega: string;
  cliente: {
    razao_social: string;
    nome_fantasia: string;
    cnpj: string;
    nome: string;
    sobrenome: string;
    cpf: string;
    email: string;
    telefone: string;
    cidade: string;
    estado: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
  };
  itens: Array<{
    id: string;
    quantidade: number;
    preco_unitario: number;
    subtotal: number;
    desconto: number;
    filial: string;
    embargue: string;
    tamanhos: Record<string, number>;
    produto: {
      id: string;
      titulo: string;
      preco_prod: number;
      modelo_prod: string;
    };
  }>;
}

export default function VisualizarPedidoModal({
  isOpen,
  onClose,
  pedidoId,
}: VisualizarPedidoModalProps) {
  const [pedido, setPedido] = useState<PedidoDetalhado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && pedidoId) {
      carregarPedido();
    }
  }, [isOpen, pedidoId]);

  const carregarPedido = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `
          *,
          cliente:clientes (
            razao_social,
            nome_fantasia,
            cnpj,
            nome,
            sobrenome,
            cpf,
            email,
            telefone,
            cidade,
            estado,
            endereco,
            numero,
            complemento,
            bairro
          ),
          itens:pedido_itens (
            id,
            quantidade,
            preco_unitario,
            subtotal,
            desconto,
            filial,
            embargue,
            tamanhos,
            produto:produtos (
              id,
              titulo,
              preco_prod,
              modelo_prod
            )
          )
        `
        )
        .eq("id", pedidoId)
        .single();

      if (error) throw error;
      setPedido(data as PedidoDetalhado);
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pago: "bg-green-100 text-green-800",
      pendente: "bg-yellow-100 text-yellow-800",
      cancelado: "bg-red-100 text-red-800",
      processando: "bg-blue-100 text-blue-800",
      autorizado: "bg-purple-100 text-purple-800",
      em_mediacao: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatarStatus = (status: string) => {
    const labels: Record<string, string> = {
      pago: "Pago",
      pendente: "Pendente",
      cancelado: "Cancelado",
      processando: "Processando",
      autorizado: "Autorizado",
      em_mediacao: "Em Mediação",
    };
    return labels[status] || status;
  };

  const getClienteNome = () => {
    if (!pedido?.cliente) return "Cliente não encontrado";
    const { razao_social, nome_fantasia, nome, sobrenome } = pedido.cliente;
    return (
      razao_social ||
      nome_fantasia ||
      `${nome || ""} ${sobrenome || ""}`.trim() ||
      "Cliente sem nome"
    );
  };

  const getClienteDocumento = () => {
    if (!pedido?.cliente) return "Documento não informado";
    const { cnpj, cpf } = pedido.cliente;
    if (cnpj) return `CNPJ: ${cnpj}`;
    if (cpf) return `CPF: ${cpf}`;
    return "Documento não informado";
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-xl font-semibold text-white">
                      Detalhes do Pedido
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">
                    Pedido #{pedido?.id.slice(-8)}
                  </p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : pedido ? (
                    <div className="space-y-6">
                      {/* Status e Informações Básicas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-5 w-5 text-gray-500" />
                            <h3 className="font-medium text-gray-900">
                              Status do Pedido
                            </h3>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              pedido.status
                            )}`}
                          >
                            {formatarStatus(pedido.status)}
                          </span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-gray-500" />
                            <h3 className="font-medium text-gray-900">
                              Data do Pedido
                            </h3>
                          </div>
                          <p className="text-gray-700">
                            {formatarData(pedido.data_pedido)}
                          </p>
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <h3 className="font-medium text-gray-900">
                            Informações do Cliente
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-sm text-gray-500">Nome</p>
                            <p className="text-gray-900 font-medium">
                              {getClienteNome()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Documento</p>
                            <p className="text-gray-900">
                              {getClienteDocumento()}
                            </p>
                          </div>
                          {pedido.cliente?.email && (
                            <div>
                              <p className="text-sm text-gray-500">E-mail</p>
                              <p className="text-gray-900">
                                {pedido.cliente.email}
                              </p>
                            </div>
                          )}
                          {pedido.cliente?.telefone && (
                            <div>
                              <p className="text-sm text-gray-500">Telefone</p>
                              <p className="text-gray-900">
                                {pedido.cliente.telefone}
                              </p>
                            </div>
                          )}
                          {(pedido.cliente?.endereco ||
                            pedido.cliente?.cidade) && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">Endereço</p>
                              <p className="text-gray-900">
                                {[
                                  pedido.cliente.endereco,
                                  pedido.cliente.numero,
                                  pedido.cliente.complemento,
                                  pedido.cliente.bairro,
                                  pedido.cliente.cidade,
                                  pedido.cliente.estado,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Frete e Pagamento */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pedido.origem_pedido === "ecommerce" && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Truck className="h-5 w-5 text-gray-500" />
                              <h3 className="font-medium text-gray-900">
                                Informações de Frete
                              </h3>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-gray-500">Valor:</span>{" "}
                                R$ {pedido.frete_valor?.toFixed(2) || "0,00"}
                              </p>
                              {pedido.frete_gratis && (
                                <p className="text-green-600">Frete Grátis</p>
                              )}
                              {pedido.opcao_frete && (
                                <p>
                                  <span className="text-gray-500">
                                    Transportadora:
                                  </span>{" "}
                                  {pedido.opcao_frete}
                                </p>
                              )}
                              {pedido.prazo_entrega && (
                                <p>
                                  <span className="text-gray-500">
                                    Prazo:
                                  </span>{" "}
                                  {pedido.prazo_entrega}
                                </p>
                              )}
                              {pedido.cep_entrega && (
                                <p>
                                  <span className="text-gray-500">CEP:</span>{" "}
                                  {pedido.cep_entrega}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-gray-500" />
                            <h3 className="font-medium text-gray-900">
                              Pagamento
                            </h3>
                          </div>
                          <div className="space-y-1">
                            <p>
                              <span className="text-gray-500">
                                Condição:
                              </span>{" "}
                              {pedido.condicao_pagamento}
                            </p>
                            {pedido.tipo_checkout && (
                              <p>
                                <span className="text-gray-500">
                                  Tipo Checkout:
                                </span>{" "}
                                {pedido.tipo_checkout}
                              </p>
                            )}
                            {pedido.payment_id && (
                              <p>
                                <span className="text-gray-500">
                                  Payment ID:
                                </span>{" "}
                                <span className="text-xs font-mono">
                                  {pedido.payment_id}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Itens do Pedido */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-3">
                          Itens do Pedido
                        </h3>
                        <div className="space-y-3">
                          {pedido.itens?.map((item) => (
                            <div
                              key={item.id}
                              className="border-b border-gray-200 last:border-0 pb-3 last:pb-0"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">
                                    {item.produto?.titulo || "Produto"}
                                  </p>
                                  <div className="text-sm text-gray-500 mt-1">
                                    <p>Quantidade: {item.quantidade}</p>
                                    <p>
                                      Preço unitário: R${" "}
                                      {item.preco_unitario.toFixed(2)}
                                    </p>
                                    {item.tamanhos &&
                                      Object.keys(item.tamanhos).length > 0 && (
                                        <p>
                                          Tamanhos:{" "}
                                          {Object.entries(item.tamanhos)
                                            .map(
                                              ([tamanho, qtd]) =>
                                                `${tamanho}: ${qtd}`
                                            )
                                            .join(", ")}
                                        </p>
                                      )}
                                    {item.filial && (
                                      <p>Filial: {item.filial}</p>
                                    )}
                                    {item.embargue && (
                                      <p>Embargue: {item.embargue}</p>
                                    )}
                                    {item.desconto > 0 && (
                                      <p className="text-green-600">
                                        Desconto: R$ {item.desconto.toFixed(2)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-gray-900">
                                    Subtotal: R$ {item.subtotal.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900">
                              Total do Pedido:
                            </span>
                            <span className="text-2xl font-bold text-blue-600">
                              R$ {pedido.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Observações */}
                      {pedido.observacoes && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">
                            Observações
                          </h3>
                          <p className="text-gray-700">{pedido.observacoes}</p>
                        </div>
                      )}

                      {/* Vendedor */}
                      {(pedido.vendedor_nome ||
                        pedido.vendedor_email ||
                        pedido.vendedor_telefone) && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">
                            Vendedor Responsável
                          </h3>
                          <div className="space-y-1 text-sm">
                            {pedido.vendedor_nome && (
                              <p>
                                <span className="text-gray-500">Nome:</span>{" "}
                                {pedido.vendedor_nome}
                              </p>
                            )}
                            {pedido.vendedor_email && (
                              <p>
                                <span className="text-gray-500">E-mail:</span>{" "}
                                {pedido.vendedor_email}
                              </p>
                            )}
                            {pedido.vendedor_telefone && (
                              <p>
                                <span className="text-gray-500">Telefone:</span>{" "}
                                {pedido.vendedor_telefone}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        Erro ao carregar dados do pedido
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}