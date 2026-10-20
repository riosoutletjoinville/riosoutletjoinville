// src/components/checkout/ClienteOptions.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DadosFormularioCheckout, ItemPedidoMP } from "@/types/mercadopago";
import { buscarEnderecoPorCEP } from "@/services/cepService";
import {
  Eye,
  EyeOff,
  Truck,
  Check,
  Shield,
  Lock,
  CreditCard,
  Clock,
  MapPin,
  Mail,
  User,
  Phone,
  FileText,
  Building2,
  QrCode,
} from "lucide-react";
import Swal from "sweetalert2";

interface ItemCarrinho {
  id: string;
  produto_id: string;
  titulo: string;
  preco_unitario: number;
  quantidade: number;
  imagem_url?: string;
}

interface ClienteOptionsProps {
  onTipoCadastro: (
    tipo: "login" | "cadastro" | "guest",
    dados?: DadosFormularioCheckout,
    metodoPagamento?: "cartao" | "pix",
  ) => Promise<void>;
  carrinhoItens: ItemPedidoMP[];
  total: number;
  subtotal?: number;
  freteValor?: number;
  freteInfo?: { nome: string; prazo: string; valor: number };
  dadosPreenchidos?: DadosFormularioCheckout | null;
}

const STORAGE_KEY = "checkout_cliente_data";

