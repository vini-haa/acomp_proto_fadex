import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { Colaboracao, ColaboracaoResponse } from "@/types/equipes";

// Cache em memória para colaborações
interface CacheEntry {
  data: Colaboracao[];
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * GET /api/equipes/colaboracao
 *
 * Identifica duplas/grupos que trabalham juntos frequentemente.
 * Analisa movimentações dos últimos 3 meses onde um usuário
 * enviou para outro e este recebeu.
 *
 * Cache: 5 minutos em memória
 *
 * Critérios:
 * - Mínimo de 5 interações para ser considerado colaboração frequente
 * - Ordenado por número de vezes que trabalharam juntos
 * - Retorna top 30 duplas
 */
export const GET = withErrorHandling(async (_request: NextRequest) => {
  const startTime = Date.now();

  // Verificar cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    const cacheTime = Date.now() - startTime;
    logger.perf(`💾 Colaboração (cache): ${cacheTime}ms`);
    return NextResponse.json({
      success: true,
      data: cache.data,
      total: cache.data.length,
    } satisfies ColaboracaoResponse);
  }

  // Query para identificar duplas que trabalham juntos frequentemente
  const query = `
    SELECT TOP 30
      u1.codigo AS codUsuario1,
      u1.Nome AS nomeUsuario1,
      LTRIM(REPLACE(COALESCE(s1.descr, 'Não definido'), '- ', '')) AS setorUsuario1,
      u2.codigo AS codUsuario2,
      u2.Nome AS nomeUsuario2,
      LTRIM(REPLACE(COALESCE(s2.descr, 'Não definido'), '- ', '')) AS setorUsuario2,
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

  // Atualizar cache
  cache = { data: result, timestamp: Date.now() };

  const queryTime = Date.now() - startTime;
  logger.perf(`⚡ Colaboração (${result.length} duplas): ${queryTime}ms`);

  const response: ColaboracaoResponse = {
    success: true,
    data: result,
    total: result.length,
  };

  return NextResponse.json(response);
});

// Cache dinâmico
export const dynamic = "force-dynamic";
