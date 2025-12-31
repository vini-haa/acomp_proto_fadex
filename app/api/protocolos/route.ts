import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { buildProtocolosListQuery, buildProtocolosCountQuery } from "@/lib/queries";
import { protocoloFiltersSchema } from "@/lib/schemas";
import { Protocolo, PaginatedResponse } from "@/types";
import { withErrorHandling, ValidationError } from "@/lib/errors";

/**
 * GET /api/protocolos
 * Retorna lista de protocolos com filtros e paginação
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Extrair e validar parâmetros
  const rawFilters = {
    status: searchParams.get("status") || undefined,
    numeroDocumento: searchParams.get("numeroDocumento") || undefined,
    numconv: searchParams.get("numconv") || undefined,
    dataInicio: searchParams.get("dataInicio") || undefined,
    dataFim: searchParams.get("dataFim") || undefined,
    faixaTempo: searchParams.get("faixaTempo") || undefined,
    page: searchParams.get("page") || "1",
    pageSize: searchParams.get("pageSize") || "20",
    sortBy: searchParams.get("sortBy") || undefined,
    sortOrder: searchParams.get("sortOrder") || "desc",
  };

  // Validar com Zod
  const parseResult = protocoloFiltersSchema.safeParse(rawFilters);

  if (!parseResult.success) {
    throw new ValidationError("Parâmetros de filtro inválidos");
  }

  const filters = parseResult.data;

  // Construir queries
  const { query: listQuery, params: listParams } = buildProtocolosListQuery(filters);
  const { query: countQuery, params: countParams } = buildProtocolosCountQuery(filters);

  // Executar query de contagem
  const countResult = await executeQuery<{ total: number }>(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  // Calcular paginação com limite máximo de 1000 registros
  const page = filters.page || 1;
  const requestedPageSize = filters.pageSize || 20;
  const pageSize = Math.min(requestedPageSize, 1000); // Máximo 1000 registros
  const totalPages = Math.ceil(total / pageSize);
  const offset = (page - 1) * pageSize;

  // Adicionar OFFSET e FETCH para paginação
  const paginatedQuery = `
    ${listQuery}
    OFFSET @offset ROWS
    FETCH NEXT @pageSize ROWS ONLY
  `;

  // Executar query de dados
  const data = await executeQuery<Protocolo>(paginatedQuery, {
    ...listParams,
    offset,
    pageSize,
  });

  // Preparar resposta paginada
  const response: PaginatedResponse<Protocolo> = {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };

  return NextResponse.json({
    ...response,
    success: true,
  });
});

export const revalidate = 60; // 1 minuto
