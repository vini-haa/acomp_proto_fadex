/**
 * CTE Base para TODOS os Protocolos
 *
 * VERSÃO OTIMIZADA (2026-01-28) - Reduz tempo de 10-58s para <5s
 *
 * OTIMIZAÇÕES:
 * 1. Usa ROW_NUMBER() unificado em vez de 3 CTEs separadas (reduz scans)
 * 2. Limita período para protocolos de 2023 em diante (foco no relevante)
 * 3. Combina MIN/MAX na mesma agregação
 * 4. Usa índices: IX_mov_codprot_data e IX_mov_data_setor_prot
 *
 * Conceitos:
 * - RegAtual = 1: Indica onde o protocolo ESTÁ AGORA
 * - Setor 52 (Arquivo): Protocolo finalizado
 * - Dias de Tramitação: Tempo desde primeira movimentação
 */

export const BASE_CTE = `
WITH MovimentacoesPeriodo AS (
    -- Filtra apenas movimentações relevantes (2023+) para reduzir volume
    SELECT
        m.codprot,
        m.data,
        m.codsetororigem,
        m.codsetordestino,
        m.RegAtual,
        m.codigo,
        -- Calcular primeira e última em uma única passada
        ROW_NUMBER() OVER (PARTITION BY m.codprot ORDER BY m.data ASC, m.codigo ASC) AS rn_primeira,
        ROW_NUMBER() OVER (PARTITION BY m.codprot ORDER BY m.RegAtual DESC, m.data DESC, m.codigo DESC) AS rn_atual
    FROM scd_movimentacao m
    WHERE (m.Deletado IS NULL OR m.Deletado = 0)
      AND m.data >= '2023-01-01'
),
ProtocoloResumo AS (
    -- Agrupa informações em uma única CTE
    SELECT
        codprot,
        MIN(CASE WHEN rn_primeira = 1 THEN data END) AS dt_primeira_mov,
        MIN(CASE WHEN rn_primeira = 1 THEN codsetororigem END) AS setor_origem_inicial,
        MAX(data) AS dt_ultima_mov,
        MIN(CASE WHEN rn_atual = 1 THEN codsetordestino END) AS setor_atual,
        MIN(CASE WHEN rn_atual = 1 THEN codsetororigem END) AS setor_origem
    FROM MovimentacoesPeriodo
    GROUP BY codprot
),
vw_ProtocolosFinanceiro AS (
    -- CTE principal com TODOS os protocolos
    -- Mantém o nome para compatibilidade com queries existentes
    SELECT
        pr.codprot,
        pr.dt_primeira_mov AS dt_entrada,
        CASE WHEN pr.setor_atual IN (25, 51, 52, 53, 54, 55) THEN pr.dt_ultima_mov ELSE NULL END AS dt_saida,
        pr.dt_ultima_mov AS dt_ultima_movimentacao,
        pr.setor_origem_inicial,
        pr.setor_atual AS setor_destino_final,
        pr.setor_atual,
        -- Flag se ainda está em tramitação (não está em setor de Arquivo)
        CASE WHEN pr.setor_atual NOT IN (25, 51, 52, 53, 54, 55) THEN 1 ELSE 0 END AS ainda_no_setor,
        -- Status do protocolo: Finalizado quando chega em setor de Arquivo
        CASE
            WHEN pr.setor_atual IN (25, 51, 52, 53, 54, 55) THEN 'Finalizado'
            ELSE 'Em Andamento'
        END AS status_protocolo,
        -- Dias de tramitação (tempo total desde entrada)
        DATEDIFF(DAY, pr.dt_primeira_mov,
            CASE WHEN pr.setor_atual IN (25, 51, 52, 53, 54, 55) THEN pr.dt_ultima_mov ELSE GETDATE() END
        ) AS dias_no_financeiro,
        -- Horas de tramitação
        DATEDIFF(HOUR, pr.dt_primeira_mov,
            CASE WHEN pr.setor_atual IN (25, 51, 52, 53, 54, 55) THEN pr.dt_ultima_mov ELSE GETDATE() END
        ) AS horas_no_financeiro,
        -- Faixa de tempo categorizada (calculada uma única vez)
        CASE
            WHEN DATEDIFF(DAY, pr.dt_primeira_mov,
                CASE WHEN pr.setor_atual IN (25, 51, 52, 53, 54, 55) THEN pr.dt_ultima_mov ELSE GETDATE() END
            ) <= 5 THEN '01. Até 5 dias'
            WHEN DATEDIFF(DAY, pr.dt_primeira_mov,
                CASE WHEN pr.setor_atual IN (25, 51, 52, 53, 54, 55) THEN pr.dt_ultima_mov ELSE GETDATE() END
            ) <= 15 THEN '02. 6-15 dias'
            WHEN DATEDIFF(DAY, pr.dt_primeira_mov,
                CASE WHEN pr.setor_atual IN (25, 51, 52, 53, 54, 55) THEN pr.dt_ultima_mov ELSE GETDATE() END
            ) <= 30 THEN '03. 16-30 dias'
            WHEN DATEDIFF(DAY, pr.dt_primeira_mov,
                CASE WHEN pr.setor_atual IN (25, 51, 52, 53, 54, 55) THEN pr.dt_ultima_mov ELSE GETDATE() END
            ) <= 60 THEN '04. 31-60 dias'
            ELSE '05. Mais de 60 dias'
        END AS faixa_tempo,
        -- Dados temporais para análise
        YEAR(pr.dt_primeira_mov) AS ano_entrada,
        MONTH(pr.dt_primeira_mov) AS mes_entrada,
        DATEPART(WEEK, pr.dt_primeira_mov) AS semana_entrada,
        FORMAT(pr.dt_primeira_mov, 'yyyy-MM') AS periodo_entrada,
        DATENAME(WEEKDAY, pr.dt_primeira_mov) AS dia_semana_entrada,
        DATEPART(WEEKDAY, pr.dt_primeira_mov) AS dia_semana_num,
        DATEPART(HOUR, pr.dt_primeira_mov) AS hora_entrada
    FROM ProtocoloResumo pr
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
