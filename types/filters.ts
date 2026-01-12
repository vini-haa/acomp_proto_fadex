/**
 * Tipos relacionados a Filtros
 */

export interface ProtocoloFilters {
  status?: "Em Andamento" | "Finalizado" | "Histórico";
  assunto?: string;
  assuntoNormalizado?: string; // Categoria normalizada (rubrica orçamentária)
  numeroDocumento?: string; // Número do protocolo (busca por prefixo)
  numconv?: number;
  dataInicio?: Date;
  dataFim?: Date;
  faixaTempo?: string;
  // Novos filtros baseados na análise do trace SQL
  setorAtual?: number; // Código do setor onde o protocolo está atualmente
  setorOrigem?: number; // Código do setor de origem/criação
  diasEstagnado?: number; // Mínimo de dias sem movimentação (para protocolos estagnados)
  apenasEstagnados?: boolean; // Filtrar apenas protocolos estagnados (>365 dias)
  excluirLotePagamento?: boolean; // Excluir LOTE DE PAGAMENTOS (padrão: true)
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
