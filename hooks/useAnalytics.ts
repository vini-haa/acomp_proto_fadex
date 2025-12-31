import { useQuery } from "@tanstack/react-query";
import {
  FluxoTemporalData,
  DistribuicaoFaixaData,
  AssuntoAnalysisData,
  ProjetoAnalysisData,
  FluxoSetoresData,
  HeatmapData,
  ComparativoData,
} from "@/types/analytics";

/**
 * Hook para buscar dados de fluxo temporal (entradas vs saídas ao longo do tempo)
 */
export function useFluxoTemporal(
  periodo: "7d" | "30d" | "90d" | "12m" | "ytd" = "ytd",
  setor?: number
) {
  return useQuery<FluxoTemporalData[]>({
    queryKey: ["analytics", "temporal", periodo, setor],
    queryFn: async () => {
      const params = new URLSearchParams({ periodo });
      if (setor !== undefined) {
        params.set("setor", setor.toString());
      }
      const response = await fetch(`/api/analytics/temporal?${params}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar dados de fluxo temporal");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos em cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook para buscar distribuição por faixa de tempo
 */
export function useDistribuicaoFaixa() {
  return useQuery<DistribuicaoFaixaData[]>({
    queryKey: ["analytics", "distribuicao"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/distribuicao");

      if (!response.ok) {
        throw new Error("Erro ao carregar distribuição por faixa");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos em cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook para buscar análise por assunto
 */
export function useAnalyticsPorAssunto(limit: number = 15) {
  return useQuery<AssuntoAnalysisData[]>({
    queryKey: ["analytics", "assunto", limit],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/por-assunto?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar análise por assunto");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar análise por projeto
 */
export function useAnalyticsPorProjeto(limit: number = 15) {
  return useQuery<ProjetoAnalysisData[]>({
    queryKey: ["analytics", "projeto", limit],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/por-projeto?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar análise por projeto");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar dados de fluxo entre setores (Sankey)
 */
export function useFluxoSetores(limit: number = 20) {
  return useQuery<FluxoSetoresData[]>({
    queryKey: ["analytics", "fluxo-setores", limit],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/fluxo-setores?limit=${limit}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar fluxo entre setores");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook para buscar dados de heatmap (dia da semana vs hora do dia)
 */
export function useHeatmap() {
  return useQuery<HeatmapData[]>({
    queryKey: ["analytics", "heatmap"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/heatmap");

      if (!response.ok) {
        throw new Error("Erro ao carregar dados de heatmap");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos (dados históricos)
  });
}

/**
 * Hook para buscar comparativo ano a ano
 */
export function useComparativo(setor?: number) {
  return useQuery<ComparativoData[]>({
    queryKey: ["analytics", "comparativo", setor],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (setor !== undefined) {
        params.set("setor", setor.toString());
      }
      const url = params.toString()
        ? `/api/analytics/comparativo?${params}`
        : "/api/analytics/comparativo";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erro ao carregar dados comparativos");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos em cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
