// components/ui/InputMoeda.tsx
import { useState, useEffect } from "react";

interface InputMoedaProps {
  value: number;
  onChange: (valor: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  max?: number;
}

export function InputMoeda({ value, onChange, placeholder, className = "", disabled = false, max }: InputMoedaProps) {
  const [displayValue, setDisplayValue] = useState("");

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const converterParaNumero = (valorFormatado: string): number => {
    const valorNumerico = valorFormatado.replace(/[^\d,]/g, "").replace(",", ".");
    return parseFloat(valorNumerico) || 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value;
    valor = valor.replace(/\D/g, "");
    
    if (valor) {
      let valorNumerico = parseInt(valor) / 100;
      if (max && valorNumerico > max) {
        valorNumerico = max;
      }
      setDisplayValue(formatarMoeda(valorNumerico));
      onChange(valorNumerico);
    } else {
      setDisplayValue("");
      onChange(0);
    }
  };

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatarMoeda(value));
    }
  }, [value]);

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    />
  );
}