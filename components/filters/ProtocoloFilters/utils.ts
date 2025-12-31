/**
 * Utilitários para o componente ProtocoloFilters
 */

/**
 * Formata o número do protocolo automaticamente no padrão XXXX.XXXXXX.XXXX
 * Exemplo: 2650241125005 → 2650.241125.0058
 */
export function formatProtocoloNumber(value: string): string {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, "");

  // Limita a 14 dígitos (4 + 6 + 4)
  const limited = digits.slice(0, 14);

  // Aplica a máscara
  if (limited.length <= 4) {
    return limited;
  } else if (limited.length <= 10) {
    return `${limited.slice(0, 4)}.${limited.slice(4)}`;
  } else {
    return `${limited.slice(0, 4)}.${limited.slice(4, 10)}.${limited.slice(10)}`;
  }
}

// Mapeamento de número para dia da semana
export const DIAS_SEMANA_LABELS: Record<number, string> = {
  1: "Domingo",
  2: "Segunda-feira",
  3: "Terça-feira",
  4: "Quarta-feira",
  5: "Quinta-feira",
  6: "Sexta-feira",
  7: "Sábado",
};

export const FILTER_OPTIONS_STORAGE_KEY = "protocolos-filter-options";
