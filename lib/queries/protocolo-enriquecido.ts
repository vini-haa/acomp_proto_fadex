/**
 * Queries SQL para dados enriquecidos de Protocolo
 *
 * Baseado no mapeamento completo das tabelas do SAGI
 */

// Query 1: Dados básicos completos do protocolo
export const QUERY_DADOS_BASICOS = `
SELECT
    d.Codigo AS CodProtocolo,
    d.Numero AS NumeroProtocolo,
    d.NumDoc AS NumeroDocumento,
    d.numeroControle AS NumeroControle,
    d.data AS DataDocumento,
    d.dataCad AS DataCadastro,
    d.horaCad AS HoraCadastro,
    d.Assunto,
    d.Descricao,
    d.obs AS Observacoes,
    d.notaFiscal AS NotaFiscal,
    d.numOf AS NumeroOficio,
    d.remetente AS Remetente,
    d.despachante AS Despachante,
    d.Interessado,
    d.destinatario AS Destinatario,
    t.descricao AS TipoDocumento,
    ass.Descricao AS AssuntoCategorizado,
    inst.descricao AS Instituicao,
    u.descr AS Unidade,
    dp.descricao AS Departamento,
    c.NumConv,
    c.titulo AS TituloProjeto,
    p.codigo AS CodPessoa,
    p.descricao AS NomePessoa,
    p.cgc_cpf AS CPFCNPJ,
    usu.Nome AS UsuarioCadastro
FROM documento d
    LEFT JOIN tipoDocumento t ON t.codigo = d.codTipoDocumento
    LEFT JOIN Instituicao inst ON inst.codigo = d.codInst
    LEFT JOIN Unidades u ON u.codigo = d.codUnidade
    LEFT JOIN Depto dp ON dp.codigo = d.codDpto
    LEFT JOIN Convenio c ON c.NumConv = d.NumConv
    LEFT JOIN Pessoas p ON p.codigo = d.CodFornec
    LEFT JOIN sdoc_Assunto ass ON ass.codigo = d.CodAssunto
    LEFT JOIN usuario usu ON usu.codigo = d.codUsuario
WHERE d.Codigo = @codProtocolo
  AND (d.deletado IS NULL OR d.deletado = 0)
`;

// Query 2: Histórico completo de tramitação
export const QUERY_HISTORICO_TRAMITACAO = `
SELECT
    sm.Codigo AS CodMovimentacao,
    sm.CodProt AS CodProtocolo,
    sm.numDocumento,
    sm.data AS DataMovimentacao,
    sm.hora AS HoraMovimentacao,
    sm.dtRecebimento AS DataRecebimento,
    sm.DataCad AS DataCadastroMov,
    sm.codSetorOrigem,
    setorOrig.DESCR AS SetorOrigem,
    sm.codUsuOrigem,
    usuOrig.Nome AS UsuarioOrigem,
    sm.codSetorDestino,
    setorDest.DESCR AS SetorDestino,
    sm.CodDestinatario,
    usuDest.Nome AS UsuarioDestinatario,
    sm.codUsuario,
    usuMov.Nome AS UsuarioMovimentou,
    sm.despachante AS Despachante,
    sm.codSituacaoProt,
    sp.descricao AS Situacao,
    sm.obs AS ObservacaoMovimentacao,
    sm.Outros,
    sm.RegAtual AS EhRegistroAtual,
    sm.PrimReg AS EhPrimeiroRegistro,
    DATEDIFF(DAY, sm.data,
        ISNULL(
            (SELECT TOP 1 data FROM scd_movimentacao sm2
             WHERE sm2.CodProt = sm.CodProt
               AND sm2.data > sm.data
               AND (sm2.Deletado IS NULL OR sm2.Deletado = 0)
             ORDER BY sm2.data),
            GETDATE()
        )
    ) AS DiasNoSetor
FROM scd_movimentacao sm
    LEFT JOIN SETOR setorOrig ON setorOrig.CODIGO = sm.codSetorOrigem
    LEFT JOIN SETOR setorDest ON setorDest.CODIGO = sm.codSetorDestino
    LEFT JOIN usuario usuOrig ON usuOrig.codigo = sm.codUsuOrigem
    LEFT JOIN usuario usuDest ON usuDest.codigo = sm.CodDestinatario
    LEFT JOIN usuario usuMov ON usuMov.codigo = sm.codUsuario
    LEFT JOIN situacaoProtocolo sp ON sp.codigo = sm.codSituacaoProt
WHERE sm.CodProt = @codProtocolo
  AND (sm.Deletado IS NULL OR sm.Deletado = 0)
ORDER BY sm.data DESC, sm.hora DESC
`;

