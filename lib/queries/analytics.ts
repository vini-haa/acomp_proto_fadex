/**
 * Queries SQL para Analytics
 */

import { withBaseCTE } from "./base-cte";

/**
 * Query para série temporal (entrada x saída)
 */
const GET_SERIE_TEMPORAL_INNER = `
WITH Meses AS (
    SELECT DISTINCT FORMAT(dt_entrada, 'yyyy-MM') AS periodo
    FROM vw_ProtocolosFinanceiro
    WHERE dt_entrada >= DATEADD(MONTH, -12, GETDATE())
    UNION
    SELECT DISTINCT FORMAT(dt_saida, 'yyyy-MM')
    FROM vw_ProtocolosFinanceiro
    WHERE dt_saida >= DATEADD(MONTH, -12, GETDATE())
)
SELECT
    m.periodo,
    COALESCE(ent.qtd_entradas, 0) AS qtdEntradas,
    COALESCE(sai.qtd_saidas, 0) AS qtdSaidas,
    COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0) AS saldoPeriodo,
    SUM(COALESCE(ent.qtd_entradas, 0) - COALESCE(sai.qtd_saidas, 0))
        OVER (ORDER BY m.periodo) AS saldoAcumulado
FROM Meses m
LEFT JOIN (
    SELECT FORMAT(dt_entrada, 'yyyy-MM') AS periodo, COUNT(*) AS qtd_entradas
    FROM vw_ProtocolosFinanceiro
    GROUP BY FORMAT(dt_entrada, 'yyyy-MM')
) ent ON m.periodo = ent.periodo
LEFT JOIN (
    SELECT FORMAT(dt_saida, 'yyyy-MM') AS periodo, COUNT(*) AS qtd_saidas
    FROM vw_ProtocolosFinanceiro
    WHERE status_protocolo = 'Finalizado'
    GROUP BY FORMAT(dt_saida, 'yyyy-MM')
) sai ON m.periodo = sai.periodo
WHERE m.periodo IS NOT NULL
ORDER BY m.periodo;
`;

export const GET_SERIE_TEMPORAL = withBaseCTE(GET_SERIE_TEMPORAL_INNER);

/**
 * Query para distribuição por faixa de tempo
 */
const GET_DISTRIBUICAO_FAIXA_INNER = `
SELECT
    vp.faixa_tempo AS faixaTempo,
    vp.status_protocolo AS statusProtocolo,
    COUNT(*) AS quantidade,
    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS DECIMAL(5,2)) AS percentual
FROM vw_ProtocolosFinanceiro vp
WHERE vp.dt_entrada >= DATEADD(YEAR, -1, GETDATE())
GROUP BY vp.faixa_tempo, vp.status_protocolo
ORDER BY vp.faixa_tempo, vp.status_protocolo;
`;

export const GET_DISTRIBUICAO_FAIXA = withBaseCTE(GET_DISTRIBUICAO_FAIXA_INNER);

/**
 * Query para análise por assunto COM NORMALIZAÇÃO
 * Reduz de ~7.022 assuntos para 21 categorias padronizadas
 * Categorias baseadas em rubricas orçamentárias e tipos de documentos
 */
