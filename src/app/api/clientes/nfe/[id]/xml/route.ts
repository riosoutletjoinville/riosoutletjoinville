// src/app/api/clientes/nfe/[id]/xml/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Para Next.js 15+, os parâmetros são recebidos como uma Promise
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id: nfeId } = await params;

    // Buscar a NF-e
    const { data: nfe, error: nfeError } = await supabase
      .from('notas_fiscais')
      .select('*, pedidos!inner(cliente_id)')
      .eq('id', nfeId)
      .single();

    if (nfeError || !nfe) {
      console.error('Erro ao buscar NF-e:', nfeError);
      return NextResponse.json({ error: 'NF-e não encontrada' }, { status: 404 });
    }

    // Verificar sessão do cliente (se existir tabela cliente_sessoes)
    // Se não existir, podemos pular essa verificação ou usar outra abordagem
    let session = null;
    let sessionError = null;
    
    try {
      const sessionResult = await supabase
        .from('cliente_sessoes')
        .select('*')
        .eq('cliente_id', (nfe.pedidos as any)?.cliente_id)
        .gt('expira_em', new Date().toISOString())
        .single();
      
      session = sessionResult.data;
      sessionError = sessionResult.error;
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
    }

    // Se a tabela cliente_sessoes existir e a sessão for inválida
    if (sessionError && sessionError.code !== 'PGRST116') {
      // PGRST116 significa que a tabela não existe ou não há registros
      console.error('Erro ao verificar sessão:', sessionError);
    }

    if (!nfe.xml && !nfe.xml_nf) {
      return NextResponse.json({ error: 'XML não disponível' }, { status: 404 });
    }

    // Pegar o XML (pode estar em xml ou xml_nf)
    const xmlContent = nfe.xml || nfe.xml_nf;
    const numeroNF = nfe.numero_nf || nfeId.slice(0, 8);

    // Retornar o XML
    return new NextResponse(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="nfe_${numeroNF}.xml"`
      }
    });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}