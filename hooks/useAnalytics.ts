import { useQuery } from "@tanstack/react-query";
import {
  FluxoTemporalData,
  DistribuicaoFaixaData,
  AssuntoAnalysisData,
  ProjetoAnalysisData,
  FluxoSetoresData,
  HeatmapData,
  ComparativoData,
  HeatmapFilters,
  HeatmapFiltrosOptions,
} from "@/types/analytics";
import { CACHE_ANALYTICS, CACHE_HISTORICAL, DEFAULT_QUERY_OPTIONS } from "@/lib/constants/cache";

/**
 * Hook para buscar dados de fluxo temporal (entradas vs saídas ao longo do tempo)
 *
 * Cache: ANALYTICS (10min stale, 20min gc)
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
    staleTime: CACHE_ANALYTICS.staleTime,
    gcTime: CACHE_ANALYTICS.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar distribuição por faixa de tempo
 *
 * Cache: ANALYTICS (10min stale, 20min gc)
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
    staleTime: CACHE_ANALYTICS.staleTime,
    gcTime: CACHE_ANALYTICS.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar análise por assunto
 *
 * Cache: ANALYTICS (10min stale, 20min gc)
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
    staleTime: CACHE_ANALYTICS.staleTime,
    gcTime: CACHE_ANALYTICS.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar análise por projeto
 *
 * Cache: ANALYTICS (10min stale, 20min gc)
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
    staleTime: CACHE_ANALYTICS.staleTime,
    gcTime: CACHE_ANALYTICS.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar dados de fluxo entre setores (Sankey)
 *
 * Cache: ANALYTICS (10min stale, 20min gc)
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
    staleTime: CACHE_ANALYTICS.staleTime,
    gcTime: CACHE_ANALYTICS.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar dados de heatmap (dia da semana vs hora do dia)
 *
 * Filtros disponíveis:
 * - numconv: Número do convênio/projeto
 * - instituicao: Código da instituição (100=UFPI, 113=IFPI, etc)
 * - uf: Estado (PI, MA, PE, etc)
 * - situacao: Código da situação do projeto (1=Concluído, 2=Execução, 3=Pré-Projeto)
 * - codSetor: Código do setor de destino
 * - codColaborador: Código do colaborador/usuário
 * - periodo: Período em meses (padrão: 6)
 *
 * Cache: ANALYTICS (10min stale, 20min gc) - depende dos filtros
 */
export function useHeatmap(filters: HeatmapFilters = {}) {
  const { numconv, instituicao, uf, situacao, codSetor, codColaborador, periodo = 6 } = filters;

  return useQuery<HeatmapData[]>({
    queryKey: [
      "analytics",
      "heatmap",
      numconv,
      instituicao,
      uf,
      situacao,
      codSetor,
      codColaborador,
      periodo,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (numconv) {
        params.set("numconv", numconv.toString());
      }
      if (instituicao) {
        params.set("instituicao", instituicao.toString());
      }
      if (uf) {
        params.set("uf", uf);
      }
      if (situacao) {
        params.set("situacao", situacao.toString());
      }
      if (codSetor) {
        params.set("codSetor", codSetor.toString());
      }
      if (codColaborador) {
        params.set("codColaborador", codColaborador.toString());
      }
      if (periodo) {
        params.set("periodo", periodo.toString());
      }

      const url = params.toString() ? `/api/analytics/heatmap?${params}` : "/api/analytics/heatmap";
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Erro ao carregar dados de heatmap");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: CACHE_ANALYTICS.staleTime,
    gcTime: CACHE_ANALYTICS.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar opções de filtros do heatmap (instituições, estados, situações, projetos)
 *
 * Cache: HISTORICAL (30min stale, 60min gc) - opções que raramente mudam
 */
export function useHeatmapFiltros() {
  return useQuery<HeatmapFiltrosOptions>({
    queryKey: ["analytics", "heatmap-filtros"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/filtros");

      if (!response.ok) {
        throw new Error("Erro ao carregar opções de filtros");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: CACHE_HISTORICAL.staleTime,
    gcTime: CACHE_HISTORICAL.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}

/**
 * Hook para buscar comparativo ano a ano
 *
 * Cache: HISTORICAL (30min stale, 60min gc) - dados históricos comparativos
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
    staleTime: CACHE_HISTORICAL.staleTime,
    gcTime: CACHE_HISTORICAL.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}