// Query 3: Situação atual do protocolo
export const QUERY_SITUACAO_ATUAL = `
SELECT
    sm.Codigo AS CodMovimentacaoAtual,
    setorDest.DESCR AS SetorAtual,
    usuDest.Nome AS UsuarioResponsavel,
    sp.descricao AS SituacaoAtual,
    sm.data AS DataUltimaMovimentacao,
    sm.dtRecebimento AS DataRecebimento,
    DATEDIFF(DAY, sm.data, GETDATE()) AS DiasNoSetorAtual,
    sm.obs AS ObservacaoAtual
FROM scd_movimentacao sm
    LEFT JOIN SETOR setorDest ON setorDest.CODIGO = sm.codSetorDestino
    LEFT JOIN usuario usuDest ON usuDest.codigo = sm.CodDestinatario
    LEFT JOIN situacaoProtocolo sp ON sp.codigo = sm.codSituacaoProt
WHERE sm.CodProt = @codProtocolo
  AND sm.RegAtual = 1
  AND (sm.Deletado IS NULL OR sm.Deletado = 0)
`;

// Query 4: Origem do protocolo (quem criou)
export const QUERY_ORIGEM = `
SELECT
    sm.data AS DataCriacao,
    sm.hora AS HoraCriacao,
    setorOrig.DESCR AS SetorOrigem,
    usuOrig.Nome AS UsuarioCriador,
    sm.obs AS ObservacaoInicial
FROM scd_movimentacao sm
    LEFT JOIN SETOR setorOrig ON setorOrig.CODIGO = sm.codSetorOrigem
    LEFT JOIN usuario usuOrig ON usuOrig.codigo = sm.codUsuOrigem
WHERE sm.CodProt = @codProtocolo
  AND sm.PrimReg = 1
  AND (sm.Deletado IS NULL OR sm.Deletado = 0)
`;

// Query 5: Verificar se é protocolo mãe (tem filhos)
export const QUERY_PROTOCOLO_MAE = `
SELECT
    'MAE' AS TipoProtocolo,
    d.Numero AS ProtocoloMae,
    dFilho.Numero AS ProtocoloFilho,
    dFilho.Codigo AS CodProtocoloFilho,
    smi.observacao AS ObservacaoVinculo,
    smi.Valor AS ValorVinculo,
    smi.dataCad AS DataVinculo
FROM documento d
    INNER JOIN scd_movimentacaoItem smi ON smi.CodProt = d.Codigo
    INNER JOIN documento dFilho ON dFilho.Codigo = smi.CodProtRel
WHERE d.Codigo = @codProtocolo
  AND smi.CodProtRel IS NOT NULL
  AND (smi.deletado IS NULL OR smi.deletado = 0)
`;

// Query 6: Verificar se é protocolo filho (tem mãe)
export const QUERY_PROTOCOLO_FILHO = `
SELECT
    'FILHO' AS TipoProtocolo,
    d.Numero AS ProtocoloFilho,
    dMae.Numero AS ProtocoloMae,
    dMae.Codigo AS CodProtocoloMae,
    smi.observacao AS ObservacaoVinculo,
    smi.Valor AS ValorVinculo,
    smi.dataCad AS DataVinculo
FROM documento d
    INNER JOIN scd_movimentacaoItem smi ON smi.CodProtRel = d.Codigo
    INNER JOIN documento dMae ON dMae.Codigo = smi.CodProt
WHERE d.Codigo = @codProtocolo
  AND (smi.deletado IS NULL OR smi.deletado = 0)
`;

// Query 7: Árvore completa de relacionamentos
export const QUERY_ARVORE = `
WITH ProtocoloArvore AS (
    SELECT
        d.Codigo,
        d.Numero,
        0 AS Nivel,
        CAST(d.Numero AS VARCHAR(MAX)) AS Caminho,
        CAST('CONSULTADO' AS VARCHAR(20)) AS Relacao
    FROM documento d
    WHERE d.Codigo = @codProtocolo

    UNION ALL

    SELECT
        dFilho.Codigo,
        dFilho.Numero,
        pa.Nivel + 1,
        pa.Caminho + ' > ' + dFilho.Numero,
        CAST('FILHO' AS VARCHAR(20))
    FROM ProtocoloArvore pa
        INNER JOIN scd_movimentacaoItem smi ON smi.CodProt = pa.Codigo
        INNER JOIN documento dFilho ON dFilho.Codigo = smi.CodProtRel
    WHERE smi.CodProtRel IS NOT NULL
      AND (smi.deletado IS NULL OR smi.deletado = 0)
      AND pa.Nivel < 5
)
SELECT * FROM ProtocoloArvore
ORDER BY Nivel, Numero
`;

