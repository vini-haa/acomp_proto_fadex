-- ============================================================================
-- Script para REMOVER a View vw_ProtocolosFinanceiro
-- Use este script se precisar reverter a criação da view
-- ============================================================================

USE [fade1]
GO

PRINT '============================================================================';
PRINT 'REMOVENDO VIEW vw_ProtocolosFinanceiro';
PRINT '============================================================================';
PRINT '';

-- Verificar se view existe
IF OBJECT_ID('dbo.vw_ProtocolosFinanceiro', 'V') IS NOT NULL
BEGIN
    PRINT '🔍 View encontrada. Removendo...';
    DROP VIEW dbo.vw_ProtocolosFinanceiro;
    PRINT '✅ View vw_ProtocolosFinanceiro removida com sucesso!';
    PRINT '';
    PRINT '📝 A view foi completamente removida do banco de dados.';
    PRINT '   Nenhum dado foi afetado (views apenas leem, não modificam).';
END
ELSE
BEGIN
    PRINT '⚠️  View vw_ProtocolosFinanceiro não encontrada.';
    PRINT '   Não há nada para remover.';
END

PRINT '';
PRINT '============================================================================';
GO
