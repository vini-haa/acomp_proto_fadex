/**
 * Tipos relacionados a Filtros
 */

export interface ProtocoloFilters {
  status?: "Em Andamento" | "Finalizado" | "Histórico";
  assunto?: string;
  numeroDocumento?: string; // Número do protocolo (busca por prefixo)
  numconv?: number;
  dataInicio?: Date;
  dataFim?: Date;
  faixaTempo?: string;
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
