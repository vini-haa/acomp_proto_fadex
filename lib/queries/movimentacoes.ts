/**
 * Queries SQL para Movimentações de Protocolos
 *
 * Este arquivo contém queries otimizadas que tratam o bug histórico
 * de registros com codSituacaoProt = NULL.
 *
 * A correção é feita em tempo de leitura (Virtual Patch), calculando
 * a situação correta baseada no setor de destino.
 *
 * @see lib/constants.ts para mapeamento de IDs
 * @see RELATORIO_INVESTIGACAO_SITUACAO.md para documentação do bug
 */

import { SETORES, SITUACOES } from "@/lib/constants";

/**
 * Query para listar movimentações de um protocolo com tratamento de NULL
 *
 * Esta query calcula automaticamente a situação para registros
 * onde codSituacaoProt é NULL, baseado no setor de destino.
 *
 * @param codProtocolo - ID do protocolo
 */
export const GET_MOVIMENTACOES_BY_PROTOCOLO = `
SELECT
    m.codigo AS idMovimentacao,
    m.codprot,
    m.data AS dataMovimentacao,
    FORMAT(m.data, 'dd/MM/yyyy HH:mm') AS dataFormatada,
    m.codsetororigem AS codSetorOrigem,
    m.codsetordestino AS codSetorDestino,
    origem.descr AS setorOrigem,
    destino.descr AS setorDestino,
    m.numdocumento AS numDocumento,
    m.RegAtual AS isAtual,
    m.observacao,

    -- Situação REAL (código) - com correção de NULLs
    COALESCE(
        m.codSituacaoProt,
        CASE
            WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN ${SITUACOES.ARQUIVADO}
            WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN ${SITUACOES.ENCAMINHADO_JURIDICO}
            WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN ${SITUACOES.EM_ANALISE}
            ELSE ${SITUACOES.RECEBIDO}
        END
    ) AS codSituacaoReal,

    -- Descrição da situação (com indicador de auto-cálculo)
    COALESCE(
        s.descricao,
        CASE
            WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN 'Arquivado (Auto)'
            WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN 'Encaminhado p/ Jurídico'
            WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN 'Em Análise'
            ELSE 'Recebido'
        END
    ) AS situacaoDescricao,

    -- Flag indicando se a situação foi calculada automaticamente
    CASE WHEN m.codSituacaoProt IS NULL THEN 1 ELSE 0 END AS situacaoInferida

FROM scd_movimentacao m
    LEFT JOIN situacaoProtocolo s ON m.codSituacaoProt = s.codigo
    LEFT JOIN setor origem ON m.codsetororigem = origem.codigo
    LEFT JOIN setor destino ON m.codsetordestino = destino.codigo
WHERE m.codprot = @codProtocolo
    AND (m.Deletado IS NULL OR m.Deletado = 0)
ORDER BY m.data DESC;
`;

/**
 * Query para listar TODAS as movimentações (paginada) com tratamento de NULL
 *
 * Inclui filtros opcionais por período e setor
 */
