// src/app/api/nfe/[id]/cancelar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { XMLHttpRequest } from 'xmlhttprequest';

export async function DELETE(
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

    const searchParams = request.nextUrl.searchParams;
    const justificativa = searchParams.get("justificativa");
    
    if (!justificativa || justificativa.length < 15) {
      return NextResponse.json({ error: "Justificativa deve ter no mínimo 15 caracteres" }, { status: 400 });
    }

    const { data: nfe, error: nfeError } = await supabase
      .from("notas_fiscais")
      .select("id, pedido_id, status, chave_acesso, ref_focus, numero_nf")
      .eq("id", id)
      .single();

    if (nfeError || !nfe) {
      return NextResponse.json({ error: "NF-e não encontrada" }, { status: 404 });
    }

    // 🔴 NOVO BLOCO: Processar cancelamento de notas em processamento (erro de envio)
    if (nfe.status === "processando") {
      // Cancela a NF-e diretamente no banco
      await supabase
        .from("notas_fiscais")
        .update({
          status: "cancelada",
          motivo_cancelamento: justificativa,
          data_cancelamento: new Date().toISOString()
        })
        .eq("id", id);

      // Libera o pedido para nova emissão
      if (nfe.pedido_id) {
        await supabase
          .from("pedidos")
          .update({ 
            observacoes: null 
          })
          .eq("id", nfe.pedido_id);
      }

      return NextResponse.json({ 
        success: true, 
        message: "NF-e cancelada. Pedido liberado para nova emissão." 
      });
    }

    // Verificar se pode cancelar (apenas notas autorizadas seguem o fluxo normal)
    if (nfe.status !== "autorizada") {
      return NextResponse.json({ error: "Apenas notas autorizadas podem ser canceladas" }, { status: 400 });
    }

    const ref = nfe.ref_focus || nfe.pedido_id;
    
    console.log("🔍 Cancelando NF-e:", {
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
    
    const url = `${baseUrl}/v2/nfe/${ref}`;
    
    console.log("📡 URL Focus:", url);
    
    const xhr = new XMLHttpRequest();
    
    xhr.open('DELETE', url, false, token);
    
    const cancelData = { justificativa };
    xhr.send(JSON.stringify(cancelData));
    
    console.log("📡 Resposta Focus:", {
      status: xhr.status,
      response: xhr.responseText
    });
    
    if (xhr.status === 200) {
      const responseData = JSON.parse(xhr.responseText);
      
      await supabase
        .from("notas_fiscais")
        .update({
          status: "cancelada",
          motivo_status: justificativa,
          motivo_cancelamento: justificativa,
          data_cancelamento: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      
      return NextResponse.json({
        success: true,
        message: "NF-e cancelada com sucesso",
        data: responseData,
      });
    } else {
      return NextResponse.json({ 
        error: "Erro ao cancelar NF-e", 
        status: xhr.status,
        response: xhr.responseText 
      }, { status: xhr.status });
    }
    
  } catch (error) {
    console.error("Erro no cancelamento:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}