/**
 * Constantes de Situação de Protocolo
 *
 * Mapeamento baseado na tabela situacaoProtocolo do banco SAGI.
 * Inclui lógica de inferência para tratar registros históricos com NULL.
 */

import { SETORES } from "./setores";

/**
 * IDs de Situação de Protocolo (tabela situacaoProtocolo)
 *
 * Mapeamento baseado na investigação do banco de dados:
 * - Os registros com codSituacaoProt NULL são um bug histórico
 * - A situação correta pode ser INFERIDA pelo setor de destino
 */
export const SITUACOES = {
  /** Protocolo arquivado (destino final) */
  ARQUIVADO: 60,

  /** Protocolo recebido/em trâmite (situação padrão) */
  RECEBIDO: 62,

  /** Protocolo encaminhado para o setor jurídico */
  ENCAMINHADO_JURIDICO: 65,

  /** Protocolo em análise (geralmente na Gerência de Projetos) */
  EM_ANALISE: 66,
} as const;

/**
 * Descrições das situações para exibição
 */
export const SITUACOES_DESCRICAO: Record<number, string> = {
  [SITUACOES.ARQUIVADO]: "Arquivado",
  [SITUACOES.RECEBIDO]: "Recebido",
  [SITUACOES.ENCAMINHADO_JURIDICO]: "Encaminhado para Jurídico",
  [SITUACOES.EM_ANALISE]: "Em Análise",
};

/**
 * Infere a situação correta do protocolo baseado no setor de destino.
 *
 * Esta função resolve o bug histórico onde ~226.000 registros
 * foram salvos com codSituacaoProt = NULL.
 *
 * Regras de inferência:
 * 1. Se já tem situação preenchida e válida, mantém
 * 2. Se destino é setor de ARQUIVO → ARQUIVADO
 * 3. Se destino é JURÍDICO → ENCAMINHADO_JURIDICO
 * 4. Se destino é GERÊNCIA DE PROJETOS → EM_ANÁLISE
 * 5. Qualquer outro caso → RECEBIDO (fallback seguro)
 *
 * @param codSetorDestino - Código do setor de destino da movimentação
 * @param codSituacaoAtual - Situação atual (pode ser null/undefined)
 * @returns Código da situação inferida
 *
 * @example
 * // Protocolo indo para o arquivo
 * inferirSituacao(52, null) // Retorna 60 (ARQUIVADO)
 *
 * // Protocolo com situação já preenchida
 * inferirSituacao(48, 62) // Retorna 62 (mantém o valor original)
 *
 * // Protocolo indo para o jurídico
 * inferirSituacao(5, null) // Retorna 65 (ENCAMINHADO_JURIDICO)
 */
export function inferirSituacao(codSetorDestino: number, codSituacaoAtual?: number | null): number {
  // 1. Se já veio preenchido com valor válido, respeita
  if (codSituacaoAtual !== null && codSituacaoAtual !== undefined && codSituacaoAtual > 0) {
    return codSituacaoAtual;
  }

  // 2. Verifica se é setor de arquivo
  if ((SETORES.ARQUIVOS as readonly number[]).includes(codSetorDestino)) {
    return SITUACOES.ARQUIVADO;
  }

  // 3. Verifica setores específicos
  if (codSetorDestino === SETORES.JURIDICO) {
    return SITUACOES.ENCAMINHADO_JURIDICO;
  }

  if (codSetorDestino === SETORES.GERENCIA_PROJETOS) {
    return SITUACOES.EM_ANALISE;
  }

  // 4. Fallback seguro - tramitações gerais
  return SITUACOES.RECEBIDO;
}

/**
 * Retorna a descrição da situação baseada no código
 *
 * @param codSituacao - Código da situação
 * @returns Descrição textual da situação
 */
export function getSituacaoDescricao(codSituacao: number): string {
  return SITUACOES_DESCRICAO[codSituacao] || "Desconhecida";
}

/** Tipo para códigos de situação válidos */
export type CodigoSituacao = (typeof SITUACOES)[keyof typeof SITUACOES];
