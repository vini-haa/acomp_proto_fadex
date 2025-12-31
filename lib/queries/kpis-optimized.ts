/**
 * Queries SQL OTIMIZADAS para KPIs principais
 *
 * MUDANÇA CRÍTICA: Usa BASE_CTE_LIGHT em vez do CTE completo
 * para reduzir tempo de execução de 7s para ~2s
 *
 * ATUALIZAÇÃO: Agora suporta filtro de setor dinâmico
 * ATUALIZAÇÃO 2: Suporta visão macro (todos os setores)
 * ATUALIZAÇÃO 3: Usa constantes centralizadas de lib/constants.ts
 */

import { withBaseCTELight, SETOR_FINANCEIRO } from "./base-cte-light";
import { SETORES } from "@/lib/constants";

// Setor de Arquivo (indica protocolo finalizado)
const SETOR_ARQUIVO = SETORES.ARQUIVO;

// Setores de entrada na fundação (Projetos e Secretaria)
const SETORES_ENTRADA = [...SETORES.ENTRADA];

// Setores relevantes para análise macro
const SETORES_PERMITIDOS = [...SETORES.RELEVANTES_MACRO];

/**
 * Query OTIMIZADA de KPIs - Usa CTE simplificado
 * Reduz de 140 linhas de CTE para 50 linhas
 *
 * @param _periodo - RESERVADO para uso futuro. Atualmente não utilizado.
 *                   Os KPIs mostram sempre dados atuais (totalEmAndamento) ou últimos 90 dias (médias).
 *                   Mantido na assinatura para compatibilidade com a API /api/kpis?periodo=...
 * @param codigoSetor - Código do setor (padrão: 48 - Financeiro)
 */
export function buildKPIsQueryOptimized(
  _periodo: string = "all",
  codigoSetor: number = SETOR_FINANCEIRO
): string {
  const queryInner = `
SELECT
    -- 1. Total de protocolos ATUALMENTE no setor (com RegAtual=1)
    -- NOTA: Não é afetado pelo filtro de período - sempre mostra o total atual
    SUM(CASE WHEN vp.ainda_no_setor = 1 THEN 1 ELSE 0 END) AS totalEmAndamento,

    -- 2. Novos protocolos que ENTRARAM no setor durante o mês atual
    -- NOTA: Sempre mostra os novos do mês atual, independente do filtro
    SUM(CASE
        WHEN vp.dt_entrada >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
             AND vp.dt_entrada < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
        THEN 1
        ELSE 0
    END) AS novosMesAtual,

    -- 3. Média de dias de permanência (SEMPRE últimos 90d - não afetado pelo filtro)
    AVG(CASE
        WHEN vp.status_protocolo = 'Finalizado'
             AND vp.dt_saida >= DATEADD(DAY, -90, GETDATE())
        THEN CAST(vp.dias_no_financeiro AS FLOAT)
    END) AS mediaDiasFinanceiro,

    -- 4. Menor tempo de permanência (SEMPRE últimos 90d - não afetado pelo filtro)
    MIN(CASE
        WHEN vp.status_protocolo = 'Finalizado'
             AND vp.dt_saida >= DATEADD(DAY, -90, GETDATE())
        THEN vp.dias_no_financeiro
    END) AS minDiasFinanceiro,

    -- 5. Maior tempo de permanência (SEMPRE últimos 90d - não afetado pelo filtro)
    MAX(CASE
        WHEN vp.status_protocolo = 'Finalizado'
             AND vp.dt_saida >= DATEADD(DAY, -90, GETDATE())
        THEN vp.dias_no_financeiro
    END) AS maxDiasFinanceiro,

    -- 6. Em Dia: até 14 dias ATUALMENTE no setor
    -- NOTA: Não é afetado pelo filtro de período - sempre mostra o total atual
    SUM(CASE
        WHEN vp.ainda_no_setor = 1
             AND vp.dias_no_financeiro < 15
        THEN 1
        ELSE 0
    END) AS emDiaMenos15Dias,

    -- 7. Urgentes: entre 15-30 dias ATUALMENTE no setor
    -- NOTA: Não é afetado pelo filtro de período - sempre mostra o total atual
    SUM(CASE
        WHEN vp.ainda_no_setor = 1
             AND vp.dias_no_financeiro BETWEEN 15 AND 30
        THEN 1
        ELSE 0
    END) AS urgentes15a30Dias,

    -- 8. Críticos: mais de 30 dias ATUALMENTE no setor
    -- NOTA: Não é afetado pelo filtro de período - sempre mostra o total atual
    SUM(CASE
        WHEN vp.ainda_no_setor = 1
             AND vp.dias_no_financeiro > 30
        THEN 1
        ELSE 0
    END) AS criticosMais30Dias
FROM vw_ProtocolosFinanceiro vp;
`;

  return withBaseCTELight(queryInner, codigoSetor);
}

/**
 * Query SUPER RÁPIDA apenas para contadores principais
 * Usa apenas o primeiro CTE, sem calcular dias
 */
export const GET_KPIS_FAST = withBaseCTELight(`
SELECT
    -- Contadores simples sem cálculos complexos
    SUM(CASE WHEN vp.ainda_no_setor = 1 THEN 1 ELSE 0 END) AS totalEmAndamento,
    SUM(CASE WHEN vp.ainda_no_setor = 1 AND vp.dias_no_financeiro > 30 THEN 1 ELSE 0 END) AS criticosMais30Dias,
    SUM(CASE WHEN vp.ainda_no_setor = 1 AND vp.dias_no_financeiro BETWEEN 15 AND 30 THEN 1 ELSE 0 END) AS urgentes15a30Dias,
    COUNT(*) AS totalNoPeriodo
FROM vw_ProtocolosFinanceiro vp;
`);