const GET_ANALISE_ASSUNTO_INNER = `
WITH DocumentoNormalizado AS (
    SELECT
        d.codigo,
        CASE
            -- Já está no formato de rubrica orçamentária
            WHEN d.assunto LIKE '33.%' OR d.assunto LIKE '44.%'
                THEN LTRIM(RTRIM(d.assunto))
            -- BOLSAS PESQUISADOR (verificar ANTES de BOLSA)
            WHEN UPPER(d.assunto) LIKE '%PESQUISADOR%'
                THEN '33.90.20 - BOLSAS PESQUISADOR'
            -- BOLSA (genérica)
            WHEN UPPER(d.assunto) LIKE '%BOLSA%'
              OR UPPER(d.assunto) LIKE '%BOLSISTA%'
                THEN '33.90.18 - BOLSA'
            -- DIÁRIAS
            WHEN UPPER(d.assunto) LIKE '%DIARIA%'
              OR UPPER(d.assunto) LIKE '%DIÁRIA%'
                THEN '33.90.14 - DIÁRIAS'
            -- PASSAGENS E LOCOMOÇÃO
            WHEN UPPER(d.assunto) LIKE '%PASSAGEM%'
              OR UPPER(d.assunto) LIKE '%DESLOCAMENTO%'
                THEN '33.90.33 - PASSAGENS E LOCOMOÇÃO'
            -- AUXÍLIO TRANSPORTE
            WHEN UPPER(d.assunto) LIKE '%AUXILIO TRANSPORTE%'
              OR UPPER(d.assunto) LIKE '%AUXÍLIO TRANSPORTE%'
                THEN '33.90.49 - AUXÍLIO TRANSPORTE'
            -- MATERIAL PERMANENTE (verificar ANTES de COMPRAS)
            WHEN UPPER(d.assunto) LIKE '%PERMANENTE%'
              OR UPPER(d.assunto) LIKE '%EQUIPAMENTO%'
                THEN '44.90.52 - MATERIAL PERMANENTE'
            -- MATERIAL DE CONSUMO / COMPRAS
            WHEN UPPER(d.assunto) LIKE '%CONSUMO%'
              OR UPPER(d.assunto) LIKE '%COMPRA%'
                THEN '33.90.30 - MATERIAL DE CONSUMO'
            -- PESSOA FÍSICA (PF)
            WHEN UPPER(d.assunto) LIKE '% PF%'
              OR UPPER(d.assunto) LIKE '%PF %'
              OR UPPER(d.assunto) LIKE '%-PF%'
              OR UPPER(d.assunto) LIKE '%PF-%'
              OR UPPER(d.assunto) LIKE '%PESSOA FISICA%'
              OR UPPER(d.assunto) LIKE '%PESSOA FÍSICA%'
                THEN '33.90.36 - SERVIÇOS PF'
            -- PESSOA JURÍDICA (PJ)
            WHEN UPPER(d.assunto) LIKE '% PJ%'
              OR UPPER(d.assunto) LIKE '%PJ %'
              OR UPPER(d.assunto) LIKE '%-PJ%'
              OR UPPER(d.assunto) LIKE '%PJ-%'
              OR UPPER(d.assunto) LIKE '%PESSOA JURIDICA%'
              OR UPPER(d.assunto) LIKE '%PESSOA JURÍDICA%'
                THEN '33.90.39 - SERVIÇOS PJ'
            -- SUPRIMENTO DE FUNDOS
            WHEN UPPER(d.assunto) LIKE '%SUPRIMENTO%FUNDO%'
                THEN 'SUPRIMENTO DE FUNDOS'
            -- PRESTAÇÃO DE CONTAS
            WHEN UPPER(d.assunto) LIKE '%PRESTA%CONTA%'
                THEN 'PRESTAÇÃO DE CONTAS'
            -- REMANEJAMENTO
            WHEN UPPER(d.assunto) LIKE '%REMANEJAMENTO%'
                THEN 'REMANEJAMENTO'
            -- LOTE DE PAGAMENTOS
            WHEN UPPER(d.assunto) LIKE '%LOTE%PAGAMENTO%'
                THEN 'LOTE DE PAGAMENTOS'
            -- RENDIMENTO
            WHEN UPPER(d.assunto) LIKE '%RENDIMENTO%'
                THEN 'RENDIMENTO'
            -- RELATÓRIO DE VIAGEM
            WHEN UPPER(d.assunto) LIKE '%RELAT%VIAG%'
                THEN 'RELATÓRIO DE VIAGEM'
            -- OFÍCIO
            WHEN UPPER(d.assunto) LIKE '%OFICIO%'
              OR UPPER(d.assunto) LIKE '%OFÍCIO%'
                THEN 'OFÍCIO'
            -- ABERTURA/ENCERRAMENTO DE CONTA
            WHEN UPPER(d.assunto) LIKE '%ABERTURA%CONTA%'
                THEN 'ABERTURA DE CONTA'
            WHEN UPPER(d.assunto) LIKE '%ENCERRAMENTO%CONTA%'
                THEN 'ENCERRAMENTO DE CONTA'
            -- NULL ou vazio
            WHEN d.assunto IS NULL OR LTRIM(RTRIM(d.assunto)) = ''
                THEN '(Sem Assunto)'
            -- Outros não classificados
            ELSE 'OUTROS'
        END AS assunto
    FROM documento d
    WHERE d.deletado IS NULL OR d.deletado = 0
)
SELECT
    dn.assunto,
    COUNT(*) AS totalProtocolos,
    SUM(CASE WHEN vp.status_protocolo = 'Em Andamento' THEN 1 ELSE 0 END) AS emAndamento,
    SUM(CASE WHEN vp.status_protocolo = 'Finalizado' THEN 1 ELSE 0 END) AS finalizados,
    AVG(CASE WHEN vp.status_protocolo = 'Finalizado' THEN vp.dias_no_financeiro END) AS mediaDiasFinalizado,
    MIN(CASE WHEN vp.status_protocolo = 'Finalizado' THEN vp.dias_no_financeiro END) AS minDias,
    MAX(CASE WHEN vp.status_protocolo = 'Finalizado' THEN vp.dias_no_financeiro END) AS maxDias,
    STDEV(CASE WHEN vp.status_protocolo = 'Finalizado' THEN vp.dias_no_financeiro END) AS desvioPadraoDias
FROM vw_ProtocolosFinanceiro vp
    LEFT JOIN DocumentoNormalizado dn ON dn.codigo = vp.codprot
GROUP BY dn.assunto
ORDER BY totalProtocolos DESC;
`;