// Query 8: Lançamentos financeiros vinculados
export const QUERY_FINANCEIRO = `
SELECT
    f.CODIGO AS CodFinanceiro,
    f.DTLANCAMENTO AS DataLancamento,
    f.DTDOCUMENTO AS DataDocumento,
    f.PROTOCOLO AS NumeroProtocoloFinanc,
    f.NOTAFISCAL AS NotaFiscal,
    f.VALORBRUTO AS ValorBruto,
    f.VALORLIQUIDO AS ValorLiquido,
    f.TITULO AS Descricao,
    f.OBSERVACAO AS Observacao,
    p.descricao AS Fornecedor,
    p.cgc_cpf AS CPFCNPJ,
    c.Titulo AS Projeto,
    r.rubrica AS Rubrica,
    r.descricao AS DescricaoRubrica,
    sh.NomeSubHist AS TipoLancamento,
    CASE
        WHEN f.CANCELADO = 1 THEN 'CANCELADO'
        WHEN f.LIBERADO = 1 THEN 'LIBERADO'
        ELSE 'PENDENTE'
    END AS Status
FROM FINANCEIRO f
    LEFT JOIN PESSOAS p ON p.codigo = f.CODFORNEC
    LEFT JOIN CONVENIO c ON c.NumConv = f.NUMCONV
    LEFT JOIN conv_rubrica cr ON cr.codigo = f.CODRUBRICA
    LEFT JOIN rubrica r ON r.codigo = cr.codRubrica
    LEFT JOIN subHist sh ON sh.codigo = f.CODSUBHIST
WHERE f.CodProt = @codProtocolo
  AND (f.DELETADO IS NULL OR f.DELETADO = 0)
ORDER BY f.DTLANCAMENTO DESC
`;

// Query 9: Requisições de compra vinculadas
export const QUERY_REQUISICOES = `
SELECT
    rc.codigo AS CodRequisicao,
    rc.numero AS NumeroRequisicao,
    rc.data AS DataRequisicao,
    rc.obs AS Observacao,
    c.Titulo AS Projeto,
    p.descricao AS Solicitante,
    CASE
        WHEN rc.liberado = 1 THEN 'LIBERADA'
        WHEN rc.rejeitado = 1 THEN 'REJEITADA'
        WHEN rc.isNaoLiberada = 1 THEN 'PENDENTE'
        ELSE 'EM ANALISE'
    END AS Status,
    rc.valorLimite AS ValorLimite
FROM requisicaocompra rc
    LEFT JOIN convenio c ON c.numConv = rc.convenio_codigo
    LEFT JOIN pessoas p ON p.codigo = rc.pessoa_codigo
WHERE rc.codProt = @codProtocolo
  AND (rc.deletado IS NULL OR rc.deletado = 0)
ORDER BY rc.data DESC
`;

// Query 10: Observações nas movimentações
export const QUERY_OBSERVACOES = `
SELECT
    sm.data AS DataMovimentacao,
    sm.obs AS Observacao,
    sm.Outros AS OutrasAnotacoes,
    usuMov.Nome AS Usuario,
    setorDest.DESCR AS Setor,
    sp.descricao AS Situacao
FROM scd_movimentacao sm
    LEFT JOIN usuario usuMov ON usuMov.codigo = sm.codUsuario
    LEFT JOIN SETOR setorDest ON setorDest.CODIGO = sm.codSetorDestino
    LEFT JOIN situacaoProtocolo sp ON sp.codigo = sm.codSituacaoProt
WHERE sm.CodProt = @codProtocolo
  AND sm.obs IS NOT NULL
  AND sm.obs <> ''
  AND (sm.Deletado IS NULL OR sm.Deletado = 0)
ORDER BY sm.data DESC
`;

