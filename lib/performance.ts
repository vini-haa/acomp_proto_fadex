/**
 * Utilitários para medição e logging de performance
 */

import { logger } from "@/lib/logger";

export class PerformanceTimer {
  private startTime: number;
  private checkpoints: Map<string, number>;

  constructor() {
    this.startTime = Date.now();
    this.checkpoints = new Map();
  }

  checkpoint(name: string): number {
    const now = Date.now();
    const elapsed = now - this.startTime;
    this.checkpoints.set(name, elapsed);
    return elapsed;
  }

  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  log(operation: string, threshold: number = 1000) {
    const elapsed = this.getElapsed();
    const emoji = elapsed > threshold ? "🐌" : elapsed > threshold / 2 ? "⚡" : "✨";
    logger.perf(`${emoji} ${operation}: ${elapsed}ms`);

    if (this.checkpoints.size > 0) {
      logger.perf("  Checkpoints:");
      this.checkpoints.forEach((time, name) => {
        logger.perf(`    - ${name}: ${time}ms`);
      });
    }

    return elapsed;
  }
}

/**
 * Decorator para medir performance de funções assíncronas
 */
export function measurePerformance(operation: string, threshold: number = 1000) {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const timer = new PerformanceTimer();
      try {
        const result = await originalMethod.apply(this, args);
        timer.log(operation, threshold);
        return result;
      } catch (error) {
        timer.log(`${operation} (ERROR)`, threshold);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper para logar performance de queries SQL
 */
export function logQueryPerformance(queryName: string, startTime: number, rowCount?: number) {
  const elapsed = Date.now() - startTime;
  const emoji = elapsed > 2000 ? "🐌" : elapsed > 1000 ? "⚡" : "✨";
  const rowInfo = rowCount !== undefined ? ` (${rowCount} rows)` : "";
  logger.perf(`${emoji} SQL: ${queryName}${rowInfo}: ${elapsed}ms`);

  // Alerta se query está muito lenta
  if (elapsed > 3000) {
    logger.warn(`⚠️  Query lenta detectada: ${queryName} levou ${elapsed}ms`);
  }
}
