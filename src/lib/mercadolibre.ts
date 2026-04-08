// src/lib/mercadolibre.ts
import axios from "axios";
import { supabase } from "./supabase";
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
          "Accept": "application/json",
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
      const config = await this.getConfig(); // ← Obter configuração

      if (!config.appId || !config.clientSecret) {
        throw new Error("Configuração do Mercado Livre incompleta");
      }

      const params = new URLSearchParams();
      params.append("grant_type", "refresh_token");
      params.append("client_id", config.appId);
      params.append("client_secret", config.clientSecret);
      params.append("refresh_token", refreshToken);

      const response = await axios.post(`${this.baseURL}/oauth/token`, params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      throw error;
    }
  }

  async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/users/me`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
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
          "Authorization": `Bearer ${accessToken}`,
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
            "Authorization": `Bearer ${accessToken}`,
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

  // Verificar se o usuário atual está conectado ao Mercado Livre - CORRIGIDO
  async isUserConnected(): Promise<boolean> {
    try {
      // ✅ PRIMEIRO: Verificar se há um usuário logado no Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth
        .getUser();

      if (userError || !user) {
        console.error("Erro ao obter usuário:", userError);
        return false;
      }

      // ✅ SEGUNDO: Buscar tokens associados a este usuário
      const { data, error } = await supabase
        .from("mercado_livre_tokens")
        .select("access_token, expires_in, updated_at")
        .eq("user_id", user.id) // Agora usando o ID do usuário do auth
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar tokens:", error);
        return false;
      }

      if (!data) {
        return false; // Nenhum token encontrado
      }

      // Verificar se o token ainda é válido
      const updatedAt = new Date(data.updated_at);
      const expiresAt = new Date(updatedAt.getTime() + data.expires_in * 1000);

      return expiresAt > new Date();
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      return false;
    }
  }

  // Obter informações completas da conexão
  async getConnectionInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return null;

      const { data, error } = await supabase
        .from("mercado_livre_tokens")
        .select("*")
        .eq("user_id", user.id) // Agora usando o ID do usuário do auth
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

  //inicio 18/09/2025
  async getProducts(): Promise<MLProduct[]> {
    return await mercadoLivreProductsService.getUserProducts();
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
  //fim 18/09/2025
  async createProduct(accessToken: string, productData: unknown) {
    try {
      const response = await axios.post(`${this.baseURL}/items`, productData, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
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
          "Authorization": `Bearer ${accessToken}`,
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
          "Authorization": `Bearer ${accessToken}`,
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
      const response = await axios.put(`${this.baseURL}/items/${itemId}`, {
        price: price,
      }, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
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
          "Authorization": `Bearer ${accessToken}`,
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
          "Authorization": `Bearer ${accessToken}`,
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
      const response = await axios.put(`${this.baseURL}/orders/${orderId}`, {
        status: status,
      }, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
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
            "Authorization": `Bearer ${accessToken}`,
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
      const response = await axios.post(`${this.baseURL}/answers`, {
        question_id: questionId,
        text: answer,
      }, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
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
            "Authorization": `Bearer ${accessToken}`,
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
    try {
      // ✅ PRIMEIRO: Obter o usuário atual do Supabase Auth
      const { data: { user }, error: userError } = await supabase.auth
        .getUser();

      if (userError || !user) {
        console.error("Erro ao obter usuário:", userError);
        return null;
      }

      console.log("Buscando token para usuário:", user.id);

      // ✅ SEGUNDO: Buscar tokens associados a este usuário
      const { data, error } = await supabase
        .from("mercado_livre_tokens")
        .select("access_token, refresh_token, updated_at, expires_in")
        .eq("user_id", user.id) // Buscar pelo ID do usuário do auth
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar tokens:", error);
        return null;
      }

      if (!data) {
        console.error("Nenhum token encontrado para o usuário:", user.id);
        return null;
      }

      console.log("Token encontrado, verificando expiração...");

      // Verificar se o token precisa ser renovado
      const updatedAt = new Date(data.updated_at);
      const expiresAt = new Date(updatedAt.getTime() + data.expires_in * 1000);

      if (expiresAt < new Date()) {
        console.log("Token expirado, renovando...");
        try {
          const newTokens = await this.refreshToken(data.refresh_token);

          // Salvar novos tokens com UPSERT
          const { error: updateError } = await supabase
            .from("mercado_livre_tokens")
            .upsert({
              user_id: user.id,
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token,
              expires_in: newTokens.expires_in,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id",
            });

          if (updateError) {
            console.error("Erro ao salvar novos tokens:", updateError);
            return null;
          }

          return newTokens.access_token;
        } catch (refreshError) {
          console.error("Erro ao renovar token:", refreshError);
          return null;
        }
      }

      console.log("Token válido retornado");
      return data.access_token;
    } catch (error) {
      console.error("Erro ao obter access token:", error);
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
            "Authorization": `Bearer ${accessToken}`,
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
            "Authorization": `Bearer ${accessToken}`,
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
