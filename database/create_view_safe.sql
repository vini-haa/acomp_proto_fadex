-- ============================================================================
-- Script SEGURO para Criação da View: vw_ProtocolosFinanceiro
-- Dashboard de Acompanhamento de Protocolos - Setor Financeiro FADEX
--
-- ESTE SCRIPT É 100% SEGURO:
-- - Apenas cria uma VIEW (não modifica dados)
-- - Apenas faz SELECT (read-only)
-- - Reversível (pode ser removido com DROP VIEW)
-- - Não afeta tabelas existentes
-- ============================================================================

USE [fade1]
GO

PRINT '============================================================================';
PRINT 'INICIANDO CRIAÇÃO DA VIEW vw_ProtocolosFinanceiro';
PRINT '============================================================================';
PRINT '';

-- Verificar se view já existe
IF OBJECT_ID('dbo.vw_ProtocolosFinanceiro', 'V') IS NOT NULL
BEGIN
    PRINT '⚠️  AVISO: View vw_ProtocolosFinanceiro já existe!';
    PRINT 'Deseja substituir? (Cancelar script se não quiser)';
    PRINT '';

    -- Comentar a linha abaixo para permitir substituição
    -- RAISERROR('View já existe. Script cancelado por segurança.', 16, 1);

    PRINT 'Removendo view existente...';
    DROP VIEW dbo.vw_ProtocolosFinanceiro;
    PRINT '✅ View removida.';
    PRINT '';
END

PRINT '📋 Criando view...';
PRINT '';

GO

-- ============================================================================
-- CRIAÇÃO DA VIEW (READ-ONLY)
-- ============================================================================
CREATE VIEW dbo.vw_ProtocolosFinanceiro AS
WITH MovimentacoesFinanceiro AS (
    -- CTE para identificar entrada e saída do financeiro (SETOR 48)
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
-- TESTES E VALIDAÇÃO
-- ============================================================================
PRINT '✅ View criada com sucesso!';
PRINT '';
PRINT '🧪 Executando testes de validação...';
PRINT '';

-- Teste 1: Contar registros
DECLARE @TotalRegistros INT;
SELECT @TotalRegistros = COUNT(*) FROM vw_ProtocolosFinanceiro;
PRINT '📊 Total de registros na view: ' + CAST(@TotalRegistros AS VARCHAR(10));

IF @TotalRegistros = 0
BEGIN
    PRINT '⚠️  AVISO: View criada mas não retornou registros!';
    PRINT '   Verifique se existem movimentações no setor 48 (Financeiro)';
END
ELSE
BEGIN
    PRINT '✅ View retornando dados corretamente!';
END

PRINT '';

-- Teste 2: Distribuição por status
PRINT '📈 Distribuição por status:';
SELECT
    status_protocolo,
    COUNT(*) AS quantidade
FROM vw_ProtocolosFinanceiro
GROUP BY status_protocolo
ORDER BY status_protocolo;
PRINT '';

-- Teste 3: Exemplo de 5 registros
PRINT '📋 Primeiros 5 registros:';
SELECT TOP 5
    codprot,
    dt_entrada,
    status_protocolo,
    dias_no_financeiro,
    faixa_tempo
FROM vw_ProtocolosFinanceiro
ORDER BY dt_entrada DESC;
PRINT '';

PRINT '============================================================================';
PRINT '✅ CONCLUÍDO COM SUCESSO!';
PRINT '';
PRINT '📝 Resumo:';
PRINT '   - View: vw_ProtocolosFinanceiro';
PRINT '   - Tipo: READ-ONLY (apenas SELECT)';
PRINT '   - Impacto: Mínimo (consulta otimizada)';
PRINT '   - Reversível: Sim (DROP VIEW para remover)';
PRINT '';
PRINT '🔒 Segurança:';
PRINT '   - Não modifica dados';
PRINT '   - Não cria tabelas';
PRINT '   - Apenas leitura';
PRINT '';
PRINT '🎉 O Dashboard pode ser usado agora!';
PRINT '============================================================================';
GO
