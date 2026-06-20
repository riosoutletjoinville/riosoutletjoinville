// src/lib/mercadolibre.ts
import axios from "axios";
import { SupabaseClient } from "@supabase/supabase-js";
import { supabase as defaultSupabaseClient, supabase } from "./supabase";

import { mercadoLivreProductsService, MLProduct } from "./products";

export class MercadoLivreService {
  private baseURL = "https://api.mercadolibre.com";

  // Método para obter configuração dinâmica
  private async getConfig() {
    // Variáveis de ambiente têm prioridade
    const envConfig = {
      redirectUri: process.env.NEXT_PUBLIC_MERCADO_LIVRE_REDIRECT_URI,
      appId: process.env.NEXT_PUBLIC_MERCADO_LIVRE_APP_ID,
      clientSecret: process.env.NEXT_PUBLIC_MERCADO_LIVRE_CLIENT_SECRET,
    };

    // Fallback para localStorage se as variáveis de ambiente não estiverem definidas
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("ml_config");
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Mescla dando prioridade às variáveis de ambiente
        return {
          ...parsedConfig,
          ...envConfig,
          // Garante que não usaremos valores undefined
          redirectUri: envConfig.redirectUri || parsedConfig.redirectUri,
          appId: envConfig.appId || parsedConfig.appId,
          clientSecret: envConfig.clientSecret || parsedConfig.clientSecret,
        };
      }
    }

    return envConfig;
  }

  async checkConfig(): Promise<{ isValid: boolean; errors: string[] }> {
    const config = await this.getConfig();
    const errors: string[] = [];

    if (!config.appId) errors.push("App ID não configurado");
    if (!config.clientSecret) errors.push("Client Secret não configurado");
    if (!config.redirectUri) errors.push("Redirect URI não configurado");

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // src/lib/mercadolibre.ts
  async getAuthUrl(state?: string): Promise<string> {
    const config = await this.getConfig();

    if (!config.appId || !config.redirectUri) {
      throw new Error("Configuração do Mercado Livre não encontrada");
    }

    const authUrl = new URL("https://auth.mercadolivre.com.br/authorization");
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("client_id", config.appId);
    authUrl.searchParams.append("redirect_uri", config.redirectUri);

    // ✅ CORRETO: escopos separados por ESPAÇO
    authUrl.searchParams.append("scope", "offline_access read write");

    if (state) {
      authUrl.searchParams.append("state", state);
    }

    return authUrl.toString();
  }

  async authenticate(code: string) {
    try {
      const config = await this.getConfig();

      if (!config.appId || !config.clientSecret || !config.redirectUri) {
        throw new Error("Configuração do Mercado Livre incompleta");
      }

      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("client_id", config.appId);
      params.append("client_secret", config.clientSecret);
      params.append("code", code);
      params.append("redirect_uri", config.redirectUri);

      console.log("Enviando requisição para obter tokens...");
      const response = await axios.post(`${this.baseURL}/oauth/token`, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error: unknown) {
      // Corrigido: tratamento adequado do erro
      console.error(
        "Erro na autenticação:",
        error instanceof Error ? error.message : "Erro desconhecido",
      );

      // Verificar se é um erro do Axios
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Falha na autenticação: ${
            error.response?.data?.message || error.message
          }`,
        );
      } else if (error instanceof Error) {
        throw new Error(`Falha na autenticação: ${error.message}`);
      } else {
        throw new Error("Falha na autenticação: Erro desconhecido");
      }
    }
  }

  
async refreshToken(refreshToken: string) {
  try {
    const config = await this.getConfig();

    if (!config.appId || !config.clientSecret) {
      throw new Error("Configuração do Mercado Livre incompleta");
    }

    console.log("🔄 [refreshToken] Renovando token...");
    
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("client_id", config.appId);
    params.append("client_secret", config.clientSecret);
    params.append("refresh_token", refreshToken);

    const response = await axios.post(`${this.baseURL}/oauth/token`, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    console.log("✅ [refreshToken] Token renovado com sucesso!");
    return response.data;
  } catch (error) {
    console.error("❌ [refreshToken] Erro ao renovar token:", error);
    
    if (axios.isAxiosError(error)) {
      console.error("Detalhes do erro:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    
    throw error;
  }
}

  async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/users/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao buscar informações do usuário:", error);
      throw error;
    }
  }

  async getOrders(accessToken: string, filters?: unknown) {
    try {
      const response = await axios.get(`${this.baseURL}/orders/search`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: filters,
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      throw error;
    }
  }

  async getItems(accessToken: string, filters?: unknown) {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/me/items/search`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: filters,
        },
      );

      return response.data;
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      throw error;
    }
  }

  async isUserConnected(supabaseClient?: SupabaseClient): Promise<boolean> {
    const client = supabaseClient || defaultSupabaseClient;

    try {
      const {
        data: { session },
      } = await client.auth.getSession();
      if (!session?.user) {
        console.log("isUserConnected: Usuário não autenticado");
        return false;
      }

      console.log(
        "isUserConnected: Buscando tokens para user_id:",
        session.user.id,
      );

      const { data: tokens, error } = await client
        .from("mercado_livre_tokens")
        .select("access_token, refresh_token, expires_in")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("isUserConnected: Erro ao buscar tokens:", error);
        return false;
      }

      const isConnected = !!tokens?.access_token;
      console.log("isUserConnected: Token encontrado?", isConnected);

      return isConnected;
    } catch (error) {
      console.error("isUserConnected: Erro geral:", error);
      return false;
    }
  }

  async getConnectionInfo(supabaseClient?: SupabaseClient) {
    const client = supabaseClient || defaultSupabaseClient;

    try {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) return null;

      const { data, error } = await client
        .from("mercado_livre_tokens")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar informações da conexão:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Erro ao obter informações da conexão:", error);
      return null;
    }
  }

  async getProducts(supabaseClient?: SupabaseClient): Promise<MLProduct[]> {
    return await mercadoLivreProductsService.getUserProducts(supabaseClient);
  }

  async publishProduct(
    productId: string,
  ): Promise<{ id: string; status: string }> {
    return await mercadoLivreProductsService.publishProduct(productId);
  }

  async updateProduct(
    productId: string,
  ): Promise<{ id: string; status: string }> {
    return await mercadoLivreProductsService.updateProduct(productId);
  }

  async updateStock(
    productId: string,
  ): Promise<{ id: string; available_quantity: number }> {
    return await mercadoLivreProductsService.updateStock(productId);
  }

  async createProduct(accessToken: string, productData: unknown) {
    try {
      const response = await axios.post(`${this.baseURL}/items`, productData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      throw error;
    }
  }

  async getProduct(accessToken: string, itemId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      throw error;
    }
  }

  async deleteProduct(accessToken: string, itemId: string) {
    try {
      const response = await axios.delete(`${this.baseURL}/items/${itemId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      throw error;
    }
  }

  async updatePrice(accessToken: string, itemId: string, price: number) {
    try {
      const response = await axios.put(
        `${this.baseURL}/items/${itemId}`,
        {
          price: price,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar preço:", error);
      throw error;
    }
  }

  // ========== PEDIDOS ==========
  async getOrder(accessToken: string, orderId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar pedido:", error);
      throw error;
    }
  }

  async getOrdersByStatus(
    accessToken: string,
    status: string,
    offset = 0,
    limit = 50,
  ) {
    try {
      const sellerId = await this.getUserSellerId(accessToken);

      const params = {
        seller: sellerId,
        ["order.status"]: status, // Notação de colchetes
        offset,
        limit,
      };

      const response = await axios.get(`${this.baseURL}/orders/search`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: params,
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar pedidos por status:", error);
      throw error;
    }
  }

  async updateOrderStatus(
    accessToken: string,
    orderId: string,
    status: string,
  ) {
    try {
      const response = await axios.put(
        `${this.baseURL}/orders/${orderId}`,
        {
          status: status,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar status do pedido:", error);
      throw error;
    }
  }

  // ========== CATEGORIAS E ATRIBUTOS ==========
  async getCategories(siteId: string = "MLB") {
    try {
      const response = await axios.get(
        `${this.baseURL}/sites/${siteId}/categories`,
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      throw error;
    }
  }

  async getCategoryAttributes(categoryId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/categories/${categoryId}/attributes`,
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar atributos da categoria:", error);
      throw error;
    }
  }

  // ========== PERGUNTAS E RESPOSTAS ==========
  async getQuestions(accessToken: string, filters?: unknown) {
    try {
      const response = await axios.get(
        `${this.baseURL}/my/received_questions/search`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: filters,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
      throw error;
    }
  }

  async answerQuestion(
    accessToken: string,
    questionId: string,
    answer: string,
  ) {
    try {
      const response = await axios.post(
        `${this.baseURL}/answers`,
        {
          question_id: questionId,
          text: answer,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao responder pergunta:", error);
      throw error;
    }
  }

  // ========== FRETE ==========
  async calculateShipping(accessToken: string, shippingData: unknown) {
    try {
      const response = await axios.post(
        `${this.baseURL}/users/me/shipping_options`,
        shippingData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao calcular frete:", error);
      throw error;
    }
  }

  // ========== UTILITÁRIOS ==========
  private async getUserSellerId(accessToken: string): Promise<string> {
    try {
      const userInfo = await this.getUserInfo(accessToken);
      return userInfo.id;
    } catch (error) {
      console.error("Erro ao obter ID do vendedor:", error);
      throw error;
    }
  }



async getAccessToken(): Promise<string | null> {
  console.log("🔍 [getAccessToken] Buscando token...");
  
  try {
    // ✅ Buscar o token mais recente
    const { data: tokens, error } = await supabase
      .from("mercado_livre_tokens")
      .select("access_token, refresh_token, expires_in, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ [getAccessToken] Erro ao buscar token:", error);
      return null;
    }

    if (!tokens?.access_token) {
      console.log("❌ [getAccessToken] Nenhum token encontrado");
      return null;
    }

    // ✅ Calcular se o token expirou corretamente
    const updatedAt = new Date(tokens.updated_at);
    const expiresIn = tokens.expires_in || 21600; // 6 horas padrão
    const expiresAt = new Date(updatedAt.getTime() + expiresIn * 1000);
    
    const now = new Date();
    const isExpired = now > expiresAt;
    const isNearExpiry = expiresAt.getTime() - now.getTime() < 5 * 60 * 1000; // 5 minutos
    
    console.log(`📊 [getAccessToken] Token expira em: ${expiresAt.toISOString()}`);
    console.log(`📊 [getAccessToken] Expirado: ${isExpired}, Próximo de expirar: ${isNearExpiry}`);
    
    // ✅ Se expirado OU próximo de expirar, renovar
    if (isExpired || isNearExpiry) {
      console.log("🔄 [getAccessToken] Token precisa ser renovado...");
      
      if (!tokens.refresh_token) {
        console.error("❌ [getAccessToken] Refresh token não disponível");
        return null;
      }
      
      // ✅ Chamar refresh via API do servidor
      const newToken = await this.refreshAccessToken(tokens.refresh_token);
      return newToken;
    }

    console.log("✅ [getAccessToken] Token válido encontrado");
    return tokens.access_token;
    
  } catch (error) {
    console.error("💥 [getAccessToken] Erro:", error);
    return null;
  }
}

async refreshAccessToken(refreshToken?: string): Promise<string | null> {
  console.log("🔄 [refreshAccessToken] Renovando token...");
  
  try {
    // Se não recebeu refreshToken, buscar do banco
    let finalRefreshToken = refreshToken;
    
    if (!finalRefreshToken) {
      const { data: tokens } = await supabase
        .from("mercado_livre_tokens")
        .select("refresh_token")
        .maybeSingle();

      if (!tokens?.refresh_token) {
        console.error("❌ [refreshAccessToken] Refresh token não encontrado");
        return null;
      }
      finalRefreshToken = tokens.refresh_token;
    }

    // ✅ Obter configuração
    const config = await this.getConfig();
    
    if (!config.appId || !config.clientSecret) {
      console.error("❌ [refreshAccessToken] Configuração incompleta");
      return null;
    }

    // ✅ Chamar API do Mercado Livre diretamente
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("client_id", config.appId);
    params.append("client_secret", config.clientSecret);
    params.append("refresh_token", finalRefreshToken);

    console.log("🌐 [refreshAccessToken] Chamando API do ML...");
    
    const response = await fetch("https://api.mercadolibre.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: params,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ [refreshAccessToken] Erro na renovação:", {
        status: response.status,
        body: errorData
      });
      
      // ✅ Se o refresh falhou, limpar tokens antigos
      if (response.status === 400) {
        console.log("🧹 [refreshAccessToken] Refresh token inválido, limpando dados...");
        await supabase.from("mercado_livre_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }
      
      return null;
    }

    const tokens = await response.json();
    console.log("✅ [refreshAccessToken] Token renovado com sucesso");
    
    // ✅ Salvar novos tokens no banco
    const { error: upsertError } = await supabase
      .from("mercado_livre_tokens")
      .upsert({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        updated_at: new Date().toISOString(),
        user_id: (await supabase.auth.getUser()).data.user?.id,
      });

    if (upsertError) {
      console.error("❌ [refreshAccessToken] Erro ao salvar tokens:", upsertError);
    }

    return tokens.access_token;
    
  } catch (error) {
    console.error("💥 [refreshAccessToken] Erro:", error);
    return null;
  }
}

  // ========== WEBHOOKS ==========
  async createWebhook(accessToken: string, webhookData: unknown) {
    try {
      const response = await axios.post(
        `${this.baseURL}/my/apps/${process.env.NEXT_PUBLIC_MERCADO_LIVRE_APP_ID}/webhooks`,
        webhookData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao criar webhook:", error);
      throw error;
    }
  }

  async getWebhooks(accessToken: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/my/apps/${process.env.NEXT_PUBLIC_MERCADO_LIVRE_APP_ID}/webhooks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar webhooks:", error);
      throw error;
    }
  }

  // ========== NOTIFICAÇÕES ==========
  async processNotification(
    accessToken: string,
    topic: string,
    resource: string,
  ) {
    try {
      switch (topic) {
        case "items":
          return await this.processItemNotification(accessToken, resource);
        case "orders_v2":
          return await this.processOrderNotification(accessToken, resource);
        case "questions":
          return await this.processQuestionNotification(accessToken, resource);
        case "messages":
          return await this.processMessageNotification(accessToken, resource);
        default:
          console.log("Tópico não processado:", topic);
          return null;
      }
    } catch (error) {
      console.error("Erro ao processar notificação:", error);
      throw error;
    }
  }

  private async processItemNotification(accessToken: string, resource: string) {
    const itemId = resource.split("/").pop();
    console.log("Processando item:", itemId);

    // Implementar lógica de sincronização do produto
    // Removida a variável não utilizada 'item'
    await this.getProduct(accessToken, itemId!);
    // Sincronizar com seu banco de dados
  }

  private async processOrderNotification(
    accessToken: string,
    resource: string,
  ) {
    const orderId = resource.split("/").pop();
    console.log("Processando pedido:", orderId);

    // Implementar lógica de processamento do pedido
    // Removida a variável não utilizada 'order'
    await this.getOrder(accessToken, orderId!);
    // Sincronizar com sua tabela de pedidos
  }

  private async processQuestionNotification(
    accessToken: string,
    resource: string,
  ) {
    const questionId = resource.split("/").pop();
    console.log("Processando pergunta:", questionId);

    // Implementar lógica de tratamento de perguntas
  }

  private async processMessageNotification(
    accessToken: string,
    resource: string,
  ) {
    const messageId = resource.split("/").pop();
    console.log("Processando mensagem:", messageId);

    // Implementar lógica de tratamento de mensagens
  }
}

export const mercadoLivreService = new MercadoLivreService();
