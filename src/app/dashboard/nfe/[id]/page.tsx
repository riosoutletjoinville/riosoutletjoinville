// src/app/dashboard/nfe/[id]/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNotification } from "@/hooks/useNotifications";
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  XCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Swal from "sweetalert2";

interface NFeDetalhes {
  id: string;
  numero_nf: string;
  serie_nf: string;
  chave_acesso: string;
  status:
    | "pendente"
    | "processando"
    | "autorizada"
    | "cancelada"
    | "rejeitada"
    | "denegada";
  data_emissao: string;
  data_autorizacao?: string;
  data_cancelamento?: string;
  protocolo?: string;
  motivo_status?: string;
  xml_nf?: string;
  danfe_url?: string;
  created_at: string;
  pedido: {
    id: string;
    data_pedido: string;
    total: number;
    status: string;
    cliente: {
      nome: string;
    };
  };
}

export default function NFeDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const notification = useNotification();
  const [nfe, setNfe] = useState<NFeDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [consultando, setConsultando] = useState(false);

  useEffect(() => {
    if (params?.id) {
      carregarNFe();
      
      // Configurar subscription em tempo real para atualizações
      const subscription = supabase
        .channel(`nfe-${params.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notas_fiscais',
            filter: `id=eq.${params.id}`,
          },
          (payload) => {
            console.log('🔄 NF-e atualizada via realtime:', payload.new);
            setNfe(payload.new as NFeDetalhes);
            
            // Mostrar notificação se o status mudou
            if (nfe && nfe.status !== payload.new.status) {
              if (payload.new.status === 'autorizada') {
                notification.showSuccess(
                  'NF-e Autorizada!',
                  `Nota fiscal ${payload.new.numero_nf} foi autorizada pela SEFAZ.`
                );
              } else if (payload.new.status === 'rejeitada') {
                notification.showError(
                  'NF-e Rejeitada',
                  payload.new.motivo_status || 'A nota foi rejeitada pela SEFAZ'
                );
              }
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [params?.id]);

  async function carregarNFe() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("notas_fiscais")
      .select(
        `
        *,
        pedido:pedidos(
          id,
          data_pedido,
          total,
          status,
          cliente:clientes(nome)
        )
      `,
      )
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("Erro ao carregar NF-e:", error);
      setError("NF-e não encontrada");
      notification.showError("Erro", "NF-e não encontrada");
    } else {
      setNfe(data);
    }

    setLoading(false);
  }

  async function handleDownloadXML() {
    if (!nfe?.chave_acesso) return;

    try {
      const response = await fetch(`/api/nfe/${nfe.id}/xml`);
      if (!response.ok) throw new Error("Erro ao baixar XML");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nfe-${nfe.chave_acesso}.xml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notification.showSuccess("Download concluído", "XML baixado com sucesso!");
    } catch (error) {
      console.error("Erro ao baixar XML:", error);
      notification.showError("Erro", "Erro ao baixar o XML");
    }
  }

  async function handleCancelar() {
    if (!justificativa || justificativa.length < 15) {
      notification.showWarning(
        "Justificativa inválida",
        "A justificativa deve ter no mínimo 15 caracteres"
      );
      return;
    }

    const confirmado = await notification.showConfirm(
      "Confirmar cancelamento",
      "Tem certeza que deseja cancelar esta NF-e? Esta ação não pode ser desfeita.",
      "Sim, cancelar"
    );

    if (!confirmado) return;

    setCancelando(true);
    const loadingAlert = notification.showLoading("Cancelando NF-e...");

    try {
      const response = await fetch(
        `/api/nfe/emitir?id=${nfe?.id}&justificativa=${encodeURIComponent(justificativa)}`,
        {
          method: "DELETE",
        }
      );

      await Swal.close();

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao cancelar NF-e");
      }

      notification.showSuccess("NF-e cancelada", "Cancelamento realizado com sucesso!");
      carregarNFe();
      setJustificativa("");
    } catch (error) {
      await Swal.close();
      console.error("Erro ao cancelar:", error);
      notification.showError("Erro", error instanceof Error ? error.message : "Erro ao cancelar NF-e");
    } finally {
      setCancelando(false);
    }
  }

  async function handleConsultar() {
    setConsultando(true);
    const loadingAlert = notification.showLoading("Consultando SEFAZ...");

    try {
      const response = await fetch(`/api/nfe/emitir?id=${nfe?.id}`);
      
      await Swal.close();

      if (!response.ok) throw new Error("Erro na consulta");

      const result = await response.json();
      
      if (result.success) {
        await carregarNFe();
        
        if (nfe?.status !== result.data?.status) {
          notification.showInfo(
            "Status atualizado",
            `NF-e agora está ${result.data?.status}`
          );
        } else {
          notification.showInfo("Consulta realizada", "Nenhuma alteração no status");
        }
      }
    } catch (error) {
      await Swal.close();
      console.error("Erro na consulta:", error);
      notification.showError("Erro", "Erro ao consultar situação da NF-e");
    } finally {
      setConsultando(false);
    }
  }

  function getStatusInfo(status: string) {
    const config: Record<string, { color: string; icon: any; label: string }> =
      {
        autorizada: {
          color: "text-green-600 bg-green-50",
          icon: CheckCircle,
          label: "Autorizada",
        },
        pendente: {
          color: "text-yellow-600 bg-yellow-50",
          icon: Clock,
          label: "Pendente",
        },
        processando: {
          color: "text-blue-600 bg-blue-50",
          icon: RefreshCw,
          label: "Processando",
        },
        cancelada: {
          color: "text-gray-600 bg-gray-50",
          icon: XCircle,
          label: "Cancelada",
        },
        rejeitada: {
          color: "text-red-600 bg-red-50",
          icon: AlertCircle,
          label: "Rejeitada",
        },
        denegada: {
          color: "text-orange-600 bg-orange-50",
          icon: AlertCircle,
          label: "Denegada",
        },
      };
    return config[status] || config.pendente;
  }


  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !nfe) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "NF-e não encontrada"}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => router.push("/dashboard/nfe")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para lista
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(nfe.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/nfe")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">NF-e {nfe.numero_nf}</h1>
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
        >
          <StatusIcon className="w-4 h-4" />
          <span>{statusInfo.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informações principais */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações da NF-e</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Número</p>
                <p className="font-medium">{nfe.numero_nf}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Série</p>
                <p className="font-medium">{nfe.serie_nf}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Emissão</p>
                <p className="font-medium">
                  {format(
                    new Date(nfe.data_emissao || nfe.created_at),
                    "dd/MM/yyyy HH:mm",
                    { locale: ptBR },
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protocolo</p>
                <p className="font-medium">{nfe.protocolo || "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Chave de Acesso</p>
              <p className="font-mono text-sm bg-muted p-2 rounded">
                {nfe.chave_acesso}
              </p>
            </div>

            {nfe.motivo_status && (
              <div>
                <p className="text-sm text-muted-foreground">Motivo</p>
                <p className="text-sm">{nfe.motivo_status}</p>
              </div>
            )}

            {nfe.status === "cancelada" && nfe.data_cancelamento && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Data de Cancelamento
                </p>
                <p className="font-medium">
                  {format(new Date(nfe.data_cancelamento), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nfe.xml_nf && (
              <Button
                className="w-full"
                variant="outline"
                onClick={handleDownloadXML}
              >
                <Download className="w-4 h-4 mr-2" />
                Download XML
              </Button>
            )}

            {nfe.danfe_url && (
              <Button className="w-full" variant="outline" asChild>
                <Link href={nfe.danfe_url} target="_blank">
                  <FileText className="w-4 h-4 mr-2" />
                  Visualizar DANFE
                </Link>
              </Button>
            )}

            {nfe.status === "autorizada" && (
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/dashboard/nfe/${nfe.id}/danfe`} target="_blank">
                  <Printer className="w-4 h-4 mr-2" />
                  Visualizar DANFE
                </Link>
              </Button>
            )}

            <Button
              className="w-full"
              variant="outline"
              onClick={handleConsultar}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Consultar SEFAZ
            </Button>

            {nfe.status === "autorizada" && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Cancelar NF-e</p>
                <textarea
                  className="w-full p-2 text-sm border rounded-md"
                  placeholder="Justificativa (mínimo 15 caracteres)"
                  rows={3}
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                />
                <Button
                  className="w-full mt-2"
                  variant="destructive"
                  onClick={handleCancelar}
                  disabled={cancelando || justificativa.length < 15}
                >
                  {cancelando ? "Cancelando..." : "Cancelar NF-e"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do Pedido */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Pedido Relacionado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pedido</p>
                <p className="font-medium">{nfe.pedido.id.substring(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{nfe.pedido.cliente.nome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data do Pedido</p>
                <p className="font-medium">
                  {format(new Date(nfe.pedido.data_pedido), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(nfe.pedido.total)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
