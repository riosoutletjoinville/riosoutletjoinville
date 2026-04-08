//src/app/dashboard/pedidos/page.tsx
"use client";
export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generatePedidoPDF } from "@/lib/generatePedidoPDF";
import VisualizarPedidoModal from "@/components/dashboard/pedidos/VisualizarPedidoModal";

import {
  Eye,
  Search,
  FileText,
  Download,
  X,
  Edit,
  RefreshCw,
} from "lucide-react";
import PrePedidoModal from "@/components/dashboard/pedidos/PrePedidoModal";
import PrePedidoPreview from "@/components/dashboard/pedidos/PrePedidoPreview";
import { generatePDF } from "@/lib/generatePDF";
import Swal from "sweetalert2";
import {
  ItemPedido,
  Produto,
  Cliente,
  Parcela,
} from "@/components/dashboard/pedidos/PrePedidoModal";

import EditarPedidoModal from "@/components/dashboard/pedidos/EditarPedidoModal";

// No início do arquivo, adicione:
import { NFeStatusBadge } from "@/components/dashboard/NFeStatusBadge";
import AcoesPedidoModal from "@/components/dashboard/pedidos/AcoesPedidoModal";

export interface Pedido {
  id: string;
  cliente_id: string;
  total: number;
  status: string;
  data_pedido: string;
  created_at: string;
  pre_pedido_id?: string;
  observacoes?: string;
  origem_pedido?: string;
  condicao_pagamento?: string;
  nfe_status?:
    | "pendente"
    | "processando"
    | "autorizada"
    | "cancelada"
    | "rejeitada"
    | "denegada";
  nfe_url?: string;
  notas_fiscais?: NotaFiscal[];
  tipo_pedido_id?: string;
  tipo_pedido?: {
    id: string;
    nome: string;
    cor: string;
  };
  cliente: {
    razao_social?: string;
    nome_fantasia?: string;
    cnpj?: string;
    nome?: string;
    sobrenome?: string;
    cpf?: string;
  };
  pedido_itens?: PedidoItem[];
  status_pedido?: {
    id: string;
    nome: string;
    categoria: string;
    descricao: string;
    cor: string;
  };
  justificativa_tipo?: string;
  local_trabalho_ped?: string;
  vendedor_nome?: string;
  vendedor_email?: string;
  vendedor_telefone?: string;
}

export interface PrePedido {
  id: string;
  cliente_id: string;
  total: number;
  status: string;
  created_at: string;
  observacoes: string;
  condicao_pagamento: string;
  itens: ItemPedido[];
  usuario_id?: string;
  tipo_cancelamento?: string;
  tipo_pedido_id?: string;
  tipo_pedido?: {
    id: string;
    nome: string;
    cor: string;
    icone?: string;
    requer_justificativa: boolean;
    afeta_estoque: boolean;
  };
  justificativa_tipo?: string;
  local_trabalho_ped?: string;
  cliente: {
    id: string;
    tipo_cliente: "juridica" | "fisica";
    razao_social?: string;
    nome_fantasia?: string;
    cnpj?: string;
    nome?: string;
    sobrenome?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    cidade?: string;
    estado?: string;
    endereco?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    local_trabalho?: string;
  } | null;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    tipo: string;
    local_trabalho?: string;
    phone?: string;
  } | null;
}

export interface PedidoSaveData {
  cliente: Cliente;
  itens: ItemPedido[];
  total: number;
  observacoes: string;
  condicaoPagamento: string;
  clienteId: string;
  usuarioId: string;
  localTrabalho?: string;
  condicaoPagamentoId?: string;
  parcelas?: Parcela[];
  pedidoAnterior?: {
    id: string;
    total: number;
    saldo_restante: number;
    cliente: Cliente;
  };
  saldoPedidoAnterior?: number;
  valorProdutosNovos?: number;
  vendedor?: {
    nome: string;
    email: string;
    telefone: string;
    local_trabalho: string;
  };
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: string;
  local_trabalho?: string;
  phone?: string;
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  desconto: number;
  tamanhos: { [tamanho: string]: number };
  filial: string;
  embargue: string;
  produto: Produto;
}

export interface ParcelaParaAtualizar {
  id: string;
  observacao?: string;
  status: string;
}

export interface NotaFiscal {
  id: string;
  status:
    | "pendente"
    | "processando"
    | "autorizada"
    | "cancelada"
    | "rejeitada"
    | "denegada";
  danfe_url: string | null;
  created_at: string;
  data_emissao: string | null;
}