// Query 11: Itens de movimentação
export const QUERY_ITENS = `
SELECT
    smi.codigo AS CodItem,
    smi.titulo AS Titulo,
    smi.observacao AS Observacao1,
    smi.observacao2 AS Observacao2,
    smi.Data AS DataItem,
    smi.Valor AS ValorItem,
    smi.dataCad AS DataCadastro,
    smi.ok AS Confirmado,
    smi.okData AS DataConfirmacao,
    usu.Nome AS UsuarioCadastro
FROM scd_movimentacaoItem smi
    LEFT JOIN usuario usu ON usu.codigo = smi.codUsu
WHERE smi.CodProt = @codProtocolo
  AND (smi.deletado IS NULL OR smi.deletado = 0)
ORDER BY smi.dataCad DESC
`;

// Query 12: Histórico de alterações do documento (auditoria)
export const QUERY_AUDITORIA_DOC = `
SELECT
    dh.Codigo,
    dh.Descricao AS AlteracaoDescrita,
    dh.DataCad AS DataAlteracao,
    usu.Nome AS UsuarioAlteracao,
    dh.TabelaRef
FROM documento_Historico dh
    LEFT JOIN usuario usu ON usu.codigo = dh.CodUsu
WHERE dh.CodRef = @codProtocolo
  AND (dh.Deletado IS NULL OR dh.Deletado = 0)
ORDER BY dh.DataCad DESC
`;

// Query 13: Histórico de alterações das movimentações (auditoria)
export const QUERY_AUDITORIA_MOV = `
SELECT
    smh.Codigo,
    smh.Descricao AS AlteracaoDescrita,
    smh.DataCad AS DataAlteracao,
    usu.Nome AS UsuarioAlteracao,
    smh.TabelaRef
FROM scd_movimentacao_Historico smh
    LEFT JOIN usuario usu ON usu.codigo = smh.CodUsu
WHERE smh.CodRef IN (
    SELECT Codigo FROM scd_movimentacao WHERE CodProt = @codProtocolo
)
  AND (smh.Deletado IS NULL OR smh.Deletado = 0)
ORDER BY smh.DataCad DESC
`;

// Query 14: Arquivos anexados
export const QUERY_ANEXOS = `
SELECT
    da.Codigo AS CodAnexo,
    da.NomeDoc AS NomeArquivo,
    da.Descricao AS DescricaoAnexo,
    da.Data AS DataAnexo,
    da.Origem AS TabelaOrigem
FROM DocsAnexados da
WHERE da.CodRef = @codProtocolo
  AND da.Origem = 'DOCUMENTO'
ORDER BY da.Data DESC
`;

// Query 15: Tempo de tramitação por setor
export const QUERY_TEMPO_SETOR = `
WITH MovimentacoesOrdenadas AS (
    SELECT
        sm.Codigo,
        sm.CodProt,
        sm.codSetorDestino,
        s.DESCR AS Setor,
        sm.data AS DataEntrada,
        LEAD(sm.data) OVER (PARTITION BY sm.CodProt ORDER BY sm.data) AS DataSaida,
        sm.RegAtual
    FROM scd_movimentacao sm
        LEFT JOIN SETOR s ON s.CODIGO = sm.codSetorDestino
    WHERE sm.CodProt = @codProtocolo
      AND (sm.Deletado IS NULL OR sm.Deletado = 0)
)
SELECT
    Setor,
    DataEntrada,
    ISNULL(DataSaida, GETDATE()) AS DataSaida,
    DATEDIFF(DAY, DataEntrada, ISNULL(DataSaida, GETDATE())) AS DiasNoSetor,
    CASE WHEN RegAtual = 1 THEN 'ATUAL' ELSE '' END AS Status
FROM MovimentacoesOrdenadas
ORDER BY DataEntrada
`;

// Query 16: Resumo de tempo por setor
export const QUERY_RESUMO_TEMPO = `
WITH MovimentacoesOrdenadas AS (
    SELECT
        sm.codSetorDestino,
        s.DESCR AS Setor,
        sm.data AS DataEntrada,
        LEAD(sm.data) OVER (PARTITION BY sm.CodProt ORDER BY sm.data) AS DataSaida
    FROM scd_movimentacao sm
        LEFT JOIN SETOR s ON s.CODIGO = sm.codSetorDestino
    WHERE sm.CodProt = @codProtocolo
      AND (sm.Deletado IS NULL OR sm.Deletado = 0)
)
SELECT
    Setor,
    COUNT(*) AS VezesNoSetor,
    SUM(DATEDIFF(DAY, DataEntrada, ISNULL(DataSaida, GETDATE()))) AS DiasTotal,
    AVG(DATEDIFF(DAY, DataEntrada, ISNULL(DataSaida, GETDATE()))) AS MediaDias
FROM MovimentacoesOrdenadas
GROUP BY codSetorDestino, Setor
ORDER BY DiasTotal DESC
`;

