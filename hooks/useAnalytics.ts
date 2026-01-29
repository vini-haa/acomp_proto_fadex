import { useQuery } from "@tanstack/react-query";
import {
  FluxoTemporalData,
  DistribuicaoFaixaData,
  AssuntoAnalysisData,
  ProjetoAnalysisData,
  FluxoSetoresData,
  HeatmapData,
  ComparativoData,
  ComparativoResponse,
  YTDInfo,
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
 * Filtros para análise por assunto
 */
export interface AssuntoFilters {
  periodo?: "30d" | "60d" | "90d" | "6m" | "1y" | "all";
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Hook para buscar análise por assunto
 *
 * @param filters - Filtros opcionais (período, dataInicio, dataFim)
 *
 * Cache: ANALYTICS (10min stale, 20min gc)
 */
export function useAnalyticsPorAssunto(filters: AssuntoFilters = {}) {
  const { periodo, dataInicio, dataFim } = filters;

  return useQuery<AssuntoAnalysisData[]>({
    queryKey: ["analytics", "assunto", periodo, dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (periodo) {
        params.set("periodo", periodo);
      }
      if (dataInicio) {
        params.set("dataInicio", dataInicio);
      }
      if (dataFim) {
        params.set("dataFim", dataFim);
      }

      const url = params.toString()
        ? `/api/analytics/por-assunto?${params}`
        : "/api/analytics/por-assunto";

      const response = await fetch(url);

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
 * @param limit - Número máximo de projetos a retornar (default: 15)
 * @param periodo - Período em meses (1, 3, 6, 12, 0 = todos) (default: 12)
 *
 * Cache: ANALYTICS (10min stale, 20min gc)
 */
export function useAnalyticsPorProjeto(limit: number = 15, periodo: number = 12) {
  return useQuery<ProjetoAnalysisData[]>({
    queryKey: ["analytics", "projeto", limit, periodo],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("limit", limit.toString());
      if (periodo > 0) {
        params.set("periodo", periodo.toString());
      }

      const response = await fetch(`/api/analytics/por-projeto?${params}`);

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
 *
 * Retorna dados com informação YTD para comparações justas entre anos
 */
export function useComparativo(setor?: number) {
  return useQuery<{ data: ComparativoData[]; ytdInfo: YTDInfo }>({
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

      const json: ComparativoResponse = await response.json();
      return { data: json.data, ytdInfo: json.ytdInfo };
    },
    staleTime: CACHE_HISTORICAL.staleTime,
    gcTime: CACHE_HISTORICAL.gcTime,
    ...DEFAULT_QUERY_OPTIONS,
  });
}
