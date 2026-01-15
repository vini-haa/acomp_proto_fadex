-- =====================================================
-- MIGRAÇÃO 002: Grupos de Trabalho (Versão Simplificada)
-- Data: 2026-01-12
-- Descrição: Estrutura para gestão de grupos de trabalho
--            SEM dependência de tabela de usuários (portal_usuarios)
-- =====================================================

-- =====================================================
-- 1. TABELA: grupo_trabalho
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'grupo_trabalho')
BEGIN
    CREATE TABLE grupo_trabalho (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(200) NOT NULL,
        descricao NVARCHAR(1000) NULL,
        responsavel_nome NVARCHAR(200) NOT NULL,         -- Nome do responsável (texto livre)
        responsavel_email NVARCHAR(200) NULL,            -- Email do responsável
        setor_codigo INT NULL,                           -- FK para setor existente
        ativo BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),

        CONSTRAINT UQ_grupo_trabalho_nome UNIQUE (nome)
    );

    PRINT '✅ Tabela grupo_trabalho criada';
END
ELSE
BEGIN
    PRINT '⚠️ Tabela grupo_trabalho já existe';
END
GO

-- =====================================================
-- 2. TABELA: grupo_membro
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'grupo_membro')
BEGIN
    CREATE TABLE grupo_membro (
        id INT IDENTITY(1,1) PRIMARY KEY,
        grupo_id INT NOT NULL,
        membro_nome NVARCHAR(200) NOT NULL,              -- Nome do membro (texto livre)
        membro_email NVARCHAR(200) NULL,                 -- Email do membro
        funcao NVARCHAR(100) NOT NULL DEFAULT 'membro',  -- coordenador, membro, observador
        ativo BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_grupo_membro_grupo FOREIGN KEY (grupo_id)
            REFERENCES grupo_trabalho(id) ON DELETE CASCADE,
        CONSTRAINT CK_grupo_membro_funcao CHECK (funcao IN ('coordenador', 'membro', 'observador'))
    );

    PRINT '✅ Tabela grupo_membro criada';
END
ELSE
BEGIN
    PRINT '⚠️ Tabela grupo_membro já existe';
END
GO

-- =====================================================
-- 3. TABELA: grupo_projeto
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'grupo_projeto')
BEGIN
    CREATE TABLE grupo_projeto (
        id INT IDENTITY(1,1) PRIMARY KEY,
        grupo_id INT NOT NULL,
        conta_corrente NVARCHAR(50) NOT NULL,            -- Referência ao projeto (SAGI)
        projeto_nome NVARCHAR(300) NULL,                 -- Cache do nome do projeto
        meta_protocolos_mes INT NULL,                    -- Meta de protocolos por mês
        observacoes NVARCHAR(1000) NULL,
        ativo BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_grupo_projeto_grupo FOREIGN KEY (grupo_id)
            REFERENCES grupo_trabalho(id) ON DELETE CASCADE,
        CONSTRAINT UQ_grupo_projeto UNIQUE (grupo_id, conta_corrente)
    );

    PRINT '✅ Tabela grupo_projeto criada';
END
ELSE
BEGIN
    PRINT '⚠️ Tabela grupo_projeto já existe';
END
GO

-- =====================================================
-- 4. TABELA: auditoria_simples
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'auditoria_simples')
BEGIN
    CREATE TABLE auditoria_simples (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tabela NVARCHAR(100) NOT NULL,
        registro_id INT NOT NULL,
        acao NVARCHAR(50) NOT NULL,                      -- INSERT, UPDATE, DELETE
        usuario_nome NVARCHAR(200) NULL,                 -- Quem fez (texto livre)
        dados_anteriores NVARCHAR(MAX) NULL,             -- JSON com dados anteriores
        dados_novos NVARCHAR(MAX) NULL,                  -- JSON com novos dados
        created_at DATETIME2 NOT NULL DEFAULT GETDATE(),

        CONSTRAINT CK_auditoria_acao CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE'))
    );

    PRINT '✅ Tabela auditoria_simples criada';
END
ELSE
BEGIN
    PRINT '⚠️ Tabela auditoria_simples já existe';
