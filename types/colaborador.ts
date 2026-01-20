/**
 * Tipos para o módulo de Colaborador
 */

/**
 * Dados básicos do colaborador
 */
export interface Colaborador {
  codigo: number;
  nome: string;
  login: string;
  email: string | null;
  codSetor: number | null;
  nomeSetor: string | null;
  bloqueado: boolean;
  deletado: boolean;
  isAtivo: boolean;
}

/**
 * Métricas do colaborador
 */
export interface ColaboradorMetricas {
  totalMovimentacoesEnviadas: number;
  totalMovimentacoesRecebidas: number;
  totalProtocolosFinalizados: number;
  tempoMedioRespostaHoras: number | null;
  mediaMovimentacoesPorDia: number;
  protocolosEmPosse: number;
}

/**
 * KPIs do colaborador (métricas principais para dashboard)
 */
export interface ColaboradorKPIs {
  // Total de protocolos que participou (enviou ou recebeu)
  totalProtocolos: number;
  // Protocolos ativos (em andamento)
  protocolosEmAndamento: number;
  // Protocolos finalizados
  protocolosFinalizados: number;
  // Tempo médio para movimentar um protocolo (em horas)
  tempoMedioEnvioHoras: number | null;
  // Atividade recente
  protocolosHoje: number;
  protocolosSemana: number;
  // Projetos diferentes que atua
  projetosAtivos: number;
  // Métricas adicionais
  movimentacoesHoje: number;
  movimentacoesSemana: number;
  mediaMovimentacoesDia: number;
}

/**
 * Estatísticas por período
 */
export interface ColaboradorEstatisticasPeriodo {
  periodo: string;
  movimentacoesEnviadas: number;
  movimentacoesRecebidas: number;
  protocolosFinalizados: number;
}

/**
 * Atuação por projeto (dados detalhados)
 */
export interface ColaboradorPorProjeto {
  numconv: number;
  projeto: string;
  situacaoProjeto: string;
  totalProtocolos: number;
  emAndamento: number;
  finalizados: number;
  percentualFinalizacao: number;
  tempoMedioDias: number | null;
  ultimaMovimentacao: string | null;
  ultimaMovimentacaoFormatada: string | null;
}

/**
 * Totais de projetos do colaborador
 */
export interface ColaboradorProjetosTotais {
  totalProjetos: number;
  totalProtocolos: number;
  totalEmAndamento: number;
  totalFinalizados: number;
  percentualFinalizacao: number;
}

/**
 * Resposta da API de projetos do colaborador
 */
export interface ColaboradorProjetosResponse {
  projetos: ColaboradorPorProjeto[];
  totais: ColaboradorProjetosTotais;
}

/**
 * Protocolo que o colaborador participou
 */
export interface ColaboradorProtocolo {
  codprot: number;
  numeroDocumento: string | null;
  assunto: string | null;
  numconv: number | null;
  projeto: string | null;
  dataMovimentacao: string;
  dataFormatada: string | null;
  acao: "Enviou" | "Recebeu";
  statusProtocolo: string;
  diasNoSetor: number | null;
  setorOrigem: string | null;
  setorDestino: string | null;
}

/**
 * Resposta paginada de protocolos do colaborador
 */
export interface ColaboradorProtocolosPaginados {
  data: ColaboradorProtocolo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Filtros para protocolos do colaborador
 */
export interface ColaboradorProtocolosFiltros extends ColaboradorFiltros {
  page?: number;
  limit?: number;
  status?: string;
  assunto?: string;
  projeto?: string;
  orderBy?: "dataMovimentacao" | "numeroDocumento" | "assunto" | "diasNoSetor" | "statusProtocolo";
  orderDir?: "asc" | "desc";
}

/**
 * Atividade temporal (para gráfico)
 */
export interface ColaboradorAtividade {
  data: string;
  dataFormatada: string;
  movimentacoesEnviadas: number;
  movimentacoesRecebidas: number;
  total: number;
}

/**
 * Dados completos do colaborador (resposta da API)
 */
export interface ColaboradorDetalhes {
  colaborador: Colaborador;
  metricas: ColaboradorMetricas;
  kpis: ColaboradorKPIs;
  estatisticasPeriodo: ColaboradorEstatisticasPeriodo[];
}

/**
 * Filtros para busca de dados do colaborador
 */
export interface ColaboradorFiltros {
  periodo?: number; // em dias
  dataInicio?: string;
  dataFim?: string;
  diaSemana?: number;
  hora?: number;
}
