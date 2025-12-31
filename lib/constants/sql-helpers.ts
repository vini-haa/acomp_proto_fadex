/**
 * SQL Helpers - Snippets para usar nas queries
 *
 * Snippets SQL reutilizáveis para calcular situações e descrições
 * diretamente nas queries, tratando NULLs históricos.
 */

import { SETORES } from "./setores";
import { SITUACOES } from "./situacoes";

/**
 * Snippet SQL para calcular situação corretamente nas queries
 * Usa COALESCE com CASE WHEN para tratar NULLs históricos
 */
export const SQL_SITUACAO_CALCULADA = `
COALESCE(
  m.codSituacaoProt,
  CASE
    WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN ${SITUACOES.ARQUIVADO}
    WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN ${SITUACOES.ENCAMINHADO_JURIDICO}
    WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN ${SITUACOES.EM_ANALISE}
    ELSE ${SITUACOES.RECEBIDO}
  END
)`;

/**
 * Snippet SQL para calcular descrição da situação nas queries
 * Inclui sufixo "(AUTO)" para situações inferidas
 */
export const SQL_SITUACAO_DESCRICAO = `
COALESCE(
  s.descricao,
  CASE
    WHEN m.codSetorDestino IN (${SETORES.ARQUIVOS.join(",")}) THEN 'Arquivado (Auto)'
    WHEN m.codSetorDestino = ${SETORES.JURIDICO} THEN 'Encaminhado p/ Jurídico'
    WHEN m.codSetorDestino = ${SETORES.GERENCIA_PROJETOS} THEN 'Em Análise'
    ELSE 'Recebido'
  END
)`;
