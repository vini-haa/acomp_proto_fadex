/**
 * Queries SQL para análise temporal MACRO (visão geral da fundação)
 *
 * Gera queries para entradas na fundação (via Projetos/Secretaria)
 * vs saídas (protocolos arquivados).
 */

import { SETORES } from "@/lib/constants";

// Constantes locais para montar as queries
const SETOR_ARQUIVO = SETORES.ARQUIVO;
const SETORES_ENTRADA = [...SETORES.ENTRADA];
const SETORES_PERMITIDOS = [...SETORES.RELEVANTES_MACRO];

/**
 * Query macro temporal por dia (7d, 30d)
 */
export function buildMacroDiasQuery(dias: number): string {
  const setoresIn = SETORES_PERMITIDOS.join(",");
  const setoresEntradaIn = SETORES_ENTRADA.join(",");

  return `
    WITH Dias AS (
        SELECT DISTINCT FORMAT(m.data, 'yyyy-MM-dd') AS periodo
        FROM scd_movimentacao m
        WHERE m.data >= DATEADD(DAY, -${dias}, GETDATE())
          AND m.Deletado IS NULL
          AND m.codsetordestino IN (${setoresIn})
    )
    SELECT
        d.periodo,
        COALESCE(ent.qtd_entradas, 0) AS qtdEntradas,
        COALESCE(sai.qtd_saidas, 0) AS qtdSaidas,
        COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0) AS saldoPeriodo,
        SUM(COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0))
            OVER (ORDER BY d.periodo ROWS UNBOUNDED PRECEDING) AS saldoAcumulado
    FROM Dias d
    LEFT JOIN (
        -- Entradas: primeira vez que o protocolo chegou em Projetos/Secretaria
        SELECT FORMAT(primeira_entrada, 'yyyy-MM-dd') AS periodo, COUNT(*) AS qtd_entradas
        FROM (
            SELECT m.codprot, MIN(m.data) AS primeira_entrada
            FROM scd_movimentacao m
            WHERE m.Deletado IS NULL
              AND m.codsetordestino IN (${setoresEntradaIn})
            GROUP BY m.codprot
        ) pe
        WHERE pe.primeira_entrada >= DATEADD(DAY, -${dias}, GETDATE())
        GROUP BY FORMAT(primeira_entrada, 'yyyy-MM-dd')
    ) ent ON d.periodo = ent.periodo
    LEFT JOIN (
        -- Saídas: protocolos que chegaram ao ARQUIVO (finalizados)
        SELECT FORMAT(m.data, 'yyyy-MM-dd') AS periodo, COUNT(DISTINCT m.codprot) AS qtd_saidas
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${SETOR_ARQUIVO}
          AND m.data >= DATEADD(DAY, -${dias}, GETDATE())
          AND m.Deletado IS NULL
        GROUP BY FORMAT(m.data, 'yyyy-MM-dd')
    ) sai ON d.periodo = sai.periodo
    WHERE d.periodo IS NOT NULL
    ORDER BY d.periodo;
  `;
}

/**
 * Query macro temporal por semana (90d)
 */
export function buildMacroSemanasQuery(): string {
  const setoresIn = SETORES_PERMITIDOS.join(",");
  const setoresEntradaIn = SETORES_ENTRADA.join(",");

  return `
    WITH Semanas AS (
        SELECT DISTINCT
            CONCAT(YEAR(m.data), '-S', RIGHT('0' + CAST(DATEPART(ISO_WEEK, m.data) AS VARCHAR), 2)) AS periodo
        FROM scd_movimentacao m
        WHERE m.data >= DATEADD(DAY, -90, GETDATE())
          AND m.Deletado IS NULL
          AND m.codsetordestino IN (${setoresIn})
    )
    SELECT
        s.periodo,
        COALESCE(ent.qtd_entradas, 0) AS qtdEntradas,
        COALESCE(sai.qtd_saidas, 0) AS qtdSaidas,
        COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0) AS saldoPeriodo,
        SUM(COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0))
            OVER (ORDER BY s.periodo ROWS UNBOUNDED PRECEDING) AS saldoAcumulado
    FROM (SELECT DISTINCT periodo FROM Semanas) s
    LEFT JOIN (
        -- Entradas: primeira vez que o protocolo chegou em Projetos/Secretaria
        SELECT
            CONCAT(YEAR(primeira_entrada), '-S', RIGHT('0' + CAST(DATEPART(ISO_WEEK, primeira_entrada) AS VARCHAR), 2)) AS periodo,
            COUNT(*) AS qtd_entradas
        FROM (
            SELECT m.codprot, MIN(m.data) AS primeira_entrada
            FROM scd_movimentacao m
            WHERE m.Deletado IS NULL
              AND m.codsetordestino IN (${setoresEntradaIn})
            GROUP BY m.codprot
        ) pe
        WHERE pe.primeira_entrada >= DATEADD(DAY, -90, GETDATE())
        GROUP BY YEAR(primeira_entrada), DATEPART(ISO_WEEK, primeira_entrada)
    ) ent ON s.periodo = ent.periodo
    LEFT JOIN (
        SELECT
            CONCAT(YEAR(m.data), '-S', RIGHT('0' + CAST(DATEPART(ISO_WEEK, m.data) AS VARCHAR), 2)) AS periodo,
            COUNT(DISTINCT m.codprot) AS qtd_saidas
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${SETOR_ARQUIVO}
          AND m.data >= DATEADD(DAY, -90, GETDATE())
          AND m.Deletado IS NULL
        GROUP BY YEAR(m.data), DATEPART(ISO_WEEK, m.data)
    ) sai ON s.periodo = sai.periodo
    WHERE s.periodo IS NOT NULL
    ORDER BY s.periodo;
  `;
}

