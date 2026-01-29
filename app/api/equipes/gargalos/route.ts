import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { buildGargalosQuery } from "@/lib/queries/equipes";
import { Gargalo, GargalosResponse } from "@/types/equipes";
import { withErrorHandling } from "@/lib/errors";
import { logger } from "@/lib/logger";

// Cache em memória para evitar queries lentas repetidas
interface CacheEntry {
  data: Gargalo[];
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

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
 * - Apenas setores ativos (descr LIKE '-%' ou ARQUIVO)
 * - Ordenado por severidade (mais críticos primeiro)
 * - Cache de 5 minutos para performance
 */
export const GET = withErrorHandling(async () => {
  const startTime = Date.now();

  // Verificar cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    const cacheTime = Date.now() - startTime;

    const criticos = cache.data.filter((g) => g.severidade === 3).length;
    const altos = cache.data.filter((g) => g.severidade === 2).length;
    logger.perf(`💾 Gargalos (cache, ${criticos} críticos, ${altos} altos): ${cacheTime}ms`);

    const response: GargalosResponse = {
      data: cache.data,
      success: true,
      total: cache.data.length,
    };

    return NextResponse.json(response);
  }

  // Executar query
  const query = buildGargalosQuery();
  const gargalos = await executeQuery<Gargalo>(query);

  // Atualizar cache
  cache = { data: gargalos, timestamp: Date.now() };

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

// Cache dinâmico
export const dynamic = "force-dynamic";
