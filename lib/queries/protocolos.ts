/**
 * Queries SQL para Protocolos
 */

import { ProtocoloFilters } from "@/types";
import { withBaseCTE } from "./base-cte";
import { buildProtocoloFilterConditions, buildOrderByClause } from "./filter-builder";

/**
 * Gera query de listagem de protocolos com filtros dinâmicos
 */
export function buildProtocolosListQuery(filters: ProtocoloFilters): {
  query: string;
  params: Record<string, unknown>;
} {
  const { whereClause, params } = buildProtocoloFilterConditions(filters);
  const orderByClause = buildOrderByClause(filters);

  const queryInner = `
    SELECT
        vp.codprot,
        d.numero AS numeroDocumento,
        d.assunto,
        d.remetente,
        c.titulo AS projeto,
        c.numconv,
        cc.cc AS contaCorrente,
        so.descr AS setorOrigem,
        sd.descr AS setorDestinoAtual,
        vp.dt_entrada AS dtEntrada,
        vp.dt_saida AS dtSaida,
        vp.dt_ultima_movimentacao AS dtUltimaMovimentacao,
        vp.status_protocolo AS statusProtocolo,
        vp.dias_no_financeiro AS diasNoFinanceiro,
        vp.faixa_tempo AS faixaTempo,
        vp.periodo_entrada AS periodoEntrada,
        vp.ano_entrada AS anoEntrada,
        vp.mes_entrada AS mesEntrada,
        vp.dia_semana_num AS diaSemanaNum,
        vp.hora_entrada AS horaEntrada,
        CASE
            WHEN vp.status_protocolo = 'Em Andamento' AND vp.dias_no_financeiro > 30 THEN 'danger'
            WHEN vp.status_protocolo = 'Em Andamento' AND vp.dias_no_financeiro > 15 THEN 'warning'
            WHEN vp.status_protocolo = 'Em Andamento' THEN 'info'
            ELSE 'success'
        END AS statusVisual,
        -- Indicadores de relacionamento Mãe/Filho
        (SELECT COUNT(*) FROM scd_movimentacaoItem smi
         WHERE smi.CodProt = vp.codprot AND smi.CodProtRel IS NOT NULL
         AND (smi.deletado IS NULL OR smi.deletado = 0)) AS qtdFilhos,
        (SELECT COUNT(*) FROM scd_movimentacaoItem smi
         WHERE smi.CodProtRel = vp.codprot
         AND (smi.deletado IS NULL OR smi.deletado = 0)) AS ehFilhoDe
    FROM vw_ProtocolosFinanceiro vp
        LEFT JOIN documento d ON d.codigo = vp.codprot AND d.deletado IS NULL
        LEFT JOIN convenio c ON d.numconv = c.numconv AND c.deletado IS NULL
        LEFT JOIN conv_cc ccc ON c.numconv = ccc.numconv
            AND ccc.deletado IS NULL AND ccc.principal = 1
        LEFT JOIN cc ON ccc.codcc = cc.codigo AND cc.deletado IS NULL
        LEFT JOIN setor so ON so.codigo = vp.setor_origem_inicial
        LEFT JOIN setor sd ON sd.codigo = vp.setor_atual
    ${whereClause}
    ${orderByClause}
  `;

  const query = withBaseCTE(queryInner);

  return { query, params };
}

/**
 * Query para contar total de protocolos (para paginação)
 */
export function buildProtocolosCountQuery(filters: ProtocoloFilters): {
  query: string;
  params: Record<string, unknown>;
} {
  const { whereClause, params } = buildProtocoloFilterConditions(filters);

  const queryInner = `
    SELECT COUNT(*) AS total
    FROM vw_ProtocolosFinanceiro vp
        LEFT JOIN documento d ON d.codigo = vp.codprot AND d.deletado IS NULL
        LEFT JOIN convenio c ON d.numconv = c.numconv AND c.deletado IS NULL
    ${whereClause}
  `;

  const query = withBaseCTE(queryInner);

  return { query, params };
}

/**
 * Query para obter detalhe de um protocolo (IMPARCIAL - todos os setores)
 * Esta query não foca em nenhum setor específico, mostrando o fluxo completo do protocolo
 * Usa RegAtual para determinar status: 1 = Em Andamento, 0 = Finalizado
 */
