// src/app/api/nfe/[id]/consultar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { XMLHttpRequest } from 'xmlhttprequest';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set(name, value, options); },
          remove(name: string, options: any) { cookieStore.set(name, '', { ...options, maxAge: 0 }); }
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🔴 ALTERAÇÃO AQUI: Buscar a NF-e incluindo ref_focus
    const { data: nfe, error: nfeError } = await supabase
      .from("notas_fiscais")
      .select("id, chave_acesso, pedido_id, status, ref_focus, numero_nf")  // ✅ ADICIONEI ref_focus
      .eq("id", id)
      .single();

    if (nfeError || !nfe) {
      return NextResponse.json({ error: "NF-e não encontrada" }, { status: 404 });
    }

    // 🔴 ALTERAÇÃO AQUI: Usar ref_focus se existir, senão usa pedido_id
    const ref = nfe.ref_focus || nfe.pedido_id;
    
    console.log("🔍 Consultando NF-e:", {
      id: nfe.id,
      numero: nfe.numero_nf,
      ref_usada: ref,
      tem_ref_focus: !!nfe.ref_focus
    });
    
    const token = process.env.FOCUS_NFE_HOMOLOGACAO_TOKEN;
    const ambiente = process.env.FOCUS_NFE_AMBIENTE || "homologacao";
    
    const baseUrl = ambiente === "producao" 
      ? "https://api.focusnfe.com.br"
      : "https://homologacao.focusnfe.com.br";
    
    const url = `${baseUrl}/v2/nfe/${ref}?completa=1`;
    
    console.log("📡 URL Focus consulta:", url);
    
    // Usar XMLHttpRequest
    const xhr = new XMLHttpRequest();
    
    let responseData: any = null;
    let statusCode = 0;
    
    xhr.open('GET', url, false, token);
    xhr.send();
    
    statusCode = xhr.status;
    
    console.log("📡 Resposta Focus consulta:", {
      status: statusCode,
      response: xhr.responseText.substring(0, 200) // Mostra só o início para não poluir
    });
    
    if (statusCode === 200) {
      responseData = JSON.parse(xhr.responseText);
    } else {
      return NextResponse.json({ 
        error: "Erro na consulta", 
        status: statusCode,
        response: xhr.responseText 
      }, { status: statusCode });
    }

    // Atualizar status no banco se necessário
    if (responseData) {
      const novoStatus = mapearStatusFocusParaBanco(responseData.status, responseData.status_sefaz);
      
      if (novoStatus !== nfe.status) {
        console.log("📊 Status mudou:", { de: nfe.status, para: novoStatus });
        
        const updates: any = {
          status: novoStatus,
          updated_at: new Date().toISOString(),
        };
        
        if (responseData.protocolo) updates.protocolo = responseData.protocolo;
        if (responseData.mensagem_sefaz) updates.motivo_status = responseData.mensagem_sefaz;
        
        if (novoStatus === "autorizada") updates.data_autorizacao = new Date().toISOString();
        if (novoStatus === "cancelada") updates.data_cancelamento = new Date().toISOString();
        
        await supabase
          .from("notas_fiscais")
          .update(updates)
          .eq("id", id);
      }
      
      return NextResponse.json({
        success: true,
        data: responseData,
        status_atual: novoStatus,
      });
    }
    
    return NextResponse.json({ success: false, error: "Resposta inválida" }, { status: 500 });
    
  } catch (error) {
    console.error("Erro na consulta:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

function mapearStatusFocusParaBanco(status: string, statusSefaz?: string): string {
  if (status === "autorizado" || statusSefaz === "100") return "autorizada";
  if (status === "cancelado" || statusSefaz === "135" || statusSefaz === "301") return "cancelada";
  if (status === "rejeitado" || statusSefaz?.startsWith("4")) return "rejeitada";
  if (status === "denegado" || statusSefaz === "110") return "denegada";
  if (status === "processando_autorizacao") return "processando";
  return "pendente";
}