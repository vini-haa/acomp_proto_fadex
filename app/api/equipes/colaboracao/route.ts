import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Tipo para dados de colaboração entre usuários
 */
export interface Colaboracao {
  codUsuario1: number;
  nomeUsuario1: string;
  setorUsuario1: string | null;
  codUsuario2: number;
  nomeUsuario2: string;
  setorUsuario2: string | null;
  vezesTrabalharamJuntos: number;
  tempoMedioConjuntoHoras: number | null;
}

export interface ColaboracaoResponse {
  success: boolean;
  data: Colaboracao[];
  total: number;
}

/**
 * GET /api/equipes/colaboracao
 *
 * Identifica duplas/grupos que trabalham juntos frequentemente.
 * Analisa movimentações dos últimos 3 meses onde um usuário
 * enviou para outro e este recebeu.
 *
 * Critérios:
 * - Mínimo de 5 interações para ser considerado colaboração frequente
 * - Ordenado por número de vezes que trabalharam juntos
 * - Retorna top 30 duplas
 */
export const GET = withErrorHandling(async (_request: NextRequest) => {
  const startTime = Date.now();

  // Query para identificar duplas que trabalham juntos frequentemente
  const query = `
    SELECT TOP 30
      u1.codigo AS codUsuario1,
      u1.Nome AS nomeUsuario1,
      LTRIM(REPLACE(COALESCE(s1.descr, 'Nao definido'), '- ', '')) AS setorUsuario1,
      u2.codigo AS codUsuario2,
      u2.Nome AS nomeUsuario2,
      LTRIM(REPLACE(COALESCE(s2.descr, 'Nao definido'), '- ', '')) AS setorUsuario2,
      COUNT(*) AS vezesTrabalharamJuntos,
      AVG(DATEDIFF(hour, m.data, m.dtRecebimento)) AS tempoMedioConjuntoHoras
    FROM scd_movimentacao m
    INNER JOIN usuario u1 ON m.codUsuario = u1.codigo
    INNER JOIN usuario u2 ON m.CodUsuRec = u2.codigo
    LEFT JOIN setor s1 ON u1.codSetor = s1.codigo
    LEFT JOIN setor s2 ON u2.codSetor = s2.codigo
    WHERE (m.Deletado IS NULL OR m.Deletado = 0)
      AND m.data >= DATEADD(month, -3, GETDATE())
      AND u1.codigo < u2.codigo
      AND m.dtRecebimento IS NOT NULL
    GROUP BY u1.codigo, u1.Nome, s1.descr, u2.codigo, u2.Nome, s2.descr
    HAVING COUNT(*) >= 5
    ORDER BY vezesTrabalharamJuntos DESC
  `;

  const result = await executeQuery<Colaboracao>(query);

  const queryTime = Date.now() - startTime;
  logger.perf(`⚡ Colaboracao (${result.length} duplas): ${queryTime}ms`);

  const response: ColaboracaoResponse = {
    success: true,
    data: result,
    total: result.length,
  };

  return NextResponse.json(response);
});

// Revalidação ISR
export const revalidate = 300; // 5 minutos
