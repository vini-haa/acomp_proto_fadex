import { useQuery } from "@tanstack/react-query";
import type { SetorMetricas, PeriodoDashboard, SetoresMetricasResponse } from "@/types/dashboard";

export interface Setor {
  codigo: number;
  descr: string;
}

/**
 * Hook para buscar lista de setores disponíveis
 *
 * @example
 * ```tsx
 * const { data: setores, isLoading } = useSetores();
 * ```
 */
export function useSetores() {
  return useQuery<Setor[]>({
    queryKey: ["setores"],
    queryFn: async () => {
      const response = await fetch("/api/setores");

      if (!response.ok) {
        throw new Error("Erro ao carregar setores");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hora - setores raramente mudam
    gcTime: 2 * 60 * 60 * 1000, // 2 horas
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook para buscar métricas comparativas de todos os setores
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSetoresMetricas({ periodo: "30d" });
 * ```
 */
export function useSetoresMetricas(filters?: { periodo?: PeriodoDashboard }) {
  const periodo = filters?.periodo || "30d";

  return useQuery<SetorMetricas[]>({
    queryKey: ["setores-metricas", periodo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (periodo) {
        params.set("periodo", periodo);
      }

      const response = await fetch(`/api/dashboard/setores?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar métricas dos setores");
      }

      const json: SetoresMetricasResponse = await response.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
  });
}
