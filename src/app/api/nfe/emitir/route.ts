// src/app/api/nfe/emitir/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { FocusNFeClient } from "@/lib/nfe/focus-client";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.set(name, "", { ...options, maxAge: 0 });
          },
        },
      },
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { pedido_id, automatica = false } = body;

    console.log("🔵 [API] Processando pedido:", pedido_id);

    // 1. Buscar pedido com todos os dados
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(
        `
        *,
        cliente:clientes(*),
        itens:pedido_itens(
          *,
          produto:produtos(*)
        )
      `,
      )
      .eq("id", pedido_id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: "Pedido não encontrado" },
        { status: 404 },
      );
    }

    console.log("📦 Pedido encontrado:", {
      id: pedido.id,
      empresa_id: pedido.empresa_id,
      cliente_id: pedido.cliente_id,
      total: pedido.total,
    });

    // Buscar pre_pedido_id para obter as parcelas
    const prePedidoId = pedido.pre_pedido_id;
    let parcelas = [];

    if (prePedidoId) {
      const { data: parcelasData, error: parcelasError } = await supabase
        .from("pre_pedido_parcelas")
        .select("*")
        .eq("pre_pedido_id", prePedidoId)
        .order("numero_parcela", { ascending: true });

      if (!parcelasError && parcelasData && parcelasData.length > 0) {
        parcelas = parcelasData;
        console.log("📋 Parcelas encontradas:", parcelas.length);
      } else {
        console.log(
          "⚠️ Nenhuma parcela encontrada para o pre_pedido:",
          prePedidoId,
        );
      }
    } else {
      console.log("⚠️ Pedido sem pre_pedido_id");
    }

    // Buscar empresa_id
    let empresaId = pedido.empresa_id;

    if (!empresaId) {
      console.log(
        "⚠️ Pedido sem empresa_id, buscando do usuário:",
        session.user.id,
      );

      const { data: userData } = await supabase
        .from("usuarios")
        .select("empresa_id")
        .eq("id", session.user.id)
        .single();

      if (userData?.empresa_id) {
        empresaId = userData.empresa_id;
        console.log("✅ Empresa encontrada no usuário:", empresaId);
      }
    }

    // 2. Buscar configurações fiscais da empresa
    let configFiscal = null;
    let configError = null;

    if (empresaId) {
      const result = await supabase
        .from("configuracoes_fiscais")
        .select("*")
        .eq("empresa_id", empresaId)
        .maybeSingle();

      configFiscal = result.data;
      configError = result.error;
    }

    if (!configFiscal && !configError) {
      console.log("⚠️ Buscando configuração fiscal global");

      const result = await supabase
        .from("configuracoes_fiscais")
        .select("*")
        .limit(1)
        .maybeSingle();

      configFiscal = result.data;
    }

    if (!configFiscal) {
      console.error("❌ Configurações fiscais não encontradas:", {
        empresa_id: empresaId,
        pedido_id: pedido.id,
      });

      return NextResponse.json(
        {
          error:
            "Configurações fiscais não encontradas. Configure os dados da empresa antes de emitir NF-e.",
        },
        { status: 400 },
      );
    }

    console.log("✅ Configuração fiscal encontrada:", {
      id: configFiscal.id,
      emitente_cnpj: configFiscal.emitente_cnpj,
      serie_nfe: configFiscal.serie_nfe,
      ambiente: configFiscal.ambiente_nfe,
    });

    // 3. Preparar dados para Focus NFe
    const cliente = pedido.cliente;
    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente não encontrado no pedido" },
        { status: 400 },
      );
    }

    const numeroNFe = (configFiscal.numero_ultima_nfe || 0) + 1;
    const referencia = `${pedido_id}-${Date.now()}`;
    const ambiente = configFiscal.ambiente_nfe === "producao" ? 1 : 2;

    // Calcular totais
    const somaProdutos = pedido.itens.reduce((sum: number, item: any) => {
      return sum + item.preco_unitario * item.quantidade;
    }, 0);

    const valorFrete = Number(pedido.frete_valor || 0);
    const valorTotal = somaProdutos + valorFrete;

    const ufEmitente = configFiscal.emitente_estado || "SC";
    const ufDestinatario = (cliente.estado || "SC")
      .toUpperCase()
      .substring(0, 2);
    const isMesmoEstado = ufEmitente === ufDestinatario;
    const isCPF = !!cliente.cpf && !cliente.cnpj;
    const isCNPJ = !!cliente.cnpj;

    // Definir CFOP e ICMS
    let cfop = "";
    let csosn = "";

    if (isMesmoEstado) {
      if (isCPF) {
        cfop = "5102";
        csosn = "102";
      } else if (isCNPJ) {
        cfop = "5102";
        csosn = "101";
      }
    } else {
      if (isCPF) {
        cfop = "6108";
        csosn = "102";
      } else if (isCNPJ) {
        cfop = "6101";
        csosn = "101";
      }
    }

    if (!cfop) {
      cfop = isMesmoEstado ? "5102" : "6108";
      csosn = "102";
    }

    console.log("🏷️ Regras tributárias aplicadas:", {
      ufEmitente,
      ufDestinatario,
      isMesmoEstado,
      tipoCliente: isCPF ? "CPF" : isCNPJ ? "CNPJ" : "NÃO IDENTIFICADO",
      cfop,
      csosn,
    });

    // ===== CONSTRUIR FORMAS DE PAGAMENTO (CORRETO PARA NFe 4.00) =====
    const formasPagamento = [];

    if (parcelas && parcelas.length > 0) {
      console.log(
        "📋 Construindo formas_pagamento a partir das parcelas:",
        parcelas.length,
      );

      // Calcular soma total das parcelas para ajustar a última
      let somaParcelas = 0;
      for (let i = 0; i < parcelas.length; i++) {
        somaParcelas += Number(parcelas[i].valor_parcela);
      }

      for (let i = 0; i < parcelas.length; i++) {
        const parcela = parcelas[i];
        const dataVencimento = new Date(parcela.data_vencimento);

        const ano = dataVencimento.getFullYear();
        const mes = (dataVencimento.getMonth() + 1).toString().padStart(2, "0");
        const dia = dataVencimento.getDate().toString().padStart(2, "0");

        // Ajustar o valor da última parcela para garantir a soma exata
        let valorParcela = Number(parcela.valor_parcela);
        if (i === parcelas.length - 1) {
          valorParcela = Number(valorTotal) - (somaParcelas - valorParcela);
        }

        formasPagamento.push({
          indicador_pagamento: "1",
          forma_pagamento: "15",
          valor_pagamento: valorParcela.toFixed(2),
        });

        console.log(`  Parcela ${i + 1}: valor R$ ${valorParcela.toFixed(2)}`);
      }
    }

       // ===== CONSTRUIR DUPLICATAS E FATURA =====
    const duplicatas = [];
    let somaParcelas = 0;

    if (parcelas && parcelas.length > 0) {
      // Calcula soma para ajuste final
      somaParcelas = parcelas.reduce(
        (sum: number, p: any) => sum + Number(p.valor_parcela),
        0,
      );

      for (let i = 0; i < parcelas.length; i++) {
        const parcela = parcelas[i];
        const dataVenc = new Date(parcela.data_vencimento);

        let valorParcela = Number(parcela.valor_parcela);
        if (i === parcelas.length - 1) {
          valorParcela = Number(valorTotal) - (somaParcelas - valorParcela);
        }

        duplicatas.push({
          nDup: (i + 1).toString().padStart(3, "0"),
          dVenc: dataVenc.toISOString().split("T")[0], // YYYY-MM-DD
          vDup: valorParcela.toFixed(2),
        });
      }
    }
