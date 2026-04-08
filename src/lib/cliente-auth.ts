//src/lib/client-auth.ts
import { supabase } from './supabase';
import crypto from 'crypto';
import { Cliente } from '@/types';

export interface ClienteLoginData {
  email: string;
  senha: string;
}

export interface ClienteCadastroData {
  email: string;
  senha: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  telefone: string;
  tipo_cliente: 'fisica' | 'juridica';
}

interface AuthResponse {
  success: boolean;
  error?: string;
  token?: string;
  cliente?: Cliente;
}

export class ClienteAuthService {
  private supabase = supabase;

  async loginCliente({ email, senha }: ClienteLoginData): Promise<AuthResponse> {
    try {
      // Buscar cliente com login ativo
      const { data: cliente, error } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('email', email)
        .eq('ativo_login', true)
        .single();

      if (error || !cliente) {
        throw new Error('Cliente não encontrado ou sem acesso ao login');
      }

      // Verificar senha (usando crypt do PostgreSQL)
      const { data: senhaCheck, error: senhaError } = await this.supabase
        .rpc('verificar_senha_cliente', {
          p_email: email,
          p_senha: senha
        });

      if (senhaError || !senhaCheck) {
        throw new Error('Senha incorreta');
      }

      // Criar sessão
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 30); // 30 dias

      const { error: sessaoError } = await this.supabase
        .from('cliente_sessoes')
        .insert({
          cliente_id: cliente.id,
          token_sessao: token,
          expira_em: expiraEm.toISOString()
        });

      if (sessaoError) throw sessaoError;

      return { success: true, token, cliente };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async cadastrarCliente(dados: ClienteCadastroData): Promise<AuthResponse> {
    try {
      const { data: cliente, error } = await this.supabase
        .from('clientes')
        .insert({
          email: dados.email,
          senha: dados.senha, // Será hashada no trigger
          nome: dados.nome,
          sobrenome: dados.sobrenome,
          cpf: dados.cpf,
          telefone: dados.telefone,
          tipo_cliente: dados.tipo_cliente,
          ativo_login: true,
          data_cadastro_login: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) throw error;

      // Criar sessão automaticamente
      const loginResult = await this.loginCliente({
        email: dados.email,
        senha: dados.senha
      });

      return loginResult;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async verificarSessao(token: string): Promise<{ cliente: Cliente | null }> {
    try {
      const { data: sessao, error } = await this.supabase
        .from('cliente_sessoes')
        .select('cliente_id, expira_em')
        .eq('token_sessao', token)
        .gt('expira_em', new Date().toISOString())
        .single();

      if (error || !sessao) {
        return { cliente: null };
      }

      const { data: cliente } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('id', sessao.cliente_id)
        .single();

      return { cliente };
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
      return { cliente: null };
    }
  }

  async logoutCliente(token: string): Promise<void> {
    try {
      await this.supabase
        .from('cliente_sessoes')
        .delete()
        .eq('token_sessao', token);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }
}

export const clienteAuthService = new ClienteAuthService();