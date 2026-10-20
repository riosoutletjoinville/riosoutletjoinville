// src/components/ui/ConfirmEmitModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, AlertTriangle } from "lucide-react";

interface ConfirmEmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
  configFiscal: any;
  onConfirm: () => void;
  isLoading: boolean;
}

export function ConfirmEmitModal({
  open,
  onOpenChange,
  pedido,
  configFiscal,
  onConfirm,
  isLoading,
}: ConfirmEmitModalProps) {
  if (!pedido) return null;

  function getNomeCliente(cliente: any) {
    if (!cliente) return "Cliente não informado";
    if (cliente.tipo_cliente === "fisica") {
      return cliente.nome || "";
    } else {
      return cliente.razao_social || cliente.nome || "";
    }
  }

  function formatarDocumento(cliente: any) {
    if (!cliente) return "";
    if (cliente.tipo_cliente === "fisica") {
      return cliente.cpf || "";
    } else {
      return cliente.cnpj || cliente.razao_social || "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Confirmar Emissão de NF-e
          </DialogTitle>
          <DialogDescription>
            Verifique os dados do pedido antes de confirmar a emissão da Nota Fiscal Eletrônica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Aviso de ambiente */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Ambiente: {configFiscal?.ambiente_nfe === "homologacao" ? "HOMOLOGAÇÃO" : "PRODUÇÃO"}</p>
                <p className="text-xs mt-1">
                  {configFiscal?.ambiente_nfe === "homologacao" 
                    ? "Esta nota será emitida em ambiente de homologação (testes)." 
                    : "Esta nota será emitida em ambiente de produção (real)."}
                </p>
              </div>
            </div>
          </div>

          {/* Dados do pedido */}
          <div className="border rounded-lg divide-y">
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Pedido</p>
              <p className="font-mono text-sm">#{pedido.id?.substring(0, 8)}...</p>
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Cliente</p>
              <p className="font-medium">{getNomeCliente(pedido.cliente)}</p>
              <p className="text-sm text-muted-foreground">{formatarDocumento(pedido.cliente)}</p>
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Valor Total</p>
              <p className="text-lg font-bold text-primary">
                R$ {pedido.total?.toFixed(2) || "0,00"}
              </p>
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Série da NF-e</p>
              <p className="font-medium">{configFiscal?.serie_nfe || "1"}</p>
            </div>
          </div>

          {/* Observação */}
          <p className="text-xs text-muted-foreground text-center">
            Após a confirmação, a NF-e será enviada à SEFAZ para autorização.
            Este processo pode levar alguns segundos.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Emitindo...
              </>
            ) : (
              "Confirmar Emissão"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}