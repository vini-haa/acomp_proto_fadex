import { useQuery } from "@tanstack/react-query";
import { Protocolo, PaginatedResponse } from "@/types";

interface UseProtocolosParams {
  page?: number;
  pageSize?: number;
  status?: string;
  numeroDocumento?: string;
  numconv?: string;
  dataInicio?: string;
  dataFim?: string;
  faixaTempo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Hook para buscar protocolos com filtros e paginação
 */
export function useProtocolos(params: UseProtocolosParams = {}) {
  const queryParams = new URLSearchParams();

  // Adiciona parâmetros apenas se existirem
  if (params.page) {
    queryParams.set("page", params.page.toString());
  }
  if (params.pageSize) {
    queryParams.set("pageSize", params.pageSize.toString());
  }
  if (params.status) {
    queryParams.set("status", params.status);
  }
  if (params.numeroDocumento) {
    queryParams.set("numeroDocumento", params.numeroDocumento);
  }
  if (params.numconv) {
    queryParams.set("numconv", params.numconv);
  }
  if (params.dataInicio) {
    queryParams.set("dataInicio", params.dataInicio);
  }
  if (params.dataFim) {
    queryParams.set("dataFim", params.dataFim);
  }
  if (params.faixaTempo) {
    queryParams.set("faixaTempo", params.faixaTempo);
  }
  if (params.sortBy) {
    queryParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    queryParams.set("sortOrder", params.sortOrder);
  }

  return useQuery<PaginatedResponse<Protocolo>>({
    queryKey: ["protocolos", params],
    queryFn: async () => {
      const response = await fetch(`/api/protocolos?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar protocolos");
      }

      const json = await response.json();
      return {
        data: json.data,
        pagination: json.pagination,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos em cache
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para buscar um protocolo específico
 */
export function useProtocolo(id: number) {
  return useQuery<Protocolo>({
    queryKey: ["protocolo", id],
    queryFn: async () => {
      const response = await fetch(`/api/protocolos/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Protocolo não encontrado");
        }
        throw new Error("Erro ao carregar protocolo");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos em cache
    refetchOnWindowFocus: false,
    enabled: !!id && id > 0,
  });
}

/**
 * Hook para buscar dados completos/enriquecidos de um protocolo
 */
export function useProtocoloCompleto(id: number) {
  return useQuery<{
    data: import("@/types").ProtocoloEnriquecido;
    success: boolean;
    tempoMs: number;
  }>({
    queryKey: ["protocolo-completo", id],
    queryFn: async () => {
      const response = await fetch(`/api/protocolos/${id}/completo`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Protocolo não encontrado");
        }
        throw new Error("Erro ao carregar dados completos do protocolo");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos em cache
    refetchOnWindowFocus: false,
    enabled: !!id && id > 0,
  });
}
