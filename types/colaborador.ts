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
 * Estatísticas por período
 */
export interface ColaboradorEstatisticasPeriodo {
  periodo: string;
  movimentacoesEnviadas: number;
  movimentacoesRecebidas: number;
  protocolosFinalizados: number;
}

/**
 * Atuação por projeto
 */
export interface ColaboradorPorProjeto {
  numconv: number;
  tituloProjeto: string | null;
  totalMovimentacoes: number;
  protocolosFinalizados: number;
  ultimaMovimentacao: string | null;
}

/**
 * Protocolo que o colaborador participou
 */
export interface ColaboradorProtocolo {
  codprot: number;
  numeroDocumento: string | null;
  assunto: string | null;
  dataMovimentacao: string;
  dataFormatada: string;
  tipoParticipacao: "enviou" | "recebeu";
  setorOrigem: string | null;
  setorDestino: string | null;
  situacao: string | null;
  numconv: number | null;
  tituloProjeto: string | null;
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
