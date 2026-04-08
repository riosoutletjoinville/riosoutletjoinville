//src/components/checkout/ClienteOptions.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DadosFormularioCheckout, ItemPedidoMP } from "@/types/mercadopago";
import { buscarEnderecoPorCEP } from "@/services/cepService";
import { Eye, EyeOff, Truck, Check } from "lucide-react";

interface ItemCarrinho {
  id: string;
  produto_id: string;
  titulo: string;
  preco_unitario: number;
  quantidade: number;
  imagem_url?: string;
}

interface ClienteOptionsProps {
  onTipoCadastro: (tipo: "login" | "cadastro" | "guest", dados?: DadosFormularioCheckout) => Promise<void>;
  carrinhoItens: ItemPedidoMP[];
  total: number;
  subtotal?: number;
  freteValor?: number;
  freteInfo?: { nome: string; prazo: string; valor: number };
  dadosPreenchidos?: DadosFormularioCheckout | null;
}

// Chave para salvar no localStorage
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
  >("guest");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buscandoCEP, setBuscandoCEP] = useState(false);

  // Estado inicial com dados do localStorage ou props
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

  // Salvar no localStorage sempre que os dados mudarem
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosCliente));
  }, [dadosCliente]);

  // Salvar também o tipo selecionado
  useEffect(() => {
    localStorage.setItem("checkout_tipo_selecionado", tipoSelecionado);
  }, [tipoSelecionado]);

  // Carregar tipo selecionado do localStorage ao montar o componente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTipo = localStorage.getItem("checkout_tipo_selecionado");
      if (
        savedTipo &&
        (savedTipo === "login" ||
          savedTipo === "cadastro" ||
          savedTipo === "guest")
      ) {
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
      alert("E-mail e senha são obrigatórios para login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: dadosCliente.email,
          senha: dadosCliente.senha,
        }),
      });

      const resultado = await response.json();

      if (resultado.success) {
        // Buscar dados completos do usuário
        const userResponse = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${resultado.token}`,
          },
        });

        const userData = await userResponse.json();

        if (userData.success) {
          const dadosParaEnviar: DadosFormularioCheckout = {
            ...dadosCliente,
            nome: userData.user.nome,
            sobrenome: userData.user.sobrenome || "",
            email: userData.user.email,
            cpf: userData.user.cpf || "",
            telefone: userData.user.telefone || "",
            tipo_cliente: userData.user.tipo_cliente || "fisica",
            // Campos de endereço do usuário
            cep: userData.user.cep || "",
            logradouro: userData.user.endereco || "",
            numero: userData.user.numero || "",
            complemento: userData.user.complemento || "",
            bairro: userData.user.bairro || "",
            cidade: userData.user.cidade || "",
            estado: userData.user.estado || "",
          };

          // Salvar token no localStorage
          localStorage.setItem("auth_token", resultado.token);
          onTipoCadastro("login", dadosParaEnviar);
        } else {
          alert("Erro ao buscar dados do usuário");
        }
      } else {
        alert(resultado.error || "Erro no login");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleContinuar = async () => {
    // Validações básicas
    if (!dadosCliente.email) {
      alert("E-mail é obrigatório");
      return;
    }

    if (tipoSelecionado === "login") {
      await handleLogin();
      return;
    }

    if (tipoSelecionado === "cadastro") {
      if (!dadosCliente.nome || !dadosCliente.senha) {
        alert("Nome e senha são obrigatórios para cadastro");
        return;
      }
    }

    if (tipoSelecionado === "guest") {
      if (!dadosCliente.nome) {
        alert("Nome é obrigatório");
        return;
      }
    }

    const dadosParaEnviar: DadosFormularioCheckout = {
      ...dadosCliente,
      // Para guest, não enviar senha
      ...(tipoSelecionado === "guest" && {
        senha: "",
      }),
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
    return numbers
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$2")
      .slice(0, 18);
  };

  const formatarTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, ""); // Remove tudo que não é número

    // Celular: (99) 99999-9999 (11 dígitos)
    if (numbers.length > 10) {
      return numbers
        .replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
        .slice(0, 15);
    }

    // Fixo: (99) 9999-9999 (10 dígitos)
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3").slice(0, 14);
  };

  const formatarCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  // Debounce para busca de CEP
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dadosCliente.cep && dadosCliente.cep.replace(/\D/g, '').length === 8) {
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
        setDadosCliente(prev => ({
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

  // Função para limpar dados salvos
  const limparDadosSalvos = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("checkout_tipo_selecionado");
    localStorage.removeItem("auth_token");
    setDadosCliente({
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
    });
    setTipoSelecionado("guest");
  };

  const toggleMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };

  // Calcular subtotal se não foi passado
  const subtotalCalculado = subtotal ?? carrinhoItens.reduce(
    (acc, item) => acc + (item.preco_unitario * item.quantidade),
    0
  );

  const temFrete = freteValor && freteValor > 0;
  const freteGratis = freteValor === 0 && (freteInfo?.valor === 0 || !temFrete);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Botão para limpar dados */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={limparDadosSalvos}
          className="text-xs"
        >
          Limpar Dados
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Finalizar Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Resumo do Pedido com frete */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Resumo do Pedido
            </h3>
            
            {/* Itens do carrinho */}
            <div className="space-y-2">
              {carrinhoItens.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.titulo} x {item.quantidade}
                  </span>
                  <span className="font-medium">
                    R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Linha de separação */}
            <div className="border-t my-3"></div>

            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>R$ {subtotalCalculado.toFixed(2)}</span>
            </div>

            {/* Frete - com destaque */}
            {temFrete && !freteGratis && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Frete ({freteInfo?.nome || "Entrega"}):
                </span>
                <span className="font-medium text-blue-600">
                  R$ {freteValor.toFixed(2)}
                </span>
              </div>
            )}

            {/* Prazo de entrega se disponível */}
            {freteInfo?.prazo && temFrete && !freteGratis && (
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Prazo de entrega:</span>
                <span>{freteInfo.prazo}</span>
              </div>
            )}

            {/* Frete Grátis */}
            {freteGratis && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Frete Grátis
                </span>
                <span className="text-green-600 font-medium">R$ 0,00</span>
              </div>
            )}

            {/* Linha de separação para o total */}
            <div className="border-t mt-3 pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Informação adicional sobre o frete */}
            {!freteGratis && temFrete && freteValor && freteValor > 0 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                * O valor do frete será calculado novamente com base no CEP informado
              </p>
            )}
          </div>

          <RadioGroup
            value={tipoSelecionado}
            onValueChange={(value: "login" | "cadastro" | "guest") =>
              setTipoSelecionado(value)
            }
            className="space-y-4"
          >
            {/* Opção Login */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="login" id="login" />
              <div className="flex-1">
                <Label htmlFor="login" className="font-semibold">
                  Já sou cliente
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Faça login para acessar seus pedidos e descontos
                </p>

                {tipoSelecionado === "login" && (
                  <div className="space-y-3 mt-2">
                    <Input
                      type="email"
                      placeholder="Seu e-mail *"
                      value={dadosCliente.email}
                      onChange={(e) =>
                        handleDadosChange("email", e.target.value)
                      }
                      required
                    />
                    <div className="relative">
                      <Input
                        type={mostrarSenha ? "text" : "password"}
                        placeholder="Sua senha *"
                        value={dadosCliente.senha}
                        onChange={(e) =>
                          handleDadosChange("senha", e.target.value)
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={toggleMostrarSenha}
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

            {/* Opção Cadastro */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="cadastro" id="cadastro" />
              <div className="flex-1">
                <Label htmlFor="cadastro" className="font-semibold">
                  Criar minha conta
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Cadastre-se para acompanhar pedidos e receber ofertas
                </p>

                {tipoSelecionado === "cadastro" && (
                  <div className="space-y-3 mt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Nome *"
                        value={dadosCliente.nome}
                        onChange={(e) =>
                          handleDadosChange("nome", e.target.value)
                        }
                        required
                      />
                      <Input
                        placeholder="Sobrenome"
                        value={dadosCliente.sobrenome}
                        onChange={(e) =>
                          handleDadosChange("sobrenome", e.target.value)
                        }
                      />
                    </div>
                    <Input
                      type="email"
                      placeholder="E-mail *"
                      value={dadosCliente.email}
                      onChange={(e) =>
                        handleDadosChange("email", e.target.value)
                      }
                      required
                    />
                    <div className="relative">
                      <Input
                        type={mostrarSenha ? "text" : "password"}
                        placeholder="Criar senha *"
                        value={dadosCliente.senha}
                        onChange={(e) =>
                          handleDadosChange("senha", e.target.value)
                        }
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={toggleMostrarSenha}
                      >
                        {mostrarSenha ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="CPF"
                        value={dadosCliente.cpf}
                        onChange={(e) =>
                          handleDadosChange("cpf", formatarCPF(e.target.value))
                        }
                      />
                      <Input
                        placeholder="Telefone"
                        value={dadosCliente.telefone}
                        onChange={(e) =>
                          handleDadosChange("telefone", formatarTelefone(e.target.value))
                        }
                      />
                    </div>

                    {/* Campos de Endereço para Cadastro */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3">Endereço de Entrega</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <Input
                            placeholder="CEP"
                            value={dadosCliente.cep}
                            onChange={(e) =>
                              handleDadosChange("cep", formatarCEP(e.target.value))
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Logradouro"
                            value={dadosCliente.logradouro}
                            onChange={(e) =>
                              handleDadosChange("logradouro", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <Input
                          placeholder="Número"
                          value={dadosCliente.numero}
                          onChange={(e) =>
                            handleDadosChange("numero", e.target.value)
                          }
                        />
                        <div className="col-span-2">
                          <Input
                            placeholder="Complemento"
                            value={dadosCliente.complemento}
                            onChange={(e) =>
                              handleDadosChange("complemento", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
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
                      <div className="mt-3">
                        <Input
                          placeholder="Estado"
                          value={dadosCliente.estado}
                          onChange={(e) =>
                            handleDadosChange("estado", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Opção Guest */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg">
              <RadioGroupItem value="guest" id="guest" />
              <div className="flex-1">
                <Label htmlFor="guest" className="font-semibold">
                  Continuar sem cadastro
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Apenas informe seus dados para entrega e faturamento
                </p>

                {tipoSelecionado === "guest" && (
                  <div className="space-y-3 mt-2">
                    <Input
                      type="email"
                      placeholder="E-mail para contato *"
                      value={dadosCliente.email}
                      onChange={(e) =>
                        handleDadosChange("email", e.target.value)
                      }
                      required
                    />
                    <Input
                      placeholder="Nome completo *"
                      value={dadosCliente.nome}
                      onChange={(e) =>
                        handleDadosChange("nome", e.target.value)
                      }
                      required
                    />

                    {/* Campos de Endereço para Guest */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-3">Endereço de Entrega</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <Input
                            placeholder="CEP"
                            value={dadosCliente.cep}
                            onChange={(e) =>
                              handleDadosChange("cep", formatarCEP(e.target.value))
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            placeholder="Logradouro"
                            value={dadosCliente.logradouro}
                            onChange={(e) =>
                              handleDadosChange("logradouro", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <Input
                          placeholder="Número"
                          value={dadosCliente.numero}
                          onChange={(e) =>
                            handleDadosChange("numero", e.target.value)
                          }
                        />
                        <div className="col-span-2">
                          <Input
                            placeholder="Complemento"
                            value={dadosCliente.complemento}
                            onChange={(e) =>
                              handleDadosChange("complemento", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-3">
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
                      <div className="mt-3">
                        <Input
                          placeholder="Estado"
                          value={dadosCliente.estado}
                          onChange={(e) =>
                            handleDadosChange("estado", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>

          <Button
            onClick={handleContinuar}
            className="w-full mt-6 bg-green-600 hover:bg-green-700"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              "Continuar para Pagamento"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}