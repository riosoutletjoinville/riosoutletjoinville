// src/types/nfe.ts
export interface ConfigFiscal {
  id: string;
  empresa_id: string;
  emitente_cnpj: string;
  emitente_razao_social: string;
  emitente_nome_fantasia?: string;
  emitente_ie: string;
  emitente_regime_tributario?: string;
  emitente_crt: string;
  emitente_cnae?: string;
  emitente_logradouro: string;
  emitente_numero: string;
  emitente_complemento?: string;
  emitente_bairro: string;
  emitente_cep: string;
  emitente_cidade: string;
  emitente_estado: string;
  emitente_telefone?: string;
  emitente_email?: string;
  ambiente_nfe: 'homologacao' | 'producao';
  serie_nfe: number;
  numero_ultima_nfe: number;
  emitente_codigo_municipio?: string;
  usuario_id?: string;
  certificado_a3_id?: string;
  created_at: string;
  updated_at: string;
}

// Interface de compatibilidade para acesso simplificado
// Isso não é uma implementação, apenas uma declaração de tipo
export interface ConfigFiscalComAlias extends ConfigFiscal {
  // Aliases para compatibilidade (apenas declaração, sem implementação)
  readonly cnpj: string;
  readonly razao_social: string;
  readonly nome_fantasia?: string;
  readonly ie: string;
  readonly crt: string;
  readonly logradouro: string;
  readonly numero: string;
  readonly bairro: string;
  readonly cep: string;
  readonly municipio: string;
  readonly uf: string;
  readonly telefone?: string;
  readonly ambiente: 'homologacao' | 'producao';
  readonly codigo_municipio?: string;
}

export interface CertificadoA3 {
  id: string;
  usuario_id: string;
  nome: string;
  arquivo_path: string;
  validade: string;
  emissor?: string;
  ultimo_uso?: string;
  ativo: boolean;
  senha?: string; // Campo para senha do certificado
  created_at: string;
  updated_at: string;
}

export interface NFe {
  id: string;
  empresa_id: string;
  pedido_id: string;
  numero: number;
  serie: number;
  chave: string;
  protocolo?: string;
  status: 'pendente' | 'processando' | 'autorizada' | 'cancelada' | 'rejeitada' | 'denegada';
  motivo_status?: string;
  xml?: string;
  pdf_danfe?: string;
  valor_total: number;
  destinatario_cpf_cnpj: string;
  destinatario_nome: string;
  emitido_automaticamente: boolean;
  data_emissao?: string;
  data_autorizacao?: string;
  data_cancelamento?: string;
  created_at: string;
  updated_at: string;
}

export interface EmissaoNFeParams {
  pedido_id: string;
  usuario_id: string;
  configFiscal: ConfigFiscal;
  certificado: CertificadoA3;
  automatica?: boolean;
}

export interface NFeEvent {
  id: string;
  nfe_id: string;
  tipo: 'emissao' | 'autorizacao' | 'cancelamento' | 'rejeicao' | 'denegacao' | 'download_xml' | 'download_danfe';
  descricao: string;
  dados?: any;
  created_at: string;
}

export function createConfigFiscalWithAliases(config: ConfigFiscal): ConfigFiscal & ConfigFiscalComAlias {
  return {
    ...config,
    get cnpj() { return config.emitente_cnpj; },
    get razao_social() { return config.emitente_razao_social; },
    get nome_fantasia() { return config.emitente_nome_fantasia; },
    get ie() { return config.emitente_ie; },
    get crt() { return config.emitente_crt; },
    get logradouro() { return config.emitente_logradouro; },
    get numero() { return config.emitente_numero; },
    get bairro() { return config.emitente_bairro; },
    get cep() { return config.emitente_cep; },
    get municipio() { return config.emitente_cidade; },
    get uf() { return config.emitente_estado; },
    get telefone() { return config.emitente_telefone; },
    get ambiente() { return config.ambiente_nfe; },
    get codigo_municipio() { return config.emitente_codigo_municipio; }
  };
}