// ANTES de enviar para Focus
console.log("🔍 DUPLICATAS SENDO ENVIADAS:", JSON.stringify({
  numero_fatura: numeroNFe.toString().padStart(9, "0"),
  valor_original_fatura: Number(valorTotal).toFixed(2),
  duplicatas: duplicatas.map(dup => ({
    nDup: dup.nDup,
    dVenc: dup.dVenc,
    vDup: parseFloat(dup.vDup).toFixed(2)
  }))
}, null, 2));
    // ===== MONTAR PAYLOAD PARA FOCUS NFe (CORRETO SEGUNDO DOCUMENTAÇÃO) =====
const dadosFocus: any = {
  natureza_operacao: "VENDA DE MERCADORIA",
  data_emissao: new Date().toISOString().split("T")[0],
  tipo_documento: "1",
  finalidade_emissao: "1",
  numero: numeroNFe,
  serie: configFiscal.serie_nfe,

  cnpj_emitente: configFiscal.emitente_cnpj.replace(/\D/g, ""),
  inscricao_estadual_emitente: configFiscal.emitente_ie || "",

  // Destinatário
  nome_destinatario: (cliente.nome || cliente.razao_social || "CONSUMIDOR FINAL").substring(0, 60),
  logradouro_destinatario: (cliente.endereco || "NAO INFORMADO").substring(0, 60),
  numero_destinatario: (cliente.numero || "S/N").substring(0, 10),
  bairro_destinatario: (cliente.bairro || "CENTRO").substring(0, 60),
  municipio_destinatario: (cliente.cidade || "Joinville").substring(0, 60),
  uf_destinatario: ufDestinatario,
  cep_destinatario: (cliente.cep || "").replace(/\D/g, "") || "89209000",
  pais_destinatario: "Brasil",
  telefone_destinatario: cliente.telefone?.replace(/\D/g, "") || "",

  // CPF ou CNPJ do destinatário
  ...(cliente.cpf ? { cpf_destinatario: cliente.cpf.replace(/\D/g, "") } : {}),
  ...(cliente.cnpj ? { cnpj_destinatario: cliente.cnpj.replace(/\D/g, "") } : {}),

  // Valores
  valor_total: Number(valorTotal).toFixed(2),
  valor_produtos: Number(somaProdutos).toFixed(2),
  valor_frete: Number(valorFrete).toFixed(2),
  valor_seguro: "0.00",
  modalidade_frete: "0",

  // Itens
  items: pedido.itens.map((item: any, idx: number) => {
    const valorItem = item.preco_unitario * item.quantidade;
    const codigoProduto = (item.produto?.modelo_prod || item.produto?.modelo || item.produto?.id || "0001").substring(0, 60);
    const descricaoProduto = (item.produto?.titulo || "Produto").substring(0, 120);
    const ncmProduto = item.produto?.ncm || "64029990";

    return {
      numero_item: (idx + 1).toString(),
      codigo_produto: codigoProduto,
      descricao: descricaoProduto,
      cfop: cfop,
      unidade_comercial: "UN",
      quantidade_comercial: Number(item.quantidade).toFixed(4),
      valor_unitario_comercial: Number(item.preco_unitario).toFixed(4),
      valor_bruto: valorItem.toFixed(2),
      unidade_tributavel: "UN",
      quantidade_tributavel: Number(item.quantidade).toFixed(4),
      valor_unitario_tributavel: Number(item.preco_unitario).toFixed(4),
      codigo_ncm: ncmProduto,
      icms_situacao_tributaria: csosn,
      icms_origem: "0",
      pis_situacao_tributaria: "99",
      cofins_situacao_tributaria: "99",
    };
  }),

  // ===== ESTRUTURA DE FATURA/DUPLICATAS (FORMATO CORRETO FOCUS) =====
  cobr: {
  fat: {
    nFat: numeroNFe.toString().padStart(9, "0"),
    vOrig: Number(valorTotal).toFixed(2),
    vDesc: "0.00",
    vLiq: Number(valorTotal).toFixed(2)
  },
  dup: duplicatas.map(dup => ({
    nDup: dup.nDup,
    dVenc: dup.dVenc,
    vDup: dup.vDup  // já está como string com 2 decimais
  }))
},

  // Formas de pagamento
  formas_pagamento: formasPagamento,
};

