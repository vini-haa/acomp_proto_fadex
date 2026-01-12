/**
 * Tipos para o componente ProtocoloFilters
 */

export interface FilterOptions {
  contasCorrentes: string[];
  setores: string[];
  assuntos: string[];
}

export interface FilterValues {
  status?: string;
  numeroDocumento?: string;
  numconv?: string;
  faixaTempo?: string;
  contaCorrente?: string;
  setorAtual?: string;
  assunto?: string;
  diaSemana?: number;
  hora?: number;
  excluirLotePagamento?: boolean;
}

export interface InitialFilters {
  numconv?: string;
  assunto?: string;
  diaSemana?: number;
  hora?: number;
}

export interface ProtocoloFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  filterOptions?: FilterOptions;
  initialFilters?: InitialFilters;
}