END
GO

-- =====================================================
-- 5. ÍNDICES DE PERFORMANCE
-- =====================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_grupo_trabalho_ativo')
BEGIN
    CREATE NONCLUSTERED INDEX IX_grupo_trabalho_ativo ON grupo_trabalho(ativo);
    PRINT '✅ Índice IX_grupo_trabalho_ativo criado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_grupo_trabalho_setor')
BEGIN
    CREATE NONCLUSTERED INDEX IX_grupo_trabalho_setor ON grupo_trabalho(setor_codigo);
    PRINT '✅ Índice IX_grupo_trabalho_setor criado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_grupo_membro_grupo')
BEGIN
    CREATE NONCLUSTERED INDEX IX_grupo_membro_grupo ON grupo_membro(grupo_id);
    PRINT '✅ Índice IX_grupo_membro_grupo criado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_grupo_membro_ativo')
BEGIN
    CREATE NONCLUSTERED INDEX IX_grupo_membro_ativo ON grupo_membro(ativo);
    PRINT '✅ Índice IX_grupo_membro_ativo criado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_grupo_projeto_grupo')
BEGIN
    CREATE NONCLUSTERED INDEX IX_grupo_projeto_grupo ON grupo_projeto(grupo_id);
    PRINT '✅ Índice IX_grupo_projeto_grupo criado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_grupo_projeto_conta')
BEGIN
    CREATE NONCLUSTERED INDEX IX_grupo_projeto_conta ON grupo_projeto(conta_corrente);
    PRINT '✅ Índice IX_grupo_projeto_conta criado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_auditoria_tabela_registro')
BEGIN
    CREATE NONCLUSTERED INDEX IX_auditoria_tabela_registro ON auditoria_simples(tabela, registro_id);
    PRINT '✅ Índice IX_auditoria_tabela_registro criado';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_auditoria_created')
BEGIN
    CREATE NONCLUSTERED INDEX IX_auditoria_created ON auditoria_simples(created_at DESC);
    PRINT '✅ Índice IX_auditoria_created criado';
END
GO

-- =====================================================
-- 6. VIEW: vw_grupos_metricas
-- =====================================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_grupos_metricas')
BEGIN
    DROP VIEW vw_grupos_metricas;
END
GO

CREATE VIEW vw_grupos_metricas AS
SELECT
    g.id,
    g.nome,
    g.descricao,
    g.responsavel_nome,
    g.responsavel_email,
    g.setor_codigo,
    s.descr AS setor_nome,
    g.ativo,
    g.created_at,
    (SELECT COUNT(*) FROM grupo_membro gm WHERE gm.grupo_id = g.id AND gm.ativo = 1) AS total_membros,
    (SELECT COUNT(*) FROM grupo_projeto gp WHERE gp.grupo_id = g.id AND gp.ativo = 1) AS total_projetos,
    (SELECT SUM(ISNULL(gp.meta_protocolos_mes, 0)) FROM grupo_projeto gp WHERE gp.grupo_id = g.id AND gp.ativo = 1) AS meta_total_mes
FROM grupo_trabalho g
LEFT JOIN setor s ON s.codigo = g.setor_codigo
WHERE g.ativo = 1;
GO

PRINT '✅ View vw_grupos_metricas criada';
GO

-- =====================================================
-- 7. VIEW: vw_projetos_metricas
-- =====================================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'vw_projetos_metricas')
BEGIN
    DROP VIEW vw_projetos_metricas;
END
GO

CREATE VIEW vw_projetos_metricas AS
SELECT
    gp.id,
    gp.grupo_id,
    g.nome AS grupo_nome,
    gp.conta_corrente,
    gp.projeto_nome,
    gp.meta_protocolos_mes,
    gp.observacoes,
    gp.ativo,
    gp.created_at,
    (SELECT COUNT(*)
     FROM protomovi pm
     WHERE pm.codccusto = gp.conta_corrente
       AND pm.data >= DATEADD(MONTH, -1, GETDATE())) AS protocolos_ultimo_mes,
    (SELECT COUNT(*)
     FROM protomovi pm
     WHERE pm.codccusto = gp.conta_corrente
       AND pm.data >= DATEADD(YEAR, -1, GETDATE())) AS protocolos_ultimo_ano
