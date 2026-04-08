// utils/formatPhone.ts
export const formatPhone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara baseada no tamanho
  if (numbers.length <= 10) {
    // Formato: (11) 9999-9999
    return numbers
      .replace(/(\d{2})?(\d{4})?(\d{4})?/, (_, d1, d2, d3) => {
        if (d3) return `(${d1}) ${d2}-${d3}`;
        if (d2) return `(${d1}) ${d2}`;
        if (d1) return `(${d1}`;
        return '';
      });
  } else {
    // Formato: (11) 99999-9999 (celular com 9)
    return numbers
      .replace(/(\d{2})?(\d{5})?(\d{4})?/, (_, d1, d2, d3) => {
        if (d3) return `(${d1}) ${d2}-${d3}`;
        if (d2) return `(${d1}) ${d2}`;
        if (d1) return `(${d1}`;
        return '';
      });
  }
};

// Função para remover a formatação
export const unformatPhone = (value: string): string => {
  return value.replace(/\D/g, '');
};