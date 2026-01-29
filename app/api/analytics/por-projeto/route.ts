import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { AnaliseProjetoItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";
import { withBaseCTE } from "@/lib/queries/base-cte";

/**
 * Gera a query de análise por projeto com filtro de período opcional
 *
 * @param periodo - Período em meses (0 = todos)
 */
function buildAnaliseProjetoQuery(periodo: number): string {
  // Filtro de data: 0 = sem filtro, >0 = últimos N meses
  const filtroData =
    periodo > 0 ? `AND vp.dt_entrada >= DATEADD(MONTH, -${periodo}, GETDATE())` : "";

  const queryInner = `
SELECT
    c.numconv,
    c.titulo AS projeto,
    COUNT(*) AS totalProtocolos,
    SUM(CASE WHEN vp.status_protocolo = 'Em Andamento' THEN 1 ELSE 0 END) AS emAndamento,
    SUM(CASE WHEN vp.status_protocolo = 'Finalizado' THEN 1 ELSE 0 END) AS finalizados,
    AVG(vp.dias_no_financeiro) AS mediaDias,
    MAX(CASE WHEN vp.status_protocolo = 'Em Andamento' THEN vp.dias_no_financeiro END) AS maxDiasEmAndamento
FROM vw_ProtocolosFinanceiro vp
    LEFT JOIN documento d ON d.codigo = vp.codprot AND d.deletado IS NULL
    LEFT JOIN convenio c ON d.numconv = c.numconv AND c.deletado IS NULL
WHERE c.numconv IS NOT NULL
  ${filtroData}
GROUP BY c.numconv, c.titulo
ORDER BY totalProtocolos DESC;
`;

  return withBaseCTE(queryInner);
}

/**
 * GET /api/analytics/por-projeto
 * Retorna análise de protocolos por projeto/convênio
 *
 * Query params:
 * - limit: Número máximo de projetos (default: 9999)
 * - periodo: Período em meses (1, 3, 6, 12, 0 = todos) (default: 12)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "9999", 10);
  const periodo = parseInt(searchParams.get("periodo") || "12", 10);

  const query = buildAnaliseProjetoQuery(periodo);
  const result = await executeQuery<AnaliseProjetoItem>(query);

  // Aplica o limite (a query já ordena por totalProtocolos DESC)
  const limitedResult = limit > 0 ? result.slice(0, limit) : result;

  return NextResponse.json({
    data: limitedResult,
    success: true,
    meta: {
      periodo,
      totalProjetos: result.length,
      projetosExibidos: limitedResult.length,
    },
  });
});

// Cache dinâmico baseado nos filtros
export const dynamic = "force-dynamic";