export const GET_PROTOCOLO_BY_ID = `
WITH PrimeiraMovimentacao AS (
    SELECT
        codprot,
        MIN(data) AS dt_primeira_movimentacao
    FROM scd_movimentacao
    WHERE codprot = @id AND Deletado IS NULL
    GROUP BY codprot
),
UltimaMovimentacao AS (
    SELECT
        codprot,
        MAX(data) AS dt_ultima_movimentacao
    FROM scd_movimentacao
    WHERE codprot = @id AND Deletado IS NULL
    GROUP BY codprot
),
SetorAtualInfo AS (
    SELECT TOP 1
        codprot,
        codsetordestino AS setor_atual_codigo,
        codsetororigem AS setor_origem_codigo,
        RegAtual
    FROM scd_movimentacao
    WHERE codprot = @id AND Deletado IS NULL
    ORDER BY RegAtual DESC, data DESC
),
TotalSetores AS (
    SELECT
        codprot,
        COUNT(DISTINCT codsetordestino) AS qtd_setores_visitados
    FROM scd_movimentacao
    WHERE codprot = @id AND Deletado IS NULL
    GROUP BY codprot
)
SELECT
    d.codigo AS codprot,
    d.numero AS numeroDocumento,
    d.assunto,
    d.remetente,
    c.titulo AS projeto,
    c.numconv,
    cc.cc AS contaCorrente,
    so.descr AS setorOrigem,
    sd.descr AS setorDestinoAtual,
    pm.dt_primeira_movimentacao AS dtEntrada,
    um.dt_ultima_movimentacao AS dtUltimaMovimentacao,
    DATEDIFF(DAY, pm.dt_primeira_movimentacao, GETDATE()) AS diasTramitacao,
    ts.qtd_setores_visitados AS qtdSetoresVisitados,
    -- Status do protocolo: Finalizado quando chega no setor 52 (Arquivo)
    CASE
        WHEN sai.setor_atual_codigo = 52 THEN 'Finalizado'
        ELSE 'Em Andamento'
    END AS statusProtocolo,
    CASE
        WHEN sai.setor_atual_codigo != 52 AND DATEDIFF(DAY, pm.dt_primeira_movimentacao, GETDATE()) > 30 THEN 'danger'
        WHEN sai.setor_atual_codigo != 52 AND DATEDIFF(DAY, pm.dt_primeira_movimentacao, GETDATE()) > 15 THEN 'warning'
        WHEN sai.setor_atual_codigo != 52 THEN 'info'
        ELSE 'success'
    END AS statusVisual,
    CASE
        WHEN DATEDIFF(DAY, pm.dt_primeira_movimentacao, GETDATE()) <= 5 THEN '01. Até 5 dias'
        WHEN DATEDIFF(DAY, pm.dt_primeira_movimentacao, GETDATE()) BETWEEN 6 AND 15 THEN '02. 6-15 dias'
        WHEN DATEDIFF(DAY, pm.dt_primeira_movimentacao, GETDATE()) BETWEEN 16 AND 30 THEN '03. 16-30 dias'
        WHEN DATEDIFF(DAY, pm.dt_primeira_movimentacao, GETDATE()) BETWEEN 31 AND 60 THEN '04. 31-60 dias'
        ELSE '05. Mais de 60 dias'
    END AS faixaTempo,
    FORMAT(pm.dt_primeira_movimentacao, 'yyyy-MM') AS periodoEntrada,
    YEAR(pm.dt_primeira_movimentacao) AS anoEntrada,
    MONTH(pm.dt_primeira_movimentacao) AS mesEntrada
FROM documento d
    LEFT JOIN convenio c ON d.numconv = c.numconv AND c.deletado IS NULL
    LEFT JOIN conv_cc ccc ON c.numconv = ccc.numconv
        AND ccc.deletado IS NULL AND ccc.principal = 1
    LEFT JOIN cc ON ccc.codcc = cc.codigo AND cc.deletado IS NULL
    LEFT JOIN PrimeiraMovimentacao pm ON pm.codprot = d.codigo
    LEFT JOIN UltimaMovimentacao um ON um.codprot = d.codigo
    LEFT JOIN SetorAtualInfo sai ON sai.codprot = d.codigo
    LEFT JOIN TotalSetores ts ON ts.codprot = d.codigo
    LEFT JOIN setor so ON so.codigo = sai.setor_origem_codigo
    LEFT JOIN setor sd ON sd.codigo = sai.setor_atual_codigo
WHERE d.codigo = @id AND d.deletado IS NULL;
`;

/**
 * Query para obter timeline de um protocolo (IMPARCIAL - todos os setores)
 * Mostra o tempo que o protocolo permaneceu em cada setor
 */
export const GET_PROTOCOLO_TIMELINE = `
WITH MovimentacoesOrdenadas AS (
    SELECT
        m.codigo AS idMovimentacao,
        m.codprot,
        m.data AS dataMovimentacao,
        m.codsetororigem,
        m.codsetordestino,
        m.numdocumento,
        m.RegAtual,
        ROW_NUMBER() OVER (PARTITION BY m.codprot ORDER BY m.data) AS ordem,
        LEAD(m.data) OVER (PARTITION BY m.codprot ORDER BY m.data) AS proxima_movimentacao
    FROM scd_movimentacao m
    WHERE m.codprot = @id AND m.Deletado IS NULL
)
SELECT
    mo.idMovimentacao,
    mo.codprot,
    mo.dataMovimentacao,
    FORMAT(mo.dataMovimentacao, 'dd/MM/yyyy HH:mm') AS dataFormatada,
    so.descr AS setorOrigem,
    sd.descr AS setorDestino,
    mo.numdocumento AS numDocumento,
    mo.ordem AS ordemMovimentacao,
    mo.RegAtual AS isAtual,
    -- Tempo desde a movimentação anterior (quanto tempo ficou no setor de origem)
    DATEDIFF(HOUR,
        LAG(mo.dataMovimentacao) OVER (ORDER BY mo.dataMovimentacao),
        mo.dataMovimentacao
    ) AS horasNoSetorAnterior,
    -- Tempo que ficou no setor de destino até a próxima movimentação
    CASE
        WHEN mo.proxima_movimentacao IS NOT NULL THEN
            DATEDIFF(HOUR, mo.dataMovimentacao, mo.proxima_movimentacao)
        WHEN mo.RegAtual = 1 THEN
            DATEDIFF(HOUR, mo.dataMovimentacao, GETDATE())
        ELSE NULL
    END AS horasNoSetorDestino,
    -- Dias no setor destino (mais legível para períodos longos)
    CASE
        WHEN mo.proxima_movimentacao IS NOT NULL THEN
            DATEDIFF(DAY, mo.dataMovimentacao, mo.proxima_movimentacao)
        WHEN mo.RegAtual = 1 THEN
            DATEDIFF(DAY, mo.dataMovimentacao, GETDATE())
        ELSE NULL
    END AS diasNoSetorDestino
FROM MovimentacoesOrdenadas mo
    LEFT JOIN setor so ON so.codigo = mo.codsetororigem
    LEFT JOIN setor sd ON sd.codigo = mo.codsetordestino
ORDER BY mo.dataMovimentacao;
`;
