// lib/dateUtils.ts

/**
 * Obtém a data atual no fuso horário de Brasília (UTC-3)
 * Retorna uma string ISO com a data ajustada
 */
export const getBrasiliaISOString = (): string => {
  const now = new Date();
  // Subtrai 3 horas para UTC-3 (Brasília)
  const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  return brasiliaTime.toISOString();
};

/**
 * Obtém a data atual no fuso horário de Brasília (UTC-3)
 * Retorna um objeto Date
 */
export const getBrasiliaDate = (): Date => {
  const now = new Date();
  return new Date(now.getTime() - (3 * 60 * 60 * 1000));
};

/**
 * Obtém a data atual no fuso horário de Brasília (UTC-3)
 * Retorna no formato: YYYY-MM-DD HH:MM:SS.mmm+00
 * Útil para queries SQL diretas
 */
export const getBrasiliaTimestamp = (): string => {
  const now = new Date();
  const brasiliaTime = new Date(now.getTime() - (3 * 60 * 60 * 1000));
  // Formato: YYYY-MM-DD HH:MM:SS.mmm+00
  return brasiliaTime.toISOString().replace('T', ' ').replace('Z', '+00');
};

export const formatBrasiliaDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("pt-BR");
};

export const formatBrasiliaTime = (dateString: string): string => {
  // Extrai diretamente HH:MM da string sem converter fuso
  const parts = dateString.match(/(\d{2}):(\d{2})/);
  if (parts) {
    return `${parts[1]}:${parts[2]}`;
  }
  // Fallback
  return new Date(dateString).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};