// src/app/api/debug-cert/route.ts
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';
import * as forge from 'node-forge';

export async function GET() {
  const resultados = [];
  
  try {
    // 1. Buscar certificado do banco
    const supabase = getAdminClient();
    const { data: certificado, error } = await supabase
      .from('certificados_a3')
      .select('*')
      .eq('id', 'a7a9224f-062c-4f13-8f6c-e8e8c671dbe1')
      .single();

    if (error) {
      return NextResponse.json({ erro: 'Certificado não encontrado', error });
    }

    resultados.push({ etapa: 'Banco', certificado: {
      id: certificado.id,
      nome: certificado.nome,
      arquivo_path: certificado.arquivo_path,
      senha_existe: !!certificado.senha,
      validade: certificado.validade
    }});

    // 2. Baixar arquivo do storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('certificados')
      .download(certificado.arquivo_path);

    if (fileError) {
      return NextResponse.json({ erro: 'Erro ao baixar arquivo', fileError });
    }

    resultados.push({ 
      etapa: 'Storage', 
      tamanho_bytes: fileData.size,
      arquivo_baixado: true 
    });

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // 3. Testar com a senha do banco
    try {
      const p12Der = buffer.toString('base64');
      const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(p12Der));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certificado.senha || '');
      
      resultados.push({ 
        etapa: 'Teste com senha do banco', 
        status: '✅ Válido',
        senha_usada: certificado.senha ? '***' : 'string vazia'
      });
    } catch (error: any) {
      resultados.push({ 
        etapa: 'Teste com senha do banco', 
        status: '❌ Inválido',
        erro: error.message,
        senha_usada: certificado.senha ? '***' : 'string vazia'
      });
    }

    // 4. Testar com senha padrão '754149'
    try {
      const p12Der = buffer.toString('base64');
      const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(p12Der));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, '754149');
      
      resultados.push({ 
        etapa: 'Teste com senha padrão', 
        status: '✅ Válido',
        senha_usada: '754149'
      });
    } catch (error: any) {
      resultados.push({ 
        etapa: 'Teste com senha padrão', 
        status: '❌ Inválido',
        erro: error.message,
        senha_usada: '754149'
      });
    }

    // 5. Informações do arquivo
    resultados.push({
      etapa: 'Info',
      primeiros_bytes: buffer.slice(0, 20).toString('hex'),
      tamanho: buffer.length
    });

    return NextResponse.json({ resultados });

  } catch (error: any) {
    return NextResponse.json({ erro_geral: error.message }, { status: 500 });
  }
}