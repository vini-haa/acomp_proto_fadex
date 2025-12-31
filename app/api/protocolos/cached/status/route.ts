import { NextResponse } from "next/server";
import { getCacheStatus, forceRefresh } from "@/lib/cache/protocolos-cache";

/**
 * GET /api/protocolos/cached/status
 * Retorna status do cache
 */
export async function GET() {
  const status = getCacheStatus();
  return NextResponse.json(status);
}

/**
 * POST /api/protocolos/cached/status
 * Força atualização do cache
 */
export async function POST() {
  await forceRefresh();
  const status = getCacheStatus();

  return NextResponse.json({
    message: "Cache atualizado com sucesso",
    ...status,
  });
}
