import { useQuery } from "@tanstack/react-query";
import { Protocolo, PaginatedResponse } from "@/types";

interface UseCachedProtocolosParams {
  page?: number;
  pageSize?: number;
  status?: string;
  numeroDocumento?: string;
  numconv?: string;
  faixaTempo?: string;
  contaCorrente?: string;
  setorAtual?: string;
  assunto?: string;
  diaSemana?: number;
  hora?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface CachedResponse extends PaginatedResponse<Protocolo> {
  cacheInfo: {
    lastUpdated: string | null;
    isStale: boolean;
    totalCached: number;
  };
  filterOptions: {
    contasCorrentes: string[];
    setores: string[];
    assuntos: string[];
  };
}

/**
 * Hook para buscar protocolos do CACHE (resposta instantânea)
 *
 * Diferenças do useProtocolos:
 * - Usa endpoint /api/protocolos/cached
 * - Resposta instantânea após primeira carga
 * - Inclui informações do cache (lastUpdated, isStale)
 * - Filtros são aplicados em memória (mais rápido)
 */
export function useCachedProtocolos(params: UseCachedProtocolosParams = {}) {
  const queryParams = new URLSearchParams();

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
  if (params.faixaTempo) {
    queryParams.set("faixaTempo", params.faixaTempo);
  }
  if (params.contaCorrente) {
    queryParams.set("contaCorrente", params.contaCorrente);
  }
  if (params.setorAtual) {
    queryParams.set("setorAtual", params.setorAtual);
  }
  if (params.assunto) {
    queryParams.set("assunto", params.assunto);
  }
  if (params.diaSemana !== undefined) {
    queryParams.set("diaSemana", params.diaSemana.toString());
  }
  if (params.hora !== undefined) {
    queryParams.set("hora", params.hora.toString());
  }
  if (params.sortBy) {
    queryParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    queryParams.set("sortOrder", params.sortOrder);
  }

  return useQuery<CachedResponse>({
    queryKey: ["protocolos-cached", params],
    queryFn: async () => {
      const response = await fetch(`/api/protocolos/cached?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar protocolos do cache");
      }

      const json = await response.json();
      return {
        data: json.data,
        pagination: json.pagination,
        cacheInfo: json.cacheInfo,
        filterOptions: json.filterOptions,
      };
    },
    // Cache do React Query - mantém dados por mais tempo já que vem do cache do servidor
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook para verificar status do cache
 */
export function useCacheStatus() {
  return useQuery({
    queryKey: ["cache-status"],
    queryFn: async () => {
      const response = await fetch("/api/protocolos/cached/status");
      if (!response.ok) {
        throw new Error("Erro ao verificar status do cache");
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Atualiza a cada 1 minuto
  });
}

/**
 * Função para forçar atualização do cache
 */
export async function refreshCache(): Promise<void> {
  const response = await fetch("/api/protocolos/cached/status", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Erro ao atualizar cache");
  }
}
