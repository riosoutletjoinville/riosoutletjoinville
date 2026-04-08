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

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { pedido_id, automatica = false } = body;

    console.log("🔵 [API] Processando pedido:", pedido_id);

    // 1. Buscar pedido com todos os dados
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(`
        *,
        cliente:clientes(*),
        itens:pedido_itens(
          *,
          produto:produtos(*)
        )
      `)
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

    // IMPORTANTE: Se empresa_id não existir no pedido,
    // precisamos buscar de alguma forma (configuração global)
    let empresaId = pedido.empresa_id;

    // Se não tiver empresa_id no pedido, buscar o usuário atual
    if (!empresaId) {
      console.log(
        "⚠️ Pedido sem empresa_id, buscando do usuário:",
        session.user.id,
      );

      // Buscar empresa do usuário logado
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

    // Se não encontrou com empresa_id, tentar buscar configuração global
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

    // Gerar referência única para rastreamento
    const referencia = `${pedido_id}-${Date.now()}`;

    // Determinar ambiente correto
    const ambiente = configFiscal.ambiente_nfe === "producao" ? 1 : 2;

    // 4. Montar payload da Focus
    const dadosFocus = {
      natureza_operacao: "VENDA DE MERCADORIA",
      data_emissao: new Date().toISOString(),
      tipo_documento: "1",
      finalidade_emissao: "1",

      cnpj_emitente: configFiscal.emitente_cnpj.replace(/\D/g, ""),
      inscricao_estadual_emitente: configFiscal.emitente_ie,

      nome_destinatario: cliente.nome || cliente.razao_social ||
        "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL",
      cpf_destinatario: cliente.cpf?.replace(/\D/g, "") || null,
      cnpj_destinatario: cliente.cnpj?.replace(/\D/g, "") || null,
      logradouro_destinatario: cliente.endereco || "NAO INFORMADO",
      numero_destinatario: cliente.numero || "S/N",
      bairro_destinatario: cliente.bairro || "CENTRO",
      municipio_destinatario: cliente.cidade || "Joinville",
      uf_destinatario: (cliente.estado || "SC").toUpperCase().substring(0, 2),
      cep_destinatario: (cliente.cep || "").replace(/\D/g, "") || "89209000",
      pais_destinatario: "Brasil",
      telefone_destinatario: cliente.telefone?.replace(/\D/g, "") || null,

      valor_total: Number(pedido.total).toFixed(2),
      valor_produtos: Number(pedido.total).toFixed(2),
      valor_frete: Number(pedido.frete_valor || 0).toFixed(2),
      valor_seguro: "0.00",
      modalidade_frete: "0",

      items: pedido.itens.map((item: any, idx: number) => ({
        numero_item: (idx + 1).toString(),
        codigo_produto: item.produto?.modelo_prod || item.produto?.modelo || "0123456789-x",
        descricao: item.produto?.titulo || "Produto",
        cfop: "5102",
        unidade_comercial: "UN",
        quantidade_comercial: Number(item.quantidade).toFixed(2),
        valor_unitario_comercial: Number(item.preco_unitario).toFixed(2),
        valor_bruto: (item.preco_unitario * item.quantidade).toFixed(2),
        codigo_ncm: item.produto?.ncm || "64029990",
        icms_situacao_tributaria: "400",
        icms_origem: "0",
        pis_situacao_tributaria: "07",
        cofins_situacao_tributaria: "07",
      })),
    };

    console.log("📦 Dados Focus enviados:", {
      uf: dadosFocus.uf_destinatario,
      municipio: dadosFocus.municipio_destinatario,
      cep: dadosFocus.cep_destinatario,
      nome: dadosFocus.nome_destinatario,
    });

    // 5. Enviar para Focus NFe
    const focusClient = new FocusNFeClient(
      ambiente === 1 ? "producao" : "homologacao",
    );

    const respostaFocus = await focusClient.emitirNFe(dadosFocus, referencia);
    console.log("✅ Resposta Focus:", respostaFocus);

    // ===== CORREÇÃO: MELHORAR A CONSULTA =====
    let dadosCompletos = { ...respostaFocus };
    let statusFinal = respostaFocus.status;

    // Se a nota já veio autorizada diretamente
    if (respostaFocus.status === "autorizado" || respostaFocus.status_sefaz === "100") {
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
    }
    // Se estiver processando, consultar até obter resultado
    else if (respostaFocus.status === "processando_autorizacao") {
      console.log("⏳ Nota em processamento, consultando até autorizar...");

      let consultado = false;
      let tentativas = 0;
      const maxTentativas = 15;
      const intervalo = 2000;

      while (!consultado && tentativas < maxTentativas) {
        tentativas++;
        
        try {
          await new Promise(resolve => setTimeout(resolve, intervalo));
          
          const consulta = await focusClient.consultarNFe(referencia);
          console.log(`📊 Tentativa ${tentativas}/${maxTentativas}:`, consulta.status);

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
        console.log("⚠️ Não foi possível obter autorização após todas tentativas");
        statusFinal = "processando_autorizacao";
      }
    }

    // Mapear status para o banco
    const statusBanco = mapearStatusParaBanco(statusFinal, dadosCompletos.status_sefaz);

    // 6. Salvar no banco com os dados completos
    const chaveLimpa = (dadosCompletos.chave || respostaFocus.chave || "")
      .replace(/^NFe/, "");

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
      data_autorizacao: statusBanco === "autorizada" ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: notaFiscal, error: insertError } = await supabase
      .from("notas_fiscais")
      .insert(notaFiscalData)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erro ao inserir NF-e:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    // ===== BLOCO CORRIGIDO - DOWNLOAD E UPLOAD DO XML =====
    if (dadosCompletos.caminho_xml && notaFiscal) {
      try {
        // CONSTRUIR URL COMPLETA DA FOCUS
        const focusBaseUrl = ambiente === 1 
          ? (process.env.FOCUS_NFE_URL || 'https://api.focusnfe.com.br')
          : (process.env.FOCUS_NFE_HOMOLOGACAO_URL || 'https://homologacao.focusnfe.com.br');
        
        const xmlUrl = focusBaseUrl + dadosCompletos.caminho_xml;
        
        console.log("📥 Baixando XML da Focus:", xmlUrl);

        const xmlResponse = await fetch(xmlUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(process.env.FOCUS_NFE_HOMOLOGACAO_TOKEN + ':').toString('base64')}`
          }
        });
        
        if (!xmlResponse.ok) {
          throw new Error(`Erro ao baixar XML: ${xmlResponse.status}`);
        }
        
        const xmlContent = await xmlResponse.text();
        console.log('📄 XML baixado, tamanho:', xmlContent.length);
        
        // SALVAR NO BUCKET SUPABASE
        const fileName = `${chaveLimpa}.xml`;
        const filePath = `${new Date().getFullYear()}/${numeroNFe.toString().padStart(9, '0')}-${configFiscal.serie_nfe}/${fileName}`;
        
        console.log("📤 Salvando XML no bucket:", filePath);

        const { error: uploadError } = await supabase
          .storage
          .from('nfe-xml')
          .upload(filePath, xmlContent, {
            contentType: 'application/xml',
            upsert: true
          });

        if (uploadError) {
          console.error("❌ Erro no upload do XML:", uploadError);
        } else {
          await supabase
            .from("notas_fiscais")
            .update({ 
              caminho_xml: filePath,
              xml_nf: xmlContent 
            })
            .eq("id", notaFiscal.id);
          console.log("✅ XML salvo no bucket");
        }
        
      } catch (storageError) {
        console.error("❌ Erro ao processar XML:", storageError);
      }
    }

    // ===== BLOCO CORRIGIDO - DOWNLOAD E UPLOAD DO DANFE =====
    if (dadosCompletos.caminho_danfe && notaFiscal) {
      try {
        // CONSTRUIR URL COMPLETA DA FOCUS
        const focusBaseUrl = ambiente === 1 
          ? (process.env.FOCUS_NFE_URL || 'https://api.focusnfe.com.br')
          : (process.env.FOCUS_NFE_HOMOLOGACAO_URL || 'https://homologacao.focusnfe.com.br');
        
        const danfeUrl = focusBaseUrl + dadosCompletos.caminho_danfe;
        
        console.log("📥 Baixando DANFE da Focus:", danfeUrl);

        const danfeResponse = await fetch(danfeUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(process.env.FOCUS_NFE_HOMOLOGACAO_TOKEN + ':').toString('base64')}`
          }
        });
        
        if (!danfeResponse.ok) {
          throw new Error(`Erro ao baixar DANFE: ${danfeResponse.status}`);
        }
        
        const danfeBuffer = await danfeResponse.arrayBuffer();
        console.log('📄 DANFE baixado, tamanho:', danfeBuffer.byteLength);
        
        // SALVAR NO BUCKET SUPABASE
        const fileName = `${chaveLimpa}.pdf`;
        const filePath = `${new Date().getFullYear()}/${numeroNFe.toString().padStart(9, '0')}-${configFiscal.serie_nfe}/${fileName}`;
        
        console.log("📤 Salvando DANFE no bucket:", filePath);

        const { error: uploadError } = await supabase
          .storage
          .from('nfe-danfe')
          .upload(filePath, danfeBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });

        if (uploadError) {
          console.error("❌ Erro no upload do DANFE:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('nfe-danfe')
            .getPublicUrl(filePath);
            
          await supabase
            .from("notas_fiscais")
            .update({ danfe_url: publicUrl })
            .eq("id", notaFiscal.id);
          console.log("✅ DANFE salvo no bucket:", publicUrl);
        }
        
      } catch (storageError) {
        console.error("❌ Erro ao processar DANFE:", storageError);
      }
    }

    // 8. Atualizar número da última NF-e
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
  } else if (status === "cancelado" || statusSefaz === "135" || statusSefaz === "301") {
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