export default function PedidosContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pedidoParaVisualizar, setPedidoParaVisualizar] = useState<
    string | null
  >(null);
  // Estados para abas
  const [activeTab, setActiveTab] = useState<"pedidos" | "pre-pedidos">(
    "pedidos",
  );

  const [selectedOrderForActions, setSelectedOrderForActions] =
    useState<Pedido | null>(null);
  const [showAcoesModal, setShowAcoesModal] = useState(false);

  const [selectedOrderForNFe, setSelectedOrderForNFe] = useState<Pedido | null>(
    null,
  );
  const [showNFeModal, setShowNFeModal] = useState(false);
  const [nfeLoading, setNfeLoading] = useState(false);

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [prePedidos, setPrePedidos] = useState<PrePedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrePedidoModal, setShowPrePedidoModal] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(
    null,
  );

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPrePedido, setSelectedPrePedido] = useState<PrePedido | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pedidoEditando, setPedidoEditando] = useState<
    PrePedido | Pedido | null
  >(null);
  const [showEditarPedidoModal, setShowEditarPedidoModal] = useState(false);
  const itemsPerPage = 10;

  const loadPedidos = async () => {
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `
        *,
        vendedor_nome,
        vendedor_email, 
        vendedor_telefone,
        cliente:clientes (
          razao_social,
          nome_fantasia,
          cnpj,
          nome,
          sobrenome,
          cpf,
          local_trabalho
        ),
        pedido_itens (
          id,
          produto_id,
          quantidade,
          preco_unitario,
          subtotal,
          desconto,
          tamanhos,
          filial,
          embargue,
          produto:produtos (
            id,
            titulo,
            preco,
            preco_prod,
            modelo_prod,
            ncm
          )
        ),
        notas_fiscais:notas_fiscais (
          id,
          status,
          danfe_url,
          created_at,
          data_emissao
        )
      `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Processar os pedidos com tipagem explícita
      const pedidosComNF = (data || []).map((pedido: any) => {
        // Tipar as notas fiscais
        const notasFiscais = (pedido.notas_fiscais || []) as NotaFiscal[];

        // Ordenar as notas fiscais por data_emissao (mais recente primeiro)
        const nfsOrdenadas = [...notasFiscais].sort((a, b) => {
          // Primeiro tenta ordenar por data_emissao
          if (a.data_emissao && b.data_emissao) {
            return (
              new Date(b.data_emissao).getTime() -
              new Date(a.data_emissao).getTime()
            );
          }
          // Se não tiver data_emissao, ordena por created_at
          if (a.created_at && b.created_at) {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          }
          return 0;
        });

        const nfMaisRecente = nfsOrdenadas[0];

        return {
          ...pedido,
          nfe_status: nfMaisRecente?.status || "pendente",
          nfe_url: nfMaisRecente?.danfe_url || null,
        };
      });

      setPedidos(pedidosComNF);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    }
  };

  const loadUsuarios = async () => {
    try {
      if (user) {
        // USAR A API EM VEZ DE CONSULTA DIRETA
        const response = await fetch("/api/usuario/perfil");
        const data = await response.json();

        if (response.ok && data.perfil) {
          const usuario = {
            id: data.perfil.id,
            nome: data.perfil.nome,
            email: data.perfil.email,
            tipo: data.perfil.tipo,
            local_trabalho: data.perfil.local_trabalho || "",
            phone: data.perfil.phone || "",
          };
          setUsuarios([usuario]);
          setUsuarioSelecionado(usuario);
        } else {
          // Fallback: criar perfil básico com dados do auth
          const usuarioFallback = {
            id: user.id,
            nome: user.email?.split("@")[0] || "Usuário",
            email: user.email || "",
            tipo: "usuario",
            local_trabalho: "",
            phone: "",
          };
          setUsuarios([usuarioFallback]);
          setUsuarioSelecionado(usuarioFallback);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      // Fallback
      if (user) {
        const usuarioFallback = {
          id: user.id,
          nome: user.email?.split("@")[0] || "Usuário",
          email: user.email || "",
          tipo: "usuario",
          local_trabalho: "",
          phone: "",
        };
        setUsuarios([usuarioFallback]);
        setUsuarioSelecionado(usuarioFallback);
      }
    }
  };

  // loadPrePedidos
  const loadPrePedidos = async () => {
    try {
      const { data, error } = await supabase
        .from("pre_pedidos")
        .select(
          `
        id,
        cliente_id,
        total,
        status,
        created_at,
        observacoes,
        condicao_pagamento,
        itens,
        usuario_id,
        tipo_pedido_id,
        justificativa_tipo,
        local_trabalho_ped,
        tipo_pedido:tipos_pedido (
          id,
          nome,
          cor,
          icone,
          requer_justificativa,
          afeta_estoque
        ),
        cliente:clientes (
          id,
          razao_social,
          nome_fantasia,
          cnpj,
          nome,
          sobrenome,
          cpf,
          email,
          telefone,
          cidade,
          estado,
          endereco,
          numero,
          complemento,
          bairro,
          tipo_cliente,
          local_trabalho
        )
      `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // CARREGAR USUÁRIOS SEPARADAMENTE
      const prePedidosComUsuarios = await Promise.all(
        (data || []).map(async (item) => {
          let usuarioData = null;

          if (item.usuario_id) {
            const { data: usuario } = await supabase
              .from("usuarios")
              .select("*")
              .eq("id", item.usuario_id)
              .maybeSingle();

            usuarioData = usuario;
          }

          const clienteData = Array.isArray(item.cliente)
            ? item.cliente[0]
            : item.cliente;

          return {
            ...item,
            usuario: usuarioData,
            tipo_pedido: Array.isArray(item.tipo_pedido)
              ? item.tipo_pedido[0]
              : item.tipo_pedido,
            cliente: clienteData
              ? {
                  id: clienteData.id,
                  tipo_cliente: clienteData.tipo_cliente || "juridica",
                  razao_social: clienteData.razao_social || "",
                  nome_fantasia: clienteData.nome_fantasia || "",
                  cnpj: clienteData.cnpj || "",
                  nome: clienteData.nome || "",
                  sobrenome: clienteData.sobrenome || "",
                  cpf: clienteData.cpf || "",
                  email: clienteData.email || "",
                  telefone: clienteData.telefone || "",
                  cidade: clienteData.cidade || "",
                  estado: clienteData.estado || "",
                  endereco: clienteData.endereco || "",
                  numero: clienteData.numero || "",
                  complemento: clienteData.complemento || "",
                  bairro: clienteData.bairro || "",
                  local_trabalho: clienteData.local_trabalho || "",
                }
              : null,
          };
        }),
      );

      setPrePedidos(prePedidosComUsuarios);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar pré-pedidos:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      await loadPedidos();
      await loadPrePedidos();
      await loadUsuarios();
    };

    loadData();
  }, [user, authLoading]);

  const handleAcoesPosVenda = (pedido: Pedido) => {
    setSelectedOrderForActions(pedido);
    setShowAcoesModal(true);
  };

  const atualizarParcelasPedidoAnterior = async (
    pedidoAnteriorId: string,
    novoPedidoId: string,
  ) => {
    try {
      // Buscar todas as parcelas pendentes do pedido anterior
      const { data: parcelas, error } = await supabase
        .from("pre_pedido_parcelas")
        .select("*")
        .eq("pre_pedido_id", pedidoAnteriorId)
        .eq("status", "pendente");

      if (error) throw error;

      // Atualizar cada parcela com observação de vinculação
      const atualizacoes: Promise<void>[] = (parcelas || []).map(
        async (parcela: ParcelaParaAtualizar) => {
          const observacaoAtual = parcela.observacao || "";
          const novaObservacao = observacaoAtual
            ? `${observacaoAtual}; Vinculada ao pedido ${novoPedidoId}`
            : `Vinculada ao pedido ${novoPedidoId}`;

          const { error: updateError } = await supabase
            .from("pre_pedido_parcelas")
            .update({
              observacao: novaObservacao,
              status: "vinculada",
            })
            .eq("id", parcela.id);

          if (updateError) throw updateError;
        },
      );

      await Promise.all(atualizacoes);

      return true;
    } catch (error) {
      console.error("Erro ao atualizar parcelas do pedido anterior:", error);
      return false;
    }
  };

  const handleSavePrePedido = async (pedidoData: PedidoSaveData) => {
    try {
      setLoading(true);

      const prePedidoData = {
        cliente_id: pedidoData.clienteId,
        itens: pedidoData.itens,
        total: pedidoData.total,
        observacoes: pedidoData.observacoes,
        condicao_pagamento: pedidoData.condicaoPagamento,
        condicao_pagamento_id:
          pedidoData.condicaoPagamentoId &&
          pedidoData.condicaoPagamentoId !== "custom"
            ? pedidoData.condicaoPagamentoId
            : null,
        pedido_anterior_id: pedidoData.pedidoAnterior?.id,
        saldo_pedido_anterior: pedidoData.saldoPedidoAnterior || 0,
        valor_produtos_novos: pedidoData.valorProdutosNovos || pedidoData.total,
        status: "confirmado",
        usuario_id: pedidoData.usuarioId,
        local_trabalho_ped: pedidoData.localTrabalho || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: prePedido, error: pedidoError } = await supabase
        .from("pre_pedidos")
        .insert(prePedidoData)
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // ATUALIZAR PARCELAS DO PEDIDO ANTERIOR SE HOUVER VINCULAÇÃO
      if (pedidoData.pedidoAnterior?.id && prePedido.id) {
        const sucesso = await atualizarParcelasPedidoAnterior(
          pedidoData.pedidoAnterior.id,
          prePedido.id,
        );

        if (!sucesso) {
          console.warn(
            "Não foi possível atualizar as parcelas do pedido anterior",
          );
        }
      }

      if (pedidoData.parcelas && pedidoData.parcelas.length > 0) {
        const parcelasData = pedidoData.parcelas.map((parcela) => ({
          pre_pedido_id: prePedido.id,
          numero_parcela: parcela.numero,
          valor_parcela: parcela.valor,
          data_vencimento: parcela.data_vencimento,
          status: "pendente",
        }));

        const { error: parcelasError } = await supabase
          .from("pre_pedido_parcelas")
          .insert(parcelasData);

        if (parcelasError) throw parcelasError;
      }

      Swal.fire("Sucesso!", "Pré-pedido criado com sucesso!", "success");
      loadPrePedidos();
      setActiveTab("pre-pedidos"); // Muda para a aba de pré-pedidos após criar
    } catch (error) {
      console.error("Erro ao criar pré-pedido:", error);
      Swal.fire("Erro", "Não foi possível criar o pré-pedido", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditarPrePedido = (prePedido: PrePedido) => {
    if (prePedido.status === "convertido") {
      Swal.fire(
        "Edição não permitida",
        "Pedidos confirmados não podem ser editados. Caso necessário, cancele o pedido e crie um novo.",
        "warning",
      );
      return;
    }
    setPedidoEditando(prePedido);
    setShowEditarPedidoModal(true);
  };

  const handleDownloadPDF = async (prePedido: PrePedido) => {
    try {
      const { data: prePedidoData, error: prePedidoError } = await supabase
        .from("pre_pedidos")
        .select(
          `
        *,
        cliente:clientes (*)
      `,
        )
        .eq("id", prePedido.id)
        .single();

      if (prePedidoError) throw prePedidoError;

      let usuarioData = null;
      if (prePedidoData.usuario_id) {
        const { data: usuario, error: usuarioError } = await supabase
          .from("usuarios")
          .select("*")
          .eq("id", prePedidoData.usuario_id)
          .single();

        if (!usuarioError) {
          usuarioData = usuario;
        }
      }

      // Corrigir a estrutura dos dados para o PDF
      const pedidoData = {
        cliente: prePedidoData.cliente || prePedido.cliente,
        itens: (prePedidoData.itens || []).map((item: ItemPedido) => ({
          produto: {
            id: item.produto?.id || "",
            titulo: item.produto?.titulo || "Produto sem nome",
            preco_prod: item.produto?.preco_prod || item.preco_unitario || 0,
            codigo: item.produto?.codigo || "",
            ncm: item.produto?.ncm || "",
            imagem_principal: item.produto?.imagem_principal || "",
          },
          quantidade: item.quantidade || 0,
          preco_unitario: item.preco_unitario || 0,
          tamanhos: item.tamanhos || {},
          subtotal: item.subtotal || 0,
          desconto: item.desconto || 0,
          filial: item.filial || "",
          embargue: item.embargue || "",
        })),
        total: prePedidoData.total || 0,
        observacoes: prePedidoData.observacoes || "",
        condicaoPagamento: prePedidoData.condicao_pagamento || "",
        numeroPedido: prePedidoData.id,
        vendedor: usuarioData
          ? {
              id: usuarioData.id,
              nome: usuarioData.nome,
              email: usuarioData.email,
              tipo: usuarioData.tipo,
              phone: usuarioData.phone || "Não informado",
            }
          : undefined,
        vendedor_nome: prePedidoData.usuario?.nome,
        vendedor_email: prePedidoData.usuario?.email,
        vendedor_telefone: prePedidoData.usuario?.phone,
        localTrabalho: prePedidoData.local_trabalho_ped || "",
      };

      await generatePDF(pedidoData, prePedidoData.id);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      Swal.fire("Erro", "Não foi possível gerar o PDF", "error");
    }
  };

  const handleViewPrePedido = (prePedido: PrePedido) => {
    setSelectedPrePedido(prePedido);
  };

  const formatStatus = (status: string, tipoCancelamento?: string) => {
    const statusMap: { [key: string]: string } = {
      rascunho: "Rascunho",
      confirmado: "Pré-Pedido Confirmado",
      convertido: "Pedido Confirmado",
      cancelado: tipoCancelamento
        ? `Cancelado (${getTipoCancelamento(tipoCancelamento)})`
        : "Cancelado",
    };
    return statusMap[status] || status;
  };

  const getTipoCancelamento = (tipo: string) => {
    const tipos: { [key: string]: string } = {
      arrependimento: "Arrependimento",
      defeito: "Defeito no produto",
      nao_entrega: "Não entrega",
      erro_pedido: "Erro no pedido",
      outro: "Outro motivo",
    };
    return tipos[tipo] || tipo;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      rascunho: "bg-gray-100 text-gray-800",
      confirmado: "bg-blue-100 text-blue-800",
      convertido: "bg-green-100 text-green-800",
      cancelado: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const handleConfirmPrePedido = async (
    prePedido: PrePedido,
    tipoPedidoId?: string,
    justificativaTipo?: string,
  ) => {
    try {
      console.log("=== INICIANDO handleConfirmPrePedido ===");

      // VALIDAR ESTOQUE
      for (const item of prePedido.itens) {
        const { data: produto, error: produtoError } = await supabase
          .from("produtos")
          .select("estoque, titulo")
          .eq("id", item.produto.id)
          .single();

        if (produtoError) {
          console.error("Erro ao verificar estoque:", produtoError);
          continue;
        }

        if ((produto.estoque || 0) < item.quantidade) {
          Swal.fire(
            "Estoque insuficiente",
            `Produto ${produto.titulo} possui apenas ${produto.estoque} unidades em estoque (solicitado: ${item.quantidade})`,
            "error",
          );
          return;
        }
      }

      const confirmResult = await Swal.fire({
        title: "Confirmar Pedido",
        text: "Deseja confirmar este pré-pedido como pedido definitivo?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sim, confirmar",
        cancelButtonText: "Cancelar",
      });

      if (!confirmResult.isConfirmed) return;

      // 1. CRIAR O PEDIDO
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          cliente_id: prePedido.cliente_id,
          total: prePedido.total,
          status: "confirmado", // Já cria como confirmado
          data_pedido: new Date().toISOString(),
          pre_pedido_id: prePedido.id,
          observacoes: prePedido.observacoes,
          condicao_pagamento: prePedido.condicao_pagamento,
          usuario_id: prePedido.usuario_id || user?.id || null,
          tipo_pedido_id: tipoPedidoId || prePedido.tipo_pedido_id,
          local_trabalho_ped: prePedido.local_trabalho_ped || "",
          vendedor_nome: prePedido.usuario?.nome || "",
          vendedor_email: prePedido.usuario?.email || "",
          vendedor_telefone: prePedido.usuario?.phone || "",
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // 2. INSERIR OS ITENS DO PEDIDO (UM POR VARIAÇÃO)
      for (const item of prePedido.itens) {
        // Se o item tem múltiplos tamanhos, criar um registro por tamanho
        if (item.tamanhos && Object.keys(item.tamanhos).length > 0) {
          for (const [tamanho, quantidade] of Object.entries(item.tamanhos)) {
            if (quantidade > 0) {
              const { error: itemError } = await supabase
                .from("pedido_itens")
                .insert({
                  pedido_id: pedido.id,
                  produto_id: item.produto.id,
                  quantidade: quantidade,
                  preco_unitario: item.preco_unitario,
                  subtotal: item.preco_unitario * quantidade,
                  desconto: item.desconto || 0,
                  tamanhos: { [tamanho]: quantidade },
                  filial: item.filial || "Matriz",
                  embargue: item.embargue || "Verificar com o vendedor",
                });

              if (itemError) throw itemError;
            }
          }
        } else {
          // Item sem tamanhos (caso raro)
          const { error: itemError } = await supabase
            .from("pedido_itens")
            .insert({
              pedido_id: pedido.id,
              produto_id: item.produto.id,
              quantidade: item.quantidade,
              preco_unitario: item.preco_unitario,
              subtotal: item.subtotal,
              desconto: item.desconto || 0,
              tamanhos: item.tamanhos || {},
              filial: item.filial || "Matriz",
              embargue: item.embargue || "Verificar com o vendedor",
            });

          if (itemError) throw itemError;
        }
      }

      // 3. ATUALIZAR O PRÉ-PEDIDO
      const { error: updatePrePedidoError } = await supabase
        .from("pre_pedidos")
        .update({
          status: "convertido",
          updated_at: new Date().toISOString(),
          pedido_id: pedido.id,
          tipo_pedido_id: tipoPedidoId || prePedido.tipo_pedido_id,
          justificativa_tipo: justificativaTipo || null,
        })
        .eq("id", prePedido.id);

      if (updatePrePedidoError) throw updatePrePedidoError;

      Swal.fire("Sucesso!", "Pedido confirmado com sucesso!", "success");
      await loadPedidos();
      await loadPrePedidos();
      setSelectedPrePedido(null);
      setActiveTab("pedidos");
    } catch (error) {
      console.error("Erro ao confirmar pedido:", error);
      Swal.fire("Erro", "Não foi possível confirmar o pedido", "error");
    }
  };

  const handleDownloadPedidoPDF = async (pedido: Pedido) => {
    try {
      // Buscar dados básicos primeiro
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          `
        *,
        cliente:clientes(*),
        pedido_itens(*, produto:produtos(*))
      `,
        )
        .eq("id", pedido.id)
        .single();

      if (error) throw error;

      // Buscar informações do pré-pedido relacionado
      let saldoAnterior = 0;
      let valorProdutosNovos = data.total;
      let parcelas: any[] = [];

      if (data.pre_pedido_id) {
        const { data: prePedidoData } = await supabase
          .from("pre_pedidos")
          .select("saldo_pedido_anterior, valor_produtos_novos")
          .eq("id", data.pre_pedido_id)
          .single();

        if (prePedidoData) {
          saldoAnterior = prePedidoData.saldo_pedido_anterior || 0;
          valorProdutosNovos = prePedidoData.valor_produtos_novos || data.total;
        }

        // Buscar parcelas
        const { data: parcelasData } = await supabase
          .from("pre_pedido_parcelas")
          .select("*")
          .eq("pre_pedido_id", data.pre_pedido_id)
          .order("numero_parcela", { ascending: true });

        parcelas = parcelasData || [];
      }

      // Preparar dados para o PDF
      const pdfData = {
        cliente: data.cliente,
        itens: data.pedido_itens.map((item: PedidoItem) => ({
          produto: {
            id: item.produto.id,
            titulo: item.produto.titulo,
            preco_prod: item.produto.preco_prod,
            codigo: item.produto.codigo,
            ncm: item.produto.ncm,
            imagem_principal: item.produto.imagem_principal,
          },
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          tamanhos: item.tamanhos,
          subtotal: item.subtotal,
          desconto: item.desconto,
          filial: item.filial,
          embargue: item.embargue,
        })),
        total: data.total,
        observacoes: data.observacoes,
        condicaoPagamento: data.condicao_pagamento,
        numeroPedido: data.id,
        vendedor_nome: data.vendedor_nome,
        vendedor_email: data.vendedor_email,
        vendedor_telefone: data.vendedor_telefone,
        localTrabalho: data.local_trabalho_ped,
        // NOVOS CAMPOS
        pedidoAnteriorId: data.pre_pedido_id,
        parcelas: parcelas,
        saldoPedidoAnterior: saldoAnterior,
        valorProdutosNovos: valorProdutosNovos,
      };

      await generatePedidoPDF(pdfData, data.id);
    } catch (error) {
      console.error("Erro ao gerar PDF do pedido:", error);
      Swal.fire("Erro", "Não foi possível gerar o PDF do pedido", "error");
    }
  };

  const handleCancelPrePedido = async (prePedido: PrePedido) => {
    try {
      const { value: motivo } = await Swal.fire({
        title: "Cancelar Pré-Pedido",
        input: "text",
        inputLabel: "Motivo do cancelamento",
        inputPlaceholder: "Digite o motivo do cancelamento",
        showCancelButton: true,
        confirmButtonText: "Confirmar cancelamento",
        cancelButtonText: "Manter pré-pedido",
        inputValidator: (value) => {
          if (!value) {
            return "Por favor, informe o motivo do cancelamento";
          }
        },
      });

      if (!motivo) return;

      const { error } = await supabase
        .from("pre_pedidos")
        .update({
          status: "cancelado",
          cancelado_em: new Date().toISOString(),
          cancelado_por: user?.id,
          motivo_cancelamento: motivo,
        })
        .eq("id", prePedido.id);

      if (error) throw error;

      Swal.fire("Cancelado!", "Pré-pedido cancelado com sucesso.", "success");
      loadPrePedidos();
      setSelectedPrePedido(null);
    } catch (error) {
      console.error("Erro ao cancelar pré-pedido:", error);
      Swal.fire("Erro", "Não foi possível cancelar o pré-pedido", "error");
    }
  };

  const getClienteName = (cliente: PrePedido["cliente"]) => {
    if (!cliente) return "Cliente não encontrado";

    if (cliente.tipo_cliente === "juridica") {
      return (
        cliente.razao_social || cliente.nome_fantasia || "Empresa sem nome"
      );
    } else {
      return (
        `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim() ||
        "Cliente sem nome"
      );
    }
  };

  const getClienteDocument = (cliente: PrePedido["cliente"]) => {
    if (!cliente) return "Documento não informado";

    if (cliente.tipo_cliente === "juridica") {
      return cliente.cnpj || "CNPJ não informado";
    } else {
      return cliente.cpf || "CPF não informado";
    }
  };

  const handleSalvarEdicaoPedido = async (pedidoData: {
    itens: ItemPedido[];
    observacoes: string;
    condicaoPagamento: string;
    total: number;
  }) => {
    try {
      console.log("=== INICIANDO SALVAMENTO DE EDIÇÃO ===");
      console.log("Pedido em edição:", pedidoEditando);
      setLoading(true);

      if (!pedidoEditando) {
        console.error("Nenhum pedido em edição");
        return;
      }

      const isPrePedido =
        pedidoEditando.status === "rascunho" ||
        pedidoEditando.status === "confirmado";

      console.log("Status do pedido:", pedidoEditando.status);
      console.log(
        "Tipo do pedido:",
        isPrePedido ? "Pré-pedido" : "Pedido normal",
      );

      let pedidoRealId = pedidoEditando.id;
      let pedidoReal = pedidoEditando;

      if (!isPrePedido) {
        console.log("Buscando pedido real para pré-pedido:", pedidoEditando.id);

        const { data: pedidoRealData, error } = await supabase
          .from("pedidos")
          .select(
            `
          *,
          pedido_itens (
            id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            desconto,
            tamanhos,
            filial,
            embargue,
            produto:produtos (
              id,
              titulo,
              preco_prod,
              modelo_prod,
              ncm
            )
          )
        `,
          )
          .eq("pre_pedido_id", pedidoEditando.id)
          .single();

        if (error) {
          console.error("Erro ao buscar pedido real:", error);
          Swal.fire(
            "Erro",
            "Não foi possível encontrar o pedido correspondente",
            "error",
          );
          setLoading(false);
          return;
        }

        if (!pedidoRealData) {
          console.error(
            "Pedido real não encontrado para pré-pedido:",
            pedidoEditando.id,
          );
          Swal.fire("Erro", "Pedido não encontrado na base de dados", "error");
          setLoading(false);
          return;
        }

        pedidoRealId = pedidoRealData.id;
        pedidoReal = pedidoRealData as Pedido;
        console.log("Pedido real encontrado:", pedidoRealId);
      }

      const itensAntigos = isPrePedido
        ? (pedidoReal as PrePedido).itens || []
        : (pedidoReal as Pedido).pedido_itens || [];

      console.log("Itens antigos:", itensAntigos.length);
      console.log("Itens novos:", pedidoData.itens.length);

      if (!isPrePedido) {
        console.log(
          "Chamando ajuste de estoque para pedido normal:",
          pedidoRealId,
        );
        await ajustarEstoquePedido(
          itensAntigos,
          pedidoData.itens,
          pedidoRealId,
        );
        console.log("Ajuste de estoque concluído");
      }

      if (isPrePedido) {
        console.log("Atualizando pré-pedido:", pedidoRealId);

        const { error: errorPedido } = await supabase
          .from("pre_pedidos")
          .update({
            itens: pedidoData.itens,
            observacoes: pedidoData.observacoes,
            condicao_pagamento: pedidoData.condicaoPagamento,
            total: pedidoData.total,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pedidoRealId);

        if (errorPedido) throw errorPedido;
      } else {
        console.log("Atualizando pedido normal:", pedidoRealId);

        const { error: errorPedido } = await supabase
          .from("pedidos")
          .update({
            observacoes: pedidoData.observacoes,
            condicao_pagamento: pedidoData.condicaoPagamento,
            total: pedidoData.total,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pedidoRealId);

        if (errorPedido) throw errorPedido;

        console.log("🗑️ Tentando deletar itens do pedido:", pedidoRealId);

        const { error: errorDelete, count: deleteCount } = await supabase
          .from("pedido_itens")
          .delete()
          .eq("pedido_id", pedidoRealId)
          .select();

        console.log("❓ Resultado do delete:", {
          error: errorDelete,
          deletedCount: deleteCount,
        });

        if (errorDelete) throw errorDelete;

        const itensParaInserir = pedidoData.itens.map((item) => ({
          pedido_id: pedidoRealId,
          produto_id: item.produto.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          desconto: item.desconto || 0,
          tamanhos: item.tamanhos || {},
          filial: item.filial || "Matriz",
          embargue: item.embargue || " dias",
        }));

        const { error: errorInsert } = await supabase
          .from("pedido_itens")
          .insert(itensParaInserir);

        if (errorInsert) throw errorInsert;
      }

      Swal.fire("Sucesso", "Pedido atualizado com sucesso", "success");
      setShowEditarPedidoModal(false);
      setPedidoEditando(null);
      loadPedidos();
      loadPrePedidos();
    } catch (error) {
      console.error("Erro ao editar pedido:", error);
      Swal.fire(
        "Erro",
        "Não foi possível salvar as alterações do pedido",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const ajustarEstoquePedido = async (
    itensAntigos: ItemPedido[],
    itensNovos: ItemPedido[],
    pedidoId: string,
  ) => {
    try {
      console.log("=== INICIANDO AJUSTE DE ESTOQUE ===");
      console.log("Pedido ID:", pedidoId);

      const itensAntigosFormatados: ItemPedido[] = itensAntigos.map((item) => {
        if (item.produto && typeof item.produto === "object") {
          return item as ItemPedido;
        } else {
          return {
            produto: item.produto || { id: "" },
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            tamanhos: item.tamanhos || {},
            subtotal: item.subtotal,
            desconto: item.desconto || 0,
            filial: item.filial || "Matriz",
            embargue: item.embargue || " dias",
          } as ItemPedido;
        }
      });

      const itensParaAjustar: {
        produto_id: string;
        diferencaQuantidade: number;
        item: ItemPedido;
      }[] = [];

      itensAntigosFormatados.forEach((itemAntigo) => {
        const itemNovo = itensNovos.find(
          (item) => item.produto.id === itemAntigo.produto.id,
        );

        if (itemNovo) {
          const diferenca = itemNovo.quantidade - itemAntigo.quantidade;
          if (diferenca !== 0) {
            itensParaAjustar.push({
              produto_id: itemAntigo.produto.id,
              diferencaQuantidade: diferenca,
              item: itemNovo,
            });
          }
        } else {
          itensParaAjustar.push({
            produto_id: itemAntigo.produto.id,
            diferencaQuantidade: -itemAntigo.quantidade,
            item: itemAntigo,
          });
        }
      });

      itensNovos.forEach((itemNovo) => {
        const itemAntigo = itensAntigosFormatados.find(
          (item) => item.produto.id === itemNovo.produto.id,
        );
        if (!itemAntigo) {
          itensParaAjustar.push({
            produto_id: itemNovo.produto.id,
            diferencaQuantidade: itemNovo.quantidade,
            item: itemNovo,
          });
        }
      });

      console.log("Itens para ajustar:", itensParaAjustar);

      for (const ajuste of itensParaAjustar) {
        const { produto_id, diferencaQuantidade, item } = ajuste;

        console.log(
          `Processando produto ${produto_id}, diferença: ${diferencaQuantidade}`,
        );

        const { data: produto, error: produtoError } = await supabase
          .from("produtos")
          .select("estoque, titulo")
          .eq("id", produto_id)
          .single();

        if (produtoError) {
          console.error("Erro ao buscar produto:", produtoError);
          continue;
        }

        const novoEstoque = (produto.estoque || 0) - diferencaQuantidade;

        console.log(
          `Produto: ${produto.titulo}, Estoque atual: ${produto.estoque}, Novo estoque: ${novoEstoque}`,
        );

        if (novoEstoque < 0) {
          throw new Error(
            `Estoque insuficiente para ${produto.titulo}. Estoque atual: ${
              produto.estoque
            }, necessário: ${Math.abs(diferencaQuantidade)}`,
          );
        }

        const { error: updateError } = await supabase
          .from("produtos")
          .update({
            estoque: novoEstoque,
            updated_at: new Date().toISOString(),
          })
          .eq("id", produto_id);

        if (updateError) {
          console.error("Erro ao atualizar estoque:", updateError);
          throw updateError;
        }

        const tipoAjuste = diferencaQuantidade > 0 ? "saida" : "entrada";
        const quantidadeAbsoluta = Math.abs(diferencaQuantidade);

        const { error: baixaError } = await supabase
          .from("baixas_estoque")
          .insert({
            produto_id: produto_id,
            quantidade: quantidadeAbsoluta,
            motivo: "ajuste_pedido",
            preco_unitario: item.preco_unitario,
            data_baixa: new Date().toISOString(),
            usuario_id: user?.id,
            observacao: `Ajuste pedido ${pedidoId} - ${produto.titulo}`,
            pedido_id: pedidoId,
            tipo_ajuste: tipoAjuste,
          });

        if (baixaError) {
          console.error("Erro ao registrar baixa:", baixaError);
          throw baixaError;
        }

        console.log(`✅ Estoque ajustado para ${produto.titulo}`);
      }

      console.log("=== AJUSTE DE ESTOQUE CONCLUÍDO ===");
    } catch (error) {
      console.error("Erro no ajuste de estoque:", error);
      throw error;
    }
  };

  // Adicione também a função para emitir NF usando a tabela correta
  const handleEmitirNFe = async (pedido: Pedido) => {
    setSelectedOrderForNFe(pedido);
    setShowNFeModal(true);
  };

  // Função para baixar DANFE
  const handleDownloadNFe = async (pedido: Pedido) => {
    if (!pedido.nfe_url) {
      Swal.fire("Erro", "DANFE não disponível para download", "error");
      return;
    }

    try {
      setNfeLoading(true);

      // Se for uma URL, abrir em nova aba ou fazer download
      if (pedido.nfe_url.startsWith("http")) {
        window.open(pedido.nfe_url, "_blank");
      } else {
        // Se for um blob/base64, criar link para download
        const response = await fetch(pedido.nfe_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `DANFE-${pedido.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Erro ao baixar DANFE:", error);
      Swal.fire("Erro", "Não foi possível baixar a DANFE", "error");
    } finally {
      setNfeLoading(false);
    }
  };

  // Filtros e paginação para pedidos
  const filteredPedidos = pedidos.filter((pedido) => {
    const matchesStatus =
      statusFilter === "all" || pedido.status === statusFilter;
    const matchesSearch = searchTerm
      ? pedido.cliente?.razao_social
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        pedido.cliente?.nome_fantasia
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        pedido.cliente?.nome
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        pedido.cliente?.sobrenome
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        pedido.id.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const totalPedidosPages = Math.ceil(filteredPedidos.length / itemsPerPage);
  const currentPedidos = filteredPedidos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Filtros e paginação para pré-pedidos
  const filteredPrePedidos = prePedidos.filter((prePedido) => {
    // Não mostrar pré-pedidos convertidos na lista de pré-pedidos
    if (prePedido.status === "convertido") return false;

    const matchesStatus =
      statusFilter === "all" || prePedido.status === statusFilter;
    const matchesSearch = searchTerm
      ? getClienteName(prePedido.cliente)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        prePedido.id.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const totalPrePedidosPages = Math.ceil(
    filteredPrePedidos.length / itemsPerPage,
  );

  const currentPrePedidos = filteredPrePedidos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Resetar página quando mudar de aba
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestão de Pedidos
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os pedidos e pré-pedidos do sistema
          </p>
        </div>

        {/* Abas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("pedidos")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "pedidos"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-0"
                }`}
              >
                Pedidos Confirmados
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {pedidos.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("pre-pedidos")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "pre-pedidos"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-0"
                }`}
              >
                Pré-Pedidos
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {prePedidos.filter((pp) => pp.status !== "convertido").length}{" "}
                  {/* ← CORREÇÃO AQUI */}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Barra de ferramentas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={`Buscar ${
                    activeTab === "pedidos" ? "pedidos" : "pré-pedidos"
                  }...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
              >
                <option value="all">Todos os status</option>
                {activeTab === "pedidos" ? (
                  <>
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="cancelado">Cancelado</option>
                  </>
                ) : (
                  <>
                    <option value="rascunho">Rascunho</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="convertido">Convertido</option>
                    <option value="cancelado">Cancelado</option>
                  </>
                )}
              </select>
            </div>
            <button
              onClick={() => setShowPrePedidoModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium w-full sm:w-auto"
            >
              Novo Pré-Pedido
            </button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === "pedidos" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : currentPedidos.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nenhum pedido encontrado
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Comece criando um novo pré-pedido"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pedido
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          NF-e
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentPedidos.map((pedido) => (
                        <tr key={pedido.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {pedido.id.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {pedido.cliente?.razao_social ||
                              pedido.cliente?.nome_fantasia ||
                              `${pedido.cliente?.nome || ""} ${
                                pedido.cliente?.sobrenome || ""
                              }`.trim() ||
                              "Cliente não encontrado"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R$ {pedido.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                pedido.status === "pago" ||
                                pedido.status === "autorizado" ||
                                pedido.status === "confirmado"
                                  ? "bg-green-100 text-green-800"
                                  : pedido.status === "pendente" ||
                                      pedido.status === "processando" ||
                                      pedido.status === "em_mediacao"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : pedido.status === "cancelado" ||
                                        pedido.status === "recusado" ||
                                        pedido.status === "reembolsado" ||
                                        pedido.status === "estornado"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {pedido.status === "pago"
                                ? "Pago"
                                : pedido.status === "autorizado"
                                  ? "Autorizado"
                                  : pedido.status === "confirmado"
                                    ? "Confirmado"
                                    : pedido.status === "pendente"
                                      ? "Pendente"
                                      : pedido.status === "processando"
                                        ? "Processando"
                                        : pedido.status === "em_mediacao"
                                          ? "Em Mediação"
                                          : pedido.status === "cancelado"
                                            ? "Cancelado"
                                            : pedido.status === "recusado"
                                              ? "Recusado"
                                              : pedido.status === "reembolsado"
                                                ? "Reembolsado"
                                                : pedido.status === "estornado"
                                                  ? "Estornado"
                                                  : pedido.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(pedido.data_pedido).toLocaleDateString(
                              "pt-BR",
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {/* Passar status como string vazia se for undefined */}
                            <NFeStatusBadge
                              status={pedido.nfe_status || "pending"}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {/* Botão de visualização para pedidos do E-commerce */}
                            {pedido.origem_pedido === "ecommerce" && (
                              <button
                                onClick={() =>
                                  setPedidoParaVisualizar(pedido.id)
                                }
                                className="text-blue-600 hover:text-blue-900"
                                title="Visualizar Pedido (E-commerce)"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}

                            {/* Botão de visualização para pedidos originados de pré-pedido (Dashboard) */}
                            {pedido.pre_pedido_id && (
                              <button
                                onClick={() => {
                                  const prePedidoCorrespondente =
                                    prePedidos.find(
                                      (pp) => pp.id === pedido.pre_pedido_id,
                                    );
                                  if (prePedidoCorrespondente) {
                                    setSelectedPrePedido(
                                      prePedidoCorrespondente,
                                    );
                                  } else {
                                    // Fallback: tentar buscar o pré-pedido se não estiver na lista
                                    const fetchPrePedido = async () => {
                                      const { data } = await supabase
                                        .from("pre_pedidos")
                                        .select("*")
                                        .eq("id", pedido.pre_pedido_id)
                                        .single();
                                      if (data) {
                                        setSelectedPrePedido(data as PrePedido);
                                      }
                                    };
                                    fetchPrePedido();
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Visualizar Pré-Pedido (Dashboard)"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}

                            {/* Se o pedido não tiver origem definida e não tiver pré-pedido, mostrar ambos ou apenas um fallback */}
                            {!pedido.origem_pedido && !pedido.pre_pedido_id && (
                             <button
                              onClick={() => {
                                const prePedidoCorrespondente = prePedidos.find(
                                  (pp) => pp.id === pedido.pre_pedido_id,
                                );
                                if (prePedidoCorrespondente) {
                                  setSelectedPrePedido(prePedidoCorrespondente);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            )}

                            <button
                              onClick={() => handleAcoesPosVenda(pedido)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Ações Pós-Venda"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadPedidoPDF(pedido)}
                              className="text-green-600 hover:text-green-900"
                              title="Baixar PDF do Pedido"
                            >
                              <Download className="h-4 w-4" />
                            </button>

                            {pedido.nfe_status === "pendente" && (
                              <button
                                onClick={() => handleEmitirNFe(pedido)}
                                className="text-indigo-600 hover:text-indigo-900"
                                disabled={nfeLoading}
                                title="Emitir NF"
                              >
                                {nfeLoading ? (
                                  "Emitindo..."
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                              </button>
                            )}

                            {pedido.nfe_status === "autorizada" && (
                              <button
                                onClick={() => handleDownloadNFe(pedido)}
                                className="text-green-600 hover:text-green-900"
                                disabled={nfeLoading}
                                title="Baixar DANFE"
                              >
                                {nfeLoading ? (
                                  "Baixando..."
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </button>
                            )}

                            {pedido.nfe_status === "rejeitada" && (
                              <button
                                onClick={() => handleEmitirNFe(pedido)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Reemitir NF (rejeitada)"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}

                            {pedido.nfe_status === "cancelada" && (
                              <button
                                onClick={() => handleEmitirNFe(pedido)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Nova emissão (cancelada)"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação para pedidos */}
                {totalPedidosPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex justify-between items-center w-full">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-0 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-700">
                        Página{" "}
                        <span className="font-medium">{currentPage}</span> de{" "}
                        <span className="font-medium">{totalPedidosPages}</span>
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPedidosPages),
                          )
                        }
                        disabled={currentPage === totalPedidosPages}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-0 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "pre-pedidos" && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : currentPrePedidos.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Nenhum pré-pedido encontrado
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Comece criando um novo pré-pedido"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pré-Pedido
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentPrePedidos.map((prePedido) => (
                        <tr key={prePedido.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {prePedido.id.slice(-8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getClienteName(prePedido.cliente)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getClienteDocument(prePedido.cliente)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R$ {prePedido.total.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                prePedido.status,
                              )}`}
                            >
                              {formatStatus(
                                prePedido.status,
                                prePedido.tipo_cancelamento,
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(prePedido.created_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleViewPrePedido(prePedido)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadPDF(prePedido)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            {prePedido.status === "confirmado" && (
                              <button
                                onClick={() =>
                                  handleConfirmPrePedido(prePedido)
                                }
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Confirmar
                              </button>
                            )}
                            {prePedido.status === "rascunho" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleEditarPrePedido(prePedido)
                                  }
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleCancelPrePedido(prePedido)
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação para pré-pedidos */}
                {totalPrePedidosPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex justify-between items-center w-full">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-0 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <span className="text-sm text-gray-700">
                        Página{" "}
                        <span className="font-medium">{currentPage}</span> de{" "}
                        <span className="font-medium">
                          {totalPrePedidosPages}
                        </span>
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPrePedidosPages),
                          )
                        }
                        disabled={currentPage === totalPrePedidosPages}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-0 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Modal de Pré-Pedido */}
        {showPrePedidoModal && (
          <PrePedidoModal
            isOpen={showPrePedidoModal}
            onClose={() => setShowPrePedidoModal(false)}
            onSave={handleSavePrePedido}
            usuarios={usuarios}
            usuarioSelecionado={usuarioSelecionado}
            onUsuarioChange={setUsuarioSelecionado}
          />
        )}

        {/* Modal de Visualização */}
        {selectedPrePedido && (
          <PrePedidoPreview
            isOpen={true}
            cliente={selectedPrePedido.cliente}
            itens={selectedPrePedido.itens}
            total={selectedPrePedido.total}
            observacoes={selectedPrePedido.observacoes}
            condicaoPagamento={selectedPrePedido.condicao_pagamento}
            status={selectedPrePedido.status}
            onClose={() => setSelectedPrePedido(null)}
            onConfirm={(tipoPedidoId: string, justificativaTipo: string) => {
              handleConfirmPrePedido(
                selectedPrePedido,
                tipoPedidoId,
                justificativaTipo,
              );
            }}
            onCancel={
              selectedPrePedido.status === "rascunho"
                ? () => {
                    handleCancelPrePedido(selectedPrePedido);
                  }
                : () => {}
            }
            onEdit={
              selectedPrePedido.status !== "convertido"
                ? () => {
                    handleEditarPrePedido(selectedPrePedido);
                  }
                : () => {}
            }
          />
        )}
        {/* Modal de Edição */}
        {showEditarPedidoModal && pedidoEditando && (
          <EditarPedidoModal
            isOpen={showEditarPedidoModal}
            onClose={() => {
              setShowEditarPedidoModal(false);
              setPedidoEditando(null);
            }}
            pedido={pedidoEditando}
            onSave={handleSalvarEdicaoPedido}
          />
        )}

        {/* Modal de Ações Pós-Venda */}
        {showAcoesModal && selectedOrderForActions && (
          <AcoesPedidoModal
            isOpen={showAcoesModal}
            onClose={() => {
              setShowAcoesModal(false);
              setSelectedOrderForActions(null);
            }}
            pedido={selectedOrderForActions}
            onActionComplete={() => {
              loadPedidos();
              setShowAcoesModal(false);
              setSelectedOrderForActions(null);
            }}
          />
        )}
        {pedidoParaVisualizar && (
          <VisualizarPedidoModal
            isOpen={!!pedidoParaVisualizar}
            onClose={() => setPedidoParaVisualizar(null)}
            pedidoId={pedidoParaVisualizar}
          />
        )}
        {/* Modal de Emissão de NF */}
        {/* {showNFeModal && selectedOrderForNFe && (
          <EmissaoNFModal
            isOpen={showNFeModal}
            onClose={() => {
              setShowNFeModal(false);
              setSelectedOrderForNFe(null);
            }}
            pedido={selectedOrderForNFe}
            onNFeEmitted={() => {
              loadPedidos();
              setShowNFeModal(false);
              setSelectedOrderForNFe(null);
            }}
          />
        )} */}
      </div>
    </div>
  );
}
