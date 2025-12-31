-- ============================================================================
-- QUERIES PARA VALIDAÇÃO DE DADOS DE SETORES
-- Execute estas queries diretamente no banco para verificar os dados
-- ============================================================================

USE [fade1]
GO

-- ============================================================================
-- 1. QUERY BASE - Dados de movimentações do Financeiro (Setor 48)
-- ============================================================================
PRINT '1. MOVIMENTAÇÕES DO SETOR FINANCEIRO (48)';
PRINT '==========================================';
GO

-- Verificar movimentações do setor 48
SELECT TOP 20
    m.codprot,
    m.data AS data_movimentacao,
    m.codsetororigem,
    so.descr AS setor_origem,
    m.codsetordestino,
    sd.descr AS setor_destino,
    CASE
        WHEN m.codsetordestino = 48 THEN 'ENTRADA no Financeiro'
        WHEN m.codsetororigem = 48 THEN 'SAÍDA do Financeiro'
        ELSE 'Outro'
    END AS tipo_movimento
FROM scd_movimentacao m
    LEFT JOIN setor so ON so.codigo = m.codsetororigem
    LEFT JOIN setor sd ON sd.codigo = m.codsetordestino
WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
ORDER BY m.data DESC;
GO

PRINT '';
PRINT '';

-- ============================================================================
-- 2. ANÁLISE DE SETORES POR PROTOCOLO
-- ============================================================================
PRINT '2. ANÁLISE DE ENTRADA/SAÍDA POR PROTOCOLO';
PRINT '==========================================';
GO

-- Ver entrada, saída e setores relacionados por protocolo
WITH MovimentacoesFinanceiro AS (
    SELECT
        m.codprot,
        MIN(CASE WHEN m.codsetordestino = 48 THEN m.data END) AS dt_entrada,
        MAX(CASE WHEN m.codsetororigem = 48 THEN m.data END) AS dt_saida,
        MIN(CASE WHEN m.codsetordestino = 48 THEN m.codsetororigem END) AS setor_origem_inicial,
        MAX(CASE WHEN m.codsetororigem = 48 THEN m.codsetordestino END) AS setor_destino_final
    FROM scd_movimentacao m
    WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
    GROUP BY m.codprot
)
SELECT TOP 20
    mf.codprot,
    mf.dt_entrada,
    mf.dt_saida,
    mf.setor_origem_inicial AS cod_setor_origem,
    so.descr AS setor_origem,
    mf.setor_destino_final AS cod_setor_destino,
    sd.descr AS setor_destino,
    DATEDIFF(DAY, mf.dt_entrada, COALESCE(mf.dt_saida, GETDATE())) AS dias_no_financeiro,
    CASE
        WHEN mf.dt_saida IS NULL THEN 'Em Andamento'
        ELSE 'Finalizado'
    END AS status
FROM MovimentacoesFinanceiro mf
    LEFT JOIN setor so ON so.codigo = mf.setor_origem_inicial
    LEFT JOIN setor sd ON sd.codigo = mf.setor_destino_final
ORDER BY mf.dt_entrada DESC;
GO

PRINT '';
PRINT '';

-- ============================================================================
-- 3. SETOR ATUAL (último setor onde o protocolo está)
-- ============================================================================
PRINT '3. SETOR ATUAL DOS PROTOCOLOS';
PRINT '==============================';
GO

-- Verificar qual é o setor atual de cada protocolo
WITH SetorAtual AS (
    SELECT
        codprot,
        setor_atual
    FROM (
        SELECT DISTINCT
            m1.codprot,
            CASE WHEN m1.codsetororigem = 48 THEN m1.codsetordestino ELSE m1.codsetororigem END AS setor_atual,
            ROW_NUMBER() OVER (PARTITION BY m1.codprot ORDER BY m1.data DESC) AS rn
        FROM scd_movimentacao m1
        WHERE m1.codsetordestino = 48 OR m1.codsetororigem = 48
    ) sub
    WHERE rn = 1
)
SELECT TOP 20
    sa.codprot,
    sa.setor_atual AS cod_setor_atual,
    s.descr AS setor_atual_descricao
FROM SetorAtual sa
    LEFT JOIN setor s ON s.codigo = sa.setor_atual
ORDER BY sa.codprot DESC;
GO

PRINT '';
PRINT '';

-- ============================================================================
-- 4. FLUXO ENTRE SETORES (para o gráfico Sankey)
-- ============================================================================
PRINT '4. FLUXO ENTRE SETORES (Finalizados - Último Ano)';
PRINT '==================================================';
GO

