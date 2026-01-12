-- =============================================================================
-- ÍNDICES RECOMENDADOS PARA OTIMIZAÇÃO DE PERFORMANCE
-- Portal de Acompanhamento de Protocolos - FADEX
-- =============================================================================
--
-- IMPORTANTE: Execute estes scripts em ambiente de TESTE antes de produção!
-- Alguns índices podem levar tempo para serem criados em tabelas grandes.
--
-- Data: 2026-01-09
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ÍNDICES PARA TABELA scd_movimentacao (Principal)
-- -----------------------------------------------------------------------------

-- Índice composto para busca de protocolos por setor e status atual
-- Usado em: KPIs, listagem de protocolos, timeline
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_scd_movimentacao_codprot_setor_regAtual')
BEGIN
    CREATE NONCLUSTERED INDEX IX_scd_movimentacao_codprot_setor_regAtual
    ON scd_movimentacao (codprot, codsetordestino, RegAtual)
    INCLUDE (data, codsetororigem, Deletado)
    WHERE Deletado IS NULL;

    PRINT 'Índice IX_scd_movimentacao_codprot_setor_regAtual criado com sucesso';
END
GO

-- Índice para busca por RegAtual (posição atual do protocolo)
-- Usado em: CTE SetorAtual, queries de status
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_scd_movimentacao_regAtual')
BEGIN
    CREATE NONCLUSTERED INDEX IX_scd_movimentacao_regAtual
    ON scd_movimentacao (RegAtual, codprot)
    INCLUDE (codsetordestino, codsetororigem, data)
    WHERE Deletado IS NULL AND RegAtual = 1;

    PRINT 'Índice IX_scd_movimentacao_regAtual criado com sucesso';
END
GO

-- Índice para busca por data (relatórios temporais)
-- Usado em: Analytics temporal, heatmap, comparativos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_scd_movimentacao_data')
BEGIN
    CREATE NONCLUSTERED INDEX IX_scd_movimentacao_data
    ON scd_movimentacao (data)
    INCLUDE (codprot, codsetordestino, codsetororigem)
    WHERE Deletado IS NULL;

    PRINT 'Índice IX_scd_movimentacao_data criado com sucesso';
END
GO

-- Índice para busca por usuário (quem enviou/recebeu)
-- Usado em: Timeline com informações de usuário
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_scd_movimentacao_codUsuario')
BEGIN
    CREATE NONCLUSTERED INDEX IX_scd_movimentacao_codUsuario
    ON scd_movimentacao (codUsuario)
    INCLUDE (codprot, data, CodUsuRec)
    WHERE Deletado IS NULL;

    PRINT 'Índice IX_scd_movimentacao_codUsuario criado com sucesso';
END
GO

-- -----------------------------------------------------------------------------
-- 2. ÍNDICES PARA TABELA scd_movimentacaoItem (Relacionamentos)
-- -----------------------------------------------------------------------------

-- Índice para busca de protocolos filhos
-- Usado em: Contagem de filhos, relacionamentos
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_scd_movimentacaoItem_CodProt')
BEGIN
    CREATE NONCLUSTERED INDEX IX_scd_movimentacaoItem_CodProt
    ON scd_movimentacaoItem (CodProt)
    INCLUDE (CodProtRel)
    WHERE deletado IS NULL OR deletado = 0;

    PRINT 'Índice IX_scd_movimentacaoItem_CodProt criado com sucesso';
END
GO

-- Índice para busca de protocolos mãe
-- Usado em: Verificar se é filho de outro protocolo
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_scd_movimentacaoItem_CodProtRel')
BEGIN
    CREATE NONCLUSTERED INDEX IX_scd_movimentacaoItem_CodProtRel
    ON scd_movimentacaoItem (CodProtRel)
    INCLUDE (CodProt)
    WHERE CodProtRel IS NOT NULL AND (deletado IS NULL OR deletado = 0);

    PRINT 'Índice IX_scd_movimentacaoItem_CodProtRel criado com sucesso';
END
GO

-- -----------------------------------------------------------------------------
-- 3. ÍNDICES PARA TABELA documento
-- -----------------------------------------------------------------------------

-- Índice para busca por número do protocolo (busca por prefixo)
-- Usado em: Filtro de número de protocolo na listagem
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_documento_numero')
BEGIN
    CREATE NONCLUSTERED INDEX IX_documento_numero
    ON documento (numero)
    INCLUDE (codigo, assunto, numconv, codUsuario)
    WHERE deletado IS NULL;

    PRINT 'Índice IX_documento_numero criado com sucesso';
END
GO

-- Índice para busca por assunto (filtro de rubrica)
-- Usado em: Filtro por tipo de rubrica/assunto
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_documento_assunto')
BEGIN
    CREATE NONCLUSTERED INDEX IX_documento_assunto
    ON documento (assunto)
    INCLUDE (codigo, numero, numconv)
    WHERE deletado IS NULL;

    PRINT 'Índice IX_documento_assunto criado com sucesso';
END
GO

-- Índice para busca por convênio
-- Usado em: Filtro por projeto/convênio
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_documento_numconv')
BEGIN
    CREATE NONCLUSTERED INDEX IX_documento_numconv
    ON documento (numconv)
    INCLUDE (codigo, numero, assunto)
    WHERE deletado IS NULL AND numconv IS NOT NULL;

    PRINT 'Índice IX_documento_numconv criado com sucesso';
END
GO

-- -----------------------------------------------------------------------------
-- 4. ÍNDICES PARA TABELA EventosDoc (Vínculos com Financeiro)
-- -----------------------------------------------------------------------------

-- Índice para busca de eventos por protocolo
-- Usado em: Vinculos com pagamentos, eventos do protocolo
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EventosDoc_CodProt')
BEGIN
    CREATE NONCLUSTERED INDEX IX_EventosDoc_CodProt
    ON EventosDoc (CodProt)
    INCLUDE (CodEvento, tipo, data);

    PRINT 'Índice IX_EventosDoc_CodProt criado com sucesso';
END
GO

-- -----------------------------------------------------------------------------
-- 5. ESTATÍSTICAS RECOMENDADAS
-- -----------------------------------------------------------------------------

-- Atualizar estatísticas das tabelas principais após criar índices
UPDATE STATISTICS scd_movimentacao;
UPDATE STATISTICS scd_movimentacaoItem;
UPDATE STATISTICS documento;
UPDATE STATISTICS EventosDoc;

PRINT 'Estatísticas atualizadas com sucesso';
GO

-- -----------------------------------------------------------------------------
-- 6. VERIFICAÇÃO DOS ÍNDICES CRIADOS
-- -----------------------------------------------------------------------------

SELECT
    t.name AS Tabela,
    i.name AS Indice,
    i.type_desc AS Tipo,
    STATS_DATE(i.object_id, i.index_id) AS UltimaAtualizacao
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.name LIKE 'IX_%'
    AND t.name IN ('scd_movimentacao', 'scd_movimentacaoItem', 'documento', 'EventosDoc')
ORDER BY t.name, i.name;
GO

-- =============================================================================
-- NOTAS:
--
-- 1. Execute em horário de baixo uso (índices em tabelas grandes podem travar)
-- 2. Monitore o espaço em disco (índices consomem espaço adicional)
-- 3. Após criar, execute queries de teste para validar melhoria
-- 4. Considere executar DBCC FREEPROCCACHE após criar índices
--
-- Estimativa de melhoria: 30-50% nas queries principais
-- =============================================================================
