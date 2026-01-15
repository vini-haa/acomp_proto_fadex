import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { HeatmapItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";

/**
 * GET /api/analytics/heatmap
 * Retorna dados para heatmap de dia/hora de movimentações
 *
 * Filtros disponíveis:
 * - numconv: Número do convênio/projeto
 * - instituicao: Código da instituição (100=UFPI, 113=IFPI, etc)
 * - uf: Estado (PI, MA, PE, etc)
 * - situacao: Código da situação do projeto (1=Concluído, 2=Execução, 3=Pré-Projeto)
 * - periodo: Período em meses (padrão: 6)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Extrair filtros
  const numconv = searchParams.get("numconv");
  const instituicao = searchParams.get("instituicao");
  const uf = searchParams.get("uf");
  const situacao = searchParams.get("situacao");
  const periodo = parseInt(searchParams.get("periodo") || "6", 10);

  // Construir cláusulas WHERE dinâmicas
  const whereClauses: string[] = [
    // Apenas setores ativos (começam com '-' ou 'ARQUIVO')
    "(s.descr LIKE '-%' OR UPPER(s.descr) LIKE 'ARQUIVO%')",
    "s.descr NOT LIKE '%DESABILITADO%'",
    `m.data >= DATEADD(MONTH, -${periodo}, GETDATE())`,
    "(m.Deletado IS NULL OR m.Deletado = 0)",
  ];

  if (numconv) {
    whereClauses.push(`c.numconv = ${parseInt(numconv, 10)}`);
  }

  if (instituicao) {
    whereClauses.push(`c.codinst = ${parseInt(instituicao, 10)}`);
  }

  if (uf) {
    whereClauses.push(`c.UF = '${uf.replace(/'/g, "''")}'`);
  }

  if (situacao) {
    whereClauses.push(`c.CodSituacaoProjeto = ${parseInt(situacao, 10)}`);
  }

  const query = `
    SELECT
      DATENAME(WEEKDAY, m.data) AS diaSemana,
      DATEPART(WEEKDAY, m.data) AS diaSemanaNum,
      DATEPART(HOUR, m.data) AS hora,
      COUNT(*) AS quantidade
    FROM scd_movimentacao m
    INNER JOIN setor s ON s.codigo = m.codsetordestino
    LEFT JOIN documento d ON d.codigo = m.codprot AND (d.deletado IS NULL OR d.deletado = 0)
    LEFT JOIN convenio c ON c.numconv = d.numconv AND c.deletado IS NULL
    WHERE ${whereClauses.join(" AND ")}
    GROUP BY
      DATENAME(WEEKDAY, m.data),
      DATEPART(WEEKDAY, m.data),
      DATEPART(HOUR, m.data)
    ORDER BY diaSemanaNum, hora
  `;

  const result = await executeQuery<HeatmapItem>(query);

  return NextResponse.json({
    data: result,
    success: true,
    filtros: {
      numconv: numconv ? parseInt(numconv, 10) : null,
      instituicao: instituicao ? parseInt(instituicao, 10) : null,
      uf: uf || null,
      situacao: situacao ? parseInt(situacao, 10) : null,
      periodo,
    },
  });
});

// Cache dinâmico baseado nos filtros
export const dynamic = "force-dynamic";
