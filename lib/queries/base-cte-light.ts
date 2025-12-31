/**
 * CTE Base SIMPLIFICADO para queries de KPIs e Dashboard
 *
 * OTIMIZAÇÃO CRÍTICA: Esta versão reduz drasticamente a complexidade
 * do CTE base original (140 linhas) para queries que precisam apenas
 * de informações básicas.
 *
 * Usa apenas 2 CTEs em vez de 4, remove cálculos repetidos de faixa_tempo,
 * e elimina campos desnecessários.
 *
 * ATUALIZAÇÃO: Agora suporta filtro de setor dinâmico
 * ATUALIZAÇÃO 2: Usa constantes centralizadas de lib/constants.ts
 */

import { SETORES } from "@/lib/constants";

// Setor padrão (Financeiro) - Exportado para compatibilidade
export const SETOR_FINANCEIRO = SETORES.FINANCEIRO;

/**
 * Gera o CTE base com setor dinâmico
 * @param codigoSetor - Código do setor (padrão: 48 - Financeiro)
 */
export function buildBaseCTELight(codigoSetor: number = SETOR_FINANCEIRO): string {
  return `
WITH ProtocolosAtuaisNoSetor AS (
    -- Protocolos que ESTÃO no setor AGORA (RegAtual = 1)
    SELECT DISTINCT
        m.codprot,
        m.data AS data_entrada_atual
    FROM scd_movimentacao m
    WHERE m.codsetordestino = ${codigoSetor}
      AND m.RegAtual = 1
      AND m.Deletado IS NULL
),
vw_ProtocolosFinanceiro AS (
    -- Versão simplificada com apenas campos essenciais
    SELECT
        m.codprot,
        MIN(CASE WHEN m.codsetordestino = ${codigoSetor} THEN m.data END) AS dt_entrada,
        MAX(CASE WHEN m.codsetororigem = ${codigoSetor} THEN m.data END) AS dt_saida,
        -- Flag se ainda está no setor
        CASE WHEN pas.codprot IS NOT NULL THEN 1 ELSE 0 END AS ainda_no_setor,
        -- Status simplificado
        CASE
            WHEN pas.codprot IS NOT NULL THEN 'Em Andamento'
            WHEN MAX(CASE WHEN m.codsetororigem = ${codigoSetor} THEN m.data END) IS NOT NULL THEN 'Finalizado'
            ELSE 'Histórico'
        END AS status_protocolo,
        -- Dias no setor (calculado uma única vez)
        CASE
            WHEN pas.codprot IS NOT NULL
                THEN DATEDIFF(DAY, MIN(CASE WHEN m.codsetordestino = ${codigoSetor} THEN m.data END), GETDATE())
            WHEN MAX(CASE WHEN m.codsetororigem = ${codigoSetor} THEN m.data END) IS NOT NULL
                THEN DATEDIFF(DAY,
                    MIN(CASE WHEN m.codsetordestino = ${codigoSetor} THEN m.data END),
                    MAX(CASE WHEN m.codsetororigem = ${codigoSetor} THEN m.data END))
            ELSE DATEDIFF(DAY, MIN(CASE WHEN m.codsetordestino = ${codigoSetor} THEN m.data END), GETDATE())
        END AS dias_no_financeiro
    FROM scd_movimentacao m
    LEFT JOIN ProtocolosAtuaisNoSetor pas ON pas.codprot = m.codprot
    WHERE m.codsetordestino = ${codigoSetor} OR m.codsetororigem = ${codigoSetor}
    GROUP BY m.codprot, pas.codprot
)
`;
}

// Mantém compatibilidade com código existente (setor 48 fixo)
export const BASE_CTE_LIGHT = buildBaseCTELight(SETOR_FINANCEIRO);

/**
 * Função helper para injetar a CTE light em uma query
 * @param query - Query SQL
 * @param codigoSetor - Código do setor (opcional, padrão: 48)
 */
export function withBaseCTELight(query: string, codigoSetor?: number): string {
  const cleanQuery = query.trim();
  const cte = codigoSetor !== undefined ? buildBaseCTELight(codigoSetor) : BASE_CTE_LIGHT;

  if (cleanQuery.toUpperCase().startsWith("WITH")) {
    const queryWithoutWith = cleanQuery.substring(4).trim();
    return `${cte},\n${queryWithoutWith}`;
  }

  return `${cte}\n${cleanQuery}`;
}
