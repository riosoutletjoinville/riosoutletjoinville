// src/components/checkout/CheckoutEndereco.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Check, Edit2, Trash2, Home, Building } from "lucide-react";

export interface EnderecoCliente {
  id: string;
  tipo?: "casa" | "trabalho" | "outro";
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  principal?: boolean;
  identificacao?: string;
}

interface CheckoutEnderecoProps {
  enderecos: EnderecoCliente[];
  enderecoSelecionado: EnderecoCliente | null;
  onSelecionar: (endereco: EnderecoCliente) => void;
  onAdicionar: () => void;
  onEditar?: (endereco: EnderecoCliente) => void;
  onExcluir?: (id: string) => void;
  modoSelecao?: boolean;
}

export function CheckoutEndereco({
  enderecos,
  enderecoSelecionado,
  onSelecionar,
  onAdicionar,
  onEditar,
  onExcluir,
  modoSelecao = true,
}: CheckoutEnderecoProps) {
  const getTipoIcon = (tipo?: string) => {
    switch (tipo) {
      case "casa":
        return <Home className="w-4 h-4" />;
      case "trabalho":
        return <Building className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getTipoLabel = (tipo?: string) => {
    switch (tipo) {
      case "casa":
        return "Casa";
      case "trabalho":
        return "Trabalho";
      default:
        return "Outro";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Endereço de Entrega
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAdicionar}
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <Plus className="w-4 h-4 mr-1" />
          Novo Endereço
        </Button>
      </div>

      <div className="space-y-3">
        {enderecos.map((endereco) => {
          const isSelected = enderecoSelecionado?.id === endereco.id;
          
          return (
            <div
              key={endereco.id}
              className={`border rounded-lg p-4 transition-all ${
                modoSelecao ? "cursor-pointer" : ""
              } ${
                isSelected
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => modoSelecao && onSelecionar(endereco)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      {getTipoIcon(endereco.tipo)}
                      {getTipoLabel(endereco.tipo)}
                    </span>
                    {endereco.principal && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Principal
                      </span>
                    )}
                    {isSelected && modoSelecao && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Selecionado
                      </span>
                    )}
                    {endereco.identificacao && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {endereco.identificacao}
                      </span>
                    )}
                  </div>
                  
                  <p className="font-medium">
                    {endereco.endereco}, {endereco.numero}
                  </p>
                  
                  {endereco.complemento && (
                    <p className="text-sm text-gray-600">{endereco.complemento}</p>
                  )}
                  
                  <p className="text-sm text-gray-600">
                    {endereco.bairro} - {endereco.cidade}/{endereco.estado}
                  </p>
                  
                  <p className="text-sm text-gray-600">CEP: {endereco.cep}</p>
                </div>
                
                {(onEditar || onExcluir) && (
                  <div className="flex items-center gap-1 ml-2">
                    {onEditar && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditar(endereco);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    {onExcluir && !endereco.principal && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExcluir(endereco.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {enderecos.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Nenhum endereço cadastrado</p>
          <Button onClick={onAdicionar} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Endereço
          </Button>
        </div>
      )}
    </div>
  );
}