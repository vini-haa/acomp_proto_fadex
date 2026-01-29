/**
 * Tipos para o Dashboard de Visão por Setores
 */

export interface SetorMetricas {
  codSetor: number;
  nomeSetor: string;
  totalColaboradores: number;
  totalProtocolos: number;
  movimentacoesPeriodo: number;
  tempoMedioDias: number | null;
  protocolosEmAndamento: number;
  protocolosFinalizados: number;
}

export interface SetoresMetricasResponse {
  data: SetorMetricas[];
  periodo: string;
  totalSetores: number;
}

export type PeriodoDashboard = "30d" | "60d" | "90d" | "180d" | "365d";

export interface SetoresMetricasFilters {
  periodo?: PeriodoDashboard;
}

/**
 * Tipos para a Visão Executiva do Dashboard
 */

export type PeriodoExecutivo = "7d" | "30d" | "60d" | "90d";
export type AnoExecutivo = "2023" | "2024" | "2025" | "2026" | "todos";

/**
 * Props compartilhadas de filtros entre as abas do Dashboard
 */
export interface FiltrosDashboard {
  codigoSetor: number;
  periodo: PeriodoExecutivo;
  ano: AnoExecutivo;
}
export type TendenciaSetor = "melhorando" | "estavel" | "piorando";
export type StatusSetor = "bom" | "atencao" | "critico";
export type TipoAlerta = "atraso" | "tendencia";
export type SeveridadeAlerta = "info" | "warning" | "critical";

export interface KPIsExecutivo {
  pendentes: number;
  pendentesVariacao: number;
  finalizados: number;
  finalizadosVariacao: number;
  tempoMedioDias: number;
  tempoMedioVariacao: number;
  percentualNoPrazo: number;
  percentualVariacao: number;
  // Valor financeiro
  valorPendente: number;
  valorPendenteVariacao: number;
}

export interface SaudeSetor {
  codSetor: number;
  nomeSetor: string;
  pendentes: number;
  tempoMedioDias: number;
  tendencia: TendenciaSetor;
  status: StatusSetor;
}

export interface AlertaExecutivo {
  tipo: TipoAlerta;
  severidade: SeveridadeAlerta;
  titulo: string;
  descricao: string;
  link?: string;
}

export interface TempoPorTipo {
  tipo: string;
  codTipo: number;
  tempoMedioDias: number;
  quantidade: number;
}

export interface ProjetoProblematico {
  numconv: number;
  projeto: string;
  pendentes: number;
  atrasados: number;
  valorPendente: number;
  tempoMedioDias: number;
}

export interface TendenciaFluxo {
  mes: string;
  mesLabel: string;
  entradas: number;
  saidas: number;
}

export interface VisaoExecutivaResponse {
  periodo: string;
  ano: string;
  setor: number;
  dataAtualizacao: string;
  kpis: KPIsExecutivo;
  saudeSetores: SaudeSetor[];
  alertas: AlertaExecutivo[];
  tempoPorTipo: TempoPorTipo[];
  projetosProblematicos: ProjetoProblematico[];
  tendenciaFluxo: TendenciaFluxo[];
}

// =============================================
// Tipos para Visão por Setor Específico
// =============================================

export interface SetorVsMediaData {
  setor: {
    codSetor: number;
    nomeSetor: string;
    tempoMedio: number;
    slaPercent: number;
    pendentes: number;
  };
  media: {
    tempoMedio: number;
    slaPercent: number;
    pendentes: number;
  };
  ranking: {
    posicao: number;
    totalSetores: number;
  };
}

export interface ProtocoloCritico {
  codProtocolo: number;
  numeroProtocolo: string;
  assunto: string;
  tipoDocumento: string;
  diasParado: number;
  status: "critico" | "urgente" | "emDia";
}

export interface EvolucaoSetorMes {
  mes: string;
  mesLabel: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface DestinoProtocolo {
  codSetorDestino: number;
  nomeSetorDestino: string;
  quantidade: number;
  percentual: number;
  tipoFluxo: "arquivo" | "tramitacao";
}

export interface RetornoProtocolo {
  codSetorOrigem: number;
  nomeSetorOrigem: string;
  quantidade: number;
  percentual: number;
}

export interface FluxoSetorData {
  destinos: DestinoProtocolo[];
  retornos: RetornoProtocolo[];
  totalSaidas: number;
  totalRetornos: number;
  percentualRetorno: number;
}

export interface VisaoSetorResponse {
  setor: { codigo: number; nome: string };
  periodo: string;
  ano: string;
  dataAtualizacao: string;
  setorVsMedia: SetorVsMediaData;
  protocolosCriticos: ProtocoloCritico[];
  evolucaoSetor: EvolucaoSetorMes[];
  fluxoSetor: FluxoSetorData;
}
