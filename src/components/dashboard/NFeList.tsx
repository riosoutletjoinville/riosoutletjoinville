// src/components/dashboard/NFeList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NFeStatusBadge } from "./NFeStatusBadge";
import {
  Eye,
  Download,
  XCircle,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NFeListProps {
  nfes: any[];
  onRefresh: () => void;
}

export function NFeList({ nfes, onRefresh }: NFeListProps) {
  const router = useRouter();
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [erroCancelamento, setErroCancelamento] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [nfeSelecionada, setNfeSelecionada] = useState<any>(null);
  const [baixandoXML, setBaixandoXML] = useState<string | null>(null);
  const [baixandoDanfe, setBaixandoDanfe] = useState<string | null>(null);

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    if (!data) return "-";
    return format(new Date(data), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const handleVisualizar = (nfeId: string) => {
    router.push(`/dashboard/nfe/${nfeId}`);
  };

  const handleCancelarClick = (nfe: any) => {
    setNfeSelecionada(nfe);
    setJustificativa("");
    setErroCancelamento("");
    setShowCancelDialog(true);
  };

  const handleConfirmarCancelamento = async () => {
    if (!nfeSelecionada) return;

    if (justificativa.length < 15) {
      setErroCancelamento("Justificativa deve ter no mínimo 15 caracteres");
      return;
    }

    setCancelando(nfeSelecionada.id);
    setErroCancelamento("");

    try {
      const response = await fetch(
        `/api/nfe/emitir?id=${nfeSelecionada.id}&justificativa=${encodeURIComponent(justificativa)}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao cancelar NF-e");
      }

      setShowCancelDialog(false);
      onRefresh();
    } catch (error) {
      setErroCancelamento(
        error instanceof Error ? error.message : "Erro ao cancelar NF-e",
      );
    } finally {
      setCancelando(null);
    }
  };

  const handleDownloadXML = async (nfe: any) => {
  setBaixandoXML(nfe.id);
  try {
    let xmlContent: string;
    
    // Se tiver o XML no banco, usa direto
    if (nfe.xml_nf) {
      xmlContent = nfe.xml_nf;
    } 
    // Se tiver caminho no bucket, busca do storage
    else if (nfe.caminho_xml) {
      const { data } = await supabase.storage
        .from('nfe-xml')
        .download(nfe.caminho_xml);
      
      if (!data) throw new Error('XML não encontrado no storage');
      xmlContent = await data.text();
    }
    // Se não tiver nada, busca da API
    else {
      const response = await fetch(`/api/nfe/${nfe.id}/xml`);
      if (!response.ok) throw new Error('Erro ao baixar XML');
      xmlContent = await response.text();
    }
    
    // Criar e baixar o arquivo
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NF-${nfe.chave_acesso || nfe.numero_nf}.xml`;
    a.click();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Erro ao baixar XML:', error);
    alert('Erro ao baixar XML');
  } finally {
    setBaixandoXML(null);
  }
};

  const handleDownloadDanfe = async (nfe: any) => {
  setBaixandoDanfe(nfe.id);
  try {
    let danfeUrl: string;
    
    // Se tiver URL do DANFE, usa direto
    if (nfe.danfe_url) {
      danfeUrl = nfe.danfe_url;
    } 
    // Se não, busca da API
    else {
      const response = await fetch(`/api/nfe/${nfe.id}/danfe`);
      if (!response.ok) throw new Error('Erro ao baixar DANFE');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANFE-${nfe.chave_acesso || nfe.numero_nf}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      return; // Sai da função pois já baixou
    }
    
    // Se tiver URL, abrir em nova aba
    window.open(danfeUrl, '_blank');
    
  } catch (error) {
    console.error('Erro ao baixar DANFE:', error);
    alert('Erro ao baixar DANFE');
  } finally {
    setBaixandoDanfe(null);
  }
};

  if (nfes.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/10">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma NF-e encontrada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Comece emitindo uma nova nota fiscal
        </p>
        <Button onClick={() => router.push("/dashboard/nfe/emitir")}>
          Emitir NF-e
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Série</TableHead>
              <TableHead>Destinatário</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Emissão</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nfes.map((nfe) => (
              <TableRow key={nfe.id}>
                <TableCell className="font-medium">{nfe.numero}</TableCell>
                <TableCell>{nfe.serie}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{nfe.destinatario_nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {nfe.destinatario_cpf_cnpj}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatarValor(nfe.valor_total)}</TableCell>
                <TableCell>
                  <NFeStatusBadge status={nfe.status} />
                </TableCell>
                <TableCell>
                  {nfe.data_emissao ? formatarData(nfe.data_emissao) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleVisualizar(nfe.id)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {(nfe.caminho_xml || nfe.xml_nf) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadXML(nfe)}
                        disabled={baixandoXML === nfe.id}
                        title="Download XML"
                      >
                        {baixandoXML === nfe.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {nfe.status === "autorizada" && nfe.danfe_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadDanfe(nfe)}
                        disabled={baixandoDanfe === nfe.id}
                        title="Download DANFE"
                      >
                        {baixandoDanfe === nfe.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {nfe.status === "autorizada" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelarClick(nfe)}
                        className="text-destructive hover:text-destructive"
                        title="Cancelar NF-e"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar NF-e</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a NF-e {nfeSelecionada?.numero}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justificativa">
                Justificativa do cancelamento
              </Label>
              <Input
                id="justificativa"
                placeholder="Digite a justificativa (mínimo 15 caracteres)"
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
              />
              {justificativa.length > 0 && justificativa.length < 15 && (
                <p className="text-xs text-destructive">
                  Faltam {15 - justificativa.length} caracteres
                </p>
              )}
            </div>

            {erroCancelamento && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{erroCancelamento}</span>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!cancelando}>
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarCancelamento}
              disabled={
                !justificativa || justificativa.length < 15 || !!cancelando
              }
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
