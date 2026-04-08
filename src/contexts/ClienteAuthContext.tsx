// src/contexts/ClienteAuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

interface Cliente {
  id: string;
  nome?: string;
  sobrenome?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipo_cliente: "fisica" | "juridica";
  ativo: boolean;
  ativo_login: boolean;
}

interface ClienteAuthContextType {
  cliente: Cliente | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  atualizarCliente: (dados: Partial<Cliente>) => Promise<{ success: boolean; error?: string }>;
}

const ClienteAuthContext = createContext<ClienteAuthContextType | undefined>(undefined);

export function ClienteAuthProvider({ children }: { children: React.ReactNode }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar cliente do localStorage ao iniciar
  useEffect(() => {
    const storedCliente = localStorage.getItem("cliente_auth");
    if (storedCliente) {
      try {
        setCliente(JSON.parse(storedCliente));
      } catch (error) {
        console.error("Erro ao carregar cliente:", error);
        localStorage.removeItem("cliente_auth");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    try {
      // Buscar cliente pelo email com todos os campos necessários
      const { data: clienteData, error } = await supabase
        .from("clientes")
        .select(`
          id, 
          nome, 
          sobrenome, 
          email, 
          telefone,
          cpf,
          razao_social,
          nome_fantasia,
          cnpj,
          inscricao_estadual,
          inscricao_municipal,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cep,
          tipo_cliente, 
          ativo, 
          ativo_login, 
          senha
        `)
        .eq("email", email.toLowerCase().trim())
        .single();

      if (error) {
        console.error("Erro ao buscar cliente:", error);
        return { success: false, error: "Email ou senha inválidos" };
      }

      if (!clienteData) {
        return { success: false, error: "Email ou senha inválidos" };
      }

      // Verificar se o cliente está ativo
      if (!clienteData.ativo) {
        return { success: false, error: "Conta desativada. Entre em contato com o suporte." };
      }

      // Verificar se o cliente tem login ativo
      if (!clienteData.ativo_login) {
        return { success: false, error: "Login não ativado. Faça um pedido primeiro." };
      }

      // Verificar se a senha existe no banco
      if (!clienteData.senha) {
        return { success: false, error: "Senha não definida. Solicite uma nova senha." };
      }

      // 🔐 COMPARAR SENHA COM BCRYPT (hash salvo no banco)
      const senhaValida = await bcrypt.compare(senha, clienteData.senha);

      if (!senhaValida) {
        return { success: false, error: "Email ou senha inválidos" };
      }

      // Login bem sucedido
      const perfil: Cliente = {
        id: clienteData.id,
        nome: clienteData.nome || "",
        sobrenome: clienteData.sobrenome || "",
        email: clienteData.email,
        telefone: clienteData.telefone || "",
        cpf: clienteData.cpf || "",
        razao_social: clienteData.razao_social || "",
        nome_fantasia: clienteData.nome_fantasia || "",
        cnpj: clienteData.cnpj || "",
        inscricao_estadual: clienteData.inscricao_estadual || "",
        inscricao_municipal: clienteData.inscricao_municipal || "",
        endereco: clienteData.endereco || "",
        numero: clienteData.numero || "",
        complemento: clienteData.complemento || "",
        bairro: clienteData.bairro || "",
        cidade: clienteData.cidade || "",
        estado: clienteData.estado || "",
        cep: clienteData.cep || "",
        tipo_cliente: clienteData.tipo_cliente,
        ativo: clienteData.ativo,
        ativo_login: clienteData.ativo_login,
      };

      setCliente(perfil);
      localStorage.setItem("cliente_auth", JSON.stringify(perfil));

      return { success: true };
    } catch (error) {
      console.error("Erro no login:", error);
      return { success: false, error: "Erro interno. Tente novamente mais tarde." };
    }
  }, []);

  const logout = useCallback(async () => {
    setCliente(null);
    localStorage.removeItem("cliente_auth");
  }, []);

  const atualizarCliente = useCallback(async (dados: Partial<Cliente>) => {
    try {
      if (!cliente) {
        return { success: false, error: "Usuário não autenticado" };
      }

      // Atualizar no Supabase
      const { data, error } = await supabase
        .from("clientes")
        .update(dados)
        .eq("id", cliente.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar cliente:", error);
        return { success: false, error: error.message };
      }

      // Atualizar o estado local
      const clienteAtualizado = { ...cliente, ...dados };
      setCliente(clienteAtualizado);
      localStorage.setItem("cliente_auth", JSON.stringify(clienteAtualizado));

      return { success: true };
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      return { success: false, error: "Erro interno ao atualizar" };
    }
  }, [cliente]);

  const value = {
    cliente,
    loading,
    login,
    logout,
    isAuthenticated: !!cliente,
    atualizarCliente,
  };

  return (
    <ClienteAuthContext.Provider value={value}>
      {children}
    </ClienteAuthContext.Provider>
  );
}

export function useClienteAuth() {
  const context = useContext(ClienteAuthContext);
  if (context === undefined) {
    throw new Error("useClienteAuth deve ser usado dentro de um ClienteAuthProvider");
  }
  return context;
}