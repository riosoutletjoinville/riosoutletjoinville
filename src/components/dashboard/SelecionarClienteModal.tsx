// app/components/dashboard/SelecionarClienteModal.tsx - ATUALIZADO
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Search } from "lucide-react";

interface Cliente {
  id: string;
  tipo_cliente: "juridica" | "fisica";
  // Campos para pessoa jurídica
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  // Campos para pessoa física
  nome?: string;
  sobrenome?: string;
  cpf?: string;
  // Campos comuns
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
}

interface SelecionarClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cliente: Cliente) => void;
}

export default function SelecionarClienteModal({
  isOpen,
  onClose,
  onSelect,
}: SelecionarClienteModalProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | "juridica" | "fisica">(
    "todos"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClientes();
    }
  }, [isOpen]);

  const loadClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select(
          `
          id,
          tipo_cliente,
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
          ativo,
          local_trabalho
        `
        )
        .eq("ativo", true)
        .order("razao_social", { ascending: true, nullsFirst: false })
        .order("nome", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Erro ao carregar clientes:", error);
        throw error;
      }

      setClientes((data as Cliente[]) || []);
    } catch (error) {
      console.error("Erro completo ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter((cliente) => {
    // Filtro por tipo
    if (tipoFiltro !== "todos" && cliente.tipo_cliente !== tipoFiltro) {
      return false;
    }

    // Filtro por busca
    const searchLower = search.toLowerCase();

    if (cliente.tipo_cliente === "juridica") {
      return (
        cliente.razao_social?.toLowerCase().includes(searchLower) ||
        cliente.nome_fantasia?.toLowerCase().includes(searchLower) ||
        cliente.cnpj?.includes(search)
      );
    } else {
      return (
        cliente.nome?.toLowerCase().includes(searchLower) ||
        cliente.sobrenome?.toLowerCase().includes(searchLower) ||
        cliente.cpf?.includes(search)
      );
    }
  });

  const getNomeCliente = (cliente: Cliente): string => {
    if (cliente.tipo_cliente === "juridica") {
      return cliente.nome_fantasia || cliente.razao_social || "Cliente PJ";
    } else {
      return (
        `${cliente.nome || ""} ${cliente.sobrenome || ""}`.trim() ||
        "Cliente PF"
      );
    }
  };

  const getDocumento = (cliente: Cliente): string => {
    if (cliente.tipo_cliente === "juridica") {
      return cliente.cnpj || "CNPJ não informado";
    } else {
      return cliente.cpf || "CPF não informado";
    }
  };

  const getTipoLabel = (cliente: Cliente): string => {
    return cliente.tipo_cliente === "juridica" ? "PJ" : "PF";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-semibold">Selecionar Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtro por tipo */}
            <select
              value={tipoFiltro}
              onChange={(e) =>
                setTipoFiltro(e.target.value as "todos" | "juridica" | "fisica")
              }
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="todos">Todos os tipos</option>
              <option value="juridica">Pessoa Jurídica</option>
              <option value="fisica">Pessoa Física</option>
            </select>

            {/* Barra de busca */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Buscar por nome, razão social, CNPJ ou CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full"
              />
            </div>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredClientes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum cliente encontrado
            </p>
          ) : (
            <div className="space-y-2 p-4">
              {filteredClientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex justify-between items-start p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {getNomeCliente(cliente)}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {getTipoLabel(cliente)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {getDocumento(cliente)}
                    </p>
                    {(cliente.email || cliente.telefone) && (
                      <p className="text-xs text-gray-500 mb-1">
                        {cliente.email && `${cliente.email} • `}
                        {cliente.telefone}
                      </p>
                    )}
                    {cliente.cidade && cliente.estado && (
                      <p className="text-xs text-gray-500">
                        {cliente.cidade} - {cliente.estado}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onSelect(cliente);
                      onClose();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 ml-4 whitespace-nowrap"
                  >
                    Selecionar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