// ===== ADICIONAR INFORMAÇÕES DAS PARCELAS NA OBSERVAÇÃO =====
if (parcelas && parcelas.length > 0) {
  const infoParcelas = parcelas.map((p, idx) => {
    const valor = Number(p.valor_parcela).toFixed(2);
    const venc = new Date(p.data_vencimento).toLocaleDateString('pt-BR');
    return `${idx+1}ª parcela: R$ ${valor} venc: ${venc}`;
  }).join('; ');
  
  dadosFocus.informacoes_adicionais_contribuinte = `Condição de pagamento: ${parcelas.length}x sem juros. ${infoParcelas}`;
}

console.log("📦 Dados Focus enviados (corrigido):", JSON.stringify(dadosFocus, null, 2));

    console.log(
      "📦 Dados Focus enviados (corrigido):",
      JSON.stringify(dadosFocus, null, 2),
    );

    console.log(
      "📦 Dados Focus enviados:",
      JSON.stringify(dadosFocus, null, 2),
    );

    // 5. Enviar para Focus NFe
    const focusClient = new FocusNFeClient(
      ambiente === 1 ? "producao" : "homologacao",
    );

    const respostaFocus = await focusClient.emitirNFe(dadosFocus, referencia);
    console.log("✅ Resposta Focus:", respostaFocus);

    // ===== PROCESSAR RESPOSTA =====
    let dadosCompletos = { ...respostaFocus };
    let statusFinal = respostaFocus.status;

    if (
      respostaFocus.status === "autorizado" ||
      respostaFocus.status_sefaz === "100"
    ) {
      dadosCompletos = {
        ...dadosCompletos,
        chave: respostaFocus.chave_nfe,
        protocolo: respostaFocus.protocolo || respostaFocus.nProt,
        status_sefaz: respostaFocus.status_sefaz,
        mensagem_sefaz: respostaFocus.mensagem_sefaz,
        caminho_xml: respostaFocus.caminho_xml_nota_fiscal,
        caminho_danfe: respostaFocus.caminho_danfe,
      };
      statusFinal = "autorizado";
      console.log("✅ Nota autorizada imediatamente!");
    } else if (respostaFocus.status === "processando_autorizacao") {
      console.log("⏳ Nota em processamento, consultando até autorizar...");

      let consultado = false;
      let tentativas = 0;
      const maxTentativas = 15;
      const intervalo = 2000;

      while (!consultado && tentativas < maxTentativas) {
        tentativas++;

        try {
          await new Promise((resolve) => setTimeout(resolve, intervalo));

          const consulta = await focusClient.consultarNFe(referencia);
          console.log(
            `📊 Tentativa ${tentativas}/${maxTentativas}:`,
            consulta.status,
          );

          if (
            consulta.status === "autorizado" ||
            consulta.status === "cancelado" ||
            consulta.status === "rejeitado" ||
            consulta.status === "denegado"
          ) {
            dadosCompletos = {
              ...dadosCompletos,
              chave: consulta.chave_nfe,
              protocolo: consulta.protocolo || consulta.nProt,
              status_sefaz: consulta.status_sefaz,
              mensagem_sefaz: consulta.mensagem_sefaz,
              caminho_xml: consulta.caminho_xml_nota_fiscal,
              caminho_danfe: consulta.caminho_danfe,
            };
            statusFinal = consulta.status;
            consultado = true;
            console.log("✅ Consulta concluída:", consulta.status);
            break;
          }

          if (consulta.status === "processando_autorizacao") {
            console.log("⏳ Ainda processando...");
          }
        } catch (err) {
          console.error("❌ Erro na consulta:", err);
        }
      }

      if (!consultado) {
        console.log(
          "⚠️ Não foi possível obter autorização após todas tentativas",
        );
        statusFinal = "processando_autorizacao";
      }
    }

    const statusBanco = mapearStatusParaBanco(
      statusFinal,
      dadosCompletos.status_sefaz,
    );

    // 6. Salvar no banco
    const chaveLimpa = (
      dadosCompletos.chave ||
      respostaFocus.chave ||
      ""
    ).replace(/^NFe/, "");

    const notaFiscalData: any = {
      empresa_id: empresaId,
      pedido_id: pedido_id,
      numero_nf: numeroNFe.toString(),
      numero: numeroNFe,
      serie_nf: configFiscal.serie_nfe,
      serie: configFiscal.serie_nfe,
      chave_acesso: chaveLimpa,
      status: statusBanco,
      protocolo: dadosCompletos.protocolo,
      motivo_status: dadosCompletos.mensagem_sefaz,
      valor_total: pedido.total,
      destinatario_nome: cliente.nome || cliente.razao_social,
      destinatario_cpf_cnpj: cliente.cpf || cliente.cnpj,
      emitido_automaticamente: automatica,
      data_emissao: new Date().toISOString(),
      data_autorizacao:
        statusBanco === "autorizada" ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ref_focus: referencia,
    };

    const { data: notaFiscal, error: insertError } = await supabase
      .from("notas_fiscais")
      .insert(notaFiscalData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erro ao inserir NF-e:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 7. Baixar e salvar XML
    if (dadosCompletos.caminho_xml && notaFiscal) {
      try {
        const focusBaseUrl =
          ambiente === 1
            ? process.env.FOCUS_NFE_URL || "https://api.focusnfe.com.br"
            : process.env.FOCUS_NFE_HOMOLOGACAO_URL ||
              "https://homologacao.focusnfe.com.br";

        const xmlUrl = focusBaseUrl + dadosCompletos.caminho_xml;
        console.log("📥 Baixando XML da Focus:", xmlUrl);

        const authToken = Buffer.from(
          `${process.env.FOCUS_NFE_HOMOLOGACAO_TOKEN}:`,
        ).toString("base64");

        const xmlResponse = await fetch(xmlUrl, {
          headers: { Authorization: `Basic ${authToken}` },
        });

        if (xmlResponse.ok) {
          const xmlContent = await xmlResponse.text();
          console.log("📄 XML baixado, tamanho:", xmlContent.length);

          const fileName = `${chaveLimpa}.xml`;
          const filePath = `${new Date().getFullYear()}/${numeroNFe.toString().padStart(9, "0")}-${configFiscal.serie_nfe}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("nfe-xml")
            .upload(filePath, xmlContent, {
              contentType: "application/xml",
              upsert: true,
            });

          if (!uploadError) {
            await supabase
              .from("notas_fiscais")
              .update({ caminho_xml: filePath, xml_nf: xmlContent })
              .eq("id", notaFiscal.id);
            console.log("✅ XML salvo no bucket");
          } else {
            console.error("❌ Erro no upload do XML:", uploadError);
          }
        } else {
          console.error("❌ Erro ao baixar XML:", xmlResponse.status);
        }
      } catch (storageError) {
        console.error("❌ Erro ao processar XML:", storageError);
      }
    }

    // 8. Baixar e salvar DANFE
    if (dadosCompletos.caminho_danfe && notaFiscal) {
      try {
        const focusBaseUrl =
          ambiente === 1
            ? process.env.FOCUS_NFE_URL || "https://api.focusnfe.com.br"
            : process.env.FOCUS_NFE_HOMOLOGACAO_URL ||
              "https://homologacao.focusnfe.com.br";

        const danfeUrl = focusBaseUrl + dadosCompletos.caminho_danfe;
        console.log("📥 Baixando DANFE da Focus:", danfeUrl);

        const authToken = Buffer.from(
          `${process.env.FOCUS_NFE_HOMOLOGACAO_TOKEN}:`,
        ).toString("base64");

        const danfeResponse = await fetch(danfeUrl, {
          headers: { Authorization: `Basic ${authToken}` },
        });

        if (danfeResponse.ok) {
          const danfeBuffer = await danfeResponse.arrayBuffer();
          console.log("📄 DANFE baixado, tamanho:", danfeBuffer.byteLength);

          const fileName = `${chaveLimpa}.pdf`;
          const filePath = `${new Date().getFullYear()}/${numeroNFe.toString().padStart(9, "0")}-${configFiscal.serie_nfe}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("nfe-danfe")
            .upload(filePath, danfeBuffer, {
              contentType: "application/pdf",
              upsert: true,
            });

          if (!uploadError) {
            const {
              data: { publicUrl },
            } = supabase.storage.from("nfe-danfe").getPublicUrl(filePath);
            await supabase
              .from("notas_fiscais")
              .update({ danfe_url: publicUrl })
              .eq("id", notaFiscal.id);
            console.log("✅ DANFE salvo no bucket:", publicUrl);
          } else {
            console.error("❌ Erro no upload do DANFE:", uploadError);
          }
        } else {
          console.error("❌ Erro ao baixar DANFE:", danfeResponse.status);
        }
      } catch (storageError) {
        console.error("❌ Erro ao processar DANFE:", storageError);
      }
    }

    // 9. Atualizar número da última NF-e
    await supabase
      .from("configuracoes_fiscais")
      .update({
        numero_ultima_nfe: numeroNFe,
        updated_at: new Date().toISOString(),
      })
      .eq("id", configFiscal.id);

    return NextResponse.json({
      success: true,
      data: notaFiscal,
      focus_response: dadosCompletos,
    });
  } catch (error) {
    console.error("🔴 [API] Erro na emissão:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro na emissão",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}

function mapearStatusParaBanco(status: string, statusSefaz?: string): string {
  if (status === "autorizado" || statusSefaz === "100") {
    return "autorizada";
  } else if (
    status === "cancelado" ||
    statusSefaz === "135" ||
    statusSefaz === "301"
  ) {
    return "cancelada";
  } else if (status === "rejeitado" || statusSefaz?.startsWith("4")) {
    return "rejeitada";
  } else if (status === "denegado" || statusSefaz === "110") {
    return "denegada";
  } else if (status === "processando_autorizacao") {
    return "processando";
  }
  return "pendente";
}
