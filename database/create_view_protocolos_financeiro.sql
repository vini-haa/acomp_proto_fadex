-- ============================================================================
-- Script de Criação da View: vw_ProtocolosFinanceiro
-- Dashboard de Acompanhamento de Protocolos - Setor Financeiro FADEX
-- ============================================================================
--
-- Descrição:
-- Esta view centraliza todos os dados necessários para o acompanhamento de
-- protocolos que passam pelo setor financeiro (código 48).
--
-- Autor: Dashboard Protocolos FADEX
-- Data: 2025-11-21
-- ============================================================================

USE [FADEX]
GO

-- Remove a view se ela já existir
IF OBJECT_ID('dbo.vw_ProtocolosFinanceiro', 'V') IS NOT NULL
    DROP VIEW dbo.vw_ProtocolosFinanceiro;
GO

CREATE VIEW dbo.vw_ProtocolosFinanceiro AS
WITH MovimentacoesFinanceiro AS (
    -- CTE para identificar entrada e saída do financeiro
    SELECT
        m.codprot,
        MIN(CASE WHEN m.codsetordestino = 48 THEN m.data END) AS dt_entrada,
        MAX(CASE WHEN m.codsetororigem = 48 THEN m.data END) AS dt_saida,
        MAX(m.data) AS dt_ultima_movimentacao,
        MIN(CASE WHEN m.codsetordestino = 48 THEN m.codsetororigem END) AS setor_origem_inicial,
        MAX(CASE WHEN m.codsetororigem = 48 THEN m.codsetordestino END) AS setor_destino_final,
        MAX(CASE
            WHEN m.data = (SELECT MAX(m2.data) FROM scd_movimentacao m2 WHERE m2.codprot = m.codprot)
            THEN CASE WHEN m.codsetororigem = 48 THEN m.codsetordestino ELSE m.codsetororigem END
        END) AS setor_atual
    FROM scd_movimentacao m
    WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
    GROUP BY m.codprot
),
CalculosTempo AS (
    -- CTE para cálculos de tempo
    SELECT
        mf.codprot,
        mf.dt_entrada,
        mf.dt_saida,
        mf.dt_ultima_movimentacao,
        mf.setor_origem_inicial,
        mf.setor_destino_final,
        mf.setor_atual,
        -- Cálculo de dias no financeiro
        CASE
            WHEN mf.dt_saida IS NULL THEN DATEDIFF(DAY, mf.dt_entrada, GETDATE())
            ELSE DATEDIFF(DAY, mf.dt_entrada, mf.dt_saida)
        END AS dias_no_financeiro,
        -- Cálculo de horas no financeiro
        CASE
            WHEN mf.dt_saida IS NULL THEN DATEDIFF(HOUR, mf.dt_entrada, GETDATE())
            ELSE DATEDIFF(HOUR, mf.dt_entrada, mf.dt_saida)
        END AS horas_no_financeiro,
        -- Status do protocolo
        CASE
            WHEN mf.dt_saida IS NULL THEN 'Em Andamento'
            WHEN mf.dt_saida IS NOT NULL AND DATEDIFF(DAY, mf.dt_saida, GETDATE()) <= 90 THEN 'Finalizado'
            ELSE 'Histórico'
        END AS status_protocolo
    FROM MovimentacoesFinanceiro mf
)
SELECT
    ct.codprot,
    ct.dt_entrada,
    ct.dt_saida,
    ct.dt_ultima_movimentacao,
    ct.setor_origem_inicial,
    ct.setor_destino_final,
    ct.setor_atual,
    ct.status_protocolo,
    ct.dias_no_financeiro,
    ct.horas_no_financeiro,
    -- Faixa de tempo categorizada
    CASE
        WHEN ct.dias_no_financeiro <= 5 THEN '01. Até 5 dias'
        WHEN ct.dias_no_financeiro BETWEEN 6 AND 15 THEN '02. 6-15 dias'
        WHEN ct.dias_no_financeiro BETWEEN 16 AND 30 THEN '03. 16-30 dias'
        WHEN ct.dias_no_financeiro BETWEEN 31 AND 60 THEN '04. 31-60 dias'
        ELSE '05. Mais de 60 dias'
    END AS faixa_tempo,
    -- Dados temporais para análise
    YEAR(ct.dt_entrada) AS ano_entrada,
    MONTH(ct.dt_entrada) AS mes_entrada,
    DATEPART(WEEK, ct.dt_entrada) AS semana_entrada,
    FORMAT(ct.dt_entrada, 'yyyy-MM') AS periodo_entrada,
    DATENAME(WEEKDAY, ct.dt_entrada) AS dia_semana_entrada
FROM CalculosTempo ct
WHERE ct.dt_entrada IS NOT NULL;

GO

-- ============================================================================
-- Grants de permissão (ajustar conforme necessário)
-- ============================================================================
GRANT SELECT ON dbo.vw_ProtocolosFinanceiro TO [public];
GO

-- ============================================================================
-- Testes básicos da view
-- ============================================================================
PRINT 'View vw_ProtocolosFinanceiro criada com sucesso!';
PRINT '';
PRINT 'Executando testes básicos...';
PRINT '';

-- Teste 1: Contar registros
DECLARE @TotalRegistros INT;
SELECT @TotalRegistros = COUNT(*) FROM vw_ProtocolosFinanceiro;
PRINT 'Total de registros na view: ' + CAST(@TotalRegistros AS VARCHAR(10));
PRINT '';

-- Teste 2: Distribuição por status
PRINT 'Distribuição por status:';
SELECT
    status_protocolo,
    COUNT(*) AS quantidade
FROM vw_ProtocolosFinanceiro
GROUP BY status_protocolo
ORDER BY status_protocolo;
PRINT '';

-- Teste 3: Distribuição por faixa de tempo (apenas em andamento)
PRINT 'Distribuição por faixa de tempo (Em Andamento):';
SELECT
    faixa_tempo,
    COUNT(*) AS quantidade
FROM vw_ProtocolosFinanceiro
WHERE status_protocolo = 'Em Andamento'
GROUP BY faixa_tempo
ORDER BY faixa_tempo;
PRINT '';

PRINT '============================================================================';
PRINT 'Script executado com sucesso!';
PRINT 'A view vw_ProtocolosFinanceiro está pronta para uso.';
PRINT '============================================================================';
GO
