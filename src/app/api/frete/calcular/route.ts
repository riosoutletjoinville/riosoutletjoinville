// src/app/api/frete/calcular/route.ts
import { NextRequest, NextResponse } from "next/server";

interface ServicoMelhorEnvio {
    id: number;
    name: string;
    price: string;
    delivery_time: number;
    custom_price?: string;
    custom_delivery_time?: number;
    company: {
        id: number;
        name: string;
    };
}

interface OpcaoFrete {
    nome: string;
    prazo: string;
    valor: number;
    valor_formatado: string;
}

interface Produto {
    id?: string;
    quantidade?: number;
    peso?: number;
    largura?: number;
    altura?: number;
    comprimento?: number;
    preco?: number;
}

export async function POST(request: NextRequest) {
    try {
        const { cep, subtotal, produtos } = await request.json();

        console.log("📍 Recebida requisição de frete:");
        console.log("📍 CEP:", cep);
        console.log("📍 Subtotal:", subtotal);
        console.log("📍 Produtos:", produtos);

        // VERIFICAÇÃO DO TOKEN
        const MELHOR_ENVIO_ACESS_TOKEN = process.env.MELHOR_ENVIO_ACESS_TOKEN;

        console.log("🔑 Token existe:", !!MELHOR_ENVIO_ACESS_TOKEN);
        console.log("🔑 Token length:", MELHOR_ENVIO_ACESS_TOKEN?.length);

        if (!MELHOR_ENVIO_ACESS_TOKEN) {
            console.log("❌ TOKEN NÃO - CONFIGURADO");
            return NextResponse.json(
                {
                    success: false,
                    error: "Configure MELHOR_ENVIO_ACESS_TOKEN no arquivo .env",
                },
                { status: 500 },
            );
        }

        if (!cep || cep.replace(/\D/g, "").length !== 8) {
            return NextResponse.json(
                { success: false, error: "CEP inválido" },
                { status: 400 },
            );
        }

        console.log("✅ Token válido, fazendo requisição...");
        const MELHOR_ENVIO_URL = process.env.MELHOR_ENVIO_URL ||
            "https://sandbox.melhorenvio.com.br";
        // SANDBOX PARA TESTES
        const apiUrl = `${MELHOR_ENVIO_URL}/api/v2/me/shipment/calculate`;

        // Preparar produtos corretamente considerando quantidade
        const produtosApi = produtos && produtos.length > 0
            ? produtos.map((prod: Produto, index: number) => {
                const quantidade = prod.quantidade || 1;
                const pesoUnitario = prod.peso || 0.3;
                const precoUnitario = prod.preco ||
                    (subtotal /
                        (produtos.reduce(
                            (acc: number, p: Produto) =>
                                acc + (p.quantidade || 1),
                            0,
                        ) || 1));

                console.log(`📦 Produto ${index + 1}:`, {
                    quantidade,
                    pesoUnitario,
                    pesoTotal: pesoUnitario * quantidade,
                    precoUnitario,
                    valorSeguro: precoUnitario * quantidade,
                });

                return {
                    id: prod.id || `prod-${index}`,
                    width: prod.largura || 20,
                    height: prod.altura || 10,
                    length: prod.comprimento || 30,
                    weight: pesoUnitario * quantidade, // ✅ Peso total = peso unitário × quantidade
                    insurance_value: precoUnitario * quantidade, // ✅ Valor do seguro por produto
                    quantity: 1, // Na API do Melhor Envio, cada item é uma unidade separada
                };
            })
            : [
                {
                    id: "produto-padrao",
                    width: 20,
                    height: 10,
                    length: 30,
                    weight: 0.3 * ((produtos?.[0]?.quantidade) || 1), // ✅ Considera quantidade
                    insurance_value: (subtotal || 0) *
                        ((produtos?.[0]?.quantidade) || 1), // ✅ Considera quantidade
                    quantity: 1,
                },
            ];

        // Calcular valor total do seguro para a opção
        const insuranceTotal = produtosApi.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (total: number, produto: any) => {
                return total + (produto.insurance_value || 0);
            },
            0,
        );

        console.log("📊 Resumo dos produtos:", {
            totalProdutos: produtosApi.length,
            insuranceTotal,
            produtosDetalhados: produtosApi,
        });

        const requestBody = {
            from: {
                postal_code: "89209430", // CEP de origem (Joinville)
            },
            to: {
                postal_code: cep.replace(/\D/g, ""), // CEP destino
            },
            products: produtosApi,
            options: {
                insurance_value: insuranceTotal, // ✅ Usar o valor calculado do seguro
                receipt: false,
                own_hand: false,
                reverse: false,
                non_commercial: true,
            },
            services: "1,2,3,4", // Códigos dos serviços
        };
        // No route.ts de calcular frete - ANTES do fetch
        console.log("🔍 DEBUG DETALHADO:");
        console.log("🌐 URL COMPLETA:", apiUrl);
        console.log(
            "🔑 Token (primeiros 10):",
            MELHOR_ENVIO_ACESS_TOKEN?.substring(0, 10) + "...",
        );
        console.log("🔑 Token length:", MELHOR_ENVIO_ACESS_TOKEN?.length);
        console.log("📋 Headers enviados:", {
            "Authorization": `Bearer ${
                MELHOR_ENVIO_ACESS_TOKEN?.substring(0, 10)
            }...`,
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent":
                "Rios Outlet Joinville (diego.sobieranski@hotmail.com)",
        });
        console.log("📦 Request body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MELHOR_ENVIO_ACESS_TOKEN}`,
                "Accept": "application/json",
                "Content-Type": "application/json",
                "User-Agent":
                    "Rios Outlet Joinville (diego.sobieranski@hotmail.com)",
            },
            body: JSON.stringify(requestBody),
        });

        console.log("📦 Status:", response.status);
        console.log("📦 Headers:", Object.fromEntries(response.headers));

        if (!response.ok) {
            const errorDetails = await response.text();
            console.log("❌ Erro da API:", errorDetails);

            if (response.status === 401) {
                return NextResponse.json(
                    {
                        success: false,
                        error:
                            "Token do Melhor Envio expirado ou inválido. Renove o token.",
                    },
                    { status: 401 },
                );
            }

            throw new Error(
                `API retornou erro: ${response.status} - ${errorDetails}`,
            );
        }

        const data: ServicoMelhorEnvio[] = await response.json();
        console.log("✅ Resposta da API:", JSON.stringify(data, null, 2));

        // Processar resposta
        const opcoes: OpcaoFrete[] = data.map((servico: ServicoMelhorEnvio) => {
            // Usar custom_price se disponível, senão usar price
            const preco = servico.custom_price || servico.price;
            const prazo = servico.custom_delivery_time || servico.delivery_time;

            const valor = parseFloat(preco) || 0;
            return {
                nome: servico.company?.name || servico.name || "Transportadora",
                prazo: `${prazo} dias úteis`,
                valor: valor,
                valor_formatado: valor === 0
                    ? "Grátis"
                    : `R$ ${valor.toFixed(2)}`,
            };
        });

        // Filtrar opções válidas
        const opcoesValidas = opcoes.filter((opcao) =>
            opcao.valor >= 0 && opcao.prazo &&
            !opcao.prazo.includes("undefined")
        );

        const VALOR_MINIMO_FRETE_GRATIS = 500;
        const freteGratis = subtotal >= VALOR_MINIMO_FRETE_GRATIS;

        // Aplicar frete grátis se necessário
        if (freteGratis) {
            opcoesValidas.forEach((opcao: OpcaoFrete) => {
                opcao.valor = 0;
                opcao.valor_formatado = "Grátis";
            });
        }

        // Ordenar por preço
        opcoesValidas.sort((a, b) => a.valor - b.valor);

        return NextResponse.json({
            success: true,
            opcoes: opcoesValidas,
            frete_gratis: freteGratis,
            valor_minimo_frete_gratis: VALOR_MINIMO_FRETE_GRATIS,
        });
    } catch (error) {
        console.error("❌ ERRO REAL:", error);
        return NextResponse.json(
            {
                success: false,
                error: `Falha na conexão: ${
                    error instanceof Error ? error.message : "Erro desconhecido"
                }`,
            },
            { status: 500 },
        );
    }
}
