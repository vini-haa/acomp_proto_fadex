import { useQuery } from "@tanstack/react-query";
import { KPIs } from "@/types";
import { CACHE_REAL_TIME, DEFAULT_QUERY_OPTIONS } from "@/lib/constants/cache";

// Código do setor financeiro (padrão)
const SETOR_FINANCEIRO = 48;

type Periodo = "mes_atual" | "7d" | "30d" | "90d" | "6m" | "1y" | "ytd" | "all";

interface UseKPIsOptions {
  periodo?: Periodo;
  codigoSetor?: number;
  enableAutoRefresh?: boolean;
}

/**
 * Hook para buscar KPIs principais do dashboard - VERSÃO REFATORADA
 *
 * Cache: REAL_TIME (5min stale, 10min gc)
 *
 * @param options - Opções de configuração
 * @param options.periodo - Período de análise: 'mes_atual', '7d', '30d', '90d', '6m', '1y', 'ytd', 'all' (padrão)
 * @param options.codigoSetor - Código do setor (padrão: 48 - Financeiro)
 * @param options.enableAutoRefresh - Se true, atualiza automaticamente a cada 5 minutos
 *
 * @example
 * ```tsx
 * // Buscar KPIs de todos os períodos do setor financeiro
 * const { data: kpis } = useKPIs({ periodo: 'all' });
 *
 * // Buscar KPIs de outro setor
 * const { data: kpis } = useKPIs({ periodo: 'mes_atual', codigoSetor: 50 });
 *
 * // Com auto-refresh
 * const { data: kpis } = useKPIs({ periodo: 'all', enableAutoRefresh: true });
 * ```
 */
export function useKPIs(options: UseKPIsOptions = {}) {
  const { periodo = "all", codigoSetor = SETOR_FINANCEIRO, enableAutoRefresh = false } = options;

  return useQuery<KPIs>({
    queryKey: ["kpis", periodo, codigoSetor],
    queryFn: async () => {
      const params = new URLSearchParams({
        periodo,
        setor: codigoSetor.toString(),
      });
      const response = await fetch(`/api/kpis?${params}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar KPIs");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    refetchInterval: enableAutoRefresh ? CACHE_REAL_TIME.refetchInterval : false,
    ...DEFAULT_QUERY_OPTIONS,
  });
}
