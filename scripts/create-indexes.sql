-- ═══════════════════════════════════════════════════════════════════════════════
-- SCRIPT DE CRIAÇÃO DE ÍNDICES - PORTAL FADEX
-- Data: 2026-01-28
-- Objetivo: Otimizar performance das queries do dashboard
--
-- INSTRUÇÕES:
-- 1. Execute este script no banco de produção (fade1)
-- 2. Escolha horário de baixo uso (fora do expediente)
-- 3. Os índices serão criados apenas se não existirem
-- 4. Tempo estimado: 5-15 minutos dependendo do volume de dados
-- ═══════════════════════════════════════════════════════════════════════════════

USE fade1;
GO

PRINT '═══════════════════════════════════════════════════════════════════════════';
PRINT 'INICIANDO CRIAÇÃO DE ÍNDICES PARA PORTAL FADEX';
PRINT 'Data/Hora: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '═══════════════════════════════════════════════════════════════════════════';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- ÍNDICE 1: Movimentações por data e setor (CRÍTICO)
-- Usado em: Cache de protocolos, Dashboard executivo, Fluxo temporal
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_mov_data_setor_prot' AND object_id = OBJECT_ID('scd_movimentacao'))
BEGIN
    PRINT 'Criando índice IX_mov_data_setor_prot...';
    CREATE NONCLUSTERED INDEX IX_mov_data_setor_prot
    ON scd_movimentacao (data DESC, codSetorDestino, codSetorOrigem)
    INCLUDE (CodProt, Deletado, codigo, RegAtual)
    WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
    PRINT '✅ Índice IX_mov_data_setor_prot criado com sucesso!';
END
ELSE
    PRINT '⏭️ Índice IX_mov_data_setor_prot já existe.';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- ÍNDICE 2: Movimentações por protocolo e data (CRÍTICO)
-- Usado em: Última movimentação, Timeline de protocolo, SetorVsMedia
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_mov_codprot_data' AND object_id = OBJECT_ID('scd_movimentacao'))
BEGIN
    PRINT 'Criando índice IX_mov_codprot_data...';
    CREATE NONCLUSTERED INDEX IX_mov_codprot_data
    ON scd_movimentacao (CodProt, data DESC)
    INCLUDE (codSetorDestino, codSetorOrigem, Deletado, RegAtual, codigo)
    WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
    PRINT '✅ Índice IX_mov_codprot_data criado com sucesso!';
END
ELSE
    PRINT '⏭️ Índice IX_mov_codprot_data já existe.';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- ÍNDICE 3: Movimentações por setor de origem (para contagem de saídas)
-- Usado em: API Setor, Destinos, Retornos
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_mov_setororigem_data' AND object_id = OBJECT_ID('scd_movimentacao'))
BEGIN
    PRINT 'Criando índice IX_mov_setororigem_data...';
    CREATE NONCLUSTERED INDEX IX_mov_setororigem_data
    ON scd_movimentacao (codSetorOrigem, data DESC)
    INCLUDE (CodProt, codSetorDestino, Deletado)
    WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
    PRINT '✅ Índice IX_mov_setororigem_data criado com sucesso!';
END
ELSE
    PRINT '⏭️ Índice IX_mov_setororigem_data já existe.';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- ÍNDICE 4: Movimentações por setor de destino (para contagem de entradas)
-- Usado em: KPIs, Fluxo temporal, Comparativo
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_mov_setordestino_data' AND object_id = OBJECT_ID('scd_movimentacao'))
BEGIN
    PRINT 'Criando índice IX_mov_setordestino_data...';
    CREATE NONCLUSTERED INDEX IX_mov_setordestino_data
    ON scd_movimentacao (codSetorDestino, data DESC)
    INCLUDE (CodProt, codSetorOrigem, Deletado)
    WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
    PRINT '✅ Índice IX_mov_setordestino_data criado com sucesso!';
END
ELSE
    PRINT '⏭️ Índice IX_mov_setordestino_data já existe.';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- ÍNDICE 5: Documento por código e projeto
-- Usado em: JOINs com documento em todas as queries
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_doc_codigo_numconv' AND object_id = OBJECT_ID('documento'))
BEGIN
    PRINT 'Criando índice IX_doc_codigo_numconv...';
    CREATE NONCLUSTERED INDEX IX_doc_codigo_numconv
    ON documento (Codigo)
    INCLUDE (numconv, assunto, deletado, numero, codTipoDocumento, codUsuario, Interessado, remetente)
    WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
    PRINT '✅ Índice IX_doc_codigo_numconv criado com sucesso!';
END
ELSE
    PRINT '⏭️ Índice IX_doc_codigo_numconv já existe.';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- ÍNDICE 6: Financeiro por protocolo (para valores pendentes)
