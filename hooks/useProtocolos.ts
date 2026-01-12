import { useQuery } from "@tanstack/react-query";
import { Protocolo, PaginatedResponse } from "@/types";
import { CACHE_STANDARD, CACHE_REAL_TIME, DEFAULT_QUERY_OPTIONS } from "@/lib/constants/cache";

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
  // Novos filtros baseados na análise do trace SQL
  setorAtual?: number;
  setorOrigem?: number;
  diasEstagnado?: number;
  apenasEstagnados?: boolean;
  excluirLotePagamento?: boolean;
  assuntoNormalizado?: string;
}

/**
 * Hook para buscar protocolos com filtros e paginação
 *
 * Cache: STANDARD (2min stale, 5min gc) - dados de lista que mudam com frequência média
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
  // Novos filtros
  if (params.setorAtual) {
    queryParams.set("setorAtual", params.setorAtual.toString());
  }
  if (params.setorOrigem) {
    queryParams.set("setorOrigem", params.setorOrigem.toString());
  }
  if (params.diasEstagnado) {
    queryParams.set("diasEstagnado", params.diasEstagnado.toString());
  }
  if (params.apenasEstagnados !== undefined) {
    queryParams.set("apenasEstagnados", params.apenasEstagnados.toString());
  }
  if (params.excluirLotePagamento !== undefined) {
    queryParams.set("excluirLotePagamento", params.excluirLotePagamento.toString());
  }
  if (params.assuntoNormalizado) {
    queryParams.set("assuntoNormalizado", params.assuntoNormalizado);
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
    staleTime: CACHE_STANDARD.staleTime,
    gcTime: CACHE_STANDARD.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar um protocolo específico
 *
 * Cache: REAL_TIME (5min stale, 10min gc) - detalhe de protocolo
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
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
    enabled: !!id && id > 0,
  });
}

/**
 * Hook para buscar dados completos/enriquecidos de um protocolo
 *
 * Cache: REAL_TIME (5min stale, 10min gc) - detalhe completo de protocolo
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
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
    enabled: !!id && id > 0,
  });
}
