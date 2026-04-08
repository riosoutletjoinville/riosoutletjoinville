// src/components/dashboard/NFeForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search } from "lucide-react";
import { useNotification } from "@/hooks/useNotifications";
import Swal from "sweetalert2";

interface NFeFormProps {
  configFiscal: any;
  onSuccess: () => void;
}

export function NFeForm({ configFiscal, onSuccess }: NFeFormProps) {
  const router = useRouter();
  const notification = useNotification();
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [emitindo, setEmitindo] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarPedidos();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Sessão atual:', {
        exists: !!session,
        user: session?.user?.email,
        expires: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'
      });
    };
    
    checkSession();
  }, []);

  async function carregarPedidos() {
    setBuscando(true);

    let query = supabase
      .from("pedidos")
      .select(
        `
        id,
        created_at,
        total,
        status,
        cliente:clientes(
          nome, 
          cpf,
          cnpj,
          tipo_cliente,
          razao_social
        ),
        notas_fiscais!left(pedido_id)
      `,
      )
      .is("notas_fiscais.pedido_id", null)
      .order("created_at", { ascending: false })
      .limit(20);

    if (busca) {
      query = query.filter("cliente.nome", "ilike", `%${busca}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao carregar pedidos:", error);
      setErro("Erro ao carregar pedidos: " + error.message);
      notification.showError("Erro", "Erro ao carregar pedidos: " + error.message);
    } else {
      setPedidos(data || []);
    }

    setBuscando(false);
  }

  async function handleEmitir() {
    if (!pedidoSelecionado) {
      notification.showWarning("Atenção", "Selecione um pedido para emitir a NF-e");
      return;
    }

    console.log('🟢 [CLIENT] Iniciando emissão para pedido:', pedidoSelecionado.id);
    
    // Mostrar loading
    const loadingAlert = notification.showLoading('Emitindo NF-e...');
    
    setEmitindo(true);
    setErro("");
    setSucesso("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🟢 [CLIENT] Sessão no cliente:', { 
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at 
      });

      console.log('🟢 [CLIENT] Fazendo fetch para /api/nfe/emitir');
      
      const response = await fetch("/api/nfe/emitir", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_id: pedidoSelecionado.id,
          automatica: false,
        }),
        credentials: 'include'
      });

      console.log('🟢 [CLIENT] Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
      });

      const data = await response.json();
      console.log('🟢 [CLIENT] Dados da resposta:', data);

      // Fechar loading
      await Swal.close();

      if (!response.ok) {
        throw new Error(data.error || "Erro na emissão");
      }

      // Verificar status da nota
      const statusNota = data.data.status;
      const statusFocus = data.focus_response?.status;
      
      if (statusNota === 'autorizada') {
        notification.showSuccess(
          'NF-e Autorizada!', 
          `Nota fiscal ${data.data.numero_nf} foi autorizada com sucesso.`
        );
      } else if (statusNota === 'processando') {
        notification.showInfo(
          'NF-e em Processamento',
          'A nota foi enviada e está sendo processada pela SEFAZ. Você receberá uma notificação quando for autorizada.'
        );
      } else if (statusNota === 'rejeitada') {
        notification.showError(
          'NF-e Rejeitada',
          data.data.motivo_status || 'A nota foi rejeitada pela SEFAZ'
        );
      } else {
        notification.showInfo(
          'NF-e Emitida',
          `Nota fiscal emitida com status: ${statusNota}`
        );
      }

      setSucesso(`NF-e emitida com sucesso! Status: ${data.data.status}`);
      
      // Recarregar lista
      carregarPedidos();
      setPedidoSelecionado(null);

      setTimeout(() => {
        onSuccess();
      }, 3000);
      
    } catch (error) {
      // Fechar loading
      await Swal.close();
      
      console.error('🔴 [CLIENT] Erro na emissão:', error);
      setErro(error instanceof Error ? error.message : "Erro na emissão");
      notification.showError('Erro na Emissão', error instanceof Error ? error.message : "Erro na emissão");
    } finally {
      setEmitindo(false);
    }
  }


  // Função para formatar o documento (CPF/CNPJ)
  function formatarDocumento(cliente: any) {
    if (!cliente) return "";

    if (cliente.tipo_cliente === "fisica") {
      return cliente.cpf || "";
    } else {
      return cliente.cnpj || cliente.razao_social || "";
    }
  }

  // Função para obter o nome do cliente
  function getNomeCliente(cliente: any) {
    if (!cliente) return "Cliente não informado";

    if (cliente.tipo_cliente === "fisica") {
      return cliente.nome || "";
    } else {
      return cliente.razao_social || cliente.nome || "";
    }
  }

  return (
    <div className="space-y-6">
      {erro && (
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
          <Input
            placeholder="Buscar pedido por cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && carregarPedidos()}
          />
          <Button
            variant="outline"
            onClick={carregarPedidos}
            disabled={buscando}
          >
            {buscando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
          {pedidos.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {buscando ? "Buscando..." : "Nenhum pedido pendente encontrado"}
            </div>
          ) : (
            pedidos.map((pedido: any) => (
              <div
                key={pedido.id}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                  pedidoSelecionado?.id === pedido.id ? "bg-muted" : ""
                }`}
                onClick={() => setPedidoSelecionado(pedido)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      Pedido #{pedido.id.substring(0, 8)}...{" "}
                      {/* Mostra os primeiros 8 caracteres do ID */}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getNomeCliente(pedido.cliente)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatarDocumento(pedido.cliente)}
                    </div>
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
            ))
          )}
        </div>
      </div>

      {pedidoSelecionado && (
        <div className="border rounded-lg p-4 bg-muted/30">
          <h3 className="font-medium mb-2">Resumo do Pedido</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Cliente:</span>{" "}
              {getNomeCliente(pedidoSelecionado.cliente)}
            </p>
            <p>
              <span className="text-muted-foreground">Documento:</span>{" "}
              {formatarDocumento(pedidoSelecionado.cliente)}
            </p>
            <p>
              <span className="text-muted-foreground">Valor:</span> R${" "}
              {pedidoSelecionado.total?.toFixed(2) || "0,00"}
            </p>
            <p>
              <span className="text-muted-foreground">Série:</span>{" "}
              {configFiscal.serie_nfe}
            </p>
            <p>
              <span className="text-muted-foreground">Ambiente:</span>{" "}
              {configFiscal.ambiente}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleEmitir}
          disabled={!pedidoSelecionado || emitindo}
          className="flex-1"
        >
          {emitindo ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Emitindo...
            </>
          ) : (
            "Emitir NF-e"
          )}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
