// src/lib/nfe/focus-client.ts
export class FocusNFeClient {
  private baseUrl: string;
  private token: string;
  private maxRetries = 3;

  constructor(ambiente: 'homologacao' | 'producao') {
    // URLs corretas da Focus
    this.baseUrl = ambiente === 'producao' 
      ? 'https://api.focusnfe.com.br'
      : 'https://homologacao.focusnfe.com.br';
    
    // Usar token baseado no ambiente
    this.token = ambiente === 'producao' 
      ? process.env.FOCUS_NFE_TOKEN!
      : process.env.FOCUS_NFE_HOMOLOGACAO_TOKEN!;

    console.log('🔧 FocusClient inicializado:', {
      ambiente,
      baseUrl: this.baseUrl,
      tokenLength: this.token?.length,
      tokenPreview: this.token?.substring(0, 5) + '...'
    });
  }

  private getAuthHeader() {
    // A Focus usa Basic Auth com o token como usuário e senha vazia
    // Importante: o token DEVE ser passado como usuário, sem os dois pontos no final
    const auth = Buffer.from(`${this.token}:`).toString('base64');
    return `Basic ${auth}`;
  }

  async emitirNFe(dados: any, ref?: string) {
    console.log('📤 [Focus] Emitindo NF-e:', {
      ref,
      numero: dados.numero,
      serie: dados.serie,
      cnpj_emitente: dados.cnpj_emitente
    });

    return this.request('POST', '/v2/nfe', dados, ref);
  }

  async consultarNFe(ref: string) {
  console.log('🔍 [Focus] Consultando NF-e:', { ref });
  
  const result = await this.request('GET', `/v2/nfe/${ref}`);
  
  // Log do resultado completo
  console.log('📊 [Focus] Resultado da consulta:', {
    status: result.status,
    status_sefaz: result.status_sefaz,
    chave_nfe: result.chave_nfe,
    protocolo: result.protocolo
  });
  
  return result;
}

  async cancelarNFe(ref: string, justificativa: string) {
    return this.request('DELETE', `/v2/nfe/${ref}`, { justificativa });
  }

  private async request(method: string, path: string, body?: any, ref?: string) {
    let url = `${this.baseUrl}${path}`;
    if (ref && method === 'POST') {
      url += `?ref=${encodeURIComponent(ref)}`;
    }

    const headers = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json'
    };

    console.log('📡 [Focus] Request:', {
      method,
      url,
      headers: {
        ...headers,
        Authorization: 'Basic [HIDDEN]'
      },
      body: body ? JSON.stringify(body).substring(0, 200) + '...' : undefined
    });

    const options: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📡 [Focus] Tentativa ${attempt}/${this.maxRetries}: ${method} ${path}`);
        
        const response = await fetch(url, options);
        
        // Log do status da resposta
        console.log(`📡 [Focus] Resposta status:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Verificar se a resposta é JSON
        const contentType = response.headers.get('content-type');
        
        if (!response.ok) {
          // Se não for OK, tentar ler o erro
          const text = await response.text();
          console.error('❌ [Focus] Erro na resposta (texto):', text);
          
          // Tentar fazer parse se for JSON
          try {
            const jsonError = JSON.parse(text);
            throw new Error(JSON.stringify(jsonError));
          } catch {
            // Se não for JSON, retornar o texto do erro
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
          }
        }

        // Se for OK, tentar parsear JSON
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          console.log('✅ [Focus] Resposta JSON:', data);
          return data;
        } else {
          // Se não for JSON, ler como texto
          const text = await response.text();
          console.log('✅ [Focus] Resposta texto:', text);
          
          // Tentar fazer parse se parecer JSON
          try {
            return JSON.parse(text);
          } catch {
            return { message: text };
          }
        }

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ [Focus] Tentativa ${attempt} falhou:`, error);
        
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Todas as tentativas falharam');
  }
}