-- Esta é a query usada no gráfico de fluxo de setores
WITH MovimentacoesFinanceiro AS (
    SELECT
        m.codprot,
        MIN(CASE WHEN m.codsetordestino = 48 THEN m.data END) AS dt_entrada,
        MAX(CASE WHEN m.codsetororigem = 48 THEN m.data END) AS dt_saida,
        MIN(CASE WHEN m.codsetordestino = 48 THEN m.codsetororigem END) AS setor_origem_inicial,
        MAX(CASE WHEN m.codsetororigem = 48 THEN m.codsetordestino END) AS setor_destino_final
    FROM scd_movimentacao m
    WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
    GROUP BY m.codprot
),
SetorAtual AS (
    SELECT
        codprot,
        setor_atual
    FROM (
        SELECT DISTINCT
            m1.codprot,
            CASE WHEN m1.codsetororigem = 48 THEN m1.codsetordestino ELSE m1.codsetororigem END AS setor_atual,
            ROW_NUMBER() OVER (PARTITION BY m1.codprot ORDER BY m1.data DESC) AS rn
        FROM scd_movimentacao m1
        WHERE m1.codsetordestino = 48 OR m1.codsetororigem = 48
    ) sub
    WHERE rn = 1
),
vw_ProtocolosFinanceiro AS (
    SELECT
        mf.codprot,
        mf.dt_entrada,
        mf.dt_saida,
        mf.setor_origem_inicial,
        mf.setor_destino_final,
        sa.setor_atual,
        CASE
            WHEN mf.dt_saida IS NULL THEN 'Em Andamento'
            WHEN mf.dt_saida IS NOT NULL AND DATEDIFF(DAY, mf.dt_saida, GETDATE()) <= 90 THEN 'Finalizado'
            ELSE 'Histórico'
        END AS status_protocolo,
        CASE
            WHEN mf.dt_saida IS NULL THEN DATEDIFF(DAY, mf.dt_entrada, GETDATE())
            ELSE DATEDIFF(DAY, mf.dt_entrada, mf.dt_saida)
        END AS dias_no_financeiro
    FROM MovimentacoesFinanceiro mf
    LEFT JOIN SetorAtual sa ON sa.codprot = mf.codprot
    WHERE mf.dt_entrada IS NOT NULL
)
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
GO

PRINT '';
PRINT '';

-- ============================================================================
-- 5. VERIFICAÇÃO DE DADOS INCONSISTENTES
-- ============================================================================
PRINT '5. VERIFICAÇÃO DE POSSÍVEIS INCONSISTÊNCIAS';
PRINT '============================================';
GO

-- Protocolos sem setor de origem
PRINT 'Protocolos SEM setor de origem:';
WITH MovimentacoesFinanceiro AS (
    SELECT
        m.codprot,
        MIN(CASE WHEN m.codsetordestino = 48 THEN m.codsetororigem END) AS setor_origem_inicial
    FROM scd_movimentacao m
    WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
    GROUP BY m.codprot
)
SELECT COUNT(*) AS qtd_sem_origem
FROM MovimentacoesFinanceiro
WHERE setor_origem_inicial IS NULL;
GO

PRINT '';

-- Protocolos sem setor de destino (ainda em andamento)
PRINT 'Protocolos SEM setor de destino (Em Andamento):';
WITH MovimentacoesFinanceiro AS (
    SELECT
        m.codprot,
        MAX(CASE WHEN m.codsetororigem = 48 THEN m.data END) AS dt_saida,
        MAX(CASE WHEN m.codsetororigem = 48 THEN m.codsetordestino END) AS setor_destino_final
    FROM scd_movimentacao m
    WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
    GROUP BY m.codprot
)
SELECT COUNT(*) AS qtd_sem_destino
FROM MovimentacoesFinanceiro
WHERE dt_saida IS NULL AND setor_destino_final IS NULL;
GO

PRINT '';

-- Setores mais comuns de origem
PRINT 'Top 10 Setores de ORIGEM:';
WITH MovimentacoesFinanceiro AS (
    SELECT
        m.codprot,
        MIN(CASE WHEN m.codsetordestino = 48 THEN m.codsetororigem END) AS setor_origem_inicial
    FROM scd_movimentacao m
    WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
    GROUP BY m.codprot
)
SELECT TOP 10
    mf.setor_origem_inicial AS codigo,
    s.descr AS setor,
    COUNT(*) AS quantidade
FROM MovimentacoesFinanceiro mf
    LEFT JOIN setor s ON s.codigo = mf.setor_origem_inicial
GROUP BY mf.setor_origem_inicial, s.descr
ORDER BY quantidade DESC;
GO

PRINT '';

-- Setores mais comuns de destino
PRINT 'Top 10 Setores de DESTINO:';
WITH MovimentacoesFinanceiro AS (
    SELECT
        m.codprot,
        MAX(CASE WHEN m.codsetororigem = 48 THEN m.codsetordestino END) AS setor_destino_final
    FROM scd_movimentacao m
    WHERE m.codsetordestino = 48 OR m.codsetororigem = 48
    GROUP BY m.codprot
)
SELECT TOP 10
    mf.setor_destino_final AS codigo,
    s.descr AS setor,
    COUNT(*) AS quantidade
FROM MovimentacoesFinanceiro mf
    LEFT JOIN setor s ON s.codigo = mf.setor_destino_final
WHERE mf.setor_destino_final IS NOT NULL
GROUP BY mf.setor_destino_final, s.descr
ORDER BY quantidade DESC;
GO

PRINT '';
PRINT '';

-- ============================================================================
-- 6. VALIDAÇÃO DA TABELA SETOR
-- ============================================================================
PRINT '6. VALIDAÇÃO DA TABELA SETOR';
PRINT '=============================';
GO

-- Ver todos os setores cadastrados
PRINT 'Total de setores cadastrados:';
SELECT COUNT(*) AS total_setores FROM setor;
GO

PRINT '';
PRINT 'Primeiros 20 setores:';
SELECT TOP 20
    codigo,
    descr AS descricao
FROM setor
ORDER BY codigo;
GO

PRINT '';
PRINT 'Verificar se o setor 48 (Financeiro) existe:';
SELECT
    codigo,
    descr AS descricao
FROM setor
WHERE codigo = 48;
GO

PRINT '';
PRINT '';
PRINT '============================================================================';
PRINT 'FIM DAS QUERIES DE VALIDAÇÃO';
PRINT '============================================================================';
GO