export default function ClienteOptions({
  onTipoCadastro,
  carrinhoItens,
  total,
  subtotal,
  freteValor,
  freteInfo,
  dadosPreenchidos,
}: ClienteOptionsProps) {
  const [tipoSelecionado, setTipoSelecionado] = useState<
    "login" | "cadastro" | "guest"
  >("" as any);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const router = useRouter();

  const [tipoPessoa, setTipoPessoa] = useState<"fisica" | "juridica">(
    dadosPreenchidos?.tipo_cliente === "juridica" ? "juridica" : "fisica",
  );

  const [dadosCliente, setDadosCliente] = useState<DadosFormularioCheckout>(
    () => {
      if (dadosPreenchidos) {
        return dadosPreenchidos;
      }

      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      }

      return {
        email: "",
        senha: "",
        nome: "",
        sobrenome: "",
        cpf: "",
        telefone: "",
        tipo_cliente: "fisica",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      };
    },
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosCliente));
  }, [dadosCliente]);

  useEffect(() => {
    localStorage.setItem("checkout_tipo_selecionado", tipoSelecionado);
  }, [tipoSelecionado]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTipo = localStorage.getItem("checkout_tipo_selecionado");
      if (savedTipo && (savedTipo === "login" || savedTipo === "cadastro")) {
        setTipoSelecionado(savedTipo);
      }
    }
  }, []);

  const handleDadosChange = (
    campo: keyof DadosFormularioCheckout,
    valor: string,
  ) => {
    setDadosCliente((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleLogin = async () => {
  if (!dadosCliente.email || !dadosCliente.senha) {
    await Swal.fire({
      icon: 'warning',
      title: 'Campos obrigatórios',
      text: 'Preencha e-mail e senha para fazer login.',
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'OK'
    });
    return;
  }

  setLoading(true);
  try {
    const response = await fetch("/api/clientes/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: dadosCliente.email,
        senha: dadosCliente.senha,
      }),
    });

    const resultado = await response.json();

    if (resultado.success) {
      localStorage.setItem("cliente_token", resultado.token);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("checkout_tipo_selecionado");
      router.push("/checkout/logado");
    } else {
      await Swal.fire({
        icon: 'error',
        title: 'Erro no login',
        text: resultado.error || 'E-mail ou senha inválidos.',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'Tentar novamente'
      });
    }
  } catch (error) {
    console.error("Erro no login:", error);
    await Swal.fire({
      icon: 'error',
      title: 'Erro de conexão',
      text: 'Não foi possível conectar ao servidor. Tente novamente.',
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'OK'
    });
  } finally {
    setLoading(false);
  }
};

  // Função para verificar se os dados do formulário estão válidos
  const isFormularioValido = (): boolean => {
    if (!dadosCliente.email) return false;

    if (tipoSelecionado === "login") {
      return !!dadosCliente.senha;
    }

    if (tipoSelecionado === "cadastro") {
      // Validações para pessoa física
      if (tipoPessoa === "fisica") {
        if (!dadosCliente.nome) return false;
        if (!dadosCliente.cpf) return false;
      }
      // Validações para pessoa jurídica
      else {
        if (!dadosCliente.razao_social) return false;
        if (!dadosCliente.cnpj) return false;
      }

      // Validações comuns
      if (!dadosCliente.senha) return false;
      if (dadosCliente.senha !== confirmarSenha) return false;
      if (dadosCliente.senha.length < 6) return false;

      // Endereço
      if (!dadosCliente.cep) return false;
      if (!dadosCliente.logradouro) return false;
      if (!dadosCliente.numero) return false;
      if (!dadosCliente.bairro) return false;
      if (!dadosCliente.cidade) return false;
      if (!dadosCliente.estado) return false;
    }

    return true;
  };

  const handleContinuar = async () => {
  // Validação de e-mail
  if (!dadosCliente.email) {
    await Swal.fire({
      icon: 'warning',
      title: 'E-mail obrigatório',
      text: 'Por favor, informe seu e-mail para continuar.',
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'OK'
    });
    return;
  }

  // Caso seja login
  if (tipoSelecionado === "login") {
    await handleLogin();
    return;
  }

  // Validações de cadastro para pessoa física
  if (tipoSelecionado === "cadastro") {
    if (tipoPessoa === "fisica") {
      if (!dadosCliente.nome) {
        await Swal.fire({
          icon: 'warning',
          title: 'Nome obrigatório',
          text: 'Por favor, informe seu nome completo.',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      if (!dadosCliente.cpf) {
        await Swal.fire({
          icon: 'warning',
          title: 'CPF obrigatório',
          text: 'Por favor, informe seu CPF.',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK'
        });
        return;
      }
    } 
    // Validações para pessoa jurídica
    else {
      if (!dadosCliente.razao_social) {
        await Swal.fire({
          icon: 'warning',
          title: 'Razão Social obrigatória',
          text: 'Por favor, informe a Razão Social da empresa.',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK'
        });
        return;
      }
      
      if (!dadosCliente.cnpj) {
        await Swal.fire({
          icon: 'warning',
          title: 'CNPJ obrigatório',
          text: 'Por favor, informe o CNPJ da empresa.',
          confirmButtonColor: '#16a34a',
          confirmButtonText: 'OK'
        });
        return;
      }
    }

    // Validação de e-mail (já feito, mas reforçando)
    if (!dadosCliente.email) {
      await Swal.fire({
        icon: 'warning',
        title: 'E-mail obrigatório',
        text: 'Por favor, informe seu e-mail.',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Validação de senha
    if (!dadosCliente.senha) {
      await Swal.fire({
        icon: 'warning',
        title: 'Senha obrigatória',
        text: 'Por favor, crie uma senha para sua conta.',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Confirmar senha
    if (dadosCliente.senha !== confirmarSenha) {
      await Swal.fire({
        icon: 'error',
        title: 'Senhas não coincidem',
        text: 'A senha e a confirmação de senha devem ser iguais.',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Tamanho mínimo da senha
    if (dadosCliente.senha.length < 6) {
      await Swal.fire({
        icon: 'warning',
        title: 'Senha muito curta',
        text: 'A senha deve ter no mínimo 6 caracteres.',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'OK'
      });
      return;
    }
  }

  // Se for guest (sem cadastro), apenas valida e-mail
  if (tipoSelecionado === "guest" && !dadosCliente.email) {
    await Swal.fire({
      icon: 'warning',
      title: 'E-mail obrigatório',
      text: 'Por favor, informe seu e-mail para continuar.',
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'OK'
    });
    return;
  }

  // Se chegou aqui, todos os dados estão OK
  const dadosParaEnviar: DadosFormularioCheckout = {
    ...dadosCliente,
  };

  onTipoCadastro(tipoSelecionado, dadosParaEnviar);
};

  const formatarCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
        .slice(0, 14);
    }
    return numbers.slice(0, 14);
  };

  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length > 10) {
      return numbers
        .replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
        .slice(0, 15);
    }
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3").slice(0, 14);
  };

  const formatarCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        dadosCliente.cep &&
        dadosCliente.cep.replace(/\D/g, "").length === 8
      ) {
        buscarEndereco(dadosCliente.cep);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [dadosCliente.cep]);

  const buscarEndereco = async (cep: string) => {
    setBuscandoCEP(true);
    try {
      const endereco = await buscarEnderecoPorCEP(cep);
      if (endereco) {
        setDadosCliente((prev) => ({
          ...prev,
          logradouro: endereco.logradouro || prev.logradouro,
          bairro: endereco.bairro || prev.bairro,
          cidade: endereco.localidade || prev.cidade,
          estado: endereco.uf || prev.estado,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setBuscandoCEP(false);
    }
  };

  const formatarCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers
        .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
        .slice(0, 18);
    }
    return numbers.slice(0, 18);
  };

  const subtotalCalculado =
    subtotal ??
    carrinhoItens.reduce(
      (acc, item) => acc + item.preco_unitario * item.quantidade,
      0,
    );

  const temFrete = freteValor && freteValor > 0;
  const freteGratis = freteValor === 0 && (freteInfo?.valor === 0 || !temFrete);

  // Verificar se o formulário está visível (cadastro expandido)
  const formularioVisivel =
    tipoSelecionado === "login" || tipoSelecionado === "cadastro";
  const formularioValido = isFormularioValido();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Esquerda - Formulário */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo e título */}
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-4">
              <Image
                src="/logomarca/logo.png"
                alt="Logo da loja"
                width={120}
                height={60}
                className="h-12 w-auto object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Finalizar Pedido
            </h1>
            <p className="text-gray-600 mt-2">
              Complete suas informações para finalizar a compra
            </p>
          </div>

          {/* Cards de opção */}
          <RadioGroup
            value={tipoSelecionado}
            onValueChange={(value: "login" | "cadastro") =>
              setTipoSelecionado(value)
            }
            className="space-y-4"
          >
            {/* Opção Login */}
            <div
              className={`relative rounded-xl border-2 transition-all cursor-pointer ${
                tipoSelecionado === "login"
                  ? "border-green-500 bg-green-50/30 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setTipoSelecionado("login")}
            >
              <div className="flex items-start p-5">
                <RadioGroupItem value="login" id="login" className="mt-1" />
                <div className="flex-1 ml-3">
                  <Label
                    htmlFor="login"
                    className="text-base font-semibold cursor-pointer"
                  >
                    Já sou cliente
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Faça login para acessar seus dados e acompanhar pedidos
                  </p>

                  {tipoSelecionado === "login" && (
                    <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="email"
                          placeholder="Seu e-mail"
                          className="pl-10"
                          value={dadosCliente.email}
                          onChange={(e) =>
                            handleDadosChange("email", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type={mostrarSenha ? "text" : "password"}
                          placeholder="Sua senha"
                          className="pl-10 pr-10"
                          value={dadosCliente.senha}
                          onChange={(e) =>
                            handleDadosChange("senha", e.target.value)
                          }
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                        >
                          {mostrarSenha ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Opção Cadastro */}
            <div
              className={`relative rounded-xl border-2 transition-all cursor-pointer ${
                tipoSelecionado === "cadastro"
                  ? "border-green-500 bg-green-50/30 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setTipoSelecionado("cadastro")}
            >
              <div className="flex items-start p-5">
                <RadioGroupItem
                  value="cadastro"
                  id="cadastro"
                  className="mt-1"
                />
                <div className="flex-1 ml-3">
                  <Label
                    htmlFor="cadastro"
                    className="text-base font-semibold cursor-pointer"
                  >
                    Criar minha conta
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Cadastre-se para acompanhar pedidos e ganhar benefícios
                  </p>

                  {tipoSelecionado === "cadastro" && (
                    <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                      {/* Tipo de Pessoa - Selector */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-green-600" />
                          Tipo de Cadastro
                        </h4>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <button
                            type="button"
                            onClick={() => {
                              setTipoPessoa("fisica");
                              handleDadosChange("tipo_cliente", "fisica");
                              handleDadosChange("razao_social", "");
                              handleDadosChange("cnpj", "");
                            }}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              tipoPessoa === "fisica"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <User className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                            <p className="font-medium text-center">
                              Pessoa Física
                            </p>
                            <p className="text-xs text-gray-500 text-center">
                              CPF
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTipoPessoa("juridica");
                              handleDadosChange("tipo_cliente", "juridica");
                              handleDadosChange("nome", "");
                              handleDadosChange("sobrenome", "");
                              handleDadosChange("cpf", "");
                            }}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              tipoPessoa === "juridica"
                                ? "border-green-500 bg-green-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Building2 className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                            <p className="font-medium text-center">
                              Pessoa Jurídica
                            </p>
                            <p className="text-xs text-gray-500 text-center">
                              CNPJ
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Campos específicos para Pessoa Física */}
                      {tipoPessoa === "fisica" && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="Nome"
                                className="pl-10"
                                value={dadosCliente.nome}
                                onChange={(e) =>
                                  handleDadosChange("nome", e.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="relative">
                              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Input
                                placeholder="Sobrenome"
                                className="pl-10"
                                value={dadosCliente.sobrenome}
                                onChange={(e) =>
                                  handleDadosChange("sobrenome", e.target.value)
                                }
                              />
                            </div>
                          </div>

                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="CPF"
                              className="pl-10"
                              value={dadosCliente.cpf}
                              onChange={(e) =>
                                handleDadosChange(
                                  "cpf",
                                  formatarCPF(e.target.value),
                                )
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Campos específicos para Pessoa Jurídica */}
                      {tipoPessoa === "juridica" && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Razão Social"
                              className="pl-10"
                              value={dadosCliente.razao_social}
                              onChange={(e) =>
                                handleDadosChange(
                                  "razao_social",
                                  e.target.value,
                                )
                              }
                              required
                            />
                          </div>

                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Nome Fantasia"
                              className="pl-10"
                              value={dadosCliente.nome_fantasia}
                              onChange={(e) =>
                                handleDadosChange(
                                  "nome_fantasia",
                                  e.target.value,
                                )
                              }
                            />
                          </div>

                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="CNPJ"
                              className="pl-10"
                              value={dadosCliente.cnpj}
                              onChange={(e) =>
                                handleDadosChange(
                                  "cnpj",
                                  formatarCNPJ(e.target.value),
                                )
                              }
                            />
                          </div>

                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                              placeholder="Inscrição Estadual (opcional)"
                              className="pl-10"
                              value={dadosCliente.inscricao_estadual}
                              onChange={(e) =>
                                handleDadosChange(
                                  "inscricao_estadual",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* E-mail (comum para ambos) */}
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="email"
                          placeholder="E-mail"
                          className="pl-10"
                          value={dadosCliente.email}
                          onChange={(e) =>
                            handleDadosChange("email", e.target.value)
                          }
                          required
                        />
                      </div>

                      {/* Senhas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type={mostrarSenha ? "text" : "password"}
                            placeholder="Senha (mínimo 6 caracteres)"
                            className="pl-10 pr-10"
                            value={dadosCliente.senha}
                            onChange={(e) =>
                              handleDadosChange("senha", e.target.value)
                            }
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                          >
                            {mostrarSenha ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            type={mostrarConfirmarSenha ? "text" : "password"}
                            placeholder="Confirmar senha"
                            className="pl-10 pr-10"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() =>
                              setMostrarConfirmarSenha(!mostrarConfirmarSenha)
                            }
                          >
                            {mostrarConfirmarSenha ? (
                              <EyeOff size={18} />
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Telefone */}
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Telefone"
                          className="pl-10"
                          value={dadosCliente.telefone}
                          onChange={(e) =>
                            handleDadosChange(
                              "telefone",
                              formatarTelefone(e.target.value),
                            )
                          }
                        />
                      </div>

                      {/* Endereço */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-green-600" />
                          Endereço de Entrega
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="relative md:col-span-1">
                            <Input
                              placeholder="CEP"
                              value={dadosCliente.cep}
                              onChange={(e) =>
                                handleDadosChange(
                                  "cep",
                                  formatarCEP(e.target.value),
                                )
                              }
                              className={buscandoCEP ? "pr-8" : ""}
                            />
                            {buscandoCEP && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                              </div>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <Input
                              placeholder="Logradouro"
                              value={dadosCliente.logradouro}
                              onChange={(e) =>
                                handleDadosChange("logradouro", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <Input
                            placeholder="Número"
                            value={dadosCliente.numero}
                            onChange={(e) =>
                              handleDadosChange("numero", e.target.value)
                            }
                          />
                          <div className="md:col-span-2">
                            <Input
                              placeholder="Complemento (opcional)"
                              value={dadosCliente.complemento}
                              onChange={(e) =>
                                handleDadosChange("complemento", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <Input
                            placeholder="Bairro"
                            value={dadosCliente.bairro}
                            onChange={(e) =>
                              handleDadosChange("bairro", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Cidade"
                            value={dadosCliente.cidade}
                            onChange={(e) =>
                              handleDadosChange("cidade", e.target.value)
                            }
                          />
                        </div>
                        <div className="mt-4">
                          <Input
                            placeholder="Estado (UF)"
                            value={dadosCliente.estado}
                            onChange={(e) =>
                              handleDadosChange("estado", e.target.value)
                            }
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </RadioGroup>

          {/* BOTÕES DE PAGAMENTO - Visíveis apenas quando um tipo está selecionado */}
          {formularioVisivel && (
            <div className="space-y-3 mt-6">
              <Button
                onClick={() => handleContinuar()} // SEM método de pagamento
                className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-semibold rounded-xl transition-all transform hover:scale-[1.02]"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Continuar para Pagamento
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Coluna Direita - Resumo do Pedido */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-5 py-4">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Resumo do Pedido
                </h3>
              </div>

              <CardContent className="p-5">
                <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                  {carrinhoItens.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.titulo}{" "}
                        <span className="text-gray-400">
                          x{item.quantidade}
                        </span>
                      </span>
                      <span className="font-medium text-gray-900">
                        R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 my-4"></div>

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="text-gray-900">
                    R$ {subtotalCalculado.toFixed(2)}
                  </span>
                </div>

                {temFrete && !freteGratis && (
                  <>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Frete ({freteInfo?.nome || "Entrega"}):
                      </span>
                      <span className="text-blue-600 font-medium">
                        R$ {freteValor?.toFixed(2)}
                      </span>
                    </div>
                    {freteInfo?.prazo && (
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Prazo de entrega:</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {freteInfo.prazo}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {freteGratis && (
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-green-600 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Frete Grátis
                    </span>
                    <span className="text-green-600 font-medium">R$ 0,00</span>
                  </div>
                )}

                <div className="border-t border-gray-200 my-4"></div>

                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {total.toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 text-xs text-gray-500 text-center">
                  Parcele em até 12x sem juros no cartão
                </div>
              </CardContent>
            </Card>

            <div className="mt-4">
              <p className="text-xs text-gray-500 text-center mb-3">
                Formas de pagamento
              </p>
              <div className="flex justify-center items-center gap-4 flex-wrap">
                <Image
                  src="/images/pagamentos/default-brand-mercadopago.webp"
                  alt="Mercado Pago"
                  width={45}
                  height={28}
                  className="h-7 w-auto grayscale hover:grayscale-0 transition-all duration-200 hover:scale-110"
                />
                <Image
                  src="/images/pagamentos/pix.webp"
                  alt="Pix"
                  width={45}
                  height={28}
                  className="h-7 w-auto grayscale hover:grayscale-0 transition-all duration-200 hover:scale-110"
                />
                <Image
                  src="/images/pagamentos/visa.webp"
                  alt="Visa"
                  width={45}
                  height={28}
                  className="h-7 w-auto grayscale hover:grayscale-0 transition-all duration-200 hover:scale-110"
                />
                <Image
                  src="/images/pagamentos/mastercard.webp"
                  alt="Mastercard"
                  width={45}
                  height={28}
                  className="h-7 w-auto grayscale hover:grayscale-0 transition-all duration-200 hover:scale-110"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <div className="mt-6 space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>Compra 100% segura</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              <span>Dados criptografados</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span>SSL Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              <span>LGPD</span>
            </div>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            Seus dados pessoais estão protegidos. Utilizamos criptografia SSL
            para garantir a segurança das suas informações.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 group">
            <a
              href="https://www.ajsservicosesolucoes.com.br/pt-BR"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              title="AJS Serviços e Soluções"
            >
              <div className="w-12 h-8 rounded-lg overflow-hidden shadow-sm transition-transform duration-200 hover:scale-110">
                <Image
                  src="/logomarca/logo-ajs.png"
                  alt="AJS Serviços e Soluções"
                  width={75}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
            </a>
            <div>
              <p className="text-xs text-gray-500">Desenvolvido por</p>
              <a
                href="https://www.ajsservicosesolucoes.com.br/pt-BR"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors duration-200"
              >
                AJS Serviços e Soluções
              </a>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Versão 1.0.0</p>
            <p className="text-xs text-gray-400">
              © 2026 - FullStack Developers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
