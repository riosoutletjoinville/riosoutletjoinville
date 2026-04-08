// src/app/dashboard/admin/users/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import {
  listUsersAdmin,
  createUserAdmin,
  getSupabaseAdmin,
  getAdminClient,
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPhone, unformatPhone } from "@/utils/formatPhone";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  Mail,
  User,
  Key,
} from "lucide-react";
import Swal from "sweetalert2";

interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: "admin" | "usuario" | "vendedor" | "contador";
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface UserMetadata {
  name?: string;
  phone?: string;
}

interface AppMetadata {
  provider?: string;
  providers?: string[];
  [key: string]: unknown;
}

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: UserMetadata;
  app_metadata?: AppMetadata;
  phone?: string;
  tipo?: "admin" | "usuario" | "vendedor" | "contador";
}

interface SupabaseUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: {
    name?: string;
    phone?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
    [key: string]: unknown;
  };
  phone?: string;
}

export default function AdminUsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "" });
  const [error, setError] = useState<string>("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    if (!getSupabaseAdmin) {
      setError(
        "Service role key não configurada. Configure NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY no .env.local"
      );
      return;
    }
    loadUsers();
    loadUsuarios();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await listUsersAdmin();
      const mappedUsers: User[] = (data.users || []).map(
        (supabaseUser: SupabaseUser) => ({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          created_at: supabaseUser.created_at,
          last_sign_in_at: supabaseUser.last_sign_in_at,
          user_metadata: supabaseUser.user_metadata,
          app_metadata: supabaseUser.app_metadata,
          phone: supabaseUser.phone,
        })
      );
      setUsers(mappedUsers);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao carregar usuários:", error);
      setError(`Erro ao carregar usuários: ${errorMessage}`);
    }
  };

  const loadUsuarios = async () => {
    try {
      const supabase = getSupabaseAdmin();
      if (!supabase) throw new Error("Supabase client não inicializado");

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  const getUserTipo = (userId: string, userEmail: string): string => {
    const usuarioById = usuarios.find((u) => u.id === userId);
    if (usuarioById) {
      return usuarioById.tipo;
    }

    const usuarioByEmail = usuarios.find((u) => u.email === userEmail);
    if (usuarioByEmail) {
      return usuarioByEmail.tipo;
    }

    return "usuario";
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createUserAdmin(newUser.email, newUser.password);
      setNewUser({ email: "", password: "" });
      loadUsers();
      loadUsuarios();

      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: "Usuário criado com sucesso!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao criar usuário:", error);
      setError(`Erro ao criar usuário: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (user: User) => {
    if (!getSupabaseAdmin()) {
      Swal.fire("Erro", "Service role não configurada", "error");
      return;
    }

    const userTipo = getUserTipo(user.id, user.email);
    const currentPhone = user.user_metadata?.phone || user.phone || "";

    const result = await Swal.fire({
      title: "Editar Usuário",
      html: `<div class="space-y-4 text-left">
      <div>
        <label class="block text-sm font-medium mb-1">Email</label>
        <input 
          id="swal-email" 
          type="email" 
          value="${user.email}" 
          class="swal2-input" 
          placeholder="Email"
        >
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Nome</label>
        <input 
          id="swal-name" 
          type="text" 
          value="${user.user_metadata?.name || ""}" 
          class="swal2-input" 
          placeholder="Nome completo"
        >
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Telefone</label>
        <input 
          id="swal-phone" 
          type="tel" 
          value="${formatPhone(currentPhone)}" 
          class="swal2-input" 
          placeholder="(11) 99999-9999"
          oninput="this.value = this.value.replace(/[^0-9() -]/g, '').slice(0, 20)"
        >
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Nova Senha (opcional)</label>
        <input 
          id="swal-password" 
          type="password" 
          class="swal2-input" 
          placeholder="Deixe em branco para manter a atual"
        >
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Tipo de Usuário</label>
        <select id="swal-tipo" class="swal2-input">
          <option value="admin" ${
            userTipo === "admin" ? "selected" : ""
          }>Administrador</option>
          <option value="vendedor" ${
            userTipo === "vendedor" ? "selected" : ""
          }>Vendedor</option>
          <option value="contador" ${
            userTipo === "contador" ? "selected" : ""
          }>Contador</option>
          <option value="usuario" ${
            userTipo === "usuario" ? "selected" : ""
          }>Usuário</option>
        </select>
      </div>
    </div>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Salvar Alterações",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        const email = (
          document.getElementById("swal-email") as HTMLInputElement
        ).value;
        const name = (document.getElementById("swal-name") as HTMLInputElement)
          .value;
        const phone = (
          document.getElementById("swal-phone") as HTMLInputElement
        ).value;
        const password = (
          document.getElementById("swal-password") as HTMLInputElement
        ).value;
        const tipo = (document.getElementById("swal-tipo") as HTMLSelectElement)
          .value as "admin" | "usuario" | "vendedor" | "contador";

        if (!email) {
          Swal.showValidationMessage("Email é obrigatório");
          return false;
        }

        const phoneClean = unformatPhone(phone);

        return { email, name, phone: phoneClean, password, tipo };
      },
    });

    if (result.isConfirmed && result.value) {
      try {
        const formValues = result.value;
        const updateData: {
          email: string;
          user_metadata?: UserMetadata;
          password?: string;
        } = {
          email: formValues.email,
          user_metadata: {
            ...user.user_metadata,
            name: formValues.name,
            phone: formValues.phone,
          },
        };

        if (formValues.password) {
          updateData.password = formValues.password;
        }

        const adminClient = getAdminClient();
        const { error: authError } =
          await adminClient.auth.admin.updateUserById(user.id, updateData);

        if (authError) throw authError;

        const supabase = getSupabaseAdmin();
        if (supabase) {
          const { error: usuarioError } = await supabase
            .from("usuarios")
            .update({
              tipo: formValues.tipo,
              nome: formValues.name,
              email: formValues.email,
              phone: formValues.phone,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (usuarioError) throw usuarioError;
        }

        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Usuário atualizado com sucesso!",
          timer: 2000,
          showConfirmButton: false,
        });

        loadUsers();
        loadUsuarios();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro ao atualizar usuário:", error);
        Swal.fire(
          "Erro",
          `Erro ao atualizar usuário: ${errorMessage}`,
          "error"
        );
      }
    }
  };

  const handleDeleteUser = async (user: User) => {
    const result = await Swal.fire({
      title: "Tem certeza?",
      text: `Você está prestes a excluir o usuário ${user.email}. Esta ação não pode ser desfeita!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sim, excluir!",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const adminClient = getAdminClient();
        const { error } = await adminClient.auth.admin.deleteUser(user.id);
        if (error) throw error;

        const supabase = getSupabaseAdmin();
        if (supabase) {
          await supabase.from("usuarios").delete().eq("id", user.id);
        }

        Swal.fire({
          icon: "success",
          title: "Excluído!",
          text: "Usuário excluído com sucesso!",
          timer: 2000,
          showConfirmButton: false,
        });

        loadUsers();
        loadUsuarios();
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro ao excluir usuário:", error);
        Swal.fire("Erro", `Erro ao excluir usuário: ${errorMessage}`, "error");
      }
    }
  };

  const handleViewUser = (user: User) => {
    const userTipo = getUserTipo(user.id, user.email);
    const currentPhone = user.user_metadata?.phone || user.phone || "";

    Swal.fire({
      title: "Detalhes do Usuário",
      html: `
      <div class="text-left space-y-3">
        <div>
          <strong>ID:</strong><br>
          <span class="text-sm">${user.id}</span>
        </div>
        <div>
          <strong>Email:</strong><br>
          ${user.email}
        </div>
        <div>
          <strong>Nome:</strong><br>
          ${user.user_metadata?.name || "Não informado"}
        </div>
        <div>
          <strong>Telefone:</strong><br>
          ${currentPhone ? formatPhone(currentPhone) : "Não informado"}
        </div>
        <div>
          <strong>Tipo:</strong><br>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            userTipo === "admin"
              ? "bg-purple-100 text-purple-800"
              : userTipo === "vendedor"
              ? "bg-blue-100 text-blue-800"
              : userTipo === "contador"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }">
            ${userTipo === "contador" ? "Contador" : userTipo}
          </span>
        </div>
        <div>
          <strong>Criado em:</strong><br>
          ${new Date(user.created_at).toLocaleString("pt-BR")}
        </div>
        <div>
          <strong>Último acesso:</strong><br>
          ${
            user.last_sign_in_at
              ? new Date(user.last_sign_in_at).toLocaleString("pt-BR")
              : "Nunca acessou"
          }
        </div>
        <div>
          <strong>Status:</strong><br>
          <span class="${
            user.last_sign_in_at ? "text-green-600" : "text-gray-600"
          }">
            ${user.last_sign_in_at ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>
    `,
      icon: "info",
      confirmButtonText: "Fechar",
      width: "600px",
    });
  };

  const handleToggleUserStatus = async (user: User) => {
    const newStatus = !user.last_sign_in_at;
    const action = newStatus ? "ativar" : "desativar";

    const result = await Swal.fire({
      title: `Confirmar ${action} usuário?`,
      text: `Deseja ${action} o usuário ${user.email}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: `Sim, ${action}`,
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          icon: "info",
          title: "Funcionalidade em desenvolvimento",
          text: `A ${action}ção de usuários será implementada em breve.`,
          timer: 3000,
          showConfirmButton: false,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`Erro ao ${action} usuário:`, error);
        Swal.fire(
          "Erro",
          `Erro ao ${action} usuário: ${errorMessage}`,
          "error"
        );
      }
    }
  };

  if (!getSupabaseAdmin()) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          Service role key não configurada. Configure a variável de ambiente
          NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                  className="pl-10"
                />
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Senha (mínimo 6 caracteres)"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Criando...
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  Criar Usuário
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Último acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const userTipo = getUserTipo(user.id, user.email);
                  return (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold">{user.email}</span>
                          {user.user_metadata?.name && (
                            <span className="text-sm text-gray-600">
                              {user.user_metadata.name}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userTipo === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : userTipo === "vendedor"
                              ? "bg-blue-100 text-blue-800"
                              : userTipo === "contador"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {userTipo === "contador" ? "Contador" : userTipo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {new Date(user.created_at).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleTimeString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at ? (
                          <div className="flex flex-col">
                            <span>
                              {new Date(
                                user.last_sign_in_at
                              ).toLocaleDateString("pt-BR")}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(
                                user.last_sign_in_at
                              ).toLocaleTimeString("pt-BR")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">
                            Nunca acessou
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.last_sign_in_at
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.last_sign_in_at ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUser(user)}
                            title="Visualizar usuário"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            title="Editar usuário"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleUserStatus(user)}
                            title={
                              user.last_sign_in_at
                                ? "Desativar usuário"
                                : "Ativar usuário"
                            }
                            className="h-8 w-8"
                          >
                            {user.last_sign_in_at ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user)}
                            title="Excluir usuário"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>Nenhum usuário encontrado</p>
              <p className="text-sm">
                Crie seu primeiro usuário usando o formulário acima
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}