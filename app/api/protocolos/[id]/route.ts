import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { GET_PROTOCOLO_BY_ID } from "@/lib/queries";
import { Protocolo } from "@/types";
import { withErrorHandling, NotFoundError, ValidationError } from "@/lib/errors";

/**
 * GET /api/protocolos/[id]
 * Retorna os detalhes de um protocolo específico
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const protocoloId = parseInt(id);

    if (isNaN(protocoloId) || protocoloId <= 0) {
      throw new ValidationError("ID de protocolo inválido");
    }

    const result = await executeQuery<Protocolo>(GET_PROTOCOLO_BY_ID, {
      id: protocoloId,
    });

    if (!result || result.length === 0) {
      throw new NotFoundError(`Protocolo #${protocoloId} não encontrado`);
    }

    return NextResponse.json({
      data: result[0],
      success: true,
    });
  }
);

export const revalidate = 60; // 1 minuto
