// utils/dateUtils.ts

/**
 * Ajusta uma data para o timezone local (Brasil - UTC-3)
 * Evita o problema de subtrair 1 dia devido ao fuso horário
 */
export const ajustarDataParaTimezone = (data: string | Date): Date => {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  
  // Se a data for inválida, retorna a data atual
  if (isNaN(dataObj.getTime())) {
    return new Date();
  }
  
  // ✅ CORREÇÃO: Usar getUTCFullYear, getUTCMonth, getUTCDate
  // para preservar a data original sem alteração de timezone
  const ano = dataObj.getUTCFullYear();
  const mes = dataObj.getUTCMonth();
  const dia = dataObj.getUTCDate();
  const horas = dataObj.getUTCHours();
  const minutos = dataObj.getUTCMinutes();
  const segundos = dataObj.getUTCSeconds();
  
  // Cria uma nova data usando os componentes UTC
  // Isso preserva a data original (08/08) em vez de subtrair 1 dia
  return new Date(Date.UTC(ano, mes, dia, horas, minutos, segundos));
};

/**
 * Formata uma data para exibição no padrão brasileiro
 * Já com o ajuste de timezone aplicado
 */
export const formatarDataLocal = (data: string | Date): string => {
  const dataAjustada = ajustarDataParaTimezone(data);
  // ✅ Usar UTC para formatar, garantindo que a data correta seja exibida
  return dataAjustada.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formata uma data para o padrão ISO (YYYY-MM-DD) sem perder 1 dia
 */
export const formatarDataParaInput = (data: string | Date): string => {
  const dataAjustada = ajustarDataParaTimezone(data);
  const ano = dataAjustada.getUTCFullYear();
  const mes = String(dataAjustada.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(dataAjustada.getUTCDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

/**
 * Retorna a data atual no formato ISO (YYYY-MM-DD) sem perder 1 dia
 * ✅ CORREÇÃO: Usar UTC para a data atual
 */
export const obterDataAtualFormatada = (): string => {
  const agora = new Date();
  const ano = agora.getUTCFullYear();
  const mes = String(agora.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(agora.getUTCDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};