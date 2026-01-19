/**
 * Tipos relacionados a Analytics e Análises
 */

export interface SerieTemporalItem {
  periodo: string;
  qtdEntradas: number;
  qtdSaidas: number;
  saldoPeriodo: number;
  saldoAcumulado: number;
  // Campos adicionados pela API para compatibilidade com gráficos
  data?: string;
  entradas?: number;
  saidas?: number;
}

export interface DistribuicaoFaixaItem {
  faixaTempo: string;
  statusProtocolo: string;
  quantidade: number;
  percentual: number;
}

export interface AnaliseAssuntoItem {
  assunto: string;
  totalProtocolos: number;
  emAndamento: number;
  finalizados: number;
  mediaDiasFinalizado: number | null;
  minDias: number | null;
  maxDias: number | null;
  desvioPadraoDias: number | null;
}

export interface FluxoSetorItem {
  setorOrigem: string;
  setorDestino: string;
  quantidade: number;
  mediaDias: number;
  rapidos: number;
  demorados: number;
}

export interface AnaliseProjetoItem {
  numconv: number;
  projeto: string;
  totalProtocolos: number;
  emAndamento: number;
  finalizados: number;
  mediaDias: number;
  maxDiasEmAndamento: number | null;
}

export interface HeatmapItem {
  diaSemana: string;
  diaSemanaNum: number;
  hora: number;
  quantidade: number;
}

export interface ComparativoItem {
  ano: number;
  mes: number;
  mesNome: string;
  quantidade: number;
}

// Type aliases para consistência com hooks
export type FluxoTemporalData = SerieTemporalItem;
export type DistribuicaoFaixaData = DistribuicaoFaixaItem;
export type AssuntoAnalysisData = AnaliseAssuntoItem;
export type ProjetoAnalysisData = AnaliseProjetoItem;
export type FluxoSetoresData = FluxoSetorItem;
export type HeatmapData = HeatmapItem;
export type ComparativoData = ComparativoItem;

// === FILTROS DO HEATMAP ===

export interface HeatmapFilters {
  numconv?: number | null;
  instituicao?: number | null;
  uf?: string | null;
  situacao?: number | null;
  codSetor?: number | null;
  codColaborador?: number | null;
  periodo?: number;
}

export interface InstituicaoOption {
  codigo: number;
  descricao: string;
  sigla: string;
  qtdConvenios: number;
}

export interface EstadoOption {
  uf: string;
  qtdConvenios: number;
}

export interface SituacaoOption {
  codigo: number;
  descricao: string;
  qtdConvenios: number;
}

export interface ProjetoOption {
  numconv: number;
  titulo: string;
  codSituacaoProjeto: number | null;
}

export interface SetorOption {
  codigo: number;
  descr: string;
}

export interface ColaboradorOption {
  codigo: number;
  nome: string;
  login: string;
  codSetor: number | null;
  qtdMovimentacoes: number;
}

export interface HeatmapFiltrosOptions {
  instituicoes: InstituicaoOption[];
  estados: EstadoOption[];
  situacoes: SituacaoOption[];
  projetos: ProjetoOption[];
  setores: SetorOption[];
  colaboradores: ColaboradorOption[];
}
