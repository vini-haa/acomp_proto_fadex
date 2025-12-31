import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { GET_PROTOCOLO_TIMELINE } from "@/lib/queries";
import { TimelineItem } from "@/types";
import { withErrorHandling, ValidationError } from "@/lib/errors";

/**
 * GET /api/protocolos/[id]/timeline
 * Retorna a timeline (histórico de movimentações) de um protocolo
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const protocoloId = parseInt(id);

    if (isNaN(protocoloId) || protocoloId <= 0) {
      throw new ValidationError("ID de protocolo inválido");
    }

    const result = await executeQuery<TimelineItem>(GET_PROTOCOLO_TIMELINE, {
      id: protocoloId,
    });

    return NextResponse.json({
      data: result,
      success: true,
    });
  }
);

export const revalidate = 60; // 1 minuto
