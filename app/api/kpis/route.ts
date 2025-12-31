import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { buildKPIsQueryOptimized, buildKPIsMacroQuery } from "@/lib/queries/kpis-optimized";
import { KPIs } from "@/types";
import { withErrorHandling, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { TODOS_SETORES } from "@/lib/constants/setores";
import { KPIsFiltersSchema } from "@/lib/validation/protocolo";

/**
 * GET /api/kpis?periodo=mes_atual|30d|90d|6m|1y|ytd|all&setor=48
 * Retorna os KPIs principais do dashboard com filtro de período e setor
 *
 * OTIMIZADO: Usa query simplificada para melhor performance
 *
 * Query params:
 * - periodo: 'mes_atual' (padrão), '30d', '90d', '6m', '1y', 'ytd', 'all'
 * - setor: código do setor (padrão: 48 - Financeiro)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();

  // Obter e validar parâmetros da URL com Zod
  const searchParams = request.nextUrl.searchParams;
  const rawParams = {
    periodo: searchParams.get("periodo") || undefined,
    setor: searchParams.get("setor") || undefined,
  };

  const parseResult = KPIsFiltersSchema.safeParse(rawParams);

  if (!parseResult.success) {
    throw new ValidationError("Parâmetros inválidos", parseResult.error.issues);
  }

  const { periodo: periodoFinal, setor: codigoSetor } = parseResult.data;

  // Executar query - usa query MACRO se setor = 0 (todos os setores)
  let query: string;
  if (codigoSetor === TODOS_SETORES) {
    query = buildKPIsMacroQuery();
  } else {
    query = buildKPIsQueryOptimized(periodoFinal, codigoSetor);
  }
  const result = await executeQuery<KPIs>(query);

  const queryTime = Date.now() - startTime;
  const setorLabel = codigoSetor === TODOS_SETORES ? "TODOS" : codigoSetor;
  logger.perf(`⚡ KPIs (período: ${periodoFinal}, setor: ${setorLabel}): ${queryTime}ms`);

  // Se não houver resultados, retorna KPIs zerados
  const kpis: KPIs = result[0] || {
    totalEmAndamento: 0,
    novosMesAtual: 0,
    mediaDiasFinanceiro: 0,
    minDiasFinanceiro: null,
    maxDiasFinanceiro: null,
    emDiaMenos15Dias: 0,
    urgentes15a30Dias: 0,
    criticosMais30Dias: 0,
  };

  return NextResponse.json({
    data: kpis,
    success: true,
    periodo: periodoFinal,
    setor: codigoSetor,
  });
});

// Configuração de revalidação (ISR)
export const revalidate = 300; // 5 minutos
