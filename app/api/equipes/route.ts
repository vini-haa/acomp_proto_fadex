import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { buildEquipesQuery } from "@/lib/queries/equipes";
import { Equipe, EquipesFilters, EquipesResponse } from "@/types/equipes";
import { withErrorHandling, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Schema de validação dos filtros
const EquipesFiltersSchema = z.object({
  instituicao: z.enum(["UFPI", "IFPI"]).nullable().optional(),
  periodo: z.enum(["7d", "30d", "90d"]).default("30d"),
});

// Cache em memória para evitar queries lentas repetidas
interface CacheEntry {
  data: Equipe[];
  timestamp: number;
}

const cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * GET /api/equipes
 *
 * Lista todos os setores/equipes ativos com métricas de performance.
 *
 * Query params:
 * - instituicao: 'UFPI' | 'IFPI' (opcional)
 * - periodo: '7d' | '30d' | '90d' (padrão: 30d)
 *
 * IMPORTANTE:
 * - Apenas setores ativos (descr LIKE '-%' ou ARQUIVO)
 * - Nome exibido sem o hífen inicial
 * - Cache de 5 minutos para performance
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();

  // Obter e validar parâmetros
  const searchParams = request.nextUrl.searchParams;
  const rawParams = {
    instituicao: searchParams.get("instituicao") || undefined,
    periodo: searchParams.get("periodo") || undefined,
  };

  const parseResult = EquipesFiltersSchema.safeParse(rawParams);

  if (!parseResult.success) {
    throw new ValidationError("Parâmetros inválidos", parseResult.error.issues);
  }

  const filters: EquipesFilters = parseResult.data;
  const cacheKey = `equipes_${filters.periodo}`;

  // Verificar cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const cacheTime = Date.now() - startTime;
    logger.perf(`💾 Equipes (cache): ${cacheTime}ms`);

    const response: EquipesResponse = {
      data: cached.data,
      success: true,
      total: cached.data.length,
      filters,
    };

    return NextResponse.json(response);
  }

  // Executar query
  const query = buildEquipesQuery(filters);
  const result = await executeQuery<Equipe>(query);

  // Atualizar cache
  cache.set(cacheKey, { data: result, timestamp: Date.now() });

  const queryTime = Date.now() - startTime;
  logger.perf(`⚡ Equipes (${result.length} setores): ${queryTime}ms`);

  const response: EquipesResponse = {
    data: result,
    success: true,
    total: result.length,
    filters,
  };

  return NextResponse.json(response);
});

// Cache dinâmico
export const dynamic = "force-dynamic";
