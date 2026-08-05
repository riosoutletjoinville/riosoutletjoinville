// src/app/api/clientes/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Pegar token do header Authorization
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar sessão no banco de dados
    const { data: sessao, error: sessaoError } = await supabase
      .from('cliente_sessoes')
      .select('cliente_id, expira_em')
      .eq('token_sessao', token)
      .gt('expira_em', new Date().toISOString())
      .single();

    if (sessaoError || !sessao) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Buscar cliente pelo ID da sessão
    const { data: cliente, error } = await supabase
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
        ativo_login
      `)
      .eq("id", sessao.cliente_id)
      .single();

    if (error || !cliente) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se cliente está ativo
    if (!cliente.ativo || !cliente.ativo_login) {
      return NextResponse.json(
        { success: false, error: 'Cliente inativo ou login desativado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: cliente.id,
        nome: cliente.nome || "",
        sobrenome: cliente.sobrenome || "",
        email: cliente.email,
        telefone: cliente.telefone || "",
        cpf: cliente.cpf || "",
        razao_social: cliente.razao_social || "",
        nome_fantasia: cliente.nome_fantasia || "",
        cnpj: cliente.cnpj || "",
        inscricao_estadual: cliente.inscricao_estadual || "",
        inscricao_municipal: cliente.inscricao_municipal || "",
        endereco: cliente.endereco || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        bairro: cliente.bairro || "",
        cidade: cliente.cidade || "",
        estado: cliente.estado || "",
        cep: cliente.cep || "",
        tipo_cliente: cliente.tipo_cliente,
        ativo: cliente.ativo,
        ativo_login: cliente.ativo_login,
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados do cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Também suportar POST para compatibilidade
export async function POST(request: NextRequest) {
  return GET(request);
}