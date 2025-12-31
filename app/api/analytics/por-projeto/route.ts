import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { GET_ANALISE_PROJETO } from "@/lib/queries";
import { AnaliseProjetoItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";

/**
 * GET /api/analytics/por-projeto
 * Retorna análise de protocolos por projeto/convênio
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "9999", 10);

  const result = await executeQuery<AnaliseProjetoItem>(GET_ANALISE_PROJETO);

  // Aplica o limite (a query já ordena por totalProtocolos DESC)
  const limitedResult = limit > 0 ? result.slice(0, limit) : result;

  return NextResponse.json({
    data: limitedResult,
    success: true,
  });
});

export const revalidate = 300; // 5 minutos
