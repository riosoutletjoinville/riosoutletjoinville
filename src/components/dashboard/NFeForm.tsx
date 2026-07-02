// src/components/dashboard/NFeForm.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, FileCheck, User, Building2, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useNotification } from "@/hooks/useNotifications";
import Swal from "sweetalert2";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface NFeFormProps {
  configFiscal: any;
  onSuccess: () => void;
}

type TipoBusca = "nome" | "documento";

const ITEMS_PER_PAGE = 8;

function formatarCPF(cpf: string): string {
  if (!cpf) return "";
  const numeros = cpf.replace(/\D/g, "");
  if (numeros.length !== 11) return cpf;
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarCNPJ(cnpj: string): string {
  if (!cnpj) return "";
  const numeros = cnpj.replace(/\D/g, "");
  if (numeros.length !== 14) return cnpj;
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function limparDocumento(doc: string): string {
  return doc.replace(/\D/g, "");
}

export function NFeForm({ configFiscal, onSuccess }: NFeFormProps) {
  const notification = useNotification();
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [emitindo, setEmitindo] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [tipoBusca, setTipoBusca] = useState<TipoBusca>("nome");
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalItens, setTotalItens] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function carregarPedidos() {
    setBuscando(true);

    try {
      // Primeiro, contar total de registros para paginação
      let countQuery = supabase
        .from("pedidos")
        .select("*", { count: 'exact', head: true })
        .eq("status", "confirmado"); // Apenas pedidos confirmados

      if (busca) {
        if (tipoBusca === "nome") {
          const { data: clientesIds } = await supabase
            .from("clientes")
            .select("id")
            .ilike("nome", `%${busca}%`);
          
          if (clientesIds && clientesIds.length > 0) {
            countQuery = countQuery.in("cliente_id", clientesIds.map(c => c.id));
          } else {
            countQuery = countQuery.eq("cliente_id", "00000000-0000-0000-0000-000000000000");
          }
        } else {
          const docLimpo = limparDocumento(busca);
          const { data: clientesIds } = await supabase
            .from("clientes")
            .select("id")
            .or(`cpf.ilike.%${docLimpo}%,cnpj.ilike.%${docLimpo}%`);
          
          if (clientesIds && clientesIds.length > 0) {
            countQuery = countQuery.in("cliente_id", clientesIds.map(c => c.id));
          } else {
            countQuery = countQuery.eq("cliente_id", "00000000-0000-0000-0000-000000000000");
          }
        }
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      setTotalItens(count || 0);
      setTotalPaginas(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      // Buscar dados paginados
      const offset = (paginaAtual - 1) * ITEMS_PER_PAGE;
      
      let query = supabase
        .from("pedidos")
        .select(
          `
          id,
          created_at,
          total,
          status,
          cliente:clientes(
            id,
            nome, 
            cpf,
            cnpj,
            tipo_cliente,
            razao_social,
            sobrenome
          ),
          notas_fiscais!left(pedido_id) (
            id,
            status,
            numero_nf
          )
        `,
        )
        .eq("status", "confirmado")
        .order("created_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (busca) {
        if (tipoBusca === "nome") {
          const { data: clientesIds } = await supabase
            .from("clientes")
            .select("id")
            .ilike("nome", `%${busca}%`);
          
          if (clientesIds && clientesIds.length > 0) {
            query = query.in("cliente_id", clientesIds.map(c => c.id));
          } else {
            query = query.eq("cliente_id", "00000000-0000-0000-0000-000000000000");
          }
        } else {
          const docLimpo = limparDocumento(busca);
          const { data: clientesIds } = await supabase
            .from("clientes")
            .select("id")
            .or(`cpf.ilike.%${docLimpo}%,cnpj.ilike.%${docLimpo}%`);
          
          if (clientesIds && clientesIds.length > 0) {
            query = query.in("cliente_id", clientesIds.map(c => c.id));
          } else {
            query = query.eq("cliente_id", "00000000-0000-0000-0000-000000000000");
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setPedidos(data || []);
      
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setErro("Erro ao carregar pedidos: " + (error instanceof Error ? error.message : "Erro desconhecido"));
      notification.showError("Erro", "Erro ao carregar pedidos: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    } finally {
      setBuscando(false);
    }
  }

  // Resetar página quando busca ou tipoBusca mudar
  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, tipoBusca]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      carregarPedidos();
    }, 800); // Reduzido para 800ms para melhor UX

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [busca, tipoBusca, paginaAtual]);

  function possuiNotaFiscal(pedido: any) {
  if (!pedido.notas_fiscais || pedido.notas_fiscais.length === 0) {
    return false;
  }
  
  // Verifica se existe alguma nota que NÃO está cancelada
  return pedido.notas_fiscais.some((nota: any) => nota.status !== "cancelada");
}

  function getStatusNota(pedido: any) {
    if (!possuiNotaFiscal(pedido)) return null;
    return pedido.notas_fiscais[0]?.status;
  }

  function abrirModal(pedido: any) {
    if (possuiNotaFiscal(pedido)) {
      notification.showWarning("Atenção", "Este pedido já possui uma nota fiscal emitida");
      return;
    }
    setPedidoSelecionado(pedido);
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setPedidoSelecionado(null);
    setErro("");
  }

  const handleManualSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    setPaginaAtual(1);
    carregarPedidos();
  };

  const handleTipoBuscaChange = (novoTipo: TipoBusca) => {
    setTipoBusca(novoTipo);
    setBusca("");
    setPedidos([]);
    setShowDropdown(false);
    setPaginaAtual(1);
  };

  const handleBuscaChange = (value: string) => {
    if (tipoBusca === "documento") {
      const numeros = value.replace(/\D/g, "");
      if (numeros.length <= 11) {
        let formatado = numeros;
        if (numeros.length > 3) formatado = `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
        if (numeros.length > 6) formatado = `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
        if (numeros.length > 9) formatado = `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`;
        setBusca(formatado);
      } else {
        let formatado = numeros;
        if (numeros.length > 2) formatado = `${numeros.slice(0, 2)}.${numeros.slice(2)}`;
        if (numeros.length > 5) formatado = `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5)}`;
        if (numeros.length > 8) formatado = `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8)}`;
        if (numeros.length > 12) formatado = `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12, 14)}`;
        setBusca(formatado.slice(0, 18));
      }
    } else {
      setBusca(value);
    }
  };

  const handlePaginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
    }
  };

  const handleProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
    }
  };

  async function handleEmitir() {
    if (!pedidoSelecionado) {
      notification.showWarning("Atenção", "Selecione um pedido para emitir a NF-e");
      return;
    }

    notification.showLoading('Emitindo NF-e...');
    setEmitindo(true);
    setErro("");

    try {
      const response = await fetch("/api/nfe/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: pedidoSelecionado.id,
          automatica: false,
        }),
        credentials: 'include'
      });

      const data = await response.json();
      await Swal.close();

      if (!response.ok) {
        throw new Error(data.error || "Erro na emissão");
      }

      const statusNota = data.data.status;
      
      if (statusNota === 'autorizada') {
        notification.showSuccess('NF-e Autorizada!', `Nota fiscal ${data.data.numero_nf} foi autorizada com sucesso.`);
      } else if (statusNota === 'processando') {
        notification.showInfo('NF-e em Processamento', 'A nota foi enviada e está sendo processada pela SEFAZ.');
      } else if (statusNota === 'rejeitada') {
        notification.showError('NF-e Rejeitada', data.data.motivo_status || 'A nota foi rejeitada pela SEFAZ');
      } else {
        notification.showInfo('NF-e Emitida', `Nota fiscal emitida com status: ${statusNota}`);
      }

      setSucesso(`NF-e emitida com sucesso! Status: ${data.data.status}`);
      fecharModal();
      carregarPedidos();

      setTimeout(() => {
        onSuccess();
      }, 3000);
      
    } catch (error) {
      await Swal.close();
      console.error(error);
      setErro(error instanceof Error ? error.message : "Erro na emissão");
      notification.showError('Erro na Emissão', error instanceof Error ? error.message : "Erro na emissão");
    } finally {
      setEmitindo(false);
    }
  }

  function formatarDocumento(cliente: any) {
    if (!cliente) return "";
    if (cliente.tipo_cliente === "fisica") {
      return formatarCPF(cliente.cpf);
    } else {
      return formatarCNPJ(cliente.cnpj);
    }
  }

  function getNomeCliente(cliente: any) {
    if (!cliente) return "Cliente não informado";
    if (cliente.tipo_cliente === "fisica") {
      const nomeCompleto = [cliente.nome, cliente.sobrenome].filter(Boolean).join(" ");
      return nomeCompleto || "Cliente não informado";
    } else {
      return cliente.razao_social || cliente.nome || "Cliente não informado";
    }
  }

  function getTipoClienteIcon(cliente: any) {
    if (!cliente) return <User className="h-3 w-3" />;
    return cliente.tipo_cliente === "fisica" ? <User className="h-3 w-3" /> : <Building2 className="h-3 w-3" />;
  }

  // Gerar array de páginas para exibição
  const getPaginasMostrar = () => {
    const paginas = [];
    const maxPaginasMostrar = 5;
    
    if (totalPaginas <= maxPaginasMostrar) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      if (paginaAtual <= 3) {
        for (let i = 1; i <= maxPaginasMostrar; i++) {
          paginas.push(i);
        }
      } else if (paginaAtual >= totalPaginas - 2) {
        for (let i = totalPaginas - maxPaginasMostrar + 1; i <= totalPaginas; i++) {
          paginas.push(i);
        }
      } else {
        for (let i = paginaAtual - 2; i <= paginaAtual + 2; i++) {
          paginas.push(i);
        }
      }
    }
    
    return paginas;
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {erro && !modalAberto && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {sucesso && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>{sucesso}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 flex gap-2 relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-[130px] h-10 px-3 rounded-md border border-input bg-background text-sm flex items-center justify-between hover:bg-accent transition-colors"
              >
                <span className="flex items-center gap-2">
                  {tipoBusca === "nome" ? (
                    <><User className="h-4 w-4" /><span>Nome</span></>
                  ) : (
                    <><CreditCard className="h-4 w-4" /><span>CPF/CNPJ</span></>
                  )}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showDropdown ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute top-full left-0 mt-1 w-[130px] bg-popover rounded-md border shadow-md z-50">
                  <button onClick={() => handleTipoBuscaChange("nome")} className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent rounded-t-md">
                    <User className="h-4 w-4" /><span>Nome</span>
                  </button>
                  <button onClick={() => handleTipoBuscaChange("documento")} className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent rounded-b-md">
                    <CreditCard className="h-4 w-4" /><span>CPF/CNPJ</span>
                  </button>
                </div>
              )}

              <Input
                placeholder={tipoBusca === "nome" ? "Digite o nome ou razão social..." : "Digite o CPF ou CNPJ..."}
                value={busca}
                onChange={(e) => handleBuscaChange(e.target.value)}
                className="flex-1"
              />
            </div>
            <Button variant="outline" onClick={handleManualSearch} disabled={buscando}>
              {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Lista de pedidos com altura fixa e sem scroll */}
          <div className="border rounded-lg divide-y min-h-[400px]">
            {buscando && pedidos.length === 0 ? (
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pedidos.length === 0 ? (
              <div className="flex justify-center items-center h-[400px] text-muted-foreground">
                {busca ? "Nenhum pedido encontrado para esta busca" : "Nenhum pedido confirmado disponível"}
              </div>
            ) : (
              <>
                <div className="divide-y">
                  {pedidos.map((pedido: any) => {
                    const temNota = possuiNotaFiscal(pedido);
                    const statusNota = getStatusNota(pedido);
                    const documento = formatarDocumento(pedido.cliente);
                    const nomeCliente = getNomeCliente(pedido.cliente);
                    
                    return (
                      <Tooltip key={pedido.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${temNota ? "opacity-75 cursor-not-allowed" : ""}`}
                            onClick={() => !temNota && abrirModal(pedido)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium flex items-center gap-2">
                                  Pedido #{pedido.id.substring(0, 8)}...
                                  {temNota && <FileCheck className="h-4 w-4 text-green-500" />}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  {getTipoClienteIcon(pedido.cliente)}
                                  <span>{nomeCliente}</span>
                                </div>
                                {documento && (
                                  <div className="text-xs text-muted-foreground font-mono">
                                    {documento}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  R$ {pedido.total?.toFixed(2) || "0,00"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(pedido.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TooltipTrigger>
                        {temNota && (
                          <TooltipContent side="right" className="bg-amber-50 border-amber-200">
                            <div className="flex items-center gap-2">
                              <FileCheck className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-lime-800">
                                Este pedido já possui nota fiscal
                                {statusNota && ` (${statusNota})`}
                              </span>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {((paginaAtual - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(paginaAtual * ITEMS_PER_PAGE, totalItens)} de {totalItens} pedidos
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handlePaginaAnterior} 
                        disabled={paginaAtual === 1 || buscando}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {getPaginasMostrar().map((pagina) => (
                          <Button
                            key={pagina}
                            variant={paginaAtual === pagina ? 'default' : 'outline'}
                            size="sm"
                            className="w-8 h-8"
                            onClick={() => setPaginaAtual(pagina)}
                            disabled={buscando}
                          >
                            {pagina}
                          </Button>
                        ))}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleProximaPagina} 
                        disabled={paginaAtual === totalPaginas || buscando}
                      >
                        Próxima
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={modalAberto} onOpenChange={fecharModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir NF-e</DialogTitle>
            <DialogDescription>
              Confirme os dados do pedido e emita a Nota Fiscal Eletrônica
            </DialogDescription>
          </DialogHeader>

          {erro && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-medium mb-3">Resumo do Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{pedidoSelecionado && getNomeCliente(pedidoSelecionado.cliente)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Documento:</span>
                  <span className="font-mono text-xs">{pedidoSelecionado && formatarDocumento(pedidoSelecionado.cliente)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Total:</span>
                  <span className="font-medium text-green-600">
                    R$ {pedidoSelecionado?.total?.toFixed(2) || "0,00"}
                  </span>
                </div>
                <div className="border-t my-2"></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Série:</span>
                  <span>{configFiscal?.serie_nfe || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ambiente:</span>
                  <span className="capitalize">{configFiscal?.ambiente_nfe || "homologacao"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Emissão:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                ⚠️ A emissão da NF-e será processada pela SEFAZ. Verifique os dados antes de confirmar.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={fecharModal} disabled={emitindo}>
              Cancelar
            </Button>
            <Button onClick={handleEmitir} disabled={emitindo || !pedidoSelecionado} className="min-w-[120px]">
              {emitindo ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Emitindo...</> : "Confirmar Emissão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
