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
 * - Apenas setores ativos (descr LIKE '-%')
 * - Nome exibido sem o hífen inicial
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

  // Executar query
  const query = buildEquipesQuery(filters);
  const result = await executeQuery<Equipe>(query);

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

// Revalidação ISR
export const revalidate = 300; // 5 minutos
