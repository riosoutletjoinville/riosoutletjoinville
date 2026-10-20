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
import Swal from "sweetalert2";
import { supabase } from "@/contexts/AuthContext";

declare global {
  interface Window {
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

  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_base64: string;
    payment_id: string;
  } | null>(null);

  // Estados para autenticação
  const [cliente, setCliente] = useState<ClienteLogado | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [metodoPagamento, setMetodoPagamento] = useState<
    "cartao" | "pix" | null
  >(null);

  const bricksBuilder = useRef<any>(null);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState(false);

  // Carregar pedido existente do sessionStorage ao montar
  useEffect(() => {
    const pedidoSalvo = sessionStorage.getItem("pedido_logado_atual");
    if (pedidoSalvo) {
      const { pedidoId, preferenceId, metodo } = JSON.parse(pedidoSalvo);

      // Verificar se o pedido ainda está válido (não foi pago)
      const verificarPedido = async () => {
        const response = await fetch(`/api/pedidos/${pedidoId}/status`);
        const data = await response.json();

        if (data.status === "pago" || data.status === "approved") {
          // Pedido já foi pago, limpar cache
          sessionStorage.removeItem("pedido_logado_atual");
          setPedidoCriado(false);
          setPedidoId("");
          setPreferenceId("");
          setMetodoPagamento(null);

          Swal.fire({
            icon: "info",
            title: "Pedido já finalizado",
            text: "Este pedido já foi pago. Inicie um novo pedido.",
            confirmButtonColor: "#16a34a",
          });
        } else {
          setPedidoId(pedidoId);
          setPreferenceId(preferenceId);
          setPedidoCriado(true);
          setMetodoPagamento(metodo);
        }
      };

      verificarPedido();
    }
  }, []);

  // Adicione junto com os outros useEffects (depois do useEffect que carrega o pedido existente)
  useEffect(() => {
    const pedidoSalvo = sessionStorage.getItem("pedido_logado_atual");
    if (pedidoSalvo) {
      const data = JSON.parse(pedidoSalvo);
      // Se for PIX e tem dados salvos, restaurar pixData
      if (data.metodo === "pix" && data.pixQrCode && data.pixQrCodeBase64) {
        console.log("♻️ Restaurando dados PIX do sessionStorage");
        setPixData({
          qr_code: data.pixQrCode,
          qr_code_base64: data.pixQrCodeBase64,
          payment_id: data.pixPaymentId,
        });
      }
    }
  }, []);

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
    if (
      !authLoading &&
      carrinho.length === 0 &&
      etapa !== "pagamento" &&
      !isProcessingRedirect
    ) {
      router.push("/carrinho");
    }
  }, [carrinho, etapa, router, authLoading, isProcessingRedirect]);

  // Carregar SDK do Mercado Pago
  // src/app/checkout/logado/CheckoutLogadoContent.tsx
  // No useEffect do SDK (~linha 213)

  useEffect(() => {
    console.log(
      "🔄 useEffect do SDK - mpLoaded:",
      mpLoaded,
      "sdkLoading:",
      sdkLoading,
    );

    if (typeof window === "undefined") return;
    if (window.MercadoPago) {
      console.log("✅ SDK já disponível no window");
      setMpLoaded(true);
      return;
    }
    if (sdkLoading) return;

    setSdkLoading(true);
    console.log("🔄 Carregando SDK do Mercado Pago...");

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("✅ SDK Mercado Pago carregado com sucesso");
      setMpLoaded(true);
      setSdkLoading(false);
    };
    script.onerror = (error) => {
      console.error("❌ Erro ao carregar SDK:", error);
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
  const iniciarCheckout = async (metodo: "cartao" | "pix") => {
    if (!cliente) return;

    if (!pedidoCriado) {
      // Limpar qualquer resquício de pedido anterior
      sessionStorage.removeItem("pedido_logado_atual");
      setPedidoId("");
      setPreferenceId("");
      setMetodoPagamento(null);
      setPixData(null); // 🆕 Limpar dados do PIX também
    }

    // Se o pedido já está pago, NÃO permitir
    if (pedidoCriado && pedidoId) {
      // Verificar status do pedido
      const { data: pedido } = await supabase
        .from("pedidos")
        .select("status, payment_method")
        .eq("id", pedidoId)
        .single();

      if (pedido?.status === "pago") {
        await Swal.fire({
          icon: "error",
          title: "Pedido já pago",
          text: `Este pedido já foi pago com ${pedido.payment_method === "pix" ? "PIX" : "Cartão"}.`,
          confirmButtonColor: "#16a34a",
        });
        return;
      }
    }

    // Se já tem pedido e é o mesmo método, só vai para pagamento
    if (pedidoCriado && metodoPagamento === metodo) {
      setEtapa("pagamento");
      return;
    }

    // Se já tem pedido mas método diferente, pergunta se quer recriar
    if (pedidoCriado && metodoPagamento !== metodo) {
      const result = await Swal.fire({
        title: "Alterar método de pagamento?",
        html: `Você já iniciou um pedido com <strong>${metodoPagamento === "cartao" ? "Cartão" : "PIX"}</strong>.<br>Deseja cancelar e iniciar com <strong>${metodo === "cartao" ? "Cartão" : "PIX"}</strong>?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, alterar",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) return;

      // LIMPAR TUDO
      sessionStorage.removeItem("pedido_logado_atual");
      setPedidoCriado(false);
      setPedidoId("");
      setPreferenceId("");
      setMetodoPagamento(null);
      setPixData(null); // 🆕 Limpar dados do PIX
      setEtapa("revisao");
      return;
    }

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
        metodo_pagamento: metodo,
        pedido_existente_id: pedidoCriado ? pedidoId : undefined,
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
        setPedidoCriado(true);
        setMetodoPagamento(metodo);

        // 🆕 IMPORTANTE: Salvar dados do PIX se vieram da API
        if (metodo === "pix" && resultado.qr_code && resultado.qr_code_base64) {
          console.log("✅ Recebidos dados do PIX da API");
          setPixData({
            qr_code: resultado.qr_code,
            qr_code_base64: resultado.qr_code_base64,
            payment_id: resultado.payment_id || resultado.payment_id,
          });
        } else if (metodo === "pix") {
          console.log("⚠️ Nenhum dado PIX recebido da API, será gerado depois");
          //setPixData(null);
        }

        // Salvar no sessionStorage
        sessionStorage.setItem(
          "pedido_logado_atual",
          JSON.stringify({
            pedidoId: resultado.pedido_id,
            preferenceId: resultado.preference_id,
            metodo: metodo,
            // 🆕 Salvar dados PIX também no sessionStorage para recuperar depois
            ...(metodo === "pix" && resultado.qr_code
              ? {
                  pixQrCode: resultado.qr_code,
                  pixQrCodeBase64: resultado.qr_code_base64,
                  pixPaymentId: resultado.payment_id,
                }
              : {}),
          }),
        );

        setEtapa("pagamento");
      } else {
        await Swal.fire({
          icon: "error",
          title: "Erro no checkout",
          text: resultado.error || "Erro ao processar pedido. Tente novamente.",
          confirmButtonColor: "#16a34a",
        });
        setProcessando(false);
      }
    } catch (error) {
      console.error("Erro ao iniciar checkout:", error);
      await Swal.fire({
        icon: "error",
        title: "Erro de conexão",
        text: "Não foi possível processar seu pedido. Tente novamente.",
        confirmButtonColor: "#16a34a",
      });
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
          visual: {
            style: { theme: "default" },
            defaultPaymentOption: {
              creditCardForm: true, // ← FORÇA abrir o formulário do cartão
            },
          },
          paymentMethods: {
            creditCard: "all",
            //bankTransfer: "all",
          },
        },
        callbacks: {
          onReady: () => {
            console.log("✅ Brick pronto");
            setErroBrick("");
          },
          onError: (error: any) => {
            console.error("❌ Erro no Brick:", error);
            setErroBrick(
              error.message || "Erro ao carregar opções de pagamento",
            );
          },
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
  const processarPagamento = async (formData: any) => {
    setEtapa("processando");
    setIsProcessingRedirect(true);

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
        sessionStorage.removeItem("pedido_logado_atual");
        sessionStorage.setItem("should_clear_cart", "true");
        router.push(`/checkout/sucesso?pedido_id=${pedidoId}`);
      } else {
        setIsProcessingRedirect(false);
        alert(
          "Pagamento não aprovado: " + (result.error || "Erro desconhecido"),
        );
        setEtapa("pagamento");
      }
    } catch (error) {
      setIsProcessingRedirect(false);
      console.error("Erro ao processar pagamento:", error);
      alert("Erro ao processar pagamento. Tente novamente.");
      setEtapa("pagamento");
    }
  };

  // Inicializar Brick quando estiver na etapa de pagamento
  useEffect(() => {
    if (
      etapa === "pagamento" &&
      metodoPagamento === "cartao" &&
      mpLoaded &&
      preferenceId
    ) {
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
                  <h2 className="text-lg font-semibold mb-4">
                    {metodoPagamento === "cartao"
                      ? "Você selecionou pagar com Cartão de Crédito"
                      : "Pagamento com PIX"}
                  </h2>

                  {/* Conteúdo direto, sem abas */}
                  {metodoPagamento === "cartao" ? (
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
                    </>
                  ) : (
                    metodoPagamento === "pix" &&
                    pedidoId && (
                      <PixPayment
                        key={pedidoId}
                        pedidoId={pedidoId}
                        total={totalComFrete}
                        initialPixData={pixData}
                        onPaymentConfirmed={() => {
                          limparCarrinho();
                          sessionStorage.removeItem("pedido_logado_atual");
                          sessionStorage.setItem("should_clear_cart", "true");
                          router.push(
                            `/checkout/sucesso?pedido_id=${pedidoId}`,
                          );
                        }}
                      />
                    )
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

              {/* Botões na etapa de revisão */}
              {etapa === "revisao" && (
                <div className="space-y-3 mt-6">
                  <Button
                    onClick={() => iniciarCheckout("cartao")}
                    disabled={processando}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {processando ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      "Pagar com Cartão"
                    )}
                  </Button>

                  <Button
                    onClick={() => iniciarCheckout("pix")}
                    disabled={processando}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Pagar com PIX
                  </Button>
                </div>
              )}

              {/* Botão voltar na etapa de pagamento */}
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
