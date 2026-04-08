// src/lib/nfe/storage-service.ts
import { createClient } from '@supabase/supabase-js';

export class NFeStorageService {
  private supabase;
  public bucketUrl: string;
  public xmlBucketUrl: string;
  public danfeBucketUrl: string;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // URL BASE DO STORAGE
    this.bucketUrl = `${supabaseUrl}/storage/v1/object/public`;
    
    // URL ESPECÍFICA DE CADA BUCKET
    this.xmlBucketUrl = `${this.bucketUrl}/nfe-xml`;
    this.danfeBucketUrl = `${this.bucketUrl}/nfe-danfe`;

    console.log('✅ Storage Service inicializado');
    console.log('📌 Bucket URL base:', this.bucketUrl);
    console.log('📌 XML Bucket URL:', this.xmlBucketUrl);
    console.log('📌 DANFE Bucket URL:', this.danfeBucketUrl);
  }

  async salvarXML(chave: string, xml: string, numero: number, serie: number) {
    try {
      if (!chave || !xml) {
        throw new Error('Chave ou XML não fornecido');
      }

      const fileName = `${chave}.xml`;
      // ISSO É DENTRO DO BUCKET, NÃO É DIRETÓRIO LOCAL!
      const filePath = `${new Date().getFullYear()}/${numero.toString().padStart(9, '0')}-${serie}/${fileName}`;

      console.log('📤 Salvando XML:', { 
        bucket: 'nfe-xml', 
        path: filePath,
        tamanho: xml.length 
      });

      // Converter string XML para Blob
      const blob = new Blob([xml], { type: 'application/xml' });

      // Verificar se arquivo já existe
      const { data: existing } = await this.supabase.storage
        .from('nfe-xml')
        .list(filePath.split('/')[0], {
          limit: 1,
          search: fileName
        });

      // Fazer upload
      const { data, error } = await this.supabase.storage
        .from('nfe-xml')
        .upload(filePath, blob, {
          contentType: 'application/xml',
          upsert: true,
          cacheControl: '3600'
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw error;
      }

      // URL completa do arquivo no bucket
      const arquivoUrl = `${this.xmlBucketUrl}/${filePath}`;
      
      // URL assinada (válida por 30 dias)
      const { data: signedData } = await this.supabase.storage
        .from('nfe-xml')
        .createSignedUrl(filePath, 60 * 60 * 24 * 30);

      console.log('✅ XML salvo com sucesso:', {
        path: filePath,
        url: arquivoUrl,
        signed: signedData?.signedUrl
      });

      return {
        success: true,
        path: filePath,
        bucketUrl: this.xmlBucketUrl,
        url: arquivoUrl,
        signedUrl: signedData?.signedUrl,
        fullPath: data?.fullPath,
        id: data?.id
      };

    } catch (error) {
      console.error('❌ Erro ao salvar XML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async salvarDANFE(chave: string, pdfBuffer: Buffer, numero: number, serie: number) {
    try {
      if (!chave || !pdfBuffer) {
        throw new Error('Chave ou PDF não fornecido');
      }

      const fileName = `${chave}.pdf`;
      // ISSO É DENTRO DO BUCKET, NÃO É DIRETÓRIO LOCAL!
      const filePath = `${new Date().getFullYear()}/${numero.toString().padStart(9, '0')}-${serie}/${fileName}`;

      console.log('📤 Salvando DANFE:', { 
        bucket: 'nfe-danfe', 
        path: filePath,
        tamanho: pdfBuffer.length 
      });

      // Fazer upload
      const { data, error } = await this.supabase.storage
        .from('nfe-danfe')
        .upload(filePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
          cacheControl: '3600'
        });

      if (error) {
        console.error('❌ Erro no upload:', error);
        throw error;
      }

      // URL pública do DANFE no bucket
      const arquivoUrl = `${this.danfeBucketUrl}/${filePath}`;

      console.log('✅ DANFE salvo com sucesso:', {
        path: filePath,
        url: arquivoUrl
      });

      return {
        success: true,
        path: filePath,
        bucketUrl: this.danfeBucketUrl,
        url: arquivoUrl,
        fullPath: data?.fullPath,
        id: data?.id
      };

    } catch (error) {
      console.error('❌ Erro ao salvar DANFE:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async buscarXML(chave: string): Promise<string | null> {
    try {
      // Primeiro busca no banco o caminho
      const { data: nfe } = await this.supabase
        .from('notas_fiscais')
        .select('caminho_xml')
        .eq('chave_acesso', chave)
        .single();

      if (!nfe?.caminho_xml) {
        console.log('⚠️ Caminho do XML não encontrado para chave:', chave);
        return null;
      }

      console.log('📥 Buscando XML:', nfe.caminho_xml);

      const { data, error } = await this.supabase.storage
        .from('nfe-xml')
        .download(nfe.caminho_xml);

      if (error) {
        console.error('❌ Erro ao baixar XML:', error);
        return null;
      }

      const xmlString = await data.text();
      console.log('✅ XML encontrado, tamanho:', xmlString.length);

      return xmlString;

    } catch (error) {
      console.error('❌ Erro ao buscar XML:', error);
      return null;
    }
  }

  async buscarDANFE(chave: string): Promise<string | null> {
    try {
      const { data: nfe } = await this.supabase
        .from('notas_fiscais')
        .select('caminho_danfe')
        .eq('chave_acesso', chave)
        .single();

      if (!nfe?.caminho_danfe) {
        console.log('⚠️ Caminho do DANFE não encontrado para chave:', chave);
        return null;
      }

      // URL completa no bucket
      return `${this.danfeBucketUrl}/${nfe.caminho_danfe}`;

    } catch (error) {
      console.error('❌ Erro ao buscar DANFE:', error);
      return null;
    }
  }

  async deletarXML(path: string): Promise<boolean> {
    try {
      console.log('🗑️ Deletando XML:', path);

      const { error } = await this.supabase.storage
        .from('nfe-xml')
        .remove([path]);

      if (error) {
        console.error('❌ Erro ao deletar XML:', error);
        return false;
      }

      console.log('✅ XML deletado com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao deletar XML:', error);
      return false;
    }
  }

  async deletarDANFE(path: string): Promise<boolean> {
    try {
      console.log('🗑️ Deletando DANFE:', path);

      const { error } = await this.supabase.storage
        .from('nfe-danfe')
        .remove([path]);

      if (error) {
        console.error('❌ Erro ao deletar DANFE:', error);
        return false;
      }

      console.log('✅ DANFE deletado com sucesso');
      return true;

    } catch (error) {
      console.error('❌ Erro ao deletar DANFE:', error);
      return false;
    }
  }

  async listarXMLs(ano?: string): Promise<any[]> {
    try {
      const path = ano ? `${ano}` : '';
      
      const { data, error } = await this.supabase.storage
        .from('nfe-xml')
        .list(path);

      if (error) {
        console.error('❌ Erro ao listar XMLs:', error);
        return [];
      }

      return data.map(item => ({
        ...item,
        url: `${this.xmlBucketUrl}/${path ? path + '/' : ''}${item.name}`
      }));

    } catch (error) {
      console.error('❌ Erro ao listar XMLs:', error);
      return [];
    }
  }

  async listarDANFEs(ano?: string): Promise<any[]> {
    try {
      const path = ano ? `${ano}` : '';
      
      const { data, error } = await this.supabase.storage
        .from('nfe-danfe')
        .list(path);

      if (error) {
        console.error('❌ Erro ao listar DANFEs:', error);
        return [];
      }

      return data.map(item => ({
        ...item,
        url: `${this.danfeBucketUrl}/${path ? path + '/' : ''}${item.name}`
      }));

    } catch (error) {
      console.error('❌ Erro ao listar DANFEs:', error);
      return [];
    }
  }
}

// Exportar instância única
export const nfeStorage = new NFeStorageService();