/**
 * Query para VISÃO MACRO (Todos os Setores)
 * Mostra métricas gerais da fundação:
 * - Protocolos que entraram na fundação
 * - Protocolos finalizados (chegaram ao ARQUIVO)
 * - Tempo médio da entrada até finalização
 * - Distribuição de status em todos os setores
 */
export function buildKPIsMacroQuery(): string {
  const setoresIn = SETORES_PERMITIDOS.join(",");
  const setoresEntradaIn = SETORES_ENTRADA.join(",");

  return `
WITH PrimeiraEntrada AS (
    -- Entrada na fundação: primeira vez que o protocolo chegou em Projetos ou Secretaria
    SELECT
        m.codprot,
        MIN(m.data) AS dt_primeira_entrada
    FROM scd_movimentacao m
    WHERE m.Deletado IS NULL
      AND m.codsetordestino IN (${setoresEntradaIn})
    GROUP BY m.codprot
),
ProtocolosFinalizados AS (
    -- Protocolos que chegaram ao ARQUIVO (finalizados)
    SELECT
        m.codprot,
        MIN(m.data) AS dt_finalizacao
    FROM scd_movimentacao m
    WHERE m.Deletado IS NULL
      AND m.codsetordestino = ${SETOR_ARQUIVO}
    GROUP BY m.codprot
),
ProtocolosAtuaisEmSetores AS (
    -- Protocolos que ESTÃO em algum setor agora (RegAtual = 1)
    -- Exclui o ARQUIVO pois lá são os finalizados
    SELECT
        m.codprot,
        m.codsetordestino AS setor_atual,
        m.data AS dt_entrada_setor_atual
    FROM scd_movimentacao m
    WHERE m.RegAtual = 1
      AND m.Deletado IS NULL
      AND m.codsetordestino IN (${setoresIn})
      AND m.codsetordestino != ${SETOR_ARQUIVO}
),
ProtocolosComTempo AS (
    SELECT
        pe.codprot,
        pe.dt_primeira_entrada,
        pf.dt_finalizacao,
        pa.setor_atual,
        pa.dt_entrada_setor_atual,
        -- Dias desde que entrou no setor atual
        CASE
            WHEN pa.codprot IS NOT NULL
            THEN DATEDIFF(DAY, pa.dt_entrada_setor_atual, GETDATE())
            ELSE NULL
        END AS dias_no_setor_atual,
        -- Tempo total até finalização
        CASE
            WHEN pf.codprot IS NOT NULL
            THEN DATEDIFF(DAY, pe.dt_primeira_entrada, pf.dt_finalizacao)
            ELSE NULL
        END AS dias_ate_finalizacao
    FROM PrimeiraEntrada pe
    LEFT JOIN ProtocolosFinalizados pf ON pf.codprot = pe.codprot
    LEFT JOIN ProtocolosAtuaisEmSetores pa ON pa.codprot = pe.codprot
)
SELECT
    -- 1. Total de protocolos em andamento (em algum setor, exceto ARQUIVO)
    COUNT(DISTINCT CASE WHEN setor_atual IS NOT NULL THEN codprot END) AS totalEmAndamento,

    -- 2. Novos protocolos que ENTRARAM na fundação no mês atual
    COUNT(DISTINCT CASE
        WHEN dt_primeira_entrada >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1)
             AND dt_primeira_entrada < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
        THEN codprot
    END) AS novosMesAtual,

    -- 3. Média de dias até finalização (últimos 90 dias)
    AVG(CASE
        WHEN dt_finalizacao >= DATEADD(DAY, -90, GETDATE())
        THEN CAST(dias_ate_finalizacao AS FLOAT)
    END) AS mediaDiasFinanceiro,

    -- 4. Menor tempo até finalização (últimos 90 dias)
    MIN(CASE
        WHEN dt_finalizacao >= DATEADD(DAY, -90, GETDATE())
        THEN dias_ate_finalizacao
    END) AS minDiasFinanceiro,

    -- 5. Maior tempo até finalização (últimos 90 dias)
    MAX(CASE
        WHEN dt_finalizacao >= DATEADD(DAY, -90, GETDATE())
        THEN dias_ate_finalizacao
    END) AS maxDiasFinanceiro,

    -- 6. Em Dia: protocolos em setores há menos de 15 dias
    COUNT(DISTINCT CASE
        WHEN setor_atual IS NOT NULL AND dias_no_setor_atual < 15
        THEN codprot
    END) AS emDiaMenos15Dias,

    -- 7. Urgentes: protocolos em setores entre 15-30 dias
    COUNT(DISTINCT CASE
        WHEN setor_atual IS NOT NULL AND dias_no_setor_atual BETWEEN 15 AND 30
        THEN codprot
    END) AS urgentes15a30Dias,

    -- 8. Críticos: protocolos em setores há mais de 30 dias
    COUNT(DISTINCT CASE
        WHEN setor_atual IS NOT NULL AND dias_no_setor_atual > 30
        THEN codprot
    END) AS criticosMais30Dias

FROM ProtocolosComTempo;
`;
}
