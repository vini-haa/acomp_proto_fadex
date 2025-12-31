import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { SerieTemporalItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";
import { buildTemporalQuery } from "@/lib/queries/analytics/temporal";

/**
 * GET /api/analytics/temporal
 * Retorna série temporal de entradas x saídas
 *
 * Query params:
 * - periodo: '7d', '30d', '90d', 'ytd', '12m' (default: '30d')
 * - setor: código do setor, 0 = visão macro (default: 48 - Financeiro)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const periodo = searchParams.get("periodo") || "30d";
  const setorParam = searchParams.get("setor") || "48"; // Setor financeiro como padrão
  const setor = parseInt(setorParam, 10);

  const query = buildTemporalQuery(setor, periodo);
  const result = await executeQuery<SerieTemporalItem>(query);

  // Transformar periodo em formato de data para exibição
  const formattedResult = result.map((item) => ({
    ...item,
    data: item.periodo, // Manter formato original
    entradas: item.qtdEntradas,
    saidas: item.qtdSaidas,
  }));

  return NextResponse.json({
    data: formattedResult,
    success: true,
  });
});

export const revalidate = 300; // 5 minutos
