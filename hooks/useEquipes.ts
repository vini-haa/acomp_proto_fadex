import { useQuery } from "@tanstack/react-query";
import {
  Equipe,
  EquipesFilters,
  EquipesResponse,
  AlertasResumo,
  AlertasResponse,
  Gargalo,
  GargalosResponse,
  UsuarioPerformance,
  UsuariosFilters,
  UsuariosResponse,
} from "@/types/equipes";
import { CACHE_REAL_TIME, DEFAULT_QUERY_OPTIONS } from "@/lib/constants/cache";

/**
 * Hook para buscar lista de equipes/setores com métricas
 *
 * Cache: REAL_TIME (5min stale, 10min gc)
 *
 * @param filters - Filtros opcionais
 * @param filters.busca - Termo para buscar por nome do setor (filtrado no frontend)
 * @param filters.periodo - '7d' | '30d' | '90d' (padrão: 30d)
 *
 * @example
 * ```tsx
 * // Todas as equipes
 * const { data, isLoading } = useEquipes();
 *
 * // Filtrar por período
 * const { data } = useEquipes({ periodo: '7d' });
 * ```
 */
export function useEquipes(filters: EquipesFilters = {}) {
  const { periodo = "30d" } = filters;

  return useQuery<Equipe[]>({
    queryKey: ["equipes", periodo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (periodo) {
        params.set("periodo", periodo);
      }

      const url = `/api/equipes${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erro ao carregar equipes");
      }

      const json: EquipesResponse = await response.json();
      return json.data;
    },
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar alertas de protocolos atrasados
 *
 * Cache: REAL_TIME (5min stale, 10min gc)
 *
 * Retorna resumo com totais e lista por setor:
 * - Críticos (>30 dias)
 * - Urgentes (15-30 dias)
 * - Atenção (7-15 dias)
 *
 * @example
 * ```tsx
 * const { data: alertas } = useAlertas();
 * console.log(alertas?.totalCriticos); // 150
 * console.log(alertas?.setores); // Lista de setores com alertas
 * ```
 */
export function useAlertas() {
  return useQuery<AlertasResumo>({
    queryKey: ["equipes", "alertas"],
    queryFn: async () => {
      const response = await fetch("/api/equipes/alertas");

      if (!response.ok) {
        throw new Error("Erro ao carregar alertas");
      }

      const json: AlertasResponse = await response.json();
      return json.data;
    },
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para identificar gargalos nos setores
 *
 * Cache: REAL_TIME (5min stale, 10min gc)
 *
 * Tipos de gargalo identificados:
 * - VOLUME CRÍTICO: >10.000 protocolos
 * - VOLUME ALTO: >3x a média geral
 * - LENTIDÃO: tempo médio >48h
 * - ESTAGNAÇÃO: >50 protocolos parados
 *
 * @example
 * ```tsx
 * const { data: gargalos } = useGargalos();
 * const criticos = gargalos?.filter(g => g.severidade === 3);
 * ```
 */
export function useGargalos() {
  return useQuery<Gargalo[]>({
    queryKey: ["equipes", "gargalos"],
    queryFn: async () => {
      const response = await fetch("/api/equipes/gargalos");

      if (!response.ok) {
        throw new Error("Erro ao carregar gargalos");
      }

      const json: GargalosResponse = await response.json();
      return json.data;
    },
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar performance individual de usuários
 *
 * Cache: REAL_TIME (5min stale, 10min gc)
 *
 * @param filters - Filtros opcionais
 * @param filters.codSetor - Código do setor (opcional)
 * @param filters.periodo - '7d' | '30d' | '90d' (padrão: 30d)
 *
 * Métricas por usuário:
 * - movimentacoesEnviadas30d
 * - movimentacoesRecebidas30d
 * - protocolosFinalizados30d
 * - tempoMedioRespostaHoras
 * - mediaMovimentacoesPorDia
 *
 * @example
 * ```tsx
 * // Todos os usuários
 * const { data: usuarios } = useUsuariosPerformance();
 *
 * // Usuários de um setor específico
 * const { data: usuarios } = useUsuariosPerformance({ codSetor: 48 });
 * ```
 */
export function useUsuariosPerformance(filters: UsuariosFilters = {}) {
  const { codSetor, periodo = "30d" } = filters;

  return useQuery<UsuarioPerformance[]>({
    queryKey: ["equipes", "usuarios", codSetor, periodo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (codSetor) {
        params.set("codSetor", codSetor.toString());
      }
      if (periodo) {
        params.set("periodo", periodo);
      }

      const url = `/api/equipes/usuarios${params.toString() ? `?${params}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      const json: UsuariosResponse = await response.json();
      return json.data;
    },
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}