export function buildMovimentacoesListQuery(options: {
  codSetor?: number;
  dataInicio?: string;
  dataFim?: string;
  apenasAtuais?: boolean;
}): { query: string; params: Record<string, unknown> } {
  const conditions: string[] = ["(m.Deletado IS NULL OR m.Deletado = 0)"];
  const params: Record<string, unknown> = {};

  // Filtro por setor (origem ou destino)
  if (options.codSetor && options.codSetor > 0) {
    conditions.push("(m.codsetororigem = @codSetor OR m.codsetordestino = @codSetor)");
    params.codSetor = options.codSetor;
  }

  // Filtro por data
  if (options.dataInicio) {
    conditions.push("m.data >= @dataInicio");
    params.dataInicio = options.dataInicio;
  }

  if (options.dataFim) {
    conditions.push("m.data <= @dataFim");
    params.dataFim = options.dataFim;
  }

  // Filtro apenas movimentações atuais
  if (options.apenasAtuais) {
    conditions.push("m.RegAtual = 1");
  }

  const whereClause = conditions.join(" AND ");

  const query = `
SELECT
    m.codigo AS idMovimentacao,
    m.codprot,
    m.data AS dataMovimentacao,
    FORMAT(m.data, 'dd/MM/yyyy HH:mm') AS dataFormatada,
    m.codsetororigem AS codSetorOrigem,
    m.codsetordestino AS codSetorDestino,
    origem.descr AS setorOrigem,
    destino.descr AS setorDestino,
    m.numdocumento AS numDocumento,
    m.RegAtual AS isAtual,
    d.assunto,

    -- Situação REAL (código) - com correção de NULLs
    COALESCE(
        m.codSituacaoProt,
        CASE
            WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN ${SITUACOES.ARQUIVADO}
            WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN ${SITUACOES.ENCAMINHADO_JURIDICO}
            WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN ${SITUACOES.EM_ANALISE}
            ELSE ${SITUACOES.RECEBIDO}
        END
    ) AS codSituacaoReal,

    -- Descrição da situação
    COALESCE(
        s.descricao,
        CASE
            WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN 'Arquivado (Auto)'
            WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN 'Encaminhado p/ Jurídico'
            WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN 'Em Análise'
            ELSE 'Recebido'
        END
    ) AS situacaoDescricao,

    -- Flag de situação inferida
    CASE WHEN m.codSituacaoProt IS NULL THEN 1 ELSE 0 END AS situacaoInferida

FROM scd_movimentacao m
    LEFT JOIN situacaoProtocolo s ON m.codSituacaoProt = s.codigo
    LEFT JOIN setor origem ON m.codsetororigem = origem.codigo
    LEFT JOIN setor destino ON m.codsetordestino = destino.codigo
    LEFT JOIN documento d ON m.codprot = d.codigo AND d.deletado IS NULL
WHERE ${whereClause}
ORDER BY m.data DESC
`;

  return { query, params };
}

/**
 * Query para contagem de movimentações por situação
 * Útil para dashboard e estatísticas
 */
export const GET_CONTAGEM_POR_SITUACAO = `
SELECT
    -- Agrupa pela situação calculada
    COALESCE(
        m.codSituacaoProt,
        CASE
            WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN ${SITUACOES.ARQUIVADO}
            WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN ${SITUACOES.ENCAMINHADO_JURIDICO}
            WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN ${SITUACOES.EM_ANALISE}
            ELSE ${SITUACOES.RECEBIDO}
        END
    ) AS codSituacao,

    COALESCE(
        s.descricao,
        CASE
            WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN 'Arquivado'
            WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN 'Encaminhado p/ Jurídico'
            WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN 'Em Análise'
            ELSE 'Recebido'
        END
    ) AS descricaoSituacao,

    COUNT(*) AS total,
    SUM(CASE WHEN m.codSituacaoProt IS NULL THEN 1 ELSE 0 END) AS totalInferidos

FROM scd_movimentacao m
    LEFT JOIN situacaoProtocolo s ON m.codSituacaoProt = s.codigo
WHERE (m.Deletado IS NULL OR m.Deletado = 0)
    AND m.RegAtual = 1  -- Apenas movimentações atuais
GROUP BY
    COALESCE(
        m.codSituacaoProt,
        CASE
            WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN ${SITUACOES.ARQUIVADO}
            WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN ${SITUACOES.ENCAMINHADO_JURIDICO}
            WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN ${SITUACOES.EM_ANALISE}
            ELSE ${SITUACOES.RECEBIDO}
        END
    ),
    COALESCE(
        s.descricao,
        CASE
            WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN 'Arquivado'
            WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN 'Encaminhado p/ Jurídico'
            WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN 'Em Análise'
            ELSE 'Recebido'
        END
    )
ORDER BY total DESC;
`;

/**
 * Query para verificar quantos registros tem situação NULL
 * Útil para monitoramento da qualidade dos dados
 */
export const GET_ESTATISTICAS_QUALIDADE = `
SELECT
    COUNT(*) AS totalMovimentacoes,
    SUM(CASE WHEN m.codSituacaoProt IS NULL THEN 1 ELSE 0 END) AS totalSemSituacao,
    SUM(CASE WHEN m.codSituacaoProt IS NOT NULL THEN 1 ELSE 0 END) AS totalComSituacao,
    CAST(
        SUM(CASE WHEN m.codSituacaoProt IS NULL THEN 1.0 ELSE 0 END) * 100.0 / COUNT(*)
    AS DECIMAL(5,2)) AS percentualSemSituacao
FROM scd_movimentacao m
WHERE (m.Deletado IS NULL OR m.Deletado = 0);
`;
