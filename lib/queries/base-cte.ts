/**
 * CTE Base para TODOS os Protocolos
 *
 * VERSÃO ATUALIZADA - Mostra todos os protocolos do sistema,
 * não apenas os que passaram pelo setor Financeiro.
 *
 * Conceitos:
 * - RegAtual = 1: Indica onde o protocolo ESTÁ AGORA
 * - Setor 52 (Arquivo): Protocolo finalizado
 * - Dias de Tramitação: Tempo desde primeira movimentação
 */

export const BASE_CTE = `
WITH PrimeiraMovimentacao AS (
    -- Primeira movimentação de cada protocolo (entrada no sistema)
    SELECT
        codprot,
        MIN(data) AS dt_primeira_mov,
        MIN(codsetororigem) AS setor_origem_inicial
    FROM scd_movimentacao
    WHERE Deletado IS NULL
    GROUP BY codprot
),
UltimaMovimentacao AS (
    -- Última movimentação de cada protocolo
    SELECT
        codprot,
        MAX(data) AS dt_ultima_mov
    FROM scd_movimentacao
    WHERE Deletado IS NULL
    GROUP BY codprot
),
SetorAtual AS (
    -- Setor onde o protocolo ESTÁ AGORA (baseado em RegAtual = 1 ou última movimentação)
    SELECT
        codprot,
        setor_atual,
        setor_origem
    FROM (
        SELECT
            m.codprot,
            m.codsetordestino AS setor_atual,
            m.codsetororigem AS setor_origem,
            ROW_NUMBER() OVER (PARTITION BY m.codprot ORDER BY m.RegAtual DESC, m.data DESC) AS rn
        FROM scd_movimentacao m
        WHERE m.Deletado IS NULL
    ) sub
    WHERE rn = 1
),
vw_ProtocolosFinanceiro AS (
    -- CTE principal com TODOS os protocolos
    -- Mantém o nome para compatibilidade com queries existentes
    SELECT
        pm.codprot,
        pm.dt_primeira_mov AS dt_entrada,
        CASE WHEN sa.setor_atual = 52 THEN um.dt_ultima_mov ELSE NULL END AS dt_saida,
        um.dt_ultima_mov AS dt_ultima_movimentacao,
        pm.setor_origem_inicial,
        sa.setor_atual AS setor_destino_final,
        sa.setor_atual,
        -- Flag se ainda está em tramitação (não está no Arquivo)
        CASE WHEN sa.setor_atual != 52 THEN 1 ELSE 0 END AS ainda_no_setor,
        -- Status do protocolo: Finalizado quando chega no setor 52 (Arquivo)
        CASE
            WHEN sa.setor_atual = 52 THEN 'Finalizado'
            ELSE 'Em Andamento'
        END AS status_protocolo,
        -- Dias de tramitação (tempo total desde entrada)
        DATEDIFF(DAY, pm.dt_primeira_mov,
            CASE WHEN sa.setor_atual = 52 THEN um.dt_ultima_mov ELSE GETDATE() END
        ) AS dias_no_financeiro,
        -- Horas de tramitação
        DATEDIFF(HOUR, pm.dt_primeira_mov,
            CASE WHEN sa.setor_atual = 52 THEN um.dt_ultima_mov ELSE GETDATE() END
        ) AS horas_no_financeiro,
        -- Faixa de tempo categorizada
        CASE
            WHEN DATEDIFF(DAY, pm.dt_primeira_mov,
                CASE WHEN sa.setor_atual = 52 THEN um.dt_ultima_mov ELSE GETDATE() END
            ) <= 5 THEN '01. Até 5 dias'
            WHEN DATEDIFF(DAY, pm.dt_primeira_mov,
                CASE WHEN sa.setor_atual = 52 THEN um.dt_ultima_mov ELSE GETDATE() END
            ) BETWEEN 6 AND 15 THEN '02. 6-15 dias'
            WHEN DATEDIFF(DAY, pm.dt_primeira_mov,
                CASE WHEN sa.setor_atual = 52 THEN um.dt_ultima_mov ELSE GETDATE() END
            ) BETWEEN 16 AND 30 THEN '03. 16-30 dias'
            WHEN DATEDIFF(DAY, pm.dt_primeira_mov,
                CASE WHEN sa.setor_atual = 52 THEN um.dt_ultima_mov ELSE GETDATE() END
            ) BETWEEN 31 AND 60 THEN '04. 31-60 dias'
            ELSE '05. Mais de 60 dias'
        END AS faixa_tempo,
        -- Dados temporais para análise
        YEAR(pm.dt_primeira_mov) AS ano_entrada,
        MONTH(pm.dt_primeira_mov) AS mes_entrada,
        DATEPART(WEEK, pm.dt_primeira_mov) AS semana_entrada,
        FORMAT(pm.dt_primeira_mov, 'yyyy-MM') AS periodo_entrada,
        DATENAME(WEEKDAY, pm.dt_primeira_mov) AS dia_semana_entrada,
        DATEPART(WEEKDAY, pm.dt_primeira_mov) AS dia_semana_num,
        DATEPART(HOUR, pm.dt_primeira_mov) AS hora_entrada
    FROM PrimeiraMovimentacao pm
    INNER JOIN SetorAtual sa ON sa.codprot = pm.codprot
    LEFT JOIN UltimaMovimentacao um ON um.codprot = pm.codprot
)
`;

/**
 * Função helper para injetar a CTE base em uma query
 *
 * @param query - Query SQL que usa vw_ProtocolosFinanceiro
 * @returns Query com CTE injetada
 */
export function withBaseCTE(query: string): string {
  // Remove qualquer CTE existente da query se houver
  const cleanQuery = query.trim();

  // Se a query já tem WITH, precisamos mesclar os CTEs
  if (cleanQuery.toUpperCase().startsWith("WITH")) {
    // Remove o WITH da query e adiciona vírgula após o BASE_CTE
    const queryWithoutWith = cleanQuery.substring(4).trim();
    return `${BASE_CTE},\n${queryWithoutWith}`;
  }

  // Se não tem WITH, apenas adiciona o BASE_CTE antes
  return `${BASE_CTE}\n${cleanQuery}`;
}
