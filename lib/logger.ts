/**
 * Sistema de Logging Condicional
 *
 * Centraliza todos os logs da aplicação e controla a saída baseado no ambiente:
 * - Em desenvolvimento (NODE_ENV=development): todos os logs são exibidos
 * - Em produção: apenas erros são exibidos
 * - Logs de performance podem ser habilitados com LOG_PERF=true
 */

const isDev = process.env.NODE_ENV === "development";
const isPerfEnabled = process.env.LOG_PERF === "true";

type LogArgs = unknown[];

/**
 * Logger centralizado da aplicação
 */
export const logger = {
  /**
   * Log informativo - apenas em desenvolvimento
   */
  info: (...args: LogArgs): void => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log de aviso - apenas em desenvolvimento
   */
  warn: (...args: LogArgs): void => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log de erro - SEMPRE exibido (produção e desenvolvimento)
   */
  error: (...args: LogArgs): void => {
    console.error(...args);
  },

  /**
   * Log de performance - em desenvolvimento ou quando LOG_PERF=true
   * Útil para monitorar queries lentas em produção quando necessário
   */
  perf: (...args: LogArgs): void => {
    if (isDev || isPerfEnabled) {
      console.log(...args);
    }
  },

  /**
   * Log de debug - apenas em desenvolvimento
   * Prefixado com [DEBUG] para fácil identificação
   */
  debug: (...args: LogArgs): void => {
    if (isDev) {
      console.log("[DEBUG]", ...args);
    }
  },

  /**
   * Log de sucesso - apenas em desenvolvimento
   * Prefixado com emoji de check
   */
  success: (...args: LogArgs): void => {
    if (isDev) {
      console.log("✅", ...args);
    }
  },
};
