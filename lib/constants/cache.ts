/**
 * Constantes de Cache para React Query
 *
 * Centraliza os tempos de cache para garantir consistência em toda a aplicação.
 *
 * Estratégia de cache:
 * - staleTime: Tempo que os dados são considerados "frescos" (não refaz fetch)
 * - gcTime: Tempo que os dados permanecem em cache após ficarem "stale"
 *
 * Categorias:
 * - REAL_TIME: Dados que mudam frequentemente (KPIs, contadores)
 * - STANDARD: Dados de lista e filtros (protocolos, timelines)
 * - ANALYTICS: Dados de análise (gráficos, séries temporais)
 * - HISTORICAL: Dados históricos que raramente mudam (heatmap, comparativos)
 */

// Tempos em milissegundos
const MINUTO = 60 * 1000;

/**
 * Cache para dados em tempo real
 * - KPIs, contadores principais
 * - Atualizam frequentemente
 */
export const CACHE_REAL_TIME = {
  staleTime: 5 * MINUTO, // 5 minutos
  gcTime: 10 * MINUTO, // 10 minutos
  refetchInterval: 5 * MINUTO, // Auto-refresh a cada 5 minutos (quando habilitado)
} as const;

/**
 * Cache para dados de lista
 * - Lista de protocolos, timelines
 * - Atualizam com frequência média
 */
export const CACHE_STANDARD = {
  staleTime: 2 * MINUTO, // 2 minutos
  gcTime: 5 * MINUTO, // 5 minutos
} as const;

/**
 * Cache para dados de analytics
 * - Gráficos, séries temporais, distribuições
 * - Atualizam com menos frequência
 */
export const CACHE_ANALYTICS = {
  staleTime: 10 * MINUTO, // 10 minutos
  gcTime: 20 * MINUTO, // 20 minutos
} as const;

/**
 * Cache para dados históricos
 * - Heatmap, comparativos anuais
 * - Raramente mudam
 */
export const CACHE_HISTORICAL = {
  staleTime: 30 * MINUTO, // 30 minutos
  gcTime: 60 * MINUTO, // 60 minutos
} as const;

/**
 * Opções padrão para React Query
 * Desabilita refetch automático em foco e mount
 */
export const DEFAULT_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  retry: 2,
} as const;

/**
 * Tabela de referência de cache por tipo de dado
 *
 * | Tipo               | staleTime | gcTime | Categoria    |
 * |--------------------|-----------|--------|--------------|
 * | KPIs               | 5 min     | 10 min | REAL_TIME    |
 * | Lista Protocolos   | 2 min     | 5 min  | STANDARD     |
 * | Detalhe Protocolo  | 5 min     | 10 min | REAL_TIME    |
 * | Timeline           | 2 min     | 5 min  | STANDARD     |
 * | Série Temporal     | 10 min    | 20 min | ANALYTICS    |
 * | Distribuição       | 10 min    | 20 min | ANALYTICS    |
 * | Por Assunto        | 10 min    | 20 min | ANALYTICS    |
 * | Por Projeto        | 10 min    | 20 min | ANALYTICS    |
 * | Fluxo Setores      | 10 min    | 20 min | ANALYTICS    |
 * | Heatmap            | 30 min    | 60 min | HISTORICAL   |
 * | Comparativo        | 30 min    | 60 min | HISTORICAL   |
 */
