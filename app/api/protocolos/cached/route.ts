import { NextRequest, NextResponse } from "next/server";
import { initializeCache, getCachedProtocolos, getCacheStatus } from "@/lib/cache/protocolos-cache";

/**
 * GET /api/protocolos/cached
 * Retorna protocolos do cache com filtros e paginação
 *
 * A primeira requisição inicializa o cache (pode demorar)
 * Requisições subsequentes são instantâneas
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Inicializa o cache se necessário (primeira vez)
  await initializeCache();

  // Extrair parâmetros
  const diaSemanaParam = searchParams.get("diaSemana");
  const horaParam = searchParams.get("hora");

  const filters = {
    status: searchParams.get("status") || undefined,
    numeroDocumento: searchParams.get("numeroDocumento") || undefined,
    faixaTempo: searchParams.get("faixaTempo") || undefined,
    contaCorrente: searchParams.get("contaCorrente") || undefined,
    setorAtual: searchParams.get("setorAtual") || undefined,
    numconv: searchParams.get("numconv") || undefined,
    assunto: searchParams.get("assunto") || undefined,
    diaSemana: diaSemanaParam ? parseInt(diaSemanaParam) : undefined,
    hora: horaParam ? parseInt(horaParam) : undefined,
    page: parseInt(searchParams.get("page") || "1"),
    pageSize: parseInt(searchParams.get("pageSize") || "20"),
    sortBy: searchParams.get("sortBy") || "dtEntrada",
    sortOrder: (searchParams.get("sortOrder") || "desc") as "asc" | "desc",
  };

  // Busca do cache (instantâneo)
  const result = getCachedProtocolos(filters);

  return NextResponse.json({
    success: true,
    ...result,
  });
}

/**
 * GET /api/protocolos/cached/status
 * Retorna status do cache
 */
export async function HEAD() {
  const status = getCacheStatus();

  return NextResponse.json(status);
}
