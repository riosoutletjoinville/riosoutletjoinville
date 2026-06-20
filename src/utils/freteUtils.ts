// src/utils/freteUtils.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// CEPs de Joinville (prefixos)
const JOINVILLE_CEPS = [
  '89200', '89201', '89202', '89203', '89204', '89205', '89206', 
  '89207', '89208', '89209', '89210', '89211', '89212', '89213',
  '89214', '89215', '89216', '89217', '89218', '89219', '89220',
  '89221', '89222', '89223', '89224', '89225', '89226', '89227',
  '89228', '89229', '89230', '89231', '89232', '89233', '89234',
  '89235', '89236', '89237', '89238', '89239'
];

export const isJoinvilleCEP = (cep: string): boolean => {
  const cepNumeros = cep.replace(/\D/g, '');
  return JOINVILLE_CEPS.some(prefix => cepNumeros.startsWith(prefix));
};

export const aplicarFreteGratisJoinville = (opcoes: any[], cep: string, subtotal: number = 0) => {
  const VALOR_MINIMO_FRETE_GRATIS = 500;
  
  // Frete grátis para Joinville OU compras acima de R$ 500
  const freteGratis = isJoinvilleCEP(cep) || subtotal >= VALOR_MINIMO_FRETE_GRATIS;
  
  if (freteGratis) {
    return opcoes.map(opcao => ({
      ...opcao,
      valor: 0,
      valor_formatado: "Grátis"
    }));
  }
  
  return opcoes;
};