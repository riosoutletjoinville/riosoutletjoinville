import { useState, useCallback } from 'react';

export const useMascaras = () => {
  const [valores, setValores] = useState({
    cpf: '',
    telefone: '',
    cep: ''
  });

  const aplicarMascaraCPF = useCallback((valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Aplica a máscara: 000.000.000-00
    if (apenasNumeros.length <= 3) {
      return apenasNumeros;
    } else if (apenasNumeros.length <= 6) {
      return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3)}`;
    } else if (apenasNumeros.length <= 9) {
      return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6)}`;
    } else {
      return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6, 9)}-${apenasNumeros.slice(9, 11)}`;
    }
  }, []);

  const aplicarMascaraTelefone = useCallback((valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Aplica a máscara: (00) 00000-0000
    if (apenasNumeros.length <= 2) {
      return `(${apenasNumeros}`;
    } else if (apenasNumeros.length <= 6) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
    } else if (apenasNumeros.length <= 10) {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
    } else {
      return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
    }
  }, []);

  const aplicarMascaraCEP = useCallback((valor: string): string => {
    // Remove tudo que não é número
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Aplica a máscara: 00000-000
    if (apenasNumeros.length <= 5) {
      return apenasNumeros;
    } else {
      return `${apenasNumeros.slice(0, 5)}-${apenasNumeros.slice(5, 8)}`;
    }
  }, []);

  const removerMascara = useCallback((valor: string): string => {
    return valor.replace(/\D/g, '');
  }, []);

  const handleChangeCPF = useCallback((valor: string, onChange: (valor: string) => void) => {
    const comMascara = aplicarMascaraCPF(valor);
    const semMascara = removerMascara(valor);
    
    setValores(prev => ({ ...prev, cpf: comMascara }));
    onChange(semMascara); // Envia sem máscara para o estado
  }, [aplicarMascaraCPF, removerMascara]);

  const handleChangeTelefone = useCallback((valor: string, onChange: (valor: string) => void) => {
    const comMascara = aplicarMascaraTelefone(valor);
    const semMascara = removerMascara(valor);
    
    setValores(prev => ({ ...prev, telefone: comMascara }));
    onChange(semMascara); // Envia sem máscara para o estado
  }, [aplicarMascaraTelefone, removerMascara]);

  const handleChangeCEP = useCallback((valor: string, onChange: (valor: string) => void) => {
    const comMascara = aplicarMascaraCEP(valor);
    const semMascara = removerMascara(valor);
    
    setValores(prev => ({ ...prev, cep: comMascara }));
    onChange(semMascara); // Envia sem máscara para o estado
  }, [aplicarMascaraCEP, removerMascara]);

  return {
    valores,
    handleChangeCPF,
    handleChangeTelefone,
    handleChangeCEP,
    removerMascara
  };
};