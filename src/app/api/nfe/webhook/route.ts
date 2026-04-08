// src/app/api/nfe/webhook/route.ts (webhook principal)
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { NFeStorageService } from "@/lib/nfe/storage-service";

export async function POST(request: NextRequest) {
  try {
    // Validar token da Focus
    const tokenRecebido = request.headers.get("X-Webhook-Token");
    const tokenEsperado = process.env.FOCUS_WEBHOOK_TOKEN; // Usar variável específica, não NEXTAUTH_SECRET

    if (!tokenRecebido || tokenRecebido !== tokenEsperado) {
      console.error("❌ Token inválido no webhook");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const supabase = getAdminClient();
    const body = await request.json();

    console.log("📥 Webhook Focus recebido:", {
      chave: body.chave_nfe,
      status: body.status,
      status_sefaz: body.status_sefaz,
      ref: body.ref,
    });

    const {
      chave_nfe,
      status,
      status_sefaz,
      mensagem_sefaz,
      protocolo,
      numero,
      serie,
      caminho_xml_nota_fiscal,
      caminho_danfe,
      ref,
    } = body;

    if (!chave_nfe) {
      return NextResponse.json({ error: "Chave não fornecida" }, {
        status: 400,
      });
    }

    // Limpar chave (remover "NFe" do início se presente)
    const chaveLimpa = chave_nfe.replace(/^NFe/, "");

    // Buscar NF-e pela chave ou ref
    let query = supabase
      .from("notas_fiscais")
      .select("*");

    if (ref) {
      // Se veio com ref, podemos buscar pelo pedido_id (se a ref for o pedido_id)
      query = query.eq("pedido_id", ref);
    } else {
      query = query.eq("chave_acesso", chaveLimpa);
    }

    const { data: nfes, error: buscaError } = await query;

    if (buscaError || !nfes || nfes.length === 0) {
      console.error("❌ NF-e não encontrada:", { chave: chaveLimpa, ref });

      // Criar NF-e se não existir? (caso de emissão externa)
      if (ref) {
        const { data: novaNfe, error: createError } = await supabase
          .from("notas_fiscais")
          .insert({
            pedido_id: ref,
            chave_acesso: chaveLimpa,
            numero_nf: numero,
            numero: parseInt(numero),
            serie_nf: serie,
            serie: parseInt(serie),
            status: mapearStatusFocus(status, status_sefaz),
            protocolo,
            motivo_status: mensagem_sefaz,
            data_emissao: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ Erro ao criar NF-e:", createError);
          return NextResponse.json({ error: "Erro ao criar registro" }, {
            status: 500,
          });
        }

        return NextResponse.json({ received: true, nfe_id: novaNfe.id });
      }

      return NextResponse.json({ error: "NF-e não encontrada" }, {
        status: 404,
      });
    }

    const nfe = nfes[0];

    // Mapear status da Focus para seu sistema
    const novoStatus = mapearStatusFocus(status, status_sefaz);

    // Preparar updates
    const updates: any = {
      status: novoStatus,
      protocolo: protocolo || nfe.protocolo,
      motivo_status: mensagem_sefaz || nfe.motivo_status,
      updated_at: new Date().toISOString(),
    };

    // Adicionar datas específicas
    if (novoStatus === "autorizada") {
      updates.data_autorizacao = new Date().toISOString();
    } else if (novoStatus === "cancelada") {
      updates.data_cancelamento = new Date().toISOString();
    }

    // Se veio caminho do XML, baixar e salvar no storage
    if (caminho_xml_nota_fiscal) {
      try {
        const storageService = new NFeStorageService();

        // Usar URL completa
        const xmlUrl = getFocusFileUrl(caminho_xml_nota_fiscal);
        const xmlResponse = await fetch(xmlUrl, {
          headers: {
            "Authorization": `Basic ${
              Buffer.from(`${process.env.FOCUS_NFE_HOMOLOGACAO_TOKEN}:`)
                .toString("base64")
            }`,
          },
        });

        const xmlContent = await xmlResponse.text();

        const { path } = await storageService.salvarXML(
          chaveLimpa,
          xmlContent,
          parseInt(numero) || nfe.numero,
          parseInt(serie) || nfe.serie,
        );

        updates.caminho_xml = path;
      } catch (xmlError) {
        console.error("Erro ao salvar XML:", xmlError);
      }
    }

    // Se veio caminho do DANFE, baixar e salvar
    if (caminho_danfe) {
      try {
        const storageService = new NFeStorageService();

        const danfeResponse = await fetch(caminho_danfe);
        const danfeBuffer = Buffer.from(await danfeResponse.arrayBuffer());

        const { url } = await storageService.salvarDANFE(
          chaveLimpa,
          danfeBuffer,
          parseInt(numero) || nfe.numero,
          parseInt(serie) || nfe.serie,
        );

        updates.danfe_url = url;
      } catch (danfeError) {
        console.error("Erro ao salvar DANFE:", danfeError);
      }
    }

    // Atualizar nota fiscal
    const { error: updateError } = await supabase
      .from("notas_fiscais")
      .update(updates)
      .eq("id", nfe.id);

    if (updateError) {
      console.error("❌ Erro ao atualizar nota:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Registrar evento
    await supabase
      .from("nfe_eventos")
      .insert({
        nfe_id: nfe.id,
        tipo: novoStatus,
        descricao: mensagem_sefaz || `Status alterado para ${novoStatus}`,
        dados: {
          status_sefaz,
          protocolo,
          recebido_em: new Date().toISOString(),
          webhook_recebido: body,
        },
      });

    console.log("✅ Webhook processado com sucesso:", {
      nfe_id: nfe.id,
      novoStatus,
    });

    return NextResponse.json({
      received: true,
      nfe_id: nfe.id,
      status: novoStatus,
    });
  } catch (error) {
    console.error("❌ Erro no webhook:", error);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 },
    );
  }
}

function getFocusFileUrl(caminho: string): string {
  if (!caminho) return "";
  if (caminho.startsWith("http")) return caminho;

  const baseUrl = process.env.FOCUS_NFE_HOMOLOGACAO_URL ||
    "https://homologacao.focusnfe.com.br";
  const path = caminho.startsWith("/") ? caminho : `/${caminho}`;
  return `${baseUrl}${path}`;
}

function mapearStatusFocus(status: string, statusSefaz: string): string {
  // Mapear status da Focus para seu sistema
  if (status === "autorizado" || statusSefaz === "100") {
    return "autorizada";
  } else if (
    status === "cancelado" || statusSefaz === "135" || statusSefaz === "301"
  ) {
    return "cancelada";
  } else if (status === "rejeitado" || statusSefaz?.startsWith("4")) {
    return "rejeitada";
  } else if (status === "denegado" || statusSefaz === "110") {
    return "denegada";
  }

  return "processando";
}
