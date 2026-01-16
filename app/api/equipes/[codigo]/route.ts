import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * GET /api/equipes/[codigo]
 *
 * Retorna detalhes completos de um setor específico:
 * - Dados principais do setor
 * - Métricas atuais
 * - Histórico mensal (6 meses)
 * - Protocolos em posse (top 20 mais antigos)
 * - Membros do setor com métricas individuais
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) => {
    const startTime = Date.now();
    const { codigo: codigoStr } = await params;
    const codigo = parseInt(codigoStr);

    if (isNaN(codigo)) {
      throw new ValidationError("Código do setor inválido");
    }

    // Query 1: Dados principais do setor
    const setorQuery = `
      SELECT
        s.codigo AS codSetor,
        LTRIM(REPLACE(s.descr, '- ', '')) AS nomeSetor,
        s.descr AS nomeSetorOriginal,
        (
          SELECT COUNT(*)
          FROM usuario u
          WHERE u.codSetor = s.codigo
            AND (u.deletado IS NULL OR u.deletado = 0)
        ) AS totalMembros,
        STUFF((
          SELECT ', ' + u2.Nome
          FROM usuario u2
          WHERE u2.codSetor = s.codigo
            AND (u2.deletado IS NULL OR u2.deletado = 0)
          ORDER BY u2.Nome
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS membros
      FROM setor s
      WHERE s.codigo = ${codigo}
    `;

    // Query 2: Métricas atuais
    const metricasQuery = `
      SELECT
        COUNT(DISTINCT CASE
          WHEN m.data >= DATEADD(day, -30, GETDATE()) THEN m.codigo
        END) AS movimentacoes30d,
        COUNT(DISTINCT CASE
          WHEN m.data >= DATEADD(day, -7, GETDATE()) THEN m.codigo
        END) AS movimentacoes7d,
        COUNT(DISTINCT CASE WHEN m.RegAtual = 1 THEN m.codprot END) AS protocolosEmPosse,
        COUNT(DISTINCT CASE
          WHEN m.RegAtual = 1 AND DATEDIFF(day, m.data, GETDATE()) > 7
          THEN m.codprot
        END) AS protocolosParados,
        AVG(CASE
          WHEN m.dtRecebimento IS NOT NULL
          AND m.data >= DATEADD(day, -30, GETDATE())
          THEN DATEDIFF(hour, m.data, m.dtRecebimento)
        END) AS tempoMedioRespostaHoras
      FROM scd_movimentacao m
      WHERE m.codsetordestino = ${codigo}
        AND (m.Deletado IS NULL OR m.Deletado = 0)
    `;

    // Query 3: Histórico mensal (últimos 6 meses)
    const historicoQuery = `
      SELECT
        CONVERT(VARCHAR(7), m.data, 120) AS periodo,
        COUNT(DISTINCT m.codigo) AS movimentacoes,
        COUNT(DISTINCT m.codprot) AS protocolosDistintos,
        AVG(CASE
          WHEN m.dtRecebimento IS NOT NULL
          THEN DATEDIFF(hour, m.data, m.dtRecebimento)
        END) AS tempoMedioHoras
      FROM scd_movimentacao m
      WHERE m.codsetordestino = ${codigo}
        AND (m.Deletado IS NULL OR m.Deletado = 0)
        AND m.data >= DATEADD(month, -6, GETDATE())
      GROUP BY CONVERT(VARCHAR(7), m.data, 120)
      ORDER BY periodo
    `;

    // Query 4: Protocolos atualmente no setor (top 20 mais antigos)
    const protocolosQuery = `
      SELECT TOP 20
        d.codigo,
        d.numero,
        d.dataCad,
        DATEDIFF(day, d.dataCad, GETDATE()) AS diasTramitacao,
        m.data AS dataEntradaSetor,
        DATEDIFF(day, m.data, GETDATE()) AS diasNoSetor,
        d.assunto AS interessado,
        CASE
          WHEN DATEDIFF(day, d.dataCad, GETDATE()) > 30 THEN 'CRITICO'
          WHEN DATEDIFF(day, d.dataCad, GETDATE()) > 15 THEN 'URGENTE'
          WHEN DATEDIFF(day, d.dataCad, GETDATE()) > 7 THEN 'ATENCAO'
          ELSE 'NORMAL'
        END AS statusUrgencia
      FROM scd_movimentacao m
      INNER JOIN documento d ON m.codprot = d.codigo
        AND (d.deletado IS NULL OR d.deletado = 0)
      WHERE m.codsetordestino = ${codigo}
        AND m.RegAtual = 1
        AND (m.Deletado IS NULL OR m.Deletado = 0)
      ORDER BY d.dataCad ASC
    `;

    // Query 5: Membros do setor com métricas individuais
    const membrosQuery = `
      SELECT
        u.codigo AS codUsuario,
        u.Nome AS nomeUsuario,
        COUNT(DISTINCT CASE
          WHEN m.codUsuario = u.codigo
          AND m.data >= DATEADD(day, -30, GETDATE())
          THEN m.codigo
        END) AS movimentacoesEnviadas30d,
        COUNT(DISTINCT CASE
          WHEN m.CodUsuRec = u.codigo
          AND m.dtRecebimento >= DATEADD(day, -30, GETDATE())
          THEN m.codigo
        END) AS movimentacoesRecebidas30d,
        AVG(CASE
          WHEN m.CodUsuRec = u.codigo
          AND m.dtRecebimento IS NOT NULL
          AND m.data >= DATEADD(day, -30, GETDATE())
          THEN DATEDIFF(hour, m.data, m.dtRecebimento)
        END) AS tempoMedioRespostaHoras
      FROM usuario u
      LEFT JOIN scd_movimentacao m
        ON (m.codUsuario = u.codigo OR m.CodUsuRec = u.codigo)
        AND (m.Deletado IS NULL OR m.Deletado = 0)
      WHERE u.codSetor = ${codigo}
        AND (u.deletado IS NULL OR u.deletado = 0)
      GROUP BY u.codigo, u.Nome
      ORDER BY movimentacoesEnviadas30d DESC
    `;

    // Executar todas as queries em paralelo
    const [setorResult, metricasResult, historicoResult, protocolosResult, membrosResult] =
      await Promise.all([
        executeQuery(setorQuery),
        executeQuery(metricasQuery),
        executeQuery(historicoQuery),
        executeQuery(protocolosQuery),
        executeQuery(membrosQuery),
      ]);

    // Log para debug de protocolos
    logger.info(`Setor ${codigo}: ${protocolosResult.length} protocolos encontrados`);

    // Verificar se o setor existe
    if (setorResult.length === 0) {
      // Tentar buscar dados apenas das movimentações
      const setorAlternativoQuery = `
        SELECT DISTINCT
          m.codsetordestino AS codSetor,
          LTRIM(REPLACE(COALESCE(s.descr, 'Setor ' + CAST(m.codsetordestino AS VARCHAR)), '- ', '')) AS nomeSetor,
          COALESCE(s.descr, 'Setor ' + CAST(m.codsetordestino AS VARCHAR)) AS nomeSetorOriginal,
          0 AS totalMembros,
          NULL AS membros
        FROM scd_movimentacao m
        LEFT JOIN setor s ON s.codigo = m.codsetordestino
        WHERE m.codsetordestino = ${codigo}
      `;
      const setorAlternativo = await executeQuery(setorAlternativoQuery);

      if (setorAlternativo.length === 0) {
        return NextResponse.json({ error: "Setor não encontrado" }, { status: 404 });
      }

      const queryTime = Date.now() - startTime;
      logger.perf(`⚡ Detalhes Setor ${codigo} (alternativo): ${queryTime}ms`);

      return NextResponse.json({
        success: true,
        data: {
          setor: setorAlternativo[0],
          metricas: metricasResult[0] || {},
          historico: historicoResult,
          protocolos: protocolosResult,
          membros: membrosResult,
        },
      });
    }

    const queryTime = Date.now() - startTime;
    logger.perf(`⚡ Detalhes Setor ${codigo}: ${queryTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        setor: setorResult[0],
        metricas: metricasResult[0] || {},
        historico: historicoResult,
        protocolos: protocolosResult,
        membros: membrosResult,
      },
    });
  }
);

// Revalidação ISR
export const revalidate = 300; // 5 minutos
