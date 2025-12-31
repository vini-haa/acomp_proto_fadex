import { useQuery } from "@tanstack/react-query";

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
