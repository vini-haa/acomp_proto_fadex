/**
 * Queries SQL para KPIs principais - VERSÃO REFATORADA
 *
 * Baseado em RELATORIO_COMPARATIVO_QUERIES.md
 *
 * Métricas implementadas:
 * 1. Protocolos em andamento ATUALMENTE no setor (ainda_no_setor = 1)
 * 2. Finalizados durante o mês atual (saíram no mês corrente)
 * 3. Protocolos com mais de 30 dias NO SETOR (atualmente)
 * 4. Protocolos entre 15-30 dias (atualmente)
 * 5. Novos protocolos que ENTRARAM no mês atual
 * 6. Média de tempo que protocolos realmente FICAM no setor
 */

import { withBaseCTE } from "./base-cte";

const GET_KPIS_INNER = `
SELECT
    -- 1. Total de protocolos ATUALMENTE no setor (RegAtual = 1)
    SUM(CASE WHEN vp.ainda_no_setor = 1 THEN 1 ELSE 0 END) AS totalEmAndamento,

    -- 2. Protocolos que SAÍRAM do setor durante o mês atual
    SUM(CASE
        WHEN vp.status_protocolo = 'Finalizado'
             AND vp.dt_saida >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
             AND vp.dt_saida < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
        THEN 1
        ELSE 0
    END) AS finalizadosMesAtual,

    -- 3. Novos protocolos que ENTRARAM no mês atual
    SUM(CASE
        WHEN vp.dt_entrada >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
             AND vp.dt_entrada < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
        THEN 1
        ELSE 0
    END) AS novosMesAtual,

    -- 4. Média de dias de permanência (protocolos finalizados nos últimos 90 dias)
    AVG(CASE
        WHEN vp.status_protocolo = 'Finalizado'
             AND vp.dt_saida >= DATEADD(DAY, -90, GETDATE())
        THEN CAST(vp.dias_no_financeiro AS FLOAT)
    END) AS mediaDiasFinanceiro,

    -- 5. Protocolos ATUALMENTE no setor há mais de 30 dias (CRÍTICOS)
    SUM(CASE
        WHEN vp.ainda_no_setor = 1
             AND vp.dias_no_financeiro > 30
        THEN 1
        ELSE 0
    END) AS criticosMais30Dias,

    -- 6. Protocolos ATUALMENTE no setor entre 15-30 dias (URGENTES)
    SUM(CASE
        WHEN vp.ainda_no_setor = 1
             AND vp.dias_no_financeiro BETWEEN 15 AND 30
        THEN 1
        ELSE 0
    END) AS urgentes15a30Dias,

    -- 7. Média de dias dos protocolos ATUALMENTE em andamento
    AVG(CASE
        WHEN vp.ainda_no_setor = 1
        THEN CAST(vp.dias_no_financeiro AS FLOAT)
    END) AS mediaDiasEmAndamento
FROM vw_ProtocolosFinanceiro vp;
`;

export const GET_KPIS = withBaseCTE(GET_KPIS_INNER);

/**
 * Query de KPIs com filtros de período configuráveis
 *
 * @param periodo - Período para análise: 'mes_atual', '30d', '90d', '6m', '1y', 'all'
 */
export function buildKPIsQuery(periodo: string = "mes_atual"): string {
  // Determinar filtro de data baseado no período
  let filtroData = "";

  switch (periodo) {
    case "mes_atual":
      filtroData = `
        AND vp.dt_entrada >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
      `;
      break;
    case "30d":
      filtroData = `AND vp.dt_entrada >= DATEADD(DAY, -30, GETDATE())`;
      break;
    case "90d":
      filtroData = `AND vp.dt_entrada >= DATEADD(DAY, -90, GETDATE())`;
      break;
    case "6m":
      filtroData = `AND vp.dt_entrada >= DATEADD(MONTH, -6, GETDATE())`;
      break;
    case "1y":
      filtroData = `AND vp.dt_entrada >= DATEADD(YEAR, -1, GETDATE())`;
      break;
    case "all":
    default:
      filtroData = ""; // Sem filtro de data
      break;
  }

  const queryInner = `
SELECT
    -- 1. Total de protocolos ATUALMENTE no setor
    SUM(CASE WHEN vp.ainda_no_setor = 1 THEN 1 ELSE 0 END) AS totalEmAndamento,

    -- 2. Protocolos finalizados no mês atual
    SUM(CASE
        WHEN vp.status_protocolo = 'Finalizado'
             AND vp.dt_saida >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
             AND vp.dt_saida < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
        THEN 1
        ELSE 0
    END) AS finalizadosMesAtual,

    -- 3. Novos protocolos do mês atual
    SUM(CASE
        WHEN vp.dt_entrada >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
             AND vp.dt_entrada < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
        THEN 1
        ELSE 0
    END) AS novosMesAtual,

    -- 4. Média de dias de permanência
    AVG(CASE
        WHEN vp.status_protocolo = 'Finalizado'
             AND vp.dt_saida >= DATEADD(DAY, -90, GETDATE())
        THEN CAST(vp.dias_no_financeiro AS FLOAT)
    END) AS mediaDiasFinanceiro,

    -- 5. Críticos: mais de 30 dias ATUALMENTE no setor
    SUM(CASE
        WHEN vp.ainda_no_setor = 1
             AND vp.dias_no_financeiro > 30
        THEN 1
        ELSE 0
    END) AS criticosMais30Dias,

    -- 6. Urgentes: entre 15-30 dias ATUALMENTE no setor
    SUM(CASE
        WHEN vp.ainda_no_setor = 1
             AND vp.dias_no_financeiro BETWEEN 15 AND 30
        THEN 1
        ELSE 0
    END) AS urgentes15a30Dias,

    -- 7. Média de dias dos protocolos em andamento
    AVG(CASE
        WHEN vp.ainda_no_setor = 1
        THEN CAST(vp.dias_no_financeiro AS FLOAT)
    END) AS mediaDiasEmAndamento,

    -- 8. Total de protocolos no período selecionado (para contexto)
    COUNT(*) AS totalNoPeriodo
FROM vw_ProtocolosFinanceiro vp
WHERE 1=1 ${filtroData};
`;

  return withBaseCTE(queryInner);
}
