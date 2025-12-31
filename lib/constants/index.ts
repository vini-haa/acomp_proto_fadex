/**
 * Constantes Centralizadas da Aplicação
 *
 * Este arquivo serve como "Fonte da Verdade" para IDs de entidades do banco de dados.
 * Elimina números mágicos espalhados pelo código e centraliza a lógica de negócio.
 *
 * IMPORTANTE: Os IDs aqui mapeados foram extraídos do banco de dados SQL Server (SAGI)
 * e NÃO devem ser alterados sem verificar a consistência com o banco de produção.
 *
 * @see RELATORIO_INVESTIGACAO_SITUACAO.md para detalhes do mapeamento
 */

// Re-export tudo dos módulos especializados
export {
  SETORES,
  TODOS_SETORES,
  isSetorArquivo,
  isSetorEntrada,
  type CodigoSetorArquivo,
  type CodigoSetorEntrada,
} from "./setores";

export {
  SITUACOES,
  SITUACOES_DESCRICAO,
  inferirSituacao,
  getSituacaoDescricao,
  type CodigoSituacao,
} from "./situacoes";

export { ASSUNTOS_NORMALIZADOS, normalizarAssunto, type AssuntoNormalizado } from "./assuntos";

export { SQL_SITUACAO_CALCULADA, SQL_SITUACAO_DESCRICAO } from "./sql-helpers";
