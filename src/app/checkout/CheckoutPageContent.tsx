// src/app/checkout/CheckoutPageContent.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import ClienteOptions from "@/components/checkout/ClienteOptions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DadosFormularioCheckout } from "@/types/mercadopago";
import {
  ItemPedidoMP,
  CheckoutRequestMP,
  ClienteDadosMP,
} from "@/types/mercadopago";
import { useCarrinho } from "@/hooks/useCarrinho";
import { PixPayment } from "@/components/checkout/PixPayment";
import { CreditCard, QrCode } from "lucide-react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
  }
}

function CheckoutContent() {
  const [carrinho, setCarrinho] = useState<ItemPedidoMP[]>([]);
  const [etapa, setEtapa] = useState<"selecao" | "pagamento" | "processando">(
    "selecao",
  );
  const [dadosFormulario, setDadosFormulario] =
    useState<DadosFormularioCheckout | null>(null);
  const [preferenceId, setPreferenceId] = useState<string>("");
  const [pedidoId, setPedidoId] = useState<string>("");
  const [mpLoaded, setMpLoaded] = useState<boolean>(false);
  const [bricksError, setBricksError] = useState<string>("");
  const [sdkLoading, setSdkLoading] = useState<boolean>(false);
  const [metodoPagamento, setMetodoPagamento] = useState<"cartao" | "pix" | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bricksBuilder = useRef<any>(null);
  const router = useRouter();

  const { frete, totalComFrete, valorFrete, limparCarrinho } = useCarrinho();

  useEffect(() => {
    const token = localStorage.getItem("cliente_token");
    if (token) {
      console.log("🔄 Cliente já logado, redirecionando para checkout/logado");
      router.push("/checkout/logado");
    }
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.MercadoPago) {
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
      console.log("✅ SDK do Mercado Pago carregado com sucesso");
      setMpLoaded(true);
      setSdkLoading(false);
    };

    script.onerror = (error) => {
      console.error("❌ Erro ao carregar SDK:", error);
      setBricksError(
        "Falha ao carregar SDK do Mercado Pago. Verifique sua conexão.",
      );
      setSdkLoading(false);
    };

    document.body.appendChild(script);

    return () => {};
  }, [sdkLoading]);

  useEffect(() => {
    const carrinhoSalvo = localStorage.getItem("carrinho");
    const dadosFormularioSalvo = localStorage.getItem("checkout_form_data");

    if (carrinhoSalvo) {
      const carrinhoParsed = JSON.parse(carrinhoSalvo);
      setCarrinho(carrinhoParsed);
    }

    if (dadosFormularioSalvo) {
      setDadosFormulario(JSON.parse(dadosFormularioSalvo));
    }
  }, []);

  const salvarDadosFormulario = (dados: DadosFormularioCheckout) => {
    localStorage.setItem("checkout_form_data", JSON.stringify(dados));
    setDadosFormulario(dados);
  };

  const totalItens = carrinho.reduce((acc, item) => {
    return acc + item.preco_unitario * item.quantidade;
  }, 0);

  const total = totalComFrete;

  const handleTipoCadastro = async (
    tipo: "login" | "cadastro" | "guest",
    dados?: DadosFormularioCheckout,
  ) => {
    if (tipo === "login") {
      router.push("/checkout/logado");
      return;
    }

    if (!dados) {
      alert("Dados do cliente são obrigatórios");
      return;
    }

    try {
      setEtapa("processando");

      const dadosParaSalvar: DadosFormularioCheckout = {
        email: dados.email,
        senha: dados.senha || "",
        nome: dados.nome,
        sobrenome: dados.sobrenome || "",
        cpf: dados.cpf || "",
        telefone: dados.telefone || "",
        tipo_cliente: dados.tipo_cliente,
        cep: dados.cep || "",
        logradouro: dados.logradouro || "",
        numero: dados.numero || "",
        complemento: dados.complemento || "",
        bairro: dados.bairro || "",
        cidade: dados.cidade || "",
        estado: dados.estado || "",
      };

      salvarDadosFormulario(dadosParaSalvar);

      let clienteDadosMP: ClienteDadosMP | undefined;

      if (tipo === "cadastro" || tipo === "guest") {
        clienteDadosMP = {
          nome: dados.nome,
          sobrenome: dados.sobrenome || "",
          email: dados.email,
          cpf: dados.cpf || "",
          cnpj: dados.cnpj || "",
          telefone: dados.telefone || "",
          tipo_cliente: dados.tipo_cliente,
          cep: dados.cep || "",
          logradouro: dados.logradouro || "",
          numero: dados.numero || "",
          complemento: dados.complemento || "",
          bairro: dados.bairro || "",
          cidade: dados.cidade || "",
          estado: dados.estado || "",
        };
      }

      const pedidoData: CheckoutRequestMP = {
        itens: carrinho,
        total: total,
        subtotal: totalItens,
        frete_valor: valorFrete,
        frete_nome: frete?.opcao_selecionada?.nome,
        frete_prazo: frete?.opcao_selecionada?.prazo,
        cliente_email: dados.email,
        cliente_nome: dados.nome,
        criar_conta: tipo === "cadastro",
        cliente_senha: tipo === "cadastro" ? dados.senha : undefined,
        cliente_dados: clienteDadosMP,
        tipo_checkout: tipo,
      };

      const response = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro HTTP:", errorText);
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const resultado = await response.json();

      if (resultado.success) {
        setPreferenceId(resultado.preference_id);
        setPedidoId(resultado.pedido_id);
        setEtapa("pagamento");
      } else {
        alert("Erro ao processar checkout: " + resultado.error);
        setEtapa("selecao");
      }
    } catch (error) {
      console.error("💥 Erro no processo:", error);
      alert("Erro ao processar pedido");
      setEtapa("selecao");
    }
  };

  const initializeBricks = async () => {
    if (!window.MercadoPago || !preferenceId) {
      return;
    }

    try {
      const mp = new window.MercadoPago(
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!,
        { locale: "pt-BR" },
      );

      const container = document.getElementById("paymentBrick_container_nd");
      if (container) {
        container.innerHTML = "";
      }

      await mp.bricks().create("payment", "paymentBrick_container_nd", {
        initialization: {
          preferenceId: preferenceId,
          amount: total,
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
            setBricksError("");
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError: (error: any) => {
            setBricksError(error.message || "Erro ao carregar opções de pagamento");
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSubmit: (cardFormData: any) => {
            const formData = cardFormData.formData;
            const cpfNumber = formData.payer?.identification?.number || dadosFormulario?.cpf || "";
            const cpfClean = cpfNumber.replace(/\D/g, "");
            const email = formData.payer?.email || dadosFormulario?.email;

            const paymentData = {
              transaction_amount: total,
              token: formData.token,
              description: `Pedido #${pedidoId}`,
              installments: parseInt(formData.installments) || 1,
              payment_method_id: formData.payment_method_id,
              issuer_id: formData.issuer_id,
              external_reference: pedidoId,
              first_name: dadosFormulario?.nome || "Cliente",
              payer: {
                email: email,
                identification: {
                  type: "CPF" as const,
                  number: cpfClean,
                },
              },
            };
            processPayment(paymentData);
          },
        },
      });
    } catch (error) {
      console.error("💥 Error initializing Bricks:", error);
      setBricksError("Falha ao inicializar processador de pagamentos");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processPayment = async (formData: any) => {
    try {
      setEtapa("processando");

      const response = await fetch("/api/mercadopago/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        limparCarrinho();
        router.push("/checkout/sucesso");
      } else {
        alert("Pagamento não aprovado: " + (result.error || "Erro desconhecido"));
        setEtapa("pagamento");
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      alert("Erro ao processar pagamento. Tente novamente.");
      setEtapa("pagamento");
    }
  };

  useEffect(() => {
    if (etapa === "pagamento" && metodoPagamento === "cartao" && mpLoaded && preferenceId) {
      initializeBricks();
    }
  }, [etapa, metodoPagamento, mpLoaded, preferenceId]);

  if (carrinho.length === 0 && etapa !== "pagamento") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Carrinho Vazio</h2>
            <p className="text-gray-600 mb-6">
              Adicione produtos ao carrinho antes de finalizar a compra.
            </p>
            <Button onClick={() => router.push("/")}>
              Continuar Comprando
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Finalizar Pedido
        </h1>

        {etapa === "selecao" && (
          <ClienteOptions
            onTipoCadastro={handleTipoCadastro}
            carrinhoItens={carrinho}
            total={total}
            subtotal={totalItens}
            freteValor={valorFrete}
            freteInfo={frete?.opcao_selecionada}
            dadosPreenchidos={dadosFormulario}
          />
        )}

        {etapa === "pagamento" && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Pagamento</h2>

                {/* Resumo com frete */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {totalItens.toFixed(2)}</span>
                    </div>
                    {valorFrete > 0 && (
                      <div className="flex justify-between">
                        <span>
                          Frete ({frete?.opcao_selecionada?.nome || "Frete"}):
                        </span>
                        <span>R$ {valorFrete.toFixed(2)}</span>
                      </div>
                    )}
                    {frete?.opcao_selecionada?.prazo && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Prazo de entrega:</span>
                        <span>{frete.opcao_selecionada.prazo}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">
                          R$ {total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seleção de método de pagamento */}
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
                    {bricksError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-800 text-sm">{bricksError}</p>
                        <Button
                          onClick={initializeBricks}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Tentar Novamente
                        </Button>
                      </div>
                    )}

                    <div
                      id="paymentBrick_container_nd"
                      className="min-h-[400px] flex items-center justify-center"
                    >
                      {!bricksError && (
                        <div className="text-center text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
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
                      total={total}
                      onPaymentConfirmed={() => {
                        limparCarrinho();
                        router.push(`/checkout/sucesso?pedido_id=${pedidoId}`);
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

                <div className="mt-4 text-center">
                  <Button variant="outline" onClick={() => setEtapa("selecao")}>
                    Voltar para Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {etapa === "processando" && (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">
                Processando seu pagamento...
              </h3>
              <p className="text-gray-600">
                Aguarde enquanto processamos seu pagamento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Carregando checkout...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPageContent() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}