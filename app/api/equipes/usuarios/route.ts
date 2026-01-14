import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { buildUsuariosQuery } from "@/lib/queries/equipes";
import { UsuarioPerformance, UsuariosFilters, UsuariosResponse } from "@/types/equipes";
import { withErrorHandling, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Schema de validação dos filtros
const UsuariosFiltersSchema = z.object({
  codSetor: z.coerce.number().int().positive().optional(),
  periodo: z.enum(["7d", "30d", "90d"]).default("30d"),
});

/**
 * GET /api/equipes/usuarios
 *
 * Retorna métricas de performance individual por usuário.
 *
 * Query params:
 * - codSetor: código do setor (opcional, filtra por setor específico)
 * - periodo: '7d' | '30d' | '90d' (padrão: 30d)
 *
 * Métricas retornadas:
 * - movimentacoesEnviadas30d: quantidade de movimentações enviadas
 * - movimentacoesRecebidas30d: quantidade de movimentações recebidas
 * - protocolosFinalizados30d: quantidade de protocolos finalizados
 * - tempoMedioRespostaHoras: tempo médio de resposta em horas
 * - mediaMovimentacoesPorDia: média de movimentações por dia
 *
 * IMPORTANTE:
 * - Apenas usuários ativos de setores ativos
 * - Apenas usuários com atividade no período
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();

  // Obter e validar parâmetros
  const searchParams = request.nextUrl.searchParams;
  const rawParams = {
    codSetor: searchParams.get("codSetor") || undefined,
    periodo: searchParams.get("periodo") || undefined,
  };

  const parseResult = UsuariosFiltersSchema.safeParse(rawParams);

  if (!parseResult.success) {
    throw new ValidationError("Parâmetros inválidos", parseResult.error.issues);
  }

  const filters: UsuariosFilters = parseResult.data;

  // Executar query
  const query = buildUsuariosQuery(filters);
  const usuarios = await executeQuery<UsuarioPerformance>(query);

  const queryTime = Date.now() - startTime;
  const setorLabel = filters.codSetor ? `setor ${filters.codSetor}` : "todos os setores";
  logger.perf(`⚡ Usuários (${usuarios.length} usuários, ${setorLabel}): ${queryTime}ms`);

  const response: UsuariosResponse = {
    data: usuarios,
    success: true,
    total: usuarios.length,
    filters,
  };

  return NextResponse.json(response);
});

// Revalidação ISR
export const revalidate = 300; // 5 minutos
