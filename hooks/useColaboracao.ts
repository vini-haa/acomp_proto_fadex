import { useQuery } from "@tanstack/react-query";
import { CACHE_REAL_TIME, DEFAULT_QUERY_OPTIONS } from "@/lib/constants/cache";

/**
 * Tipo para dados de colaboração entre usuários
 */
export interface Colaboracao {
  codUsuario1: number;
  nomeUsuario1: string;
  setorUsuario1: string | null;
  codUsuario2: number;
  nomeUsuario2: string;
  setorUsuario2: string | null;
  vezesTrabalharamJuntos: number;
  tempoMedioConjuntoHoras: number | null;
}

export interface ColaboracaoResponse {
  success: boolean;
  data: Colaboracao[];
  total: number;
}

/**
 * Hook para buscar dados de colaboração entre usuários
 *
 * Cache: REAL_TIME (5min stale, 10min gc)
 *
 * Identifica duplas/grupos que trabalham juntos frequentemente
 * nos últimos 3 meses.
 *
 * Critérios:
 * - Mínimo de 5 interações para ser considerado colaboração frequente
 * - Ordenado por número de vezes que trabalharam juntos
 * - Retorna top 30 duplas
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useColaboracao();
 *
 * // Acessar duplas
 * const duplas = data?.data || [];
 *
 * // Top 5 duplas
 * const top5 = duplas.slice(0, 5);
 * ```
 */
export function useColaboracao() {
  return useQuery<ColaboracaoResponse>({
    queryKey: ["colaboracao"],
    queryFn: async () => {
      const response = await fetch("/api/equipes/colaboracao");

      if (!response.ok) {
        throw new Error("Erro ao buscar dados de colaboração");
      }

      return await response.json();
    },
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}
