import { useQuery } from "@tanstack/react-query";
import { KPIs } from "@/types";

// Código do setor financeiro (padrão)
const SETOR_FINANCEIRO = 48;

type Periodo = "mes_atual" | "30d" | "90d" | "6m" | "1y" | "ytd" | "all";

interface UseKPIsOptions {
  periodo?: Periodo;
  codigoSetor?: number;
  enableAutoRefresh?: boolean;
}

/**
 * Hook para buscar KPIs principais do dashboard - VERSÃO REFATORADA
 *
 * @param options - Opções de configuração
 * @param options.periodo - Período de análise: 'mes_atual', '30d', '90d', '6m', '1y', 'all' (padrão)
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
    queryKey: ["kpis", periodo, codigoSetor], // Incluir período e setor na query key
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
    staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
    gcTime: 10 * 60 * 1000, // 10 minutos - mantém em cache
    refetchInterval: enableAutoRefresh ? 5 * 60 * 1000 : false, // Auto-refresh opcional
    refetchOnWindowFocus: false, // Não recarregar ao focar na janela
    refetchOnMount: false, // Não recarregar ao montar se cache válido
  });
}
