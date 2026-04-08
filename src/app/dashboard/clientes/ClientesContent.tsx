"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Search, Plus, Edit, Trash2, Building2, User, Key, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ==================== INTERFACE CORRETA ====================
interface Cliente {
  id: string;
  tipo_cliente: "fisica" | "juridica";
  razao_social: string | null;
  nome_fantasia: string | null;
  nome: string | null;
  sobrenome: string | null;
  cnpj: string | null;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  responsavel: string | null;
  local_trabalho: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  observacoes: string | null;
  ativo: boolean;
  ativo_login: boolean;
  senha: string | null;
  created_at: string;
}

// ==================== MÁSCARAS ====================
const mascaraCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const mascaraCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const mascaraTelefone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

const mascaraCEP = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1");
};

// ==================== COMPONENTE PAGINAÇÃO ====================
function Pagination({ currentPage, totalPages, onPageChange }: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Próxima
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function ClientesContent() {
  const { user } = useAuth();
  
  // Estados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 10;
  
  // Senha
  const [showSenhaModal, setShowSenhaModal] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  // Formulário - TODOS OS CAMPOS DA TABELA
  const [formData, setFormData] = useState({
    tipo_cliente: "juridica" as "fisica" | "juridica",
    razao_social: "",
    nome_fantasia: "",
    nome: "",
    sobrenome: "",
    cnpj: "",
    cpf: "",
    email: "",
    telefone: "",
    responsavel: "",
    local_trabalho: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    inscricao_estadual: "",
    inscricao_municipal: "",
    observacoes: "",
    ativo: true,
    senha: "",
  });

  // ==================== BUSCAR CLIENTES COM PAGINAÇÃO ====================
  const fetchClientes = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("clientes")
        .select("*", { count: 'exact' })
        .or(`created_by.eq.${user!.id},created_by.is.null`);
      
      if (searchTerm) {
        query = query.or(
          `razao_social.ilike.%${searchTerm}%,` +
          `nome_fantasia.ilike.%${searchTerm}%,` +
          `nome.ilike.%${searchTerm}%,` +
          `sobrenome.ilike.%${searchTerm}%,` +
          `cnpj.ilike.%${searchTerm}%,` +
          `cpf.ilike.%${searchTerm}%,` +
          `email.ilike.%${searchTerm}%,` +
          `telefone.ilike.%${searchTerm}%`
        );
      }
      
      const { count, error: countError } = await query;
      if (countError) throw countError;
      
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
      
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== SALVAR CLIENTE ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Preparar dados - SÓ OS CAMPOS QUE EXISTEM NA TABELA
      const clienteData: any = {
        tipo_cliente: formData.tipo_cliente,
        razao_social: formData.tipo_cliente === "juridica" ? formData.razao_social : null,
        nome_fantasia: formData.tipo_cliente === "juridica" ? formData.nome_fantasia : null,
        cnpj: formData.tipo_cliente === "juridica" ? formData.cnpj : null,
        nome: formData.tipo_cliente === "fisica" ? formData.nome : null,
        sobrenome: formData.tipo_cliente === "fisica" ? formData.sobrenome : null,
        cpf: formData.tipo_cliente === "fisica" ? formData.cpf : null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        responsavel: formData.responsavel || null,
        local_trabalho: formData.local_trabalho || null,
        endereco: formData.endereco || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        cep: formData.cep || null,
        inscricao_estadual: formData.inscricao_estadual || null,
        inscricao_municipal: formData.inscricao_municipal || null,
        observacoes: formData.observacoes || null,
        ativo: formData.ativo,
        created_by: user!.id,
      };
      
      // Só adiciona senha se fornecida
      if (formData.senha) {
        const bcrypt = await import("bcryptjs");
        const salt = await bcrypt.genSalt(12);
        clienteData.senha = await bcrypt.hash(formData.senha, salt);
        clienteData.ativo_login = true;
        clienteData.data_cadastro_login = new Date().toISOString();
      }

      if (editingCliente) {
        const { error } = await supabase
          .from("clientes")
          .update(clienteData)
          .eq("id", editingCliente.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert([clienteData]);
        if (error) throw error;
      }

      resetForm();
      fetchClientes();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente");
    }
  };

  // ==================== ALTERAR SENHA ====================
  const handleAlterarSenha = async () => {
    if (!editingCliente || !novaSenha) return;
    
    setAlterandoSenha(true);
    try {
      const bcrypt = await import("bcryptjs");
      const salt = await bcrypt.genSalt(12);
      const senhaHash = await bcrypt.hash(novaSenha, salt);
      
      const { error } = await supabase
        .from("clientes")
        .update({ 
          senha: senhaHash,
          ativo_login: true,
          data_cadastro_login: new Date().toISOString()
        })
        .eq("id", editingCliente.id);
      
      if (error) throw error;
      
      alert("Senha alterada com sucesso!");
      setNovaSenha("");
      setShowSenhaModal(false);
      fetchClientes();
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      alert("Erro ao alterar senha");
    } finally {
      setAlterandoSenha(false);
    }
  };

  // ==================== EXCLUIR CLIENTE ====================
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      fetchClientes();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
    }
  };

  // ==================== EDITAR CLIENTE ====================
  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      tipo_cliente: cliente.tipo_cliente,
      razao_social: cliente.razao_social || "",
      nome_fantasia: cliente.nome_fantasia || "",
      nome: cliente.nome || "",
      sobrenome: cliente.sobrenome || "",
      cnpj: cliente.cnpj || "",
      cpf: cliente.cpf || "",
      email: cliente.email || "",
      telefone: cliente.telefone || "",
      responsavel: cliente.responsavel || "",
      local_trabalho: cliente.local_trabalho || "",
      endereco: cliente.endereco || "",
      numero: cliente.numero || "",
      complemento: cliente.complemento || "",
      bairro: cliente.bairro || "",
      cidade: cliente.cidade || "",
      estado: cliente.estado || "",
      cep: cliente.cep || "",
      inscricao_estadual: cliente.inscricao_estadual || "",
      inscricao_municipal: cliente.inscricao_municipal || "",
      observacoes: cliente.observacoes || "",
      ativo: cliente.ativo,
      senha: "",
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  // ==================== RESETAR FORMULÁRIO ====================
  const resetForm = () => {
    setFormData({
      tipo_cliente: "juridica",
      razao_social: "",
      nome_fantasia: "",
      nome: "",
      sobrenome: "",
      cnpj: "",
      cpf: "",
      email: "",
      telefone: "",
      responsavel: "",
      local_trabalho: "",
      endereco: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      cep: "",
      inscricao_estadual: "",
      inscricao_municipal: "",
      observacoes: "",
      ativo: true,
      senha: "",
    });
    setEditingCliente(null);
    setIsEditing(false);
    setIsCreating(false);
    setShowSenhaModal(false);
    setNovaSenha("");
  };

  // Effects
  useEffect(() => {
    if (user) fetchClientes();
  }, [user, searchTerm, currentPage]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Modal Alterar Senha */}
      {showSenhaModal && editingCliente && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Alterar Senha - {editingCliente.nome || editingCliente.razao_social}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
              <div className="flex space-x-2">
                <Button onClick={handleAlterarSenha} disabled={alterandoSenha || !novaSenha}>
                  {alterandoSenha ? "Salvando..." : "Salvar"}
                </Button>
                <Button variant="outline" onClick={() => setShowSenhaModal(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Criação/Edição */}
      {(isCreating || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo Cliente */}
              <div>
                <Label>Tipo de Cliente *</Label>
                <RadioGroup
                  value={formData.tipo_cliente}
                  onValueChange={(value: "fisica" | "juridica") =>
                    setFormData({ ...formData, tipo_cliente: value })
                  }
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="juridica" id="juridica" />
                    <Label htmlFor="juridica">Pessoa Jurídica</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fisica" id="fisica" />
                    <Label htmlFor="fisica">Pessoa Física</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* PJ */}
              {formData.tipo_cliente === "juridica" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Razão Social *</Label>
                      <Input
                        value={formData.razao_social}
                        onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Nome Fantasia</Label>
                      <Input
                        value={formData.nome_fantasia}
                        onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>CNPJ *</Label>
                    <Input
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: mascaraCNPJ(e.target.value) })}
                      required
                    />
                  </div>
                </>
              )}

              {/* PF */}
              {formData.tipo_cliente === "fisica" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome *</Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Sobrenome *</Label>
                      <Input
                        value={formData.sobrenome}
                        onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>CPF *</Label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: mascaraCPF(e.target.value) })}
                      required
                    />
                  </div>
                </>
              )}

              {/* Contato */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: mascaraTelefone(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label>Responsável</Label>
                <Input
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                />
              </div>

              <div>
                <Label>Local de Trabalho</Label>
                <Input
                  value={formData.local_trabalho}
                  onChange={(e) => setFormData({ ...formData, local_trabalho: e.target.value })}
                />
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: mascaraCEP(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="UF"
                  />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <Input
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  />
                </div>
              </div>

              {/* PJ específico */}
              {formData.tipo_cliente === "juridica" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Inscrição Estadual</Label>
                    <Input
                      value={formData.inscricao_estadual}
                      onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Inscrição Municipal</Label>
                    <Input
                      value={formData.inscricao_municipal}
                      onChange={(e) => setFormData({ ...formData, inscricao_municipal: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Observações</Label>
                <Input
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>

              {/* Senha - só na criação */}
              {isCreating && (
                <div>
                  <Label>Senha {isCreating && "*"}</Label>
                  <Input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required={isCreating}
                    placeholder="Senha para acesso ao sistema"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta senha será criptografada
                  </p>
                </div>
              )}

              {/* Status */}
              <div>
                <Label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="rounded"
                  />
                  <span>Cliente Ativo</span>
                </Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit">{isEditing ? "Atualizar" : "Criar"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento, email ou telefone..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome/Razão Social</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Login</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                clientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cliente.tipo_cliente === "juridica" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {cliente.tipo_cliente === "juridica" ? "PJ" : "PF"}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {cliente.tipo_cliente === "juridica" ? (
                          <Building2 className="mr-2 h-4 w-4" />
                        ) : (
                          <User className="mr-2 h-4 w-4" />
                        )}
                        {cliente.tipo_cliente === "juridica" 
                          ? cliente.razao_social 
                          : `${cliente.nome || ""} ${cliente.sobrenome || ""}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {cliente.tipo_cliente === "juridica" ? cliente.cnpj : cliente.cpf}
                    </TableCell>
                    <TableCell>{cliente.email}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell>
                      {cliente.ativo_login ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          Inativo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        {cliente.ativo_login && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCliente(cliente);
                              setShowSenhaModal(true);
                            }}
                            title="Alterar Senha"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleEdit(cliente)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(cliente.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
          
          <div className="text-sm text-muted-foreground mt-2">
            Total: {totalCount} cliente(s)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}