FROM grupo_projeto gp
INNER JOIN grupo_trabalho g ON g.id = gp.grupo_id
WHERE gp.ativo = 1 AND g.ativo = 1;
GO

PRINT '✅ View vw_projetos_metricas criada';
GO

-- =====================================================
-- 8. DADOS DE EXEMPLO
-- =====================================================
-- Inserir grupos de exemplo apenas se a tabela estiver vazia
IF NOT EXISTS (SELECT TOP 1 1 FROM grupo_trabalho)
BEGIN
    -- Grupo 1: Financeiro
    INSERT INTO grupo_trabalho (nome, descricao, responsavel_nome, responsavel_email, setor_codigo)
    VALUES ('Equipe Financeiro', 'Equipe responsável pelos protocolos financeiros', 'João Silva', 'joao.silva@fadex.org.br', 48);

    DECLARE @grupo1_id INT = SCOPE_IDENTITY();

    INSERT INTO grupo_membro (grupo_id, membro_nome, membro_email, funcao)
    VALUES
        (@grupo1_id, 'João Silva', 'joao.silva@fadex.org.br', 'coordenador'),
        (@grupo1_id, 'Maria Santos', 'maria.santos@fadex.org.br', 'membro'),
        (@grupo1_id, 'Pedro Oliveira', 'pedro.oliveira@fadex.org.br', 'membro');

    -- Grupo 2: Compras
    INSERT INTO grupo_trabalho (nome, descricao, responsavel_nome, responsavel_email, setor_codigo)
    VALUES ('Equipe Compras', 'Equipe de processos de compras e licitações', 'Ana Costa', 'ana.costa@fadex.org.br', 16);

    DECLARE @grupo2_id INT = SCOPE_IDENTITY();

    INSERT INTO grupo_membro (grupo_id, membro_nome, membro_email, funcao)
    VALUES
        (@grupo2_id, 'Ana Costa', 'ana.costa@fadex.org.br', 'coordenador'),
        (@grupo2_id, 'Carlos Lima', 'carlos.lima@fadex.org.br', 'membro');

    -- Grupo 3: Projetos Especiais
    INSERT INTO grupo_trabalho (nome, descricao, responsavel_nome, responsavel_email, setor_codigo)
    VALUES ('Projetos Especiais', 'Acompanhamento de projetos estratégicos', 'Roberto Souza', 'roberto.souza@fadex.org.br', NULL);

    DECLARE @grupo3_id INT = SCOPE_IDENTITY();

    INSERT INTO grupo_membro (grupo_id, membro_nome, membro_email, funcao)
    VALUES
        (@grupo3_id, 'Roberto Souza', 'roberto.souza@fadex.org.br', 'coordenador'),
        (@grupo3_id, 'Fernanda Alves', 'fernanda.alves@fadex.org.br', 'membro'),
        (@grupo3_id, 'Lucas Pereira', 'lucas.pereira@fadex.org.br', 'observador');

    PRINT '✅ Dados de exemplo inseridos (3 grupos)';
END
ELSE
BEGIN
    PRINT '⚠️ Dados de exemplo não inseridos (tabela já contém dados)';
END
GO

-- =====================================================
-- 9. RESUMO FINAL
-- =====================================================
PRINT '========================================';
PRINT '✅ MIGRAÇÃO 002 CONCLUÍDA COM SUCESSO!';
PRINT '========================================';
PRINT '';
PRINT 'Tabelas criadas:';
PRINT '  - grupo_trabalho';
PRINT '  - grupo_membro';
PRINT '  - grupo_projeto';
PRINT '  - auditoria_simples';
PRINT '';
PRINT 'Views criadas:';
PRINT '  - vw_grupos_metricas';
PRINT '  - vw_projetos_metricas';
PRINT '';
PRINT 'Índices criados: 8';
PRINT '';
PRINT 'Para validar, execute:';
PRINT '  SELECT * FROM vw_grupos_metricas;';
PRINT '  SELECT * FROM grupo_trabalho;';
GO
