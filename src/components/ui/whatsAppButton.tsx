// src/components/ui/WhatsAppButton.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, User, HelpCircle } from "lucide-react";
import Image from "next/image";

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export default function WhatsAppButton({ 
  phoneNumber = "554788318265", 
  defaultMessage = "Olá! Gostaria de mais informações sobre os produtos." 
}: WhatsAppButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [isClient, setIsClient] = useState<boolean | null>(null);
  const [contactReason, setContactReason] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Verificar se é cliente
  const steps = [
    {
      question: "Você já é cliente?",
      options: [
        { label: "Sim, sou cliente", value: "cliente" },
        { label: "Ainda não sou cliente", value: "nao-cliente" }
      ]
    },
    {
      question: "Qual o motivo do contato?",
      options: [
        { label: "Dúvida sobre produto", value: "duvida-produto" },
        { label: "Status do pedido", value: "status-pedido" },
        { label: "Trocas e devoluções", value: "trocas-devolucoes" },
        { label: "Financeiro/Pagamento", value: "financeiro" },
        { label: "Outro", value: "outro" }
      ]
    },
    {
      question: "Escreva sua mensagem:",
      input: true
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        resetForm();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const resetForm = () => {
    setStep(0);
    setIsClient(null);
    setContactReason("");
    setCustomMessage("");
  };

  const handleOptionSelect = (value: string) => {
    if (step === 0) {
      setIsClient(value === "cliente");
      setStep(1);
    } else if (step === 1) {
      setContactReason(value);
      setStep(2);
    }
  };

  const generateMessage = () => {
    let message = "Olá! ";
    
    if (isClient) {
      message += "Sou cliente e ";
    } else {
      message += "Ainda não sou cliente e ";
    }

    // Adicionar motivo do contato
    const reasonText = {
      "duvida-produto": "tenho dúvidas sobre um produto",
      "status-pedido": "gostaria de saber sobre o status do meu pedido",
      "trocas-devolucoes": "preciso de ajuda com trocas ou devoluções",
      "financeiro": "tenho dúvidas sobre pagamento",
      "outro": "gostaria de conversar"
    }[contactReason] || "gostaria de conversar";

    message += reasonText;

    // Adicionar mensagem personalizada se fornecida
    if (customMessage.trim()) {
      message += `. ${customMessage}`;
    }

    return encodeURIComponent(message);
  };

  const handleSendMessage = () => {
    const finalMessage = customMessage.trim() ? generateMessage() : encodeURIComponent(defaultMessage);
    const url = `https://wa.me/${phoneNumber}?text=${finalMessage}`;
    window.open(url, "_blank");
    setIsOpen(false);
    resetForm();
  };

  const getStepIcon = () => {
    if (step === 0) return <User className="w-5 h-5" />;
    if (step === 1) return <HelpCircle className="w-5 h-5" />;
    return <MessageCircle className="w-5 h-5" />;
  };

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group"
        aria-label="Conversar no WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-xs font-bold">!</span>
        </div>
        
        {/* Efeito de pulsação */}
        <div className="absolute inset-0 border-2 border-green-400 rounded-full animate-ping opacity-75"></div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100"
          >
            {/* Header */}
            <div className="bg-green-500 text-white rounded-t-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-12 flex-shrink-0">
                    <Image
                      src="/logomarca.jpg"
                      alt="Rios Outlet - Loja de calçados em Joinville"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">Atendimento Rios Outlet</h3>
                    <p className="text-green-100 text-sm">Estamos aqui para ajudar!</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="text-white hover:text-green-200 transition-colors flex-shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {step + 1}/{steps.length}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Step Indicator */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                  {getStepIcon()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {steps[step].question}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {step === 0 && "Para melhor atendê-lo"}
                    {step === 1 && "Selecione uma opção"}
                    {step === 2 && "Descreva em detalhes"}
                  </p>
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-4">
                {step === 2 && steps[step].input ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Descreva sua dúvida ou solicitação..."
                        className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-500 text-sm"
                        maxLength={500}
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {customMessage.length}/500
                      </div>
                    </div>
                    
                    {/* Preview da mensagem estilo WhatsApp */}
                    {customMessage.trim() && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 font-medium">
                          Preview da mensagem:
                        </p>
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">VO</span>
                            </div>
                            <div className="flex-1">
                              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-200">
                                <p className="text-gray-800 text-sm leading-relaxed">
                                  {decodeURIComponent(generateMessage())}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 mt-1 px-1">
                                <span className="text-xs text-gray-500">10:30</span>
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M18 10v-4c0-3.313-2.688-6-6-6s-6 2.687-6 6v4h-3v14h18v-14h-3zm-10 0v-4c0-2.206 1.794-4 4-4s4 1.794 4 4v4h-8z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {steps[step].options?.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleOptionSelect(option.value)}
                        className="p-4 text-left border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                      >
                        <span className="font-medium text-gray-800 group-hover:text-green-700">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-8">
                {step > 0 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Voltar
                  </button>
                )}
                {step === 2 ? (
                  <button
                    onClick={handleSendMessage}
                    disabled={!customMessage.trim()}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Mensagem</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (step === 0 && isClient === null) return;
                      if (step === 1 && !contactReason) return;
                      setStep(step + 1);
                    }}
                    disabled={
                      (step === 0 && isClient === null) ||
                      (step === 1 && !contactReason)
                    }
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Continuar
                  </button>
                )}
              </div>

              {/* Skip */}
              {step === 0 && (
                <button
                  onClick={handleSendMessage}
                  className="w-full mt-4 text-center text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  Já sei o que preciso, enviar mensagem direta
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Atendimento rápido • Seg-Sex: 8h-18h</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}