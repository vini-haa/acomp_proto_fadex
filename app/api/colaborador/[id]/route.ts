import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";
import type {
  Colaborador,
  ColaboradorMetricas,
  ColaboradorKPIs,
  ColaboradorDetalhes,
} from "@/types/colaborador";

// Cache em memória para detalhes do colaborador
interface CacheEntry {
  data: ColaboradorDetalhes;
  timestamp: number;
}

const cache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Schema de validação dos parâmetros
 */
const paramsSchema = z.object({
  periodo: z.coerce.number().min(1).max(365).optional().default(30),
});

/**
 * GET /api/colaborador/[id]
 * Retorna dados detalhados de um colaborador
 *
 * Parâmetros de query:
 * - periodo: Período em dias para métricas (padrão: 30)
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const startTime = Date.now();
    const { id } = await params;
    const codColaborador = parseInt(id, 10);

    if (isNaN(codColaborador) || codColaborador <= 0) {
      return NextResponse.json(
        { success: false, error: "ID do colaborador inválido" },
        { status: 400 }
      );
    }

    // Validar query params
    const { searchParams } = new URL(request.url);
    const periodoParam = searchParams.get("periodo");
    const validatedParams = paramsSchema.parse({
      periodo: periodoParam ? periodoParam : undefined,
    });
    const { periodo } = validatedParams;

    // Verificar cache
    const cacheKey = `colaborador_${codColaborador}_${periodo}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.perf(`💾 Colaborador ${codColaborador} (cache): ${Date.now() - startTime}ms`);
      return NextResponse.json({ success: true, data: cached.data });
    }

    // Query 1: Dados básicos do colaborador
    const colaboradorQuery = `
      SELECT
        u.Codigo AS codigo,
        u.Nome AS nome,
        ISNULL(u.Login, '') AS login,
        u.email AS email,
        u.codSetor AS codSetor,
        LTRIM(REPLACE(ISNULL(s.descr, 'Não definido'), '- ', '')) AS nomeSetor,
        ISNULL(u.bloqueado, 0) AS bloqueado,
        ISNULL(u.DELETADO, 0) AS deletado
      FROM Usuario u
      LEFT JOIN setor s ON s.codigo = u.codSetor
      WHERE u.Codigo = @codColaborador
    `;

    // Query 2: Métricas do colaborador (período configurável)
    // Nota: tempoMedioTramitacaoHoras mede o tempo que o protocolo ficou no setor
    // antes de ser enviado pelo colaborador
    const metricasQuery = `
      WITH EntradasSetor AS (
        -- Identifica quando protocolos ENTRARAM no setor do colaborador
        SELECT
          m.codprot,
          m.codSetorDestino AS codSetor,
          m.data AS dataEntrada,
          ROW_NUMBER() OVER (PARTITION BY m.codprot, m.codSetorDestino ORDER BY m.data) AS seq
        FROM scd_movimentacao m
        INNER JOIN Usuario u ON u.Codigo = @codColaborador AND u.codSetor = m.codSetorDestino
        WHERE (m.Deletado IS NULL OR m.Deletado = 0)
          AND m.codSetorDestino IS NOT NULL
      ),
      SaidasSetor AS (
        -- Identifica quando protocolos SAÍRAM do setor (enviados pelo colaborador)
        SELECT
          m.codprot,
          m.codSetorOrigem AS codSetor,
          m.data AS dataSaida,
          ROW_NUMBER() OVER (PARTITION BY m.codprot, m.codSetorOrigem ORDER BY m.data) AS seq
        FROM scd_movimentacao m
        WHERE (m.Deletado IS NULL OR m.Deletado = 0)
          AND m.codSetorOrigem IS NOT NULL
          AND m.codUsuario = @codColaborador
          AND m.data >= DATEADD(day, -@periodo, GETDATE())
      ),
      TemposPorProtocolo AS (
        -- Calcula o tempo de tramitação por protocolo
        SELECT
          DATEDIFF(HOUR, e.dataEntrada, s.dataSaida) AS tempoHoras
        FROM SaidasSetor s
        INNER JOIN EntradasSetor e
          ON e.codprot = s.codprot
          AND e.codSetor = s.codSetor
          AND e.seq = s.seq
        WHERE e.dataEntrada < s.dataSaida
      )
      SELECT
        -- Movimentações enviadas no período
        COUNT(DISTINCT CASE
          WHEN m.codUsuario = @codColaborador
          AND m.data >= DATEADD(day, -@periodo, GETDATE())
          THEN m.codigo
        END) AS totalMovimentacoesEnviadas,

        -- Movimentações recebidas no período
        COUNT(DISTINCT CASE
          WHEN m.CodUsuRec = @codColaborador
          AND m.dtRecebimento >= DATEADD(day, -@periodo, GETDATE())
          THEN m.codigo
        END) AS totalMovimentacoesRecebidas,

        -- Protocolos finalizados no período
        COUNT(DISTINCT CASE
          WHEN m.codUsuario = @codColaborador
          AND m.codSituacaoProt = 1
          AND m.data >= DATEADD(day, -@periodo, GETDATE())
          THEN m.codprot
        END) AS totalProtocolosFinalizados,

        -- Tempo médio de tramitação: tempo que o protocolo ficou no setor antes de ser enviado
        (SELECT AVG(CAST(tempoHoras AS FLOAT)) FROM TemposPorProtocolo) AS tempoMedioTramitacaoHoras,

        -- Média de movimentações por dia
        CAST(
          COUNT(DISTINCT CASE
            WHEN m.codUsuario = @codColaborador
            AND m.data >= DATEADD(day, -@periodo, GETDATE())
            THEN m.codigo
          END) AS FLOAT
        ) / @periodo AS mediaMovimentacoesPorDia,

        -- Protocolos em posse atualmente
        (
          SELECT COUNT(DISTINCT m2.codprot)
          FROM scd_movimentacao m2
          WHERE m2.CodUsuRec = @codColaborador
            AND (m2.Deletado IS NULL OR m2.Deletado = 0)
            AND m2.RegAtual = 1
            AND NOT EXISTS (
              SELECT 1 FROM scd_movimentacao m3
              WHERE m3.codprot = m2.codprot
                AND m3.codUsuario = @codColaborador
                AND m3.data > m2.dtRecebimento
                AND (m3.Deletado IS NULL OR m3.Deletado = 0)
            )
        ) AS protocolosEmPosse

      FROM scd_movimentacao m
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND (m.codUsuario = @codColaborador OR m.CodUsuRec = @codColaborador)
    `;

    // Query 3: KPIs principais
    const kpisQuery = `
      WITH TempoEnvio AS (
        -- Calcula o tempo entre receber e enviar para cada protocolo
        SELECT
          m_env.codprot,
          DATEDIFF(HOUR, m_rec.dtRecebimento, m_env.data) AS horasParaEnviar
        FROM scd_movimentacao m_env
        INNER JOIN scd_movimentacao m_rec
          ON m_rec.codprot = m_env.codprot
          AND m_rec.CodUsuRec = @codColaborador
          AND m_rec.dtRecebimento < m_env.data
          AND (m_rec.Deletado IS NULL OR m_rec.Deletado = 0)
        WHERE m_env.codUsuario = @codColaborador
          AND (m_env.Deletado IS NULL OR m_env.Deletado = 0)
          AND m_env.data >= DATEADD(day, -@periodo, GETDATE())
      )
      SELECT
        -- Total de protocolos que participou (enviou ou recebeu) no período
        COUNT(DISTINCT m.codprot) AS totalProtocolos,

        -- Protocolos em andamento (participou e ainda não finalizados)
        COUNT(DISTINCT CASE
          WHEN m.RegAtual = 1
          AND ISNULL(m.codSituacaoProt, 0) NOT IN (1, 5) -- Não finalizado nem arquivado
          THEN m.codprot
        END) AS protocolosEmAndamento,

        -- Protocolos finalizados (que ele finalizou)
        COUNT(DISTINCT CASE
          WHEN m.codUsuario = @codColaborador
          AND m.codSituacaoProt = 1
          THEN m.codprot
        END) AS protocolosFinalizados,

        -- Tempo médio para enviar protocolo (calculado via CTE)
        (SELECT AVG(CAST(horasParaEnviar AS FLOAT)) FROM TempoEnvio) AS tempoMedioEnvioHoras,

        -- Protocolos movimentados hoje
        COUNT(DISTINCT CASE
          WHEN (m.codUsuario = @codColaborador OR m.CodUsuRec = @codColaborador)
          AND CAST(m.data AS DATE) = CAST(GETDATE() AS DATE)
          THEN m.codprot
        END) AS protocolosHoje,

        -- Protocolos movimentados na semana
        COUNT(DISTINCT CASE
          WHEN (m.codUsuario = @codColaborador OR m.CodUsuRec = @codColaborador)
          AND m.data >= DATEADD(day, -7, GETDATE())
          THEN m.codprot
        END) AS protocolosSemana,

        -- Projetos ativos (diferentes projetos que atuou no período)
        COUNT(DISTINCT CASE
          WHEN d.numconv IS NOT NULL
          THEN d.numconv
        END) AS projetosAtivos,

        -- Movimentações hoje
        COUNT(DISTINCT CASE
          WHEN m.codUsuario = @codColaborador
          AND CAST(m.data AS DATE) = CAST(GETDATE() AS DATE)
          THEN m.codigo
        END) AS movimentacoesHoje,

        -- Movimentações na semana
        COUNT(DISTINCT CASE
          WHEN m.codUsuario = @codColaborador
          AND m.data >= DATEADD(day, -7, GETDATE())
          THEN m.codigo
        END) AS movimentacoesSemana,

        -- Média de movimentações por dia (no período)
        CAST(
          COUNT(DISTINCT CASE
            WHEN m.codUsuario = @codColaborador
            THEN m.codigo
          END) AS FLOAT
        ) / @periodo AS mediaMovimentacoesDia

      FROM scd_movimentacao m
      LEFT JOIN documento d ON d.codigo = m.codprot AND (d.deletado IS NULL OR d.deletado = 0)
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND (m.codUsuario = @codColaborador OR m.CodUsuRec = @codColaborador)
        AND m.data >= DATEADD(day, -@periodo, GETDATE())
    `;

    // Query 4 (estatisticasPeriodo) removida — tab "Atividade" ainda não implementada.
    // Será adicionada quando o componente de atividade temporal for criado.

    // Executar queries em paralelo (3 queries)
    const [colaboradorResult, metricasResult, kpisResult] = await Promise.all([
      executeQuery<Colaborador>(colaboradorQuery, { codColaborador }),
      executeQuery<ColaboradorMetricas>(metricasQuery, { codColaborador, periodo }),
      executeQuery<ColaboradorKPIs>(kpisQuery, { codColaborador, periodo }),
    ]);

    // Verificar se colaborador existe
    if (!colaboradorResult || colaboradorResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Colaborador não encontrado" },
        { status: 404 }
      );
    }

    const colaborador = colaboradorResult[0];
    const metricas = metricasResult[0] || {
      totalMovimentacoesEnviadas: 0,
      totalMovimentacoesRecebidas: 0,
      totalProtocolosFinalizados: 0,
      tempoMedioTramitacaoHoras: null,
      mediaMovimentacoesPorDia: 0,
      protocolosEmPosse: 0,
    };

    const kpis = kpisResult[0] || {
      totalProtocolos: 0,
      protocolosEmAndamento: 0,
      protocolosFinalizados: 0,
      tempoMedioEnvioHoras: null,
      protocolosHoje: 0,
      protocolosSemana: 0,
      projetosAtivos: 0,
      movimentacoesHoje: 0,
      movimentacoesSemana: 0,
      mediaMovimentacoesDia: 0,
    };

    // Construir resposta
    const response: ColaboradorDetalhes = {
      colaborador: {
        ...colaborador,
        bloqueado: Boolean(colaborador.bloqueado),
        deletado: Boolean(colaborador.deletado),
        isAtivo: !colaborador.bloqueado && !colaborador.deletado,
      },
      metricas: {
        ...metricas,
        tempoMedioTramitacaoHoras: metricas.tempoMedioTramitacaoHoras
          ? Math.round(metricas.tempoMedioTramitacaoHoras * 10) / 10
          : null,
        mediaMovimentacoesPorDia: Math.round(metricas.mediaMovimentacoesPorDia * 100) / 100,
      },
      kpis: {
        ...kpis,
        tempoMedioEnvioHoras: kpis.tempoMedioEnvioHoras
          ? Math.round(kpis.tempoMedioEnvioHoras * 10) / 10
          : null,
        mediaMovimentacoesDia: Math.round((kpis.mediaMovimentacoesDia || 0) * 100) / 100,
      },
    };

    // Atualizar cache
    cache.set(cacheKey, { data: response, timestamp: Date.now() });

    const queryTime = Date.now() - startTime;
    logger.perf(`⚡ Colaborador ${codColaborador} (${queryTime}ms)`);

    return NextResponse.json({
      success: true,
      data: response,
    });
  }
);

// Sem cache - dados em tempo real
export const dynamic = "force-dynamic";
