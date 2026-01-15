/**
 * Tipos para o módulo de Gestão de Equipes/Setores
 */

// === SETOR/EQUIPE ===

export interface Equipe {
  codSetor: number;
  nomeSetor: string;
  nomeSetorOriginal: string;
  totalMembros: number;
  membros: string | null;
  movimentacoes30d: number;
  movimentacoes7d: number;
  protocolosEmPosse: number;
  protocolosParados: number;
  tempoMedioRespostaHoras: number | null;
  cargaTrabalho: CargaTrabalho;
  statusGargalo: StatusGargalo;
}

export type CargaTrabalho = "NORMAL" | "MODERADA" | "ALTA" | "MUITO ALTA" | "CRÍTICA";

export type StatusGargalo = "NORMAL" | "ATENÇÃO" | "GARGALO" | "GARGALO CRÍTICO";

// === ALERTAS ===

export interface AlertaSetor {
  codSetor: number;
  nomeSetor: string;
  criticos: number;
  urgentes: number;
  atencao: number;
  totalAlertas: number;
}

export interface AlertasResumo {
  totalCriticos: number;
  totalUrgentes: number;
  totalAtencao: number;
  totalGeral: number;
  setores: AlertaSetor[];
}

// === GARGALOS ===

export interface Gargalo {
  codSetor: number;
  nomeSetor: string;
  cargaAtual: number;
  tempoMedioHoras: number | null;
  protocolosParados: number;
  mediaCarga: number;
  mediaTempo: number | null;
  percentualAcimaMedia: number | null;
  tipoGargalo: TipoGargalo;
  severidade: SeveridadeGargalo;
}

export type TipoGargalo = "NORMAL" | "VOLUME CRÍTICO" | "VOLUME ALTO" | "LENTIDÃO" | "ESTAGNAÇÃO";

export type SeveridadeGargalo = 0 | 1 | 2 | 3; // 0=Normal, 1=Moderado, 2=Alto, 3=Crítico

// === USUÁRIOS/PERFORMANCE ===

export interface UsuarioPerformance {
  codUsuario: number;
  nomeUsuario: string;
  login: string;
  codSetor: number;
  nomeSetor: string;
  movimentacoesEnviadas30d: number;
  movimentacoesRecebidas30d: number;
  protocolosFinalizados30d: number;
  tempoMedioRespostaHoras: number | null;
  mediaMovimentacoesPorDia: number;
}

// === FILTROS ===

export interface EquipesFilters {
  busca?: string;
  periodo?: "7d" | "30d" | "90d";
}

export interface UsuariosFilters {
  codSetor?: number;
  periodo?: "7d" | "30d" | "90d";
}

// === RESPONSES ===

export interface EquipesResponse {
  data: Equipe[];
  success: boolean;
  total: number;
  filters: EquipesFilters;
}

export interface AlertasResponse {
  data: AlertasResumo;
  success: boolean;
}

export interface GargalosResponse {
  data: Gargalo[];
  success: boolean;
  total: number;
}

export interface UsuariosResponse {
  data: UsuarioPerformance[];
  success: boolean;
  total: number;
  filters: UsuariosFilters;
}

// === HELPERS ===

export function getCargaTrabalhoColor(carga: CargaTrabalho): string {
  const colors: Record<CargaTrabalho, string> = {
    NORMAL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    MODERADA: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    ALTA: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    "MUITO ALTA": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    CRÍTICA: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };
  return colors[carga] || colors["NORMAL"];
}

export function getGargaloIcon(status: StatusGargalo): string {
  const icons: Record<StatusGargalo, string> = {
    NORMAL: "✅",
    ATENÇÃO: "⚠️",
    GARGALO: "🔴",
    "GARGALO CRÍTICO": "🚨",
  };
  return icons[status] || icons["NORMAL"];
}

export function getSeveridadeLabel(severidade: SeveridadeGargalo): string {
  const labels: Record<SeveridadeGargalo, string> = {
    0: "Normal",
    1: "Moderado",
    2: "Alto",
    3: "Crítico",
  };
  return labels[severidade] || "Desconhecido";
}
