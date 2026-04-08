// src/components/ui/FormattedInput.tsx
import { useState, useEffect } from 'react';
import { formatCNPJ, formatIE, formatCEP, formatPhone, removeFormatting, isValidEmail } from '@/lib/formatUtils';

interface FormattedInputProps {
  type: 'cnpj' | 'ie' | 'cep' | 'phone' | 'email' | 'text';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function FormattedInput({
  type,
  value,
  onChange,
  placeholder,
  className = '',
  required = false
}: FormattedInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Formatar valor para exibição
    let formatted = value;
    
    switch (type) {
      case 'cnpj':
        formatted = formatCNPJ(value);
        break;
      case 'ie':
        formatted = formatIE(value);
        break;
      case 'cep':
        formatted = formatCEP(value);
        break;
      case 'phone':
        formatted = formatPhone(value);
        break;
      case 'email':
        formatted = value;
        // Validar e-mail em tempo real
        if (value && !isValidEmail(value)) {
          setError('E-mail inválido');
        } else {
          setError('');
        }
        break;
      default:
        formatted = value;
    }
    
    setDisplayValue(formatted);
  }, [value, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    let rawValue = inputValue;

    // Remover formatação para salvar no estado
    if (type !== 'email') {
      rawValue = removeFormatting(inputValue);
    }

    // Limitar tamanho máximo baseado no tipo
    let maxLength = 255;
    switch (type) {
      case 'cnpj':
        maxLength = 14;
        break;
      case 'ie':
        maxLength = 12;
        break;
      case 'cep':
        maxLength = 8;
        break;
      case 'phone':
        maxLength = 11;
        break;
    }

    if (rawValue.length <= maxLength) {
      onChange(rawValue);
    }
  };

  const getInputMode = () => {
    if (type === 'email') return 'email';
    return 'numeric';
  };

  return (
    <div className="w-full">
      <input
        type={type === 'email' ? 'email' : 'text'}
        inputMode={getInputMode()}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        required={required}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}