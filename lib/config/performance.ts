/**
 * Configurações de Performance da Aplicação
 *
 * Centralize todas as configurações relacionadas a performance aqui
 */

export const PERFORMANCE_CONFIG = {
  // Cache settings (em milissegundos)
  cache: {
    kpis: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
    analytics: {
      staleTime: 10 * 60 * 1000, // 10 minutos
      gcTime: 15 * 60 * 1000, // 15 minutos
    },
    protocolos: {
      staleTime: 3 * 60 * 1000, // 3 minutos
      gcTime: 5 * 60 * 1000, // 5 minutos
    },
    historico: {
      staleTime: 30 * 60 * 1000, // 30 minutos (dados históricos)
      gcTime: 60 * 60 * 1000, // 1 hora
    },
  },

  // Database settings
  database: {
    poolMax: 20, // Máximo de conexões
    poolMin: 2, // Mínimo de conexões (sempre abertas)
    connectionTimeout: 30000, // 30s
    requestTimeout: 60000, // 60s
  },

  // Query limits
  limits: {
    maxPageSize: 1000, // Máximo de registros por página
    defaultPageSize: 20, // Padrão
    exportBatchSize: 1000, // Tamanho do batch para exportação
  },

  // Performance thresholds (em milissegundos)
  thresholds: {
    fast: 500, // Query rápida: < 500ms
    acceptable: 1000, // Query aceitável: < 1s
    slow: 2000, // Query lenta: > 2s
    critical: 5000, // Query crítica: > 5s
  },

  // Feature flags
  features: {
    useLightCTE: true, // Usar CTE simplificado para KPIs
    lazyLoadCharts: true, // Carregamento lazy de gráficos
    aggressiveCache: true, // Cache mais agressivo
    performanceLogs: true, // Logs de performance detalhados
    prefetchData: false, // Prefetch de dados (experimental)
  },

  // Revalidation (ISR)
  revalidation: {
    kpis: 300, // 5 minutos
    analytics: 600, // 10 minutos
    protocolos: 180, // 3 minutos
  },
} as const;

/**
 * Helper para verificar se uma query está lenta
 */
export function isQuerySlow(elapsed: number): boolean {
  return elapsed > PERFORMANCE_CONFIG.thresholds.slow;
}

/**
 * Helper para verificar se uma query está crítica
 */
export function isQueryCritical(elapsed: number): boolean {
  return elapsed > PERFORMANCE_CONFIG.thresholds.critical;
}

/**
 * Helper para obter emoji de performance
 */
export function getPerformanceEmoji(elapsed: number): string {
  const { fast, acceptable, slow } = PERFORMANCE_CONFIG.thresholds;

  if (elapsed < fast) {
    return "✨";
  } // Muito rápido
  if (elapsed < acceptable) {
    return "⚡";
  } // Rápido
  if (elapsed < slow) {
    return "🔶";
  } // Aceitável
  return "🐌"; // Lento
}

/**
 * Helper para formatar tempo de query
 */
export function formatQueryTime(elapsed: number): string {
  if (elapsed < 1000) {
    return `${elapsed}ms`;
  }
  return `${(elapsed / 1000).toFixed(2)}s`;
}
