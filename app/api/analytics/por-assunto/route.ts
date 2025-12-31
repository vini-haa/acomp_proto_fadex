import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { GET_ANALISE_ASSUNTO } from "@/lib/queries";
import { AnaliseAssuntoItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";

/**
 * GET /api/analytics/por-assunto
 * Retorna análise de protocolos por assunto
 */
export const GET = withErrorHandling(async () => {
  const result = await executeQuery<AnaliseAssuntoItem>(GET_ANALISE_ASSUNTO);

  return NextResponse.json({
    data: result,
    success: true,
  });
});

export const revalidate = 300; // 5 minutos
