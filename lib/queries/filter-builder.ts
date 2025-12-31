/**
 * Utilitário para construção de cláusulas WHERE dinâmicas
 *
 * Centraliza a lógica de filtros para evitar duplicação entre queries
 */

import { ProtocoloFilters } from "@/types";

export interface FilterResult {
  whereClause: string;
  params: Record<string, unknown>;
}

/**
 * Campos permitidos para ordenação (whitelist para prevenir SQL injection)
 */
export const ALLOWED_SORT_FIELDS = [
  "dt_entrada",
  "dtEntrada",
  "numeroDocumento",
  "statusProtocolo",
  "diasNoFinanceiro",
  "dtUltimaMovimentacao",
  "projeto",
  "assunto",
  "faixaTempo",
] as const;

export type AllowedSortField = (typeof ALLOWED_SORT_FIELDS)[number];

/**
 * Valida e retorna campo de ordenação seguro
 */
export function getSafeSortField(field: string | undefined): string {
  if (!field) {
    return "dt_entrada";
  }
  return ALLOWED_SORT_FIELDS.includes(field as AllowedSortField) ? field : "dt_entrada";
}

/**
 * Constrói cláusulas WHERE e parâmetros a partir dos filtros de protocolo
 *
 * @param filters - Filtros de protocolo
 * @returns Objeto com whereClause e params
 *
 * @example
 * const { whereClause, params } = buildProtocoloFilterConditions({
 *   status: 'Em Andamento',
 *   numconv: '123'
 * });
 * // whereClause: 'WHERE vp.status_protocolo = @status AND c.numconv = @numconv'
 * // params: { status: 'Em Andamento', numconv: '123' }
 */
export function buildProtocoloFilterConditions(filters: ProtocoloFilters): FilterResult {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.status) {
    conditions.push("vp.status_protocolo = @status");
    params.status = filters.status;
  }

  if (filters.numeroDocumento) {
    // Busca por prefixo é muito mais eficiente (usa índice)
    // O número do protocolo tem formato fixo: XXXX.XXXXXX.XXXX
    conditions.push("d.numero LIKE @numeroDocumento + '%'");
    params.numeroDocumento = filters.numeroDocumento;
  }

  if (filters.numconv) {
    conditions.push("c.numconv = @numconv");
    params.numconv = filters.numconv;
  }

  if (filters.dataInicio) {
    conditions.push("vp.dt_entrada >= @dataInicio");
    params.dataInicio = filters.dataInicio;
  }

  if (filters.dataFim) {
    conditions.push("vp.dt_entrada <= @dataFim");
    params.dataFim = filters.dataFim;
  }

  if (filters.faixaTempo) {
    conditions.push("vp.faixa_tempo = @faixaTempo");
    params.faixaTempo = filters.faixaTempo;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, params };
}

/**
 * Constrói cláusula ORDER BY segura
 *
 * @param filters - Filtros com sortBy e sortOrder
 * @returns Cláusula ORDER BY formatada
 */
export function buildOrderByClause(filters: ProtocoloFilters): string {
  const sortBy = getSafeSortField(filters.sortBy);
  const sortOrder = filters.sortOrder === "asc" ? "ASC" : "DESC";
  return `ORDER BY ${sortBy} ${sortOrder}`;
}
