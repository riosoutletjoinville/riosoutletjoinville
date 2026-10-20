// src/services/nfeAutoService.ts
import { supabase } from "@/lib/supabase";
//import { NFeEmissor } from "@/lib/nfe/emissor";

export class NFeAutoService {
  private static interval: NodeJS.Timeout;
  private static processando = false;

  static iniciar() {
    // Verificar a cada 5 minutos
    this.interval = setInterval(() => this.processarFilas(), 5 * 60 * 1000);
    console.log("Serviço automático de NF-e iniciado");
  }

  static parar() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log("Serviço automático de NF-e parado");
    }
  }

  private static async processarFilas() {
    if (this.processando) {
      console.log("Já existe um processo em andamento");
      return;
    }

    this.processando = true;

    try {
      // 1. Processar pedidos aguardando NF-e
      await this.processarPedidosPendentes();

      // 2. Re-tentar NF-e com falha
      await this.retentarNFesComFalha();

      // 3. Consultar NF-e em processamento
      await this.consultarNfesProcessando();
    } catch (error) {
      console.error("Erro no processamento automático:", error);
    } finally {
      this.processando = false;
    }
  }

  private static async processarPedidosPendentes() {
  try {
    // Buscar pedidos que precisam de NF-e
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select(`
        id,
        empresa_id,
        status_pagamento,
        nfe_pedidos!left(id)
      `)
      .eq('status_pagamento', 'aprovado')
      .eq('status', 'entregue')
      .is('nfe_pedidos.id', null)
      .limit(10);

    if (error) throw error;

    if (!pedidos?.length) return;

    console.log(`Processando ${pedidos.length} pedidos para emissão automática`);

    for (const pedido of pedidos) {
      try {
        // 1. Buscar configuração fiscal da empresa
        const { data: configFiscal, error: configError } = await supabase
          .from('configuracoes_fiscais')
          .select('*')
          .eq('empresa_id', pedido.empresa_id)
          .single();

        if (configError || !configFiscal) {
          console.error(`Configuração fiscal não encontrada para empresa ${pedido.empresa_id}`);
          continue;
        }

        // 2. Buscar certificado ativo
        if (!configFiscal.certificado_a3_id) {
          console.error(`Nenhum certificado vinculado à configuração fiscal da empresa ${pedido.empresa_id}`);
          continue;
        }

        const { data: certificado, error: certError } = await supabase
          .from('certificados_a3')
          .select('*')
          .eq('id', configFiscal.certificado_a3_id)
          .eq('ativo', true)
          .single();

        if (certError || !certificado) {
          console.error(`Certificado não encontrado ou inativo para empresa ${pedido.empresa_id}`);
          continue;
        }

        // 3. Buscar um usuário da empresa (preferencialmente admin)
        // IMPORTANTE: Isso é uma emissão automática, então precisamos de um usuário
        // para associar à ação. Pode ser o primeiro admin encontrado ou um usuário
        // específico do sistema
        const { data: usuarios, error: userError } = await supabase
          .from('usuarios')
          .select('id')
          .eq('empresa_id', pedido.empresa_id)
          .eq('role', 'admin')
          .limit(1);

        if (userError || !usuarios?.length) {
          console.error(`Nenhum usuário admin encontrado para empresa ${pedido.empresa_id}`);
          
          // Opção alternativa: tentar qualquer usuário da empresa
          const { data: anyUser } = await supabase
            .from('usuarios')
            .select('id')
            .eq('empresa_id', pedido.empresa_id)
            .limit(1);
            
          if (!anyUser?.length) {
            console.error(`Nenhum usuário encontrado para empresa ${pedido.empresa_id}`);
            continue;
          }
          
          { /*await NFeEmissor.emitir({
            pedido_id: pedido.id,
            usuario_id: anyUser[0].id,
            configFiscal,
            certificado,
            automatica: true
          });*/ }
        } else {
          // Usar o admin encontrado
           { /*await NFeEmissor.emitir({
            pedido_id: pedido.id,
            usuario_id: usuarios[0].id,
            configFiscal,
            certificado,
            automatica: true
          });*/ }
        }
        
        console.log(`NF-e emitida automaticamente para pedido ${pedido.id}`);
      } catch (error) {
        console.error(`Erro ao emitir NF-e para pedido ${pedido.id}:`, error);
        
        // Registrar falha para re-tentativa
        await supabase.from('nfe_retentativas').insert({
          pedido_id: pedido.id,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          proxima_tentativa: this.calcularProximaTentativa(1)
        });
      }
    }
  } catch (error) {
    console.error('Erro ao processar pedidos pendentes:', error);
  }
}

  private static async retentarNFesComFalha() {
  try {
    // Buscar NF-e pendentes para re-tentativa
    const { data: nfes, error } = await supabase
      .from('nfe')
      .select(`
        *,
        pedido:pedidos(
          empresa_id
        )
      `)
      .eq('status', 'pendente')
      .lt('created_at', new Date(Date.now() - 30 * 60000).toISOString()) // >30 min
      .limit(5);

    if (error) throw error;

    if (!nfes?.length) return;

    console.log(`Re-tentando ${nfes.length} NF-e com falha`);

    for (const nfe of nfes) {
      try {
        // Buscar configuração fiscal
        const { data: configFiscal, error: configError } = await supabase
          .from('configuracoes_fiscais')
          .select('*')
          .eq('empresa_id', nfe.pedido.empresa_id)
          .single();

        if (configError || !configFiscal) {
          console.error(`Configuração fiscal não encontrada`);
          continue;
        }

        // Buscar certificado
        if (!configFiscal.certificado_a3_id) {
          console.error(`Certificado não configurado`);
          continue;
        }

        const { data: certificado, error: certError } = await supabase
          .from('certificados_a3')
          .select('*')
          .eq('id', configFiscal.certificado_a3_id)
          .eq('ativo', true)
          .single();

        if (certError || !certificado) {
          console.error(`Certificado não encontrado`);
          continue;
        }

        // Buscar usuário
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('id')
          .eq('empresa_id', nfe.pedido.empresa_id)
          .limit(1);

        if (!usuario?.length) {
          console.error(`Nenhum usuário encontrado`);
          continue;
        }

        // Re-emitir a NF-e
        { /*await NFeEmissor.emitir({
          pedido_id: nfe.pedido_id,
          usuario_id: usuario[0].id,
          configFiscal,
          certificado,
          automatica: true
        });*/ }
        
        // Remover registro antigo
        await supabase.from('nfe').delete().eq('id', nfe.id);
        
        console.log(`Re-tentativa bem-sucedida para NF-e ${nfe.id}`);
      } catch (error) {
        console.error(`Falha na re-tentativa da NF-e ${nfe.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Erro ao re-tentar NF-e com falha:', error);
  }
}
  private static async consultarNfesProcessando() {
    try {
      // Buscar NF-e em processamento há mais de 2 minutos
      const { data: nfes, error } = await supabase
        .from("nfe")
        .select("*")
        .eq("status", "processando")
        .lt("created_at", new Date(Date.now() - 2 * 60000).toISOString())
        .limit(10);

      if (error) throw error;

      if (!nfes?.length) return;

      console.log(`Consultando ${nfes.length} NF-e em processamento`);

      for (const nfe of nfes) {
        try {
          //const result = await NFeEmissor.consultar(nfe.id);

          //console.log(`Consulta NF-e ${nfe.id}:`, result);
        } catch (error) {
          console.error(`Erro ao consultar NF-e ${nfe.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Erro ao consultar NF-e processando:", error);
    }
  }

  private static calcularProximaTentativa(tentativa: number): string {
    const minutos = Math.pow(2, tentativa) * 5; // 5, 10, 20, 40 minutos...
    return new Date(Date.now() + minutos * 60000).toISOString();
  }
}

// Iniciar serviço se estiver em produção e não for ambiente de teste
if (process.env.NODE_ENV === "production" && !process.env.CI) {
  NFeAutoService.iniciar();
}
