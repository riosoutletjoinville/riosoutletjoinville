// src/app/checkouten/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bricksBuilder = useRef<any>(null);
  const router = useRouter();

  // Adicionar hook do carrinho para acessar o frete
  const { frete, totalComFrete, valorFrete } = useCarrinho();

  // Carregar SDK manualmente
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Se já carregou, não carregar novamente
    if (window.MercadoPago) {
      console.log("✅ SDK já estava carregado");
      setMpLoaded(true);
      return;
    }

    // Se já está carregando, não carregar novamente
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

    return () => {
      // Não remover o script para evitar problemas
    };
  }, [sdkLoading]);

  useEffect(() => {
  const carrinhoSalvo = localStorage.getItem("carrinho");
  const dadosFormularioSalvo = localStorage.getItem("checkout_form_data");

  if (carrinhoSalvo) {
    const carrinhoParsed = JSON.parse(carrinhoSalvo);
    console.log("📦 CARRINHO CARREGADO:", JSON.stringify(carrinhoParsed, null, 2));
    // Verificar se cada item tem variacao_id
    carrinhoParsed.forEach((item: any, index: number) => {
      console.log(`Item ${index}:`, {
        titulo: item.titulo,
        produto_id: item.produto_id,
        variacao_id: item.variacao_id || "❌ NÃO TEM VARIACAO_ID!",
        variacao: item.variacao
      });
    });
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

  // Calcular total dos itens
  const totalItens = carrinho.reduce((acc, item) => {
    return acc + item.preco_unitario * item.quantidade;
  }, 0);

  // Usar totalComFrete do hook (já inclui frete)
  const total = totalComFrete;

  const handleTipoCadastro = async (
    tipo: "login" | "cadastro" | "guest",
    dados?: DadosFormularioCheckout,
  ) => {
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
        // CAMPOS DE ENDEREÇO
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
          // CAMPOS DE ENDEREÇO
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
        frete_prazo: frete?.opcao_selecionada?.prazo, // Prazo de entrega
        cliente_email: dados.email,
        cliente_nome: dados.nome,
        criar_conta: tipo === "cadastro",
        cliente_senha: tipo === "cadastro" ? dados.senha : undefined,
        cliente_dados: clienteDadosMP,
        tipo_checkout: tipo,
      };

      console.log("📤 Enviando para API com frete:", {
        totalItens,
        valorFrete,
        totalComFrete: total,
        freteInfo: frete?.opcao_selecionada,
      });

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
      console.log("✅ Resultado da API:", resultado);

      if (resultado.success) {
        setPreferenceId(resultado.preference_id);
        setPedidoId(resultado.pedido_id);
        setEtapa("pagamento");
      } else {
        console.error("❌ Erro no resultado:", resultado.error);
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
      console.error("❌ Missing MercadoPago SDK or preferenceId:", {
        hasMercadoPago: !!window.MercadoPago,
        preferenceId,
      });
      return;
    }

    try {
      console.log("🔄 Initializing Bricks with preference:", preferenceId);

      const mp = new window.MercadoPago(
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!,
        {
          locale: "pt-BR",
        },
      );

      // Clear container first
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
          visual: {
            style: {
              theme: "default",
            },
          },
          paymentMethods: {
            creditCard: "all",
            bankTransfer: "all",
          },
        },
        callbacks: {
          onReady: () => {
            console.log("✅ Brick ready");
            setBricksError("");
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onError: (error: any) => {
            console.error("❌ Brick error:", error);
            setBricksError(
              error.message || "Erro ao carregar opções de pagamento",
            );
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSubmit: (cardFormData: any) => {
            console.log("📤 Brick form data COMPLETO:", cardFormData);
            const formData = cardFormData.formData;

            let cpfNumber = "";

            if (formData.cardholder?.identification?.number) {
              cpfNumber = formData.cardholder.identification.number;
            } else if (formData.payer?.identification?.number) {
              cpfNumber = formData.payer.identification.number;
            } else if (formData.identification?.number) {
              cpfNumber = formData.identification.number;
            } else if (formData.cpf) {
              cpfNumber = formData.cpf;
            }

            if (!cpfNumber && dadosFormulario?.cpf) {
              cpfNumber = dadosFormulario.cpf;
            }

            const cpfClean = cpfNumber.replace(/\D/g, "");
            const email =
              formData.payer?.email || formData.email || dadosFormulario?.email;
            const cardholderName =
              formData.cardholder?.name || formData.first_name || "APRO";

            const paymentData = {
              transaction_amount: total,
              token: formData.token,
              description: `Pedido #${pedidoId}`,
              installments: parseInt(formData.installments) || 1,
              payment_method_id: formData.payment_method_id,
              issuer_id: formData.issuer_id,
              external_reference: pedidoId,
              payer: {
                email: email,
                identification: {
                  type: "CPF",
                  number: cpfClean,
                },
                name: cardholderName,
              },
            };

            console.log(
              "🔄 Dados para processamento (validados):",
              paymentData,
            );
            processPayment(paymentData);
          },
        },
      });

      console.log("✅ Bricks created successfully");
    } catch (error) {
      console.error("💥 Error initializing Bricks:", error);
      setBricksError("Falha ao inicializar processador de pagamentos");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processPayment = async (formData: any) => {
    try {
      setEtapa("processando");

      const cpfNumber = formData.payer?.identification?.number || "";
      const cpfClean = cpfNumber.replace(/\D/g, "");
      const cardholderName = formData.payer?.name || "APRO";

      const paymentData = {
        transaction_amount: total,
        token: formData.token,
        description: `Pedido #${pedidoId}`,
        installments: parseInt(formData.installments) || 1,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        external_reference: pedidoId,
        payer: {
          email: formData.payer?.email || dadosFormulario?.email,
          identification: {
            type: "CPF",
            number: cpfClean,
          },
          name: cardholderName,
        },
      };

      console.log(
        "📤 Enviando pagamento com dados completos:",
        JSON.stringify(paymentData, null, 2),
      );

      const response = await fetch("/api/mercadopago/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.success) {
        router.push("/checkout/sucesso");
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

  useEffect(() => {
    if (etapa === "pagamento" && mpLoaded && preferenceId && dadosFormulario) {
      console.log("🎯 Todas as condições atendidas, inicializando Bricks...");
      initializeBricks();
    }
  }, [etapa, mpLoaded, preferenceId, dadosFormulario]);

  useEffect(() => {
    if (etapa === "pagamento") {
      console.log("🔍 Debug condições Bricks:", {
        etapa,
        mpLoaded,
        preferenceId,
        hasDadosFormulario: !!dadosFormulario,
        allConditions:
          etapa === "pagamento" && mpLoaded && preferenceId && dadosFormulario,
      });
    }
  }, [etapa, mpLoaded, preferenceId, dadosFormulario]);

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

                {/* Mostrar resumo com frete */}
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

                {bricksError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800 text-sm">
                      Erro no processador de pagamentos: {bricksError}
                    </p>
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
                      <div id="paymentBrick_container"></div>
                    </div>
                  )}
                </div>

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

// Loading component para checkout
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

// Componente principal com Suspense
export default function CheckoutPageContent() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
