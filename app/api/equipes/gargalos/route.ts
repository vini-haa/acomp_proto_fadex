import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { buildGargalosQuery } from "@/lib/queries/equipes";
import { Gargalo, GargalosResponse } from "@/types/equipes";
import { withErrorHandling } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * GET /api/equipes/gargalos
 *
 * Identifica gargalos nos setores com base em métricas de volume e tempo.
 *
 * Tipos de gargalo:
 * - VOLUME CRÍTICO: >10.000 protocolos
 * - VOLUME ALTO: >3x a média geral
 * - LENTIDÃO: tempo médio de resposta >48h
 * - ESTAGNAÇÃO: >50 protocolos parados há 7+ dias
 *
 * Severidade:
 * - 0: Normal
 * - 1: Moderado
 * - 2: Alto
 * - 3: Crítico
 *
 * IMPORTANTE:
 * - Apenas setores ativos (descr LIKE '-%')
 * - Ordenado por severidade (mais críticos primeiro)
 */
export const GET = withErrorHandling(async () => {
  const startTime = Date.now();

  // Executar query
  const query = buildGargalosQuery();
  const gargalos = await executeQuery<Gargalo>(query);

  const queryTime = Date.now() - startTime;

  // Contar por severidade para logging
  const criticos = gargalos.filter((g) => g.severidade === 3).length;
  const altos = gargalos.filter((g) => g.severidade === 2).length;

  logger.perf(
    `⚡ Gargalos (${gargalos.length} setores, ${criticos} críticos, ${altos} altos): ${queryTime}ms`
  );

  const response: GargalosResponse = {
    data: gargalos,
    success: true,
    total: gargalos.length,
  };

  return NextResponse.json(response);
});

// Revalidação ISR
export const revalidate = 300; // 5 minutos