/**
 * Query macro temporal por mês (YTD - Year to Date)
 */
export function buildMacroMesesYTDQuery(): string {
  const setoresIn = SETORES_PERMITIDOS.join(",");
  const setoresEntradaIn = SETORES_ENTRADA.join(",");

  return `
    WITH Meses AS (
        SELECT DISTINCT FORMAT(m.data, 'yyyy-MM') AS periodo
        FROM scd_movimentacao m
        WHERE m.data >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
          AND m.Deletado IS NULL
          AND m.codsetordestino IN (${setoresIn})
    )
    SELECT
        ms.periodo,
        COALESCE(ent.qtd_entradas, 0) AS qtdEntradas,
        COALESCE(sai.qtd_saidas, 0) AS qtdSaidas,
        COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0) AS saldoPeriodo,
        SUM(COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0))
            OVER (ORDER BY ms.periodo ROWS UNBOUNDED PRECEDING) AS saldoAcumulado
    FROM Meses ms
    LEFT JOIN (
        -- Entradas: primeira vez que o protocolo chegou em Projetos/Secretaria
        SELECT FORMAT(primeira_entrada, 'yyyy-MM') AS periodo, COUNT(*) AS qtd_entradas
        FROM (
            SELECT m.codprot, MIN(m.data) AS primeira_entrada
            FROM scd_movimentacao m
            WHERE m.Deletado IS NULL
              AND m.codsetordestino IN (${setoresEntradaIn})
            GROUP BY m.codprot
        ) pe
        WHERE pe.primeira_entrada >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
        GROUP BY FORMAT(primeira_entrada, 'yyyy-MM')
    ) ent ON ms.periodo = ent.periodo
    LEFT JOIN (
        SELECT FORMAT(m.data, 'yyyy-MM') AS periodo, COUNT(DISTINCT m.codprot) AS qtd_saidas
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${SETOR_ARQUIVO}
          AND m.data >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
          AND m.Deletado IS NULL
        GROUP BY FORMAT(m.data, 'yyyy-MM')
    ) sai ON ms.periodo = sai.periodo
    WHERE ms.periodo IS NOT NULL
    ORDER BY ms.periodo;
  `;
}

/**
 * Query macro temporal por mês (12m)
 */
export function buildMacroMeses12MQuery(): string {
  const setoresIn = SETORES_PERMITIDOS.join(",");
  const setoresEntradaIn = SETORES_ENTRADA.join(",");

  return `
    WITH Meses AS (
        SELECT DISTINCT FORMAT(m.data, 'yyyy-MM') AS periodo
        FROM scd_movimentacao m
        WHERE m.data >= DATEADD(MONTH, -12, GETDATE())
          AND m.Deletado IS NULL
          AND m.codsetordestino IN (${setoresIn})
    )
    SELECT
        ms.periodo,
        COALESCE(ent.qtd_entradas, 0) AS qtdEntradas,
        COALESCE(sai.qtd_saidas, 0) AS qtdSaidas,
        COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0) AS saldoPeriodo,
        SUM(COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0))
            OVER (ORDER BY ms.periodo ROWS UNBOUNDED PRECEDING) AS saldoAcumulado
    FROM Meses ms
    LEFT JOIN (
        -- Entradas: primeira vez que o protocolo chegou em Projetos/Secretaria
        SELECT FORMAT(primeira_entrada, 'yyyy-MM') AS periodo, COUNT(*) AS qtd_entradas
        FROM (
            SELECT m.codprot, MIN(m.data) AS primeira_entrada
            FROM scd_movimentacao m
            WHERE m.Deletado IS NULL
              AND m.codsetordestino IN (${setoresEntradaIn})
            GROUP BY m.codprot
        ) pe
        WHERE pe.primeira_entrada >= DATEADD(MONTH, -12, GETDATE())
        GROUP BY FORMAT(primeira_entrada, 'yyyy-MM')
    ) ent ON ms.periodo = ent.periodo
    LEFT JOIN (
        SELECT FORMAT(m.data, 'yyyy-MM') AS periodo, COUNT(DISTINCT m.codprot) AS qtd_saidas
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${SETOR_ARQUIVO}
          AND m.data >= DATEADD(MONTH, -12, GETDATE())
          AND m.Deletado IS NULL
        GROUP BY FORMAT(m.data, 'yyyy-MM')
    ) sai ON ms.periodo = sai.periodo
    WHERE ms.periodo IS NOT NULL
    ORDER BY ms.periodo;
  `;
}

/**
 * Seleciona a query macro correta baseada no período
 */
export function buildTemporalMacroQuery(periodo: string): string {
  if (periodo === "7d") {
    return buildMacroDiasQuery(7);
  } else if (periodo === "30d") {
    return buildMacroDiasQuery(30);
  } else if (periodo === "90d") {
    return buildMacroSemanasQuery();
  } else if (periodo === "ytd") {
    return buildMacroMesesYTDQuery();
  } else {
    // 12m (default)
    return buildMacroMeses12MQuery();
  }
}
