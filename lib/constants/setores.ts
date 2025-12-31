/**
 * Constantes de Setores da Organização
 *
 * IDs mapeados do banco de dados SQL Server (SAGI)
 */

/**
 * IDs de Setores principais da organização
 */
export const SETORES = {
  /** Setor Jurídico */
  JURIDICO: 5,

  /** Setor de Arquivo - destino final de protocolos arquivados */
  ARQUIVO: 52,

  /** Gerência de Projetos */
  GERENCIA_PROJETOS: 40,

  /** Setor Financeiro */
  FINANCEIRO: 48,

  /** Setor Administrativo */
  ADMINISTRATIVO: 45,

  /** Secretaria */
  SECRETARIA: 44,

  /** Contabilidade */
  CONTABILIDADE: 43,

  /** Presidência */
  PRESIDENCIA: 56,

  /**
   * Lista completa de setores que representam "Arquivo"
   * Protocolos enviados para esses setores são considerados ARQUIVADOS
   */
  ARQUIVOS: [25, 51, 52, 53, 54, 55] as const,

  /**
   * Setores de entrada na fundação (porta de entrada de novos protocolos)
   */
  ENTRADA: [40, 44] as const, // Gerência de Projetos e Secretaria

  /**
   * Setores relevantes para análise macro
   */
  RELEVANTES_MACRO: [52, 43, 48, 45, 40, 56, 44] as const,
} as const;

/**
 * Valor especial para indicar "Todos os Setores" em filtros
 */
export const TODOS_SETORES = 0;

/**
 * Verifica se um setor é considerado setor de arquivo
 *
 * @param codSetor - Código do setor
 * @returns true se for setor de arquivo
 */
export function isSetorArquivo(codSetor: number): boolean {
  return (SETORES.ARQUIVOS as readonly number[]).includes(codSetor);
}

/**
 * Verifica se um setor é setor de entrada na fundação
 *
 * @param codSetor - Código do setor
 * @returns true se for setor de entrada
 */
export function isSetorEntrada(codSetor: number): boolean {
  return (SETORES.ENTRADA as readonly number[]).includes(codSetor);
}

/** Tipo para códigos de setores de arquivo */
export type CodigoSetorArquivo = (typeof SETORES.ARQUIVOS)[number];

/** Tipo para códigos de setores de entrada */
export type CodigoSetorEntrada = (typeof SETORES.ENTRADA)[number];