-- Usado em: KPIs executivos com valor pendente
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_fin_codprot' AND object_id = OBJECT_ID('FINANCEIRO'))
BEGIN
    PRINT 'Criando índice IX_fin_codprot...';
    CREATE NONCLUSTERED INDEX IX_fin_codprot
    ON FINANCEIRO (CodProt)
    INCLUDE (VALORLIQUIDO, CANCELADO, DELETADO)
    WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
    PRINT '✅ Índice IX_fin_codprot criado com sucesso!';
END
ELSE
    PRINT '⏭️ Índice IX_fin_codprot já existe.';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- ÍNDICE 7: MovimentacaoItem para relacionamentos Mãe/Filho
-- Usado em: Listagem de protocolos (qtdFilhos, ehFilhoDe)
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_movitem_codprot' AND object_id = OBJECT_ID('scd_movimentacaoItem'))
BEGIN
    PRINT 'Criando índice IX_movitem_codprot...';
    CREATE NONCLUSTERED INDEX IX_movitem_codprot
    ON scd_movimentacaoItem (CodProt)
    INCLUDE (CodProtRel, deletado)
    WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
    PRINT '✅ Índice IX_movitem_codprot criado com sucesso!';
END
ELSE
    PRINT '⏭️ Índice IX_movitem_codprot já existe.';
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_movitem_codprotrel' AND object_id = OBJECT_ID('scd_movimentacaoItem'))
BEGIN
    PRINT 'Criando índice IX_movitem_codprotrel...';
    CREATE NONCLUSTERED INDEX IX_movitem_codprotrel
    ON scd_movimentacaoItem (CodProtRel)
    INCLUDE (CodProt, deletado)
    WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
    PRINT '✅ Índice IX_movitem_codprotrel criado com sucesso!';
END
ELSE
    PRINT '⏭️ Índice IX_movitem_codprotrel já existe.';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- ÍNDICE 8: Filtrado para movimentações ativas (sem deletados)
-- Índice filtrado para queries que sempre filtram Deletado IS NULL
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_mov_ativos_data' AND object_id = OBJECT_ID('scd_movimentacao'))
BEGIN
    PRINT 'Criando índice filtrado IX_mov_ativos_data...';
    CREATE NONCLUSTERED INDEX IX_mov_ativos_data
    ON scd_movimentacao (data DESC, CodProt)
    INCLUDE (codSetorDestino, codSetorOrigem, RegAtual, codigo)
    WHERE Deletado IS NULL
    WITH (ONLINE = ON, SORT_IN_TEMPDB = ON);
    PRINT '✅ Índice IX_mov_ativos_data criado com sucesso!';
END
ELSE
    PRINT '⏭️ Índice IX_mov_ativos_data já existe.';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════════════════
PRINT '';
PRINT '═══════════════════════════════════════════════════════════════════════════';
PRINT 'ÍNDICES NA TABELA scd_movimentacao:';
PRINT '═══════════════════════════════════════════════════════════════════════════';
SELECT
    name AS NomeIndice,
    type_desc AS Tipo,
    is_unique AS Unico,
    CASE WHEN has_filter = 1 THEN 'SIM' ELSE 'NÃO' END AS Filtrado
FROM sys.indexes
WHERE object_id = OBJECT_ID('scd_movimentacao')
ORDER BY name;
GO

PRINT '';
PRINT '═══════════════════════════════════════════════════════════════════════════';
PRINT 'ÍNDICES NA TABELA documento:';
PRINT '═══════════════════════════════════════════════════════════════════════════';
SELECT
    name AS NomeIndice,
    type_desc AS Tipo,
    is_unique AS Unico
FROM sys.indexes
WHERE object_id = OBJECT_ID('documento')
ORDER BY name;
GO

PRINT '';
PRINT '═══════════════════════════════════════════════════════════════════════════';
PRINT 'CRIAÇÃO DE ÍNDICES CONCLUÍDA!';
PRINT 'Data/Hora: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '═══════════════════════════════════════════════════════════════════════════';
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- SCRIPT DE REMOÇÃO (caso necessário reverter)
-- Descomente e execute se precisar remover os índices
-- ═══════════════════════════════════════════════════════════════════════════════
/*
DROP INDEX IF EXISTS IX_mov_data_setor_prot ON scd_movimentacao;
DROP INDEX IF EXISTS IX_mov_codprot_data ON scd_movimentacao;
DROP INDEX IF EXISTS IX_mov_setororigem_data ON scd_movimentacao;
DROP INDEX IF EXISTS IX_mov_setordestino_data ON scd_movimentacao;
DROP INDEX IF EXISTS IX_mov_ativos_data ON scd_movimentacao;
DROP INDEX IF EXISTS IX_doc_codigo_numconv ON documento;
DROP INDEX IF EXISTS IX_fin_codprot ON FINANCEIRO;
DROP INDEX IF EXISTS IX_movitem_codprot ON scd_movimentacaoItem;
DROP INDEX IF EXISTS IX_movitem_codprotrel ON scd_movimentacaoItem;
PRINT 'Todos os índices foram removidos.';
*/
