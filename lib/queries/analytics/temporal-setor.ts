/**
 * Queries SQL para análise temporal de um setor específico
 *
 * Gera queries para entradas/saídas de protocolos em um setor específico,
 * agrupando por diferentes períodos (dia, semana, mês).
 */

/**
 * Query temporal por dia (7d, 30d)
 */
export function buildTemporalDiasQuery(setor: number, dias: number): string {
  return `
    WITH Dias AS (
        SELECT DISTINCT FORMAT(m.data, 'yyyy-MM-dd') AS periodo
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${setor}
          AND m.data >= DATEADD(DAY, -${dias}, GETDATE())
          AND m.Deletado IS NULL
        UNION
        SELECT DISTINCT FORMAT(m.data, 'yyyy-MM-dd')
        FROM scd_movimentacao m
        WHERE m.codsetororigem = ${setor}
          AND m.data >= DATEADD(DAY, -${dias}, GETDATE())
          AND m.Deletado IS NULL
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
        SELECT FORMAT(m.data, 'yyyy-MM-dd') AS periodo, COUNT(DISTINCT m.codprot) AS qtd_entradas
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${setor}
          AND m.data >= DATEADD(DAY, -${dias}, GETDATE())
          AND m.Deletado IS NULL
        GROUP BY FORMAT(m.data, 'yyyy-MM-dd')
    ) ent ON d.periodo = ent.periodo
    LEFT JOIN (
        SELECT FORMAT(m.data, 'yyyy-MM-dd') AS periodo, COUNT(DISTINCT m.codprot) AS qtd_saidas
        FROM scd_movimentacao m
        WHERE m.codsetororigem = ${setor}
          AND m.data >= DATEADD(DAY, -${dias}, GETDATE())
          AND m.Deletado IS NULL
        GROUP BY FORMAT(m.data, 'yyyy-MM-dd')
    ) sai ON d.periodo = sai.periodo
    WHERE d.periodo IS NOT NULL
    ORDER BY d.periodo;
  `;
}

/**
 * Query temporal por semana (90d)
 */
export function buildTemporalSemanasQuery(setor: number): string {
  return `
    WITH Semanas AS (
        SELECT DISTINCT
            CONCAT(YEAR(m.data), '-S', RIGHT('0' + CAST(DATEPART(ISO_WEEK, m.data) AS VARCHAR), 2)) AS periodo
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${setor}
          AND m.data >= DATEADD(DAY, -90, GETDATE())
          AND m.Deletado IS NULL
        UNION
        SELECT DISTINCT
            CONCAT(YEAR(m.data), '-S', RIGHT('0' + CAST(DATEPART(ISO_WEEK, m.data) AS VARCHAR), 2))
        FROM scd_movimentacao m
        WHERE m.codsetororigem = ${setor}
          AND m.data >= DATEADD(DAY, -90, GETDATE())
          AND m.Deletado IS NULL
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
        SELECT
            CONCAT(YEAR(m.data), '-S', RIGHT('0' + CAST(DATEPART(ISO_WEEK, m.data) AS VARCHAR), 2)) AS periodo,
            COUNT(DISTINCT m.codprot) AS qtd_entradas
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${setor}
          AND m.data >= DATEADD(DAY, -90, GETDATE())
          AND m.Deletado IS NULL
        GROUP BY YEAR(m.data), DATEPART(ISO_WEEK, m.data)
    ) ent ON s.periodo = ent.periodo
    LEFT JOIN (
        SELECT
            CONCAT(YEAR(m.data), '-S', RIGHT('0' + CAST(DATEPART(ISO_WEEK, m.data) AS VARCHAR), 2)) AS periodo,
            COUNT(DISTINCT m.codprot) AS qtd_saidas
        FROM scd_movimentacao m
        WHERE m.codsetororigem = ${setor}
          AND m.data >= DATEADD(DAY, -90, GETDATE())
          AND m.Deletado IS NULL
        GROUP BY YEAR(m.data), DATEPART(ISO_WEEK, m.data)
    ) sai ON s.periodo = sai.periodo
    WHERE s.periodo IS NOT NULL
    ORDER BY s.periodo;
  `;
}

