// src/app/api/nfe/[id]/xml/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params
    const { id } = await params;
    
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
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          }
        },
      }
    );

    // Verificar autenticação
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar NF-e
    const { data: nfe, error: nfeError } = await supabase
      .from("notas_fiscais")
      .select("chave_acesso, caminho_xml, xml_nf, numero, serie")
      .eq("id", id)
      .single();

    if (nfeError || !nfe) {
      return NextResponse.json({ error: "NF-e não encontrada" }, { status: 404 });
    }

    let xmlContent: string | null = null;

    // Tentar buscar do storage primeiro
    if (nfe.caminho_xml) {
      try {
        const { data } = await supabase.storage
          .from('nfe-xml')
          .download(nfe.caminho_xml);
        
        if (data) {
          xmlContent = await data.text();
        }
      } catch (storageError) {
        console.error('Erro ao buscar do storage:', storageError);
      }
    }

    // Se não achou no storage, usar o que está no banco
    if (!xmlContent && nfe.xml_nf) {
      xmlContent = nfe.xml_nf;
    }

    if (!xmlContent) {
      return NextResponse.json({ error: "XML não disponível" }, { status: 404 });
    }

    // Retornar XML
    return new NextResponse(xmlContent, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Content-Disposition": `attachment; filename="nfe-${nfe.chave_acesso}.xml"`,
      },
    });

  } catch (error) {
    console.error("Erro ao baixar XML:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}