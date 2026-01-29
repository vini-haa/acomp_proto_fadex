import { useQuery } from "@tanstack/react-query";
import { CACHE_REAL_TIME, DEFAULT_QUERY_OPTIONS } from "@/lib/constants/cache";

/**
 * Tipos para os detalhes do setor
 */
export interface SetorDetalhes {
  codSetor: number;
  nomeSetor: string;
  nomeSetorOriginal: string;
  totalMembros: number;
  membros: string | null;
}

export interface SetorMetricas {
  movimentacoes30d: number;
  movimentacoes7d: number;
  protocolosEmPosse: number;
  protocolosParados: number;
  tempoMedioRespostaHoras: number | null;
}

export interface SetorHistorico {
  periodo: string;
  movimentacoes: number;
  protocolosDistintos: number;
  tempoMedioHoras: number | null;
}

export interface ProtocoloEmPosse {
  codigo: number;
  numero: string;
  dataCad: string;
  diasTramitacao: number;
  dataEntradaSetor: string;
  diasNoSetor: number;
  assunto: string | null;
  interessado: string | null;
  statusUrgencia: "CRITICO" | "URGENTE" | "ATENCAO" | "NORMAL";
}

export interface MembroSetor {
  codUsuario: number;
  nomeUsuario: string;
  movimentacoesEnviadas30d: number;
  movimentacoesRecebidas30d: number;
  tempoMedioRespostaHoras: number | null;
}

export interface EquipeDetalhesResponse {
  success: boolean;
  data: {
    setor: SetorDetalhes;
    metricas: SetorMetricas;
    historico: SetorHistorico[];
    protocolos: ProtocoloEmPosse[];
    membros: MembroSetor[];
  };
}

/**
 * Hook para buscar detalhes completos de um setor específico
 *
 * Cache: REAL_TIME (5min stale, 10min gc)
 *
 * Retorna:
 * - Dados principais do setor
 * - Métricas atuais (movimentações, protocolos em posse, tempo médio)
 * - Histórico mensal (últimos 6 meses)
 * - Protocolos em posse (top 20 mais antigos)
 * - Membros do setor com métricas individuais
 *
 * @param codigo - Código do setor
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useEquipeDetalhes(48);
 *
 * // Acessar dados
 * const setor = data?.data?.setor;
 * const metricas = data?.data?.metricas;
 * const historico = data?.data?.historico;
 * const protocolos = data?.data?.protocolos;
 * const membros = data?.data?.membros;
 * ```
 */
export function useEquipeDetalhes(codigo: number) {
  return useQuery<EquipeDetalhesResponse>({
    queryKey: ["equipe-detalhes", codigo],
    queryFn: async () => {
      const response = await fetch(`/api/equipes/${codigo}`);

      if (!response.ok) {
        throw new Error("Erro ao buscar detalhes do setor");
      }

      return await response.json();
    },
    enabled: !!codigo && !isNaN(codigo),
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}
