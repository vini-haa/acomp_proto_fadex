import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { GET_FLUXO_SETORES } from "@/lib/queries";
import { FluxoSetorItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";

/**
 * GET /api/analytics/fluxo-setores
 * Retorna dados de fluxo entre setores (para diagrama Sankey)
 */
export const GET = withErrorHandling(async () => {
  const result = await executeQuery<FluxoSetorItem>(GET_FLUXO_SETORES);

  return NextResponse.json({
    data: result,
    success: true,
  });
});

export const revalidate = 300; // 5 minutos
