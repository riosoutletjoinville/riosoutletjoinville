// src/app/api/clientes/auth/login/route.ts
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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

// Função auxiliar para criar sessão do cliente
export async function createClienteSession(clienteId: string): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias

  const { error } = await supabase
    .from('cliente_sessoes')
    .insert({
      cliente_id: clienteId,
      token_sessao: token,
      expira_em: expiresAt.toISOString()
    });

  if (error) {
    console.error('Erro ao criar sessão:', error);
    throw new Error('Erro ao criar sessão');
  }

  return { token, expiresAt: expiresAt.toISOString() };
}

export class ClienteAuthService {
  private supabase = supabase;

  async loginCliente({ email, senha }: ClienteLoginData): Promise<AuthResponse> {
    try {
      // Buscar cliente com login ativo
      const { data: cliente, error } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .eq('ativo_login', true)
        .single();

      if (error || !cliente) {
        return { success: false, error: 'Cliente não encontrado ou sem acesso ao login' };
      }

      // Verificar se o cliente está ativo
      if (!cliente.ativo) {
        return { success: false, error: 'Conta desativada' };
      }

      // Verificar senha
      if (!cliente.senha) {
        return { success: false, error: 'Senha não definida' };
      }

      let senhaValida = false;
      const isBcryptHash = cliente.senha.startsWith('$2');
      
      if (isBcryptHash) {
        senhaValida = await bcrypt.compare(senha, cliente.senha);
      } else {
        senhaValida = senha === cliente.senha;
        // Atualizar para hash se for texto puro
        if (senhaValida) {
          const salt = await bcrypt.genSalt(12);
          const novoHash = await bcrypt.hash(senha, salt);
          await this.supabase
            .from('clientes')
            .update({ senha: novoHash })
            .eq('id', cliente.id);
        }
      }

      if (!senhaValida) {
        return { success: false, error: 'Senha incorreta' };
      }

      // Criar sessão
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 30);

      const { error: sessaoError } = await this.supabase
        .from('cliente_sessoes')
        .insert({
          cliente_id: cliente.id,
          token_sessao: token,
          expira_em: expiraEm.toISOString()
        });

      if (sessaoError) {
        console.error('Erro ao criar sessão:', sessaoError);
      }

      const { senha: _, ...clienteSemSenha } = cliente;
      return { success: true, token, cliente: clienteSemSenha as Cliente };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async cadastrarCliente(dados: ClienteCadastroData): Promise<AuthResponse> {
    try {
      // Verificar se email já existe
      const { data: existente } = await this.supabase
        .from('clientes')
        .select('id')
        .eq('email', dados.email.toLowerCase().trim())
        .single();

      if (existente) {
        return { success: false, error: 'Email já cadastrado' };
      }

      // Gerar hash da senha
      const salt = await bcrypt.genSalt(12);
      const senhaHash = await bcrypt.hash(dados.senha, salt);

      const { data: cliente, error } = await this.supabase
        .from('clientes')
        .insert({
          email: dados.email.toLowerCase().trim(),
          senha: senhaHash,
          nome: dados.nome,
          sobrenome: dados.sobrenome,
          cpf: dados.cpf || null,
          telefone: dados.telefone || null,
          tipo_cliente: dados.tipo_cliente,
          ativo: true,
          ativo_login: true,
          origem_cadastro: 'ecommerce',
          data_cadastro_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao cadastrar:', error);
        return { success: false, error: error.message };
      }

      // Criar sessão automaticamente
      const token = crypto.randomBytes(32).toString('hex');
      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 30);

      await this.supabase
        .from('cliente_sessoes')
        .insert({
          cliente_id: cliente.id,
          token_sessao: token,
          expira_em: expiraEm.toISOString()
        });

      const { senha: _, ...clienteSemSenha } = cliente;
      return { success: true, token, cliente: clienteSemSenha as Cliente };
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

      if (!cliente) {
        return { cliente: null };
      }

      const { senha: _, ...clienteSemSenha } = cliente;
      return { cliente: clienteSemSenha as Cliente };
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