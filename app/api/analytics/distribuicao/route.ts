import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { GET_DISTRIBUICAO_FAIXA } from "@/lib/queries";
import { DistribuicaoFaixaItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";

/**
 * GET /api/analytics/distribuicao
 * Retorna distribuição por faixa de tempo
 */
export const GET = withErrorHandling(async () => {
  const result = await executeQuery<DistribuicaoFaixaItem>(GET_DISTRIBUICAO_FAIXA);

  return NextResponse.json({
    data: result,
    success: true,
  });
});

export const revalidate = 300; // 5 minutos
