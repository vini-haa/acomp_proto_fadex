import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { buildAlertasQuery } from "@/lib/queries/equipes";
import { AlertaSetor, AlertasResumo, AlertasResponse } from "@/types/equipes";
import { withErrorHandling } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * GET /api/equipes/alertas
 *
 * Retorna alertas de protocolos atrasados por setor.
 *
 * Classificação por tempo de atraso:
 * - Crítico: >30 dias
 * - Urgente: 15-30 dias
 * - Atenção: 7-15 dias
 *
 * IMPORTANTE:
 * - Apenas setores ativos (descr LIKE '-%')
 * - Apenas protocolos não finalizados (codSituacaoProt != 1)
 */
export const GET = withErrorHandling(async () => {
  const startTime = Date.now();

  // Executar query
  const query = buildAlertasQuery();
  const setores = await executeQuery<AlertaSetor>(query);

  // Calcular totais
  const totalCriticos = setores.reduce((acc, s) => acc + s.criticos, 0);
  const totalUrgentes = setores.reduce((acc, s) => acc + s.urgentes, 0);
  const totalAtencao = setores.reduce((acc, s) => acc + s.atencao, 0);
  const totalGeral = setores.reduce((acc, s) => acc + s.totalAlertas, 0);

  const queryTime = Date.now() - startTime;
  logger.perf(`⚡ Alertas (${setores.length} setores, ${totalGeral} alertas): ${queryTime}ms`);

  const resumo: AlertasResumo = {
    totalCriticos,
    totalUrgentes,
    totalAtencao,
    totalGeral,
    setores,
  };

  const response: AlertasResponse = {
    data: resumo,
    success: true,
  };

  return NextResponse.json(response);
});

// Revalidação ISR
export const revalidate = 300; // 5 minutos
