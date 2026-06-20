// src/utils/validateFrete.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
export function validateFreteParaCheckout(frete: any, totalPreco: number) {
  if (!frete) {
    return {
      valid: false,
      error: "Frete não calculado. Por favor, calcule o frete antes de finalizar a compra."
    };
  }

  if (!frete.opcao_selecionada) {
    return {
      valid: false,
      error: "Nenhuma opção de frete selecionada. Por favor, selecione uma opção de entrega."
    };
  }

  // Verificar se precisa pagar frete
  const valorMinimoFreteGratis = frete.valor_minimo_frete_gratis || 500;
  const devePagarFrete = totalPreco < valorMinimoFreteGratis;
  
  if (devePagarFrete && frete.opcao_selecionada.valor === 0) {
    return {
      valid: false,
      error: `Frete grátis disponível apenas para compras acima de R$ ${valorMinimoFreteGratis.toFixed(2)}. Seu carrinho está em R$ ${totalPreco.toFixed(2)}.`
    };
  }

  return { valid: true, valorFrete: devePagarFrete ? frete.opcao_selecionada.valor : 0 };
}