// Query 17: Idade do protocolo
export const QUERY_IDADE = `
SELECT
    d.Numero AS Protocolo,
    d.dataCad AS DataCriacao,
    DATEDIFF(DAY, d.dataCad, GETDATE()) AS IdadeEmDias,
    DATEDIFF(MONTH, d.dataCad, GETDATE()) AS IdadeEmMeses,
    (SELECT TOP 1 data FROM scd_movimentacao
     WHERE CodProt = d.Codigo AND Deletado IS NULL
     ORDER BY data DESC) AS UltimaMovimentacao,
    DATEDIFF(DAY,
        (SELECT TOP 1 data FROM scd_movimentacao
         WHERE CodProt = d.Codigo AND Deletado IS NULL
         ORDER BY data DESC),
        GETDATE()
    ) AS DiasSemMovimentacao
FROM documento d
WHERE d.Codigo = @codProtocolo
`;

// Query 18: Query Master - todos os dados resumidos
export const QUERY_MASTER = `
SELECT
    -- DADOS BASICOS
    d.Codigo, d.Numero, d.NumDoc, d.Assunto, d.Descricao, d.obs,
    d.data AS DataDocumento, d.dataCad AS DataCadastro,
    d.remetente, d.despachante, d.Interessado,
    t.descricao AS TipoDocumento,
    inst.descricao AS Instituicao,
    c.NumConv, c.Titulo AS Projeto,
    p.descricao AS Pessoa, p.cgc_cpf,

    -- SITUACAO ATUAL
    (SELECT TOP 1 s.DESCR FROM scd_movimentacao sm
     JOIN SETOR s ON s.CODIGO = sm.codSetorDestino
     WHERE sm.CodProt = d.Codigo AND sm.RegAtual = 1 AND sm.Deletado IS NULL) AS SetorAtual,

    (SELECT TOP 1 u.Nome FROM scd_movimentacao sm
     JOIN usuario u ON u.codigo = sm.CodDestinatario
     WHERE sm.CodProt = d.Codigo AND sm.RegAtual = 1 AND sm.Deletado IS NULL) AS ResponsavelAtual,

    (SELECT TOP 1 sp.descricao FROM scd_movimentacao sm
     JOIN situacaoProtocolo sp ON sp.codigo = sm.codSituacaoProt
     WHERE sm.CodProt = d.Codigo AND sm.RegAtual = 1 AND sm.Deletado IS NULL) AS SituacaoAtual,

    (SELECT TOP 1 sm.data FROM scd_movimentacao sm
     WHERE sm.CodProt = d.Codigo AND sm.RegAtual = 1 AND sm.Deletado IS NULL) AS DataUltimaMovimentacao,

    -- METRICAS
    (SELECT COUNT(*) FROM scd_movimentacao WHERE CodProt = d.Codigo AND Deletado IS NULL) AS TotalMovimentacoes,
    (SELECT COUNT(*) FROM scd_movimentacaoItem WHERE CodProt = d.Codigo AND deletado IS NULL) AS TotalItens,
    (SELECT COUNT(*) FROM FINANCEIRO WHERE CodProt = d.Codigo AND DELETADO IS NULL) AS LancamentosFinanceiros,
    (SELECT COUNT(*) FROM scd_movimentacaoItem WHERE CodProt = d.Codigo AND CodProtRel IS NOT NULL AND deletado IS NULL) AS ProtocolosFilhos,
    (SELECT COUNT(*) FROM scd_movimentacaoItem WHERE CodProtRel = d.Codigo AND deletado IS NULL) AS EhFilhoDe,
    DATEDIFF(DAY, d.dataCad, GETDATE()) AS IdadeEmDias

FROM documento d
    LEFT JOIN tipoDocumento t ON t.codigo = d.codTipoDocumento
    LEFT JOIN Instituicao inst ON inst.codigo = d.codInst
    LEFT JOIN Convenio c ON c.NumConv = d.NumConv
    LEFT JOIN Pessoas p ON p.codigo = d.CodFornec
WHERE d.Codigo = @codProtocolo
`;