export const GET_ANALISE_ASSUNTO = withBaseCTE(GET_ANALISE_ASSUNTO_INNER);

/**
 * Query para fluxo entre setores
 */
const GET_FLUXO_SETORES_INNER = `
SELECT
    so.descr AS setorOrigem,
    sd.descr AS setorDestino,
    COUNT(*) AS quantidade,
    AVG(vp.dias_no_financeiro) AS mediaDias,
    SUM(CASE WHEN vp.dias_no_financeiro <= 15 THEN 1 ELSE 0 END) AS rapidos,
    SUM(CASE WHEN vp.dias_no_financeiro > 30 THEN 1 ELSE 0 END) AS demorados
FROM vw_ProtocolosFinanceiro vp
    LEFT JOIN setor so ON so.codigo = vp.setor_origem_inicial
    LEFT JOIN setor sd ON sd.codigo = vp.setor_destino_final
WHERE vp.status_protocolo = 'Finalizado'
  AND vp.dt_entrada >= DATEADD(YEAR, -1, GETDATE())
GROUP BY so.descr, sd.descr
ORDER BY quantidade DESC;
`;

export const GET_FLUXO_SETORES = withBaseCTE(GET_FLUXO_SETORES_INNER);

/**
 * Query para análise por projeto
 * Agrupa apenas por numconv e titulo para evitar duplicação
 */
const GET_ANALISE_PROJETO_INNER = `
SELECT
    c.numconv,
    c.titulo AS projeto,
    COUNT(*) AS totalProtocolos,
    SUM(CASE WHEN vp.status_protocolo = 'Em Andamento' THEN 1 ELSE 0 END) AS emAndamento,
    SUM(CASE WHEN vp.status_protocolo = 'Finalizado' THEN 1 ELSE 0 END) AS finalizados,
    AVG(vp.dias_no_financeiro) AS mediaDias,
    MAX(CASE WHEN vp.status_protocolo = 'Em Andamento' THEN vp.dias_no_financeiro END) AS maxDiasEmAndamento
FROM vw_ProtocolosFinanceiro vp
    LEFT JOIN documento d ON d.codigo = vp.codprot AND d.deletado IS NULL
    LEFT JOIN convenio c ON d.numconv = c.numconv AND c.deletado IS NULL
WHERE vp.dt_entrada >= DATEADD(YEAR, -1, GETDATE())
  AND c.numconv IS NOT NULL
GROUP BY c.numconv, c.titulo
ORDER BY totalProtocolos DESC;
`;

export const GET_ANALISE_PROJETO = withBaseCTE(GET_ANALISE_PROJETO_INNER);

/**
 * Query para heatmap (dia/hora)
 * Considera movimentações para TODOS os setores relevantes nos últimos 6 meses
 * Setores: 43 (TI), 48 (Financeiro), 45 (Administrativa), 40 (Projetos), 56 (Portal), 44 (Secretaria)
 */
export const GET_HEATMAP = `
SELECT
    DATENAME(WEEKDAY, m.data) AS diaSemana,
    DATEPART(WEEKDAY, m.data) AS diaSemanaNum,
    DATEPART(HOUR, m.data) AS hora,
    COUNT(*) AS quantidade
FROM scd_movimentacao m
WHERE m.codsetordestino IN (43, 48, 45, 40, 56, 44)
  AND m.data >= DATEADD(MONTH, -6, GETDATE())
  AND m.Deletado IS NULL
GROUP BY
    DATENAME(WEEKDAY, m.data),
    DATEPART(WEEKDAY, m.data),
    DATEPART(HOUR, m.data)
ORDER BY diaSemanaNum, hora;
`;

/**
 * Query para comparativo YoY (dados mensais de múltiplos anos)
 */
const GET_COMPARATIVO_INNER = `
SELECT
    YEAR(vp.dt_entrada) AS ano,
    MONTH(vp.dt_entrada) AS mes,
    DATENAME(MONTH, vp.dt_entrada) AS mesNome,
    COUNT(*) AS quantidade
FROM vw_ProtocolosFinanceiro vp
WHERE vp.dt_entrada >= DATEADD(YEAR, -3, GETDATE())
GROUP BY
    YEAR(vp.dt_entrada),
    MONTH(vp.dt_entrada),
    DATENAME(MONTH, vp.dt_entrada)
ORDER BY ano, mes;
`;

export const GET_COMPARATIVO = withBaseCTE(GET_COMPARATIVO_INNER);
