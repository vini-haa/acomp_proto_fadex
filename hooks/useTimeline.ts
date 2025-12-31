import { useQuery } from "@tanstack/react-query";
import { TimelineItem } from "@/types";

/**
 * Hook para buscar a timeline (histórico de movimentações) de um protocolo
 */
export function useTimeline(protocoloId: number) {
  return useQuery<TimelineItem[]>({
    queryKey: ["timeline", protocoloId],
    queryFn: async () => {
      const response = await fetch(`/api/protocolos/${protocoloId}/timeline`);

      if (!response.ok) {
        throw new Error("Erro ao carregar timeline");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 60 * 1000,
    enabled: !!protocoloId && protocoloId > 0,
  });
}
