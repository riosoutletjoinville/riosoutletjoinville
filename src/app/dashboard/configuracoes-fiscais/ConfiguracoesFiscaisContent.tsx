// src/app/dashboard/configuracoes-fiscais/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Save, AlertCircle, CheckCircle } from "lucide-react";
import FormattedInput from "@/components/ui/FormattedInput";
import { isValidEmail } from "@/lib/formatUtils";
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';

interface ConfigFiscal {
  id: string;
  emitente_cnpj: string;
  emitente_razao_social: string;
  emitente_nome_fantasia: string;
  emitente_ie: string;
  emitente_regime_tributario: string;
  emitente_crt: string;
  emitente_cnae: string;
  emitente_logradouro: string;
  emitente_numero: string;
  emitente_complemento: string;
  emitente_bairro: string;
  emitente_cep: string;
  emitente_cidade: string;
  emitente_estado: string;
  emitente_telefone: string;
  emitente_email: string;
  emitente_codigo_municipio: string;
  ambiente_nfe: string;
  sequencia_nfe: number;
  senha_certificado: string;
  validade_certificado: string;
}

export default function ConfiguracoesFiscaisContents() {
  const router = useRouter();
  const [config, setConfig] = useState<ConfigFiscal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from("configuracoes_fiscais")
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar configurações:", error);
        await Swal.fire({
          icon: 'error',
          title: 'Erro ao carregar',
          text: 'Não foi possível carregar as configurações fiscais.',
          confirmButtonColor: '#3b82f6',
        });
        return;
      }

      if (data) {
        setConfig(data);
      } else {
        // Configuração padrão se não existir
        setConfig({
          id: "",
          emitente_cnpj: "",
          emitente_razao_social: "",
          emitente_nome_fantasia: "",
          emitente_ie: "",
          emitente_regime_tributario: "",
          emitente_crt: "",
          emitente_cnae: "",
          emitente_logradouro: "",
          emitente_numero: "",
          emitente_complemento: "",
          emitente_bairro: "",
          emitente_cep: "",
          emitente_cidade: "",
          emitente_estado: "",
          emitente_telefone: "",
          emitente_email: "",
          emitente_codigo_municipio: "",
          ambiente_nfe: "homologacao",
          sequencia_nfe: 1,
          senha_certificado: "",
          validade_certificado: "",
        });
      }
    } catch (error) {
      console.error("Erro:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Erro inesperado',
        text: 'Ocorreu um erro ao carregar as configurações.',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validar CNPJ (deve ter 14 dígitos)
    if (!config?.emitente_cnpj || config.emitente_cnpj.replace(/\D/g, '').length !== 14) {
      errors.emitente_cnpj = "CNPJ deve ter 14 dígitos";
    }

    // Validar Razão Social
    if (!config?.emitente_razao_social || config.emitente_razao_social.trim() === "") {
      errors.emitente_razao_social = "Razão Social é obrigatória";
    }

    // Validar e-mail
    if (config?.emitente_email && !isValidEmail(config.emitente_email)) {
      errors.emitente_email = "E-mail inválido";
    }

    // Validar CEP (deve ter 8 dígitos)
    if (config?.emitente_cep && config.emitente_cep.replace(/\D/g, '').length !== 8) {
      errors.emitente_cep = "CEP deve ter 8 dígitos";
    }

    // Validar estado (deve ter 2 caracteres)
    if (config?.emitente_estado && config.emitente_estado.length !== 2) {
      errors.emitente_estado = "Estado deve ter 2 caracteres";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const showSuccessMessage = async (isNew: boolean) => {
    const result = await Swal.fire({
      icon: 'success',
      title: 'Configurações salvas!',
      text: isNew 
        ? 'As configurações fiscais foram salvas com sucesso.' 
        : 'As configurações fiscais foram atualizadas com sucesso.',
      showConfirmButton: true,
      confirmButtonText: 'Continuar',
      showDenyButton: true,
      denyButtonText: 'Ir para Dashboard',
      confirmButtonColor: '#3b82f6',
      denyButtonColor: '#10b981',
      timer: 5000,
      timerProgressBar: true,
    });

    if (result.isDenied) {
      router.push('/dashboard');
    }
  };

  const showErrorMessage = async (error: any) => {
    await Swal.fire({
      icon: 'error',
      title: 'Erro ao salvar',
      text: error?.message || 'Ocorreu um erro ao salvar as configurações.',
      confirmButtonColor: '#3b82f6',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage({ type: "error", text: "Por favor, corrija os erros no formulário" });
      
      // Scroll para o primeiro erro
      const firstErrorField = Object.keys(formErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (!config) return;

      // Prepara os dados para salvar
      const configToSave = {
        emitente_cnpj: config.emitente_cnpj.replace(/\D/g, ''),
        emitente_razao_social: config.emitente_razao_social,
        emitente_nome_fantasia: config.emitente_nome_fantasia || null,
        emitente_ie: config.emitente_ie || null,
        emitente_regime_tributario: config.emitente_regime_tributario || null,
        emitente_crt: config.emitente_crt || null,
        emitente_cnae: config.emitente_cnae || null,
        emitente_logradouro: config.emitente_logradouro || null,
        emitente_numero: config.emitente_numero || null,
        emitente_complemento: config.emitente_complemento || null,
        emitente_bairro: config.emitente_bairro || null,
        emitente_cep: config.emitente_cep ? config.emitente_cep.replace(/\D/g, '') : null,
        emitente_cidade: config.emitente_cidade || null,
        emitente_estado: config.emitente_estado || null,
        emitente_telefone: config.emitente_telefone || null,
        emitente_email: config.emitente_email || null,
        emitente_codigo_municipio: config.emitente_codigo_municipio || null,
        ambiente_nfe: config.ambiente_nfe,
        sequencia_nfe: config.sequencia_nfe,
        senha_certificado: config.senha_certificado || null,
        validade_certificado: config.validade_certificado || null,
        updated_at: new Date().toISOString(),
      };

      let result;
      const isNewRecord = !config.id;

      if (config.id) {
        // Update - se já existe um ID
        result = await supabase
          .from("configuracoes_fiscais")
          .update(configToSave)
          .eq("id", config.id);
      } else {
        // Insert - se é um novo registro
        result = await supabase
          .from("configuracoes_fiscais")
          .insert([configToSave]);
      }

      if (result.error) {
        console.error("Erro ao salvar:", result.error);
        await showErrorMessage(result.error);
      } else {
        await showSuccessMessage(isNewRecord);
        
        // Se for um novo registro, recarrega para pegar o ID
        if (isNewRecord) {
          carregarConfiguracoes();
        }
      }
    } catch (error: any) {
      console.error("Erro:", error);
      await showErrorMessage(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setConfig((prev) => (prev ? { ...prev, [field]: value } : null));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    handleChange(name, value);
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Carregando configurações fiscais...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configurações Fiscais</h1>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="text-gray-600 hover:text-gray-800"
        >
          Voltar para Dashboard
        </button>
      </div>

      {message && (
        <div
          className={`p-4 mb-4 rounded-md flex items-start ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "error" ? (
            <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          ) : (
            <CheckCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Campos do formulário (mantidos iguais) */}
          <div>
            <label className="block text-sm font-medium mb-2">CNPJ *</label>
            <FormattedInput
              type="cnpj"
              value={config?.emitente_cnpj || ""}
              onChange={(value) => handleChange("emitente_cnpj", value)}
              placeholder="00.000.000/0000-00"
              className={formErrors.emitente_cnpj ? "border-red-500" : ""}
              required
            />
            {formErrors.emitente_cnpj && (
              <p className="text-red-500 text-xs mt-1">{formErrors.emitente_cnpj}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Razão Social *</label>
            <input
              type="text"
              name="emitente_razao_social"
              value={config?.emitente_razao_social || ""}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md ${
                formErrors.emitente_razao_social ? "border-red-500" : ""
              }`}
              required
            />
            {formErrors.emitente_razao_social && (
              <p className="text-red-500 text-xs mt-1">{formErrors.emitente_razao_social}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nome Fantasia</label>
            <input
              type="text"
              name="emitente_nome_fantasia"
              value={config?.emitente_nome_fantasia || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Inscrição Estadual</label>
            <FormattedInput
              type="ie"
              value={config?.emitente_ie || ""}
              onChange={(value) => handleChange("emitente_ie", value)}
              placeholder="000.000.000.000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Regime Tributário</label>
            <select
              name="emitente_regime_tributario"
              value={config?.emitente_regime_tributario || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione</option>
              <option value="1">Simples Nacional</option>
              <option value="2">Simples Nacional - excesso de sublimite</option>
              <option value="3">Regime Normal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">CRT</label>
            <select
              name="emitente_crt"
              value={config?.emitente_crt || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Selecione</option>
              <option value="1">Simples Nacional</option>
              <option value="2">Simples Nacional - excesso de sublimite</option>
              <option value="3">Regime Normal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Logradouro</label>
            <input
              type="text"
              name="emitente_logradouro"
              value={config?.emitente_logradouro || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Número</label>
            <input
              type="text"
              name="emitente_numero"
              value={config?.emitente_numero || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Complemento</label>
            <input
              type="text"
              name="emitente_complemento"
              value={config?.emitente_complemento || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bairro</label>
            <input
              type="text"
              name="emitente_bairro"
              value={config?.emitente_bairro || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">CEP</label>
            <FormattedInput
              type="cep"
              value={config?.emitente_cep || ""}
              onChange={(value) => handleChange("emitente_cep", value)}
              placeholder="00000-000"
              className={formErrors.emitente_cep ? "border-red-500" : ""}
            />
            {formErrors.emitente_cep && (
              <p className="text-red-500 text-xs mt-1">{formErrors.emitente_cep}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cidade</label>
            <input
              type="text"
              name="emitente_cidade"
              value={config?.emitente_cidade || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Estado</label>
            <input
              type="text"
              name="emitente_estado"
              value={config?.emitente_estado || ""}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded-md uppercase ${
                formErrors.emitente_estado ? "border-red-500" : ""
              }`}
              maxLength={2}
              placeholder="SP"
            />
            {formErrors.emitente_estado && (
              <p className="text-red-500 text-xs mt-1">{formErrors.emitente_estado}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Código Município</label>
            <input
              type="text"
              name="emitente_codigo_municipio"
              value={config?.emitente_codigo_municipio || ""}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Telefone</label>
            <FormattedInput
              type="phone"
              value={config?.emitente_telefone || ""}
              onChange={(value) => handleChange("emitente_telefone", value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <FormattedInput
              type="email"
              value={config?.emitente_email || ""}
              onChange={(value) => handleChange("emitente_email", value)}
              placeholder="email@exemplo.com"
              className={formErrors.emitente_email ? "border-red-500" : ""}
            />
            {formErrors.emitente_email && (
              <p className="text-red-500 text-xs mt-1">{formErrors.emitente_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ambiente NFe</label>
            <select
              name="ambiente_nfe"
              value={config?.ambiente_nfe || "homologacao"}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="homologacao">Homologação</option>
              <option value="producao">Produção</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sequência NFe</label>
            <input
              type="number"
              name="sequencia_nfe"
              value={config?.sequencia_nfe || 1}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              min={1}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving || Object.keys(formErrors).length > 0}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}