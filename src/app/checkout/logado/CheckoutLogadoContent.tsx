// src/app/checkout/logado/CheckoutLogadoContent.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ItemPedidoMP } from "@/types/mercadopago";
import { useCarrinho } from "@/hooks/useCarrinho";
import {
  Truck,
  Check,
  Edit2,
  ArrowLeft,
  Package,
  CreditCard,
  QrCode,
} from "lucide-react";
import Image from "next/image";
import { PixPayment } from "@/components/checkout/PixPayment";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

type EtapaCheckout = "revisao" | "pagamento" | "processando";

// Interface para os dados do cliente
interface ClienteLogado {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  cpf: string;
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  tipo_cliente: "fisica" | "juridica";
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  ativo: boolean;
  ativo_login: boolean;
}

function CheckoutLogado() {
  const router = useRouter();
  const {
    carrinho,
    totalComFrete,
    totalPreco,
    valorFrete,
    frete,
    limparCarrinho,
  } = useCarrinho();

  const [etapa, setEtapa] = useState<EtapaCheckout>("revisao");
  const [pedidoId, setPedidoId] = useState<string>("");
  const [preferenceId, setPreferenceId] = useState<string>("");
  const [mpLoaded, setMpLoaded] = useState(false);
  const [sdkLoading, setSdkLoading] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erroBrick, setErroBrick] = useState<string>("");

  // Estados para autenticação
  const [cliente, setCliente] = useState<ClienteLogado | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string>("");
  const [metodoPagamento, setMetodoPagamento] = useState<
    "cartao" | "pix" | null
  >(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bricksBuilder = useRef<any>(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const verificarAutenticacao = async () => {
      const token = localStorage.getItem("cliente_token");

      if (!token) {
        console.log("🔄 Sem token, redirecionando para checkout");
        router.push("/checkout");
        return;
      }

      try {
        console.log("🔍 Verificando token...");
        const response = await fetch("/api/clientes/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.user) {
          console.log("✅ Cliente autenticado:", data.user.email);
          setCliente(data.user);
        } else {
          console.log("❌ Token inválido, redirecionando para checkout");
          localStorage.removeItem("cliente_token");
          router.push("/checkout");
        }
      } catch (error) {
        console.error("❌ Erro ao verificar autenticação:", error);
        localStorage.removeItem("cliente_token");
        router.push("/checkout");
      } finally {
        setAuthLoading(false);
      }
    };

    verificarAutenticacao();
  }, [router]);

  // Redirecionar se carrinho vazio
  useEffect(() => {
    if (!authLoading && carrinho.length === 0 && etapa !== "pagamento") {
      router.push("/carrinho");
    }
  }, [carrinho, etapa, router, authLoading]);

  // Carregar SDK do Mercado Pago
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.MercadoPago) {
      setMpLoaded(true);
      return;
    }
    if (sdkLoading) return;

    setSdkLoading(true);
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("✅ SDK Mercado Pago carregado");
      setMpLoaded(true);
      setSdkLoading(false);
    };
    script.onerror = () => {
      console.error("❌ Erro ao carregar SDK");
      setSdkLoading(false);
    };
    document.body.appendChild(script);
  }, [sdkLoading]);

  // Converter itens do carrinho para formato MP
  const itensMP: ItemPedidoMP[] = carrinho.map((item) => ({
    id: item.id,
    produto_id: item.produto_id,
    titulo: item.titulo,
    preco_unitario: item.preco_unitario,
    quantidade: item.quantidade,
    variacao_id: item.variacao_id,
    imagem_url: item.imagem_url,
  }));

  // Iniciar checkout (criar pedido e preferência)
  const iniciarCheckout = async () => {
    if (!cliente) return;

    setProcessando(true);
    try {
      const dadosCliente = {
        email: cliente.email || "",
        nome: cliente.nome || cliente.razao_social || "",
        sobrenome: cliente.sobrenome || "",
        cpf: cliente.cpf || "",
        cnpj: cliente.cnpj || "",
        telefone: cliente.telefone || "",
        tipo_cliente: cliente.tipo_cliente,
        cep: cliente.cep || "",
        logradouro: cliente.endereco || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        estado: cliente.estado || "",
      };

      const pedidoData = {
        itens: itensMP,
        total: totalComFrete,
        subtotal: totalPreco,
        frete_valor: valorFrete,
        frete_nome: frete?.opcao_selecionada?.nome,
        frete_prazo: frete?.opcao_selecionada?.prazo,
        cliente_email: cliente.email,
        cliente_nome: cliente.nome || cliente.razao_social,
        cliente_id: cliente.id,
        tipo_checkout: "logado",
        cliente_dados: dadosCliente,
      };

      console.log("📤 Enviando pedido logado:", pedidoData);

      const response = await fetch("/api/mercadopago/checkout/logado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoData),
      });

      const resultado = await response.json();

      if (resultado.success) {
        setPedidoId(resultado.pedido_id);
        setPreferenceId(resultado.preference_id);
        setEtapa("pagamento");
      } else {
        alert("Erro ao processar checkout: " + resultado.error);
        setProcessando(false);
      }
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      alert("Erro ao processar pedido. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  };

  // Inicializar Brick de pagamento
  const inicializarBrick = async () => {
    if (!window.MercadoPago || !preferenceId) {
      console.error("❌ SDK ou preferenceId não disponível");
      return;
    }

    // Verificar se o container existe
    const container = document.getElementById("paymentBrick_container_logado");
    if (!container) {
      console.error("❌ Container do Brick não encontrado no DOM");
      return;
    }

    try {
      const mp = new window.MercadoPago(
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!,
        { locale: "pt-BR" },
      );

      if (container) {
        container.innerHTML = "";
      }

      await mp.bricks().create("payment", "paymentBrick_container_logado", {
        initialization: {
          preferenceId: preferenceId,
          amount: totalComFrete,
        },
        customization: {
          visual: { style: { theme: "default" } },
          paymentMethods: {
            creditCard: "all",
            bankTransfer: "all",
          },
        },
        callbacks: {
          onReady: () => {
            console.log("✅ Brick pronto");
            setErroBrick("");
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError: (error: any) => {
            console.error("❌ Erro no Brick:", error);
            setErroBrick(
              error.message || "Erro ao carregar opções de pagamento",
            );
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSubmit: (cardFormData: any) => {
            processarPagamento(cardFormData.formData);
          },
        },
      });
    } catch (error) {
      console.error("Erro ao inicializar Brick:", error);
      setErroBrick("Falha ao inicializar processador de pagamentos");
    }
  };

  // Processar pagamento
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processarPagamento = async (formData: any) => {
    setEtapa("processando");

    try {
      let cpfNumber = "";
      if (formData.payer?.identification?.number) {
        cpfNumber = formData.payer.identification.number;
      } else if (cliente?.cpf) {
        cpfNumber = cliente.cpf;
      }

      const paymentData = {
        transaction_amount: totalComFrete,
        token: formData.token,
        description: `Pedido #${pedidoId}`,
        installments: parseInt(formData.installments) || 1,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        external_reference: pedidoId,
        first_name: cliente?.nome || cliente?.razao_social || "Cliente",
        payer: {
          email: cliente?.email || formData.payer?.email,
          identification: {
            type: "CPF" as const,
            number: cpfNumber.replace(/\D/g, ""),
          },
        },
      };

      const response = await fetch("/api/mercadopago/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.success) {
        limparCarrinho();
        router.push(`/checkout/sucesso?pedido_id=${pedidoId}`);
      } else {
        alert(
          "Pagamento não aprovado: " + (result.error || "Erro desconhecido"),
        );
        setEtapa("pagamento");
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      alert("Erro ao processar pagamento. Tente novamente.");
      setEtapa("pagamento");
    }
  };

  // Inicializar Brick quando estiver na etapa de pagamento
  useEffect(() => {
  // Só inicializar o Brick se o método escolhido for CARTÃO
  if (etapa === "pagamento" && metodoPagamento === "cartao" && mpLoaded && preferenceId) {
    // Pequeno delay para garantir que o DOM foi renderizado
    const timer = setTimeout(() => {
      inicializarBrick();
    }, 100);
    return () => clearTimeout(timer);
  }
}, [etapa, metodoPagamento, mpLoaded, preferenceId]);

  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem("cliente_token");
    router.push("/checkout");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sua conta...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return null;
  }

  // Formatar nome completo para exibição
  const nomeCompleto =
    cliente.tipo_cliente === "fisica"
      ? `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim()
      : cliente.razao_social || cliente.nome_fantasia || "";

  const documento =
    cliente.tipo_cliente === "fisica" ? cliente.cpf : cliente.cnpj;
  const tipoDocumento = cliente.tipo_cliente === "fisica" ? "CPF" : "CNPJ";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com progresso */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/carrinho")}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
            <h1 className="text-xl font-bold">Finalizar Compra</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sair
            </button>
          </div>

          {/* Indicador de etapas */}
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  etapa === "revisao"
                    ? "bg-green-600 text-white"
                    : "bg-green-100 text-green-600"
                }`}
              >
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium">Revisão</span>
            </div>
            <div
              className={`w-16 h-0.5 mx-2 ${
                etapa === "pagamento" || etapa === "processando"
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            />
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  etapa === "pagamento"
                    ? "bg-green-600 text-white"
                    : etapa === "processando"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
              <span className="ml-2 text-sm font-medium">Pagamento</span>
            </div>
            <div
              className={`w-16 h-0.5 mx-2 ${
                etapa === "processando" ? "bg-green-600" : "bg-gray-300"
              }`}
            />
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  etapa === "processando"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                3
              </div>
              <span className="ml-2 text-sm font-medium">Confirmação</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2">
            {etapa === "revisao" && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">
                    Revisão do Pedido
                  </h2>

                  {/* Dados do Cliente */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Dados do Cliente</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/minha-conta/dados")}
                        className="text-blue-600"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{nomeCompleto}</p>
                      <p className="text-gray-600">{cliente.email}</p>
                      <p className="text-gray-600">{cliente.telefone}</p>
                      {documento && (
                        <p className="text-gray-600">
                          {tipoDocumento}: {documento}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Endereço de Entrega */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Endereço de Entrega</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/minha-conta/enderecos")}
                        className="text-blue-600"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Alterar
                      </Button>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p>
                        {cliente.endereco}, {cliente.numero}
                      </p>
                      {cliente.complemento && <p>{cliente.complemento}</p>}
                      <p>{cliente.bairro}</p>
                      <p>
                        {cliente.cidade} - {cliente.estado}
                      </p>
                      <p>CEP: {cliente.cep}</p>
                    </div>
                  </div>

                  {/* Frete Selecionado */}
                  {frete?.opcao_selecionada && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">Forma de Envio</h3>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Truck className="w-5 h-5 text-blue-600 mr-2" />
                          <div>
                            <p className="font-medium">
                              {frete.opcao_selecionada.nome}
                            </p>
                            <p className="text-sm text-gray-600">
                              Prazo: {frete.opcao_selecionada.prazo}
                            </p>
                          </div>
                          <div className="ml-auto font-bold text-blue-600">
                            {valorFrete === 0 ? (
                              <span className="text-green-600 flex items-center">
                                <Check className="w-4 h-4 mr-1" />
                                Grátis
                              </span>
                            ) : (
                              `R$ ${valorFrete.toFixed(2)}`
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Itens do Pedido */}
                  <div>
                    <h3 className="font-medium mb-3">Itens do Pedido</h3>
                    <div className="space-y-3">
                      {carrinho.map((item, index) => (
                        <div
                          key={`${item.produto_id}-${item.variacao_id || index}`}
                          className="flex items-center"
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 relative overflow-hidden">
                            {item.imagem_url ? (
                              <Image
                                src={item.imagem_url}
                                alt={item.titulo}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex-1">
                            <p className="font-medium">{item.titulo}</p>
                            {item.variacao && (
                              <p className="text-sm text-gray-600">
                                {item.variacao.cor &&
                                  `Cor: ${item.variacao.cor}`}
                                {item.variacao.cor &&
                                  item.variacao.tamanho &&
                                  " | "}
                                {item.variacao.tamanho &&
                                  `Tamanho: ${item.variacao.tamanho}`}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              Qtd: {item.quantidade}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              R${" "}
                              {(item.preco_unitario * item.quantidade).toFixed(
                                2,
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {etapa === "pagamento" && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Pagamento</h2>

                  {metodoPagamento === null ? (
                    <div className="space-y-4">
                      <p className="text-gray-600 mb-4">
                        Escolha a forma de pagamento para finalizar seu pedido
                      </p>

                      <Button
                        onClick={() => setMetodoPagamento("cartao")}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <CreditCard className="mr-2 h-5 w-5" />
                        Cartão de Crédito
                      </Button>

                      <Button
                        onClick={() => setMetodoPagamento("pix")}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                        variant="outline"
                      >
                        <QrCode className="mr-2 h-5 w-5" />
                        PIX
                      </Button>
                    </div>
                  ) : metodoPagamento === "cartao" ? (
                    <>
                      {erroBrick && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                          <p className="text-red-800 text-sm">{erroBrick}</p>
                          <Button
                            onClick={inicializarBrick}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Tentar Novamente
                          </Button>
                        </div>
                      )}

                      {/* Container do Brick - sempre renderizado */}
                      <div
                        id="paymentBrick_container_logado"
                        className="min-h-[400px]"
                      >
                        {!erroBrick && !mpLoaded && (
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setMetodoPagamento(null)}
                        className="mt-4"
                      >
                        Voltar e escolher outro método
                      </Button>
                    </>
                  ) : (
                    <>
                      <PixPayment
                        pedidoId={pedidoId}
                        total={totalComFrete}
                        onPaymentConfirmed={() => {
                          limparCarrinho();
                          router.push(
                            `/checkout/sucesso?pedido_id=${pedidoId}`,
                          );
                        }}
                      />

                      <Button
                        variant="outline"
                        onClick={() => setMetodoPagamento(null)}
                        className="mt-4"
                      >
                        Voltar e escolher outro método
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {etapa === "processando" && (
              <Card>
                <CardContent className="p-6 text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">
                    Processando seu pagamento...
                  </h3>
                  <p className="text-gray-600">
                    Aguarde enquanto confirmamos sua transação.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna de Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg border shadow-sm sticky top-24">
              <h3 className="font-semibold text-lg mb-4">Resumo do Pedido</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>R$ {totalPreco.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Frete:</span>
                  {valorFrete === 0 ? (
                    <span className="text-green-600">Grátis</span>
                  ) : (
                    <span>R$ {valorFrete.toFixed(2)}</span>
                  )}
                </div>

                {frete?.opcao_selecionada?.prazo && valorFrete > 0 && (
                  <div className="text-xs text-gray-500 text-right">
                    Prazo: {frete.opcao_selecionada.prazo}
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">
                      R$ {totalComFrete.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    em até 12x sem juros
                  </p>
                </div>
              </div>

              {etapa === "revisao" && (
                <Button
                  onClick={iniciarCheckout}
                  disabled={processando}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {processando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    "Ir para Pagamento"
                  )}
                </Button>
              )}

              {etapa === "pagamento" && (
                <Button
                  variant="outline"
                  onClick={() => setEtapa("revisao")}
                  className="w-full mt-6"
                >
                  Voltar para Revisão
                </Button>
              )}

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Pagamento seguro via Mercado Pago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutLogadoLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
    </div>
  );
}

export default function CheckoutLogadoContent() {
  return (
    <Suspense fallback={<CheckoutLogadoLoading />}>
      <CheckoutLogado />
    </Suspense>
  );
}
