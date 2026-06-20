import { NextResponse } from "next/server";
import { XMLHttpRequest } from 'xmlhttprequest';

export async function GET() {
  try {
    const chave = "42260545595442000166550010000002201244172732";
    const token = process.env.FOCUS_NFE_HOMOLOGACAO_TOKEN;
    
    console.log("🔍 Buscando nota pela chave:", chave);
    
    // URL correta da Focus (sem /v2/nfe?chave=)
    const url = `https://homologacao.focusnfe.com.br/v2/nfe?chave=${chave}`;
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false, token);
    xhr.send();
    
    console.log("📡 Status Focus:", xhr.status);
    console.log("📡 Resposta Focus:", xhr.responseText);
    
    if (xhr.status === 200) {
      const data = JSON.parse(xhr.responseText);
      if (data && data.length > 0) {
        const nota = data[0];
        return NextResponse.json({
          success: true,
          ref: nota.ref,
          chave: nota.chave,
          status: nota.status,
          protocolo: nota.protocolo,
          mensagem: nota.mensagem_sefaz
        });
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      status: xhr.status,
      response: xhr.responseText 
    }, { status: xhr.status });
    
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido"
    }, { status: 500 });
  }
}