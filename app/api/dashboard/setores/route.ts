import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import type { SetorMetricas } from "@/types/dashboard";

/**
 * Setores relevantes para análise no Dashboard
 */
const SETORES_PERMITIDOS = [
  43, // ASSESSORIA TÉCNICA / TI
  48, // GERENCIA DE FINANÇAS E CONTABILIDADE
  45, // GERÊNCIA ADMINISTRATIVA
  40, // GERÊNCIA DE PROJETOS
  56, // PORTAL DO COORDENADOR
  44, // SECRETARIA
];

/**
 * Converte período para número de dias
 */
function periodoParaDias(periodo: string): number {
  switch (periodo) {
    case "30d":
      return 30;
    case "60d":
      return 60;
    case "90d":
      return 90;
    case "180d":
      return 180;
    case "365d":
      return 365;
    default:
      return 30;
  }
}

/**
 * GET /api/dashboard/setores
 * Retorna métricas comparativas de todos os setores
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const periodo = searchParams.get("periodo") || "30d";
  const dias = periodoParaDias(periodo);

  const codigosIn = SETORES_PERMITIDOS.join(",");

  const query = `
    WITH ColaboradoresPorSetor AS (
      -- Conta colaboradores ativos que fizeram movimentações nos últimos 90 dias
      -- Isso identifica colaboradores REALMENTE ativos no setor
      SELECT
        u.codSetor,
        COUNT(DISTINCT u.codigo) AS totalColaboradores
      FROM usuario u
      WHERE (u.bloqueado = 0 OR u.bloqueado IS NULL)
        AND (u.DELETADO = 0 OR u.DELETADO IS NULL)
        AND u.codSetor IN (${codigosIn})
        AND EXISTS (
          SELECT 1 FROM scd_movimentacao m
          WHERE m.codUsuario = u.codigo
            AND (m.Deletado = 0 OR m.Deletado IS NULL)
            AND m.data >= DATEADD(day, -90, GETDATE())
        )
      GROUP BY u.codSetor
    ),
    MovimentacoesPorSetor AS (
      SELECT
        COALESCE(m.codSetorOrigem, m.codSetorDestino) AS codSetor,
        COUNT(DISTINCT m.codigo) AS movimentacoesPeriodo,
        COUNT(DISTINCT m.codprot) AS totalProtocolos
      FROM scd_movimentacao m
      WHERE (m.Deletado = 0 OR m.Deletado IS NULL)
        AND m.data >= DATEADD(day, -${dias}, GETDATE())
        AND (m.codSetorOrigem IN (${codigosIn}) OR m.codSetorDestino IN (${codigosIn}))
      GROUP BY COALESCE(m.codSetorOrigem, m.codSetorDestino)
    ),
    ProtocolosStatus AS (
      SELECT
        m.codSetorDestino AS codSetor,
        SUM(CASE WHEN sp.descricao LIKE '%Finalizado%' OR sp.descricao LIKE '%Arquivado%' THEN 1 ELSE 0 END) AS finalizados,
        SUM(CASE WHEN sp.descricao NOT LIKE '%Finalizado%' AND sp.descricao NOT LIKE '%Arquivado%' THEN 1 ELSE 0 END) AS emAndamento
      FROM scd_movimentacao m
      INNER JOIN (
        SELECT codprot, MAX(codigo) AS ultimaMovimentacao
        FROM scd_movimentacao
        WHERE (Deletado = 0 OR Deletado IS NULL)
        GROUP BY codprot
      ) ult ON m.codigo = ult.ultimaMovimentacao
      LEFT JOIN situacaoProtocolo sp ON m.codSituacaoProt = sp.codigo
      WHERE m.codSetorDestino IN (${codigosIn})
        AND m.data >= DATEADD(day, -${dias}, GETDATE())
      GROUP BY m.codSetorDestino
    ),
    TempoMedioPorSetor AS (
      SELECT
        m1.codSetorOrigem AS codSetor,
        AVG(CAST(DATEDIFF(hour, m1.data, m2.data) AS float) / 24.0) AS tempoMedioDias
      FROM scd_movimentacao m1
      INNER JOIN scd_movimentacao m2 ON m1.codprot = m2.codprot
        AND m2.codigo > m1.codigo
        AND m2.codSetorOrigem = m1.codSetorDestino
      WHERE (m1.Deletado = 0 OR m1.Deletado IS NULL)
        AND (m2.Deletado = 0 OR m2.Deletado IS NULL)
        AND m1.data >= DATEADD(day, -${dias}, GETDATE())
        AND m1.codSetorOrigem IN (${codigosIn})
      GROUP BY m1.codSetorOrigem
    )
    SELECT
      s.codigo AS codSetor,
      s.descr AS nomeSetor,
      ISNULL(c.totalColaboradores, 0) AS totalColaboradores,
      ISNULL(m.totalProtocolos, 0) AS totalProtocolos,
      ISNULL(m.movimentacoesPeriodo, 0) AS movimentacoesPeriodo,
      t.tempoMedioDias,
      ISNULL(ps.emAndamento, 0) AS protocolosEmAndamento,
      ISNULL(ps.finalizados, 0) AS protocolosFinalizados
    FROM setor s
    LEFT JOIN ColaboradoresPorSetor c ON c.codSetor = s.codigo
    LEFT JOIN MovimentacoesPorSetor m ON m.codSetor = s.codigo
    LEFT JOIN ProtocolosStatus ps ON ps.codSetor = s.codigo
    LEFT JOIN TempoMedioPorSetor t ON t.codSetor = s.codigo
    WHERE s.deletado IS NULL
      AND s.codigo IN (${codigosIn})
    ORDER BY m.movimentacoesPeriodo DESC
  `;

  const result = await executeQuery<SetorMetricas>(query);

  return NextResponse.json({
    data: result,
    periodo,
    totalSetores: result.length,
    success: true,
  });
});

export const revalidate = 300; // 5 minutos
