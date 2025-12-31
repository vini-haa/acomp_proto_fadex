import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { GET_HEATMAP } from "@/lib/queries";
import { HeatmapItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";

/**
 * GET /api/analytics/heatmap
 * Retorna dados para heatmap de dia/hora de movimentações
 */
export const GET = withErrorHandling(async () => {
  const result = await executeQuery<HeatmapItem>(GET_HEATMAP);

  return NextResponse.json({
    data: result,
    success: true,
  });
});

export const revalidate = 300; // 5 minutos