/**
 * Query temporal por mês (YTD - Year to Date)
 */
export function buildTemporalMesesYTDQuery(setor: number): string {
  return `
    WITH Meses AS (
        SELECT DISTINCT FORMAT(m.data, 'yyyy-MM') AS periodo
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${setor}
          AND m.data >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
          AND m.Deletado IS NULL
        UNION
        SELECT DISTINCT FORMAT(m.data, 'yyyy-MM')
        FROM scd_movimentacao m
        WHERE m.codsetororigem = ${setor}
          AND m.data >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
          AND m.Deletado IS NULL
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
        SELECT FORMAT(m.data, 'yyyy-MM') AS periodo, COUNT(DISTINCT m.codprot) AS qtd_entradas
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${setor}
          AND m.data >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
          AND m.Deletado IS NULL
        GROUP BY FORMAT(m.data, 'yyyy-MM')
    ) ent ON ms.periodo = ent.periodo
    LEFT JOIN (
        SELECT FORMAT(m.data, 'yyyy-MM') AS periodo, COUNT(DISTINCT m.codprot) AS qtd_saidas
        FROM scd_movimentacao m
        WHERE m.codsetororigem = ${setor}
          AND m.data >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)
          AND m.Deletado IS NULL
        GROUP BY FORMAT(m.data, 'yyyy-MM')
    ) sai ON ms.periodo = sai.periodo
    WHERE ms.periodo IS NOT NULL
    ORDER BY ms.periodo;
  `;
}

/**
 * Query temporal por mês (12m)
 */
export function buildTemporalMeses12MQuery(setor: number): string {
  return `
    WITH Meses AS (
        SELECT DISTINCT FORMAT(m.data, 'yyyy-MM') AS periodo
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${setor}
          AND m.data >= DATEADD(MONTH, -12, GETDATE())
          AND m.Deletado IS NULL
        UNION
        SELECT DISTINCT FORMAT(m.data, 'yyyy-MM')
        FROM scd_movimentacao m
        WHERE m.codsetororigem = ${setor}
          AND m.data >= DATEADD(MONTH, -12, GETDATE())
          AND m.Deletado IS NULL
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
        SELECT FORMAT(m.data, 'yyyy-MM') AS periodo, COUNT(DISTINCT m.codprot) AS qtd_entradas
        FROM scd_movimentacao m
        WHERE m.codsetordestino = ${setor}
          AND m.data >= DATEADD(MONTH, -12, GETDATE())
          AND m.Deletado IS NULL
        GROUP BY FORMAT(m.data, 'yyyy-MM')
    ) ent ON ms.periodo = ent.periodo
    LEFT JOIN (
        SELECT FORMAT(m.data, 'yyyy-MM') AS periodo, COUNT(DISTINCT m.codprot) AS qtd_saidas
        FROM scd_movimentacao m
        WHERE m.codsetororigem = ${setor}
          AND m.data >= DATEADD(MONTH, -12, GETDATE())
          AND m.Deletado IS NULL
        GROUP BY FORMAT(m.data, 'yyyy-MM')
    ) sai ON ms.periodo = sai.periodo
    WHERE ms.periodo IS NOT NULL
    ORDER BY ms.periodo;
  `;
}

/**
 * Seleciona a query correta baseada no período
 */
export function buildTemporalSetorQuery(setor: number, periodo: string): string {
  if (periodo === "7d") {
    return buildTemporalDiasQuery(setor, 7);
  } else if (periodo === "30d") {
    return buildTemporalDiasQuery(setor, 30);
  } else if (periodo === "90d") {
    return buildTemporalSemanasQuery(setor);
  } else if (periodo === "ytd") {
    return buildTemporalMesesYTDQuery(setor);
  } else {
    // 12m (default)
    return buildTemporalMeses12MQuery(setor);
  }
}
