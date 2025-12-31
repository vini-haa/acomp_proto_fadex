/**
 * Funções de formatação centralizadas
 * Utilizadas em componentes de protocolo e gráficos
 */

/**
 * Formata valor numérico para moeda brasileira (BRL)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como moeda (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value));
}

/**
 * Formata número com separadores de milhar brasileiros
 * @param value - Valor numérico a ser formatado
 * @returns String formatada com separadores (ex: "1.234")
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

/**
 * Formata CPF ou CNPJ com pontuação
 * @param value - CPF (11 dígitos) ou CNPJ (14 dígitos)
 * @returns String formatada ou "—" se vazio
 */
export function formatCPFCNPJ(value: string | null): string {
  if (!value) {
    return "—";
  }
  const clean = value.replace(/\D/g, "");
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return value;
}

/**
 * Formata porcentagem
 * @param value - Valor decimal (0.5 = 50%)
 * @param decimals - Casas decimais (padrão: 1)
 * @returns String formatada com % (ex: "50,0%")
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals).replace(".", ",")}%`;
}

/**
 * Formata número de dias
 * @param days - Número de dias
 * @returns String formatada (ex: "15 dias" ou "1 dia")
 */
export function formatDays(days: number): string {
  return `${days} ${days === 1 ? "dia" : "dias"}`;
}
