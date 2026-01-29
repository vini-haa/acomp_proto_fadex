import { useQuery } from "@tanstack/react-query";
import type {
  ColaboradorDetalhes,
  ColaboradorProtocolosPaginados,
  ColaboradorProjetosResponse,
  ColaboradorAtividade,
  ColaboradorProtocolosFiltros,
} from "@/types/colaborador";

/**
 * Configuração de cache para dados do colaborador
 */
const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
};

/**
 * Hook para buscar dados detalhados de um colaborador
 *
 * @param id - Código do colaborador
 * @param periodo - Período em dias para métricas (padrão: 30)
 */
export function useColaborador(id: number | null, periodo: number = 30) {
  return useQuery<ColaboradorDetalhes>({
    queryKey: ["colaborador", id, periodo],
    queryFn: async () => {
      if (!id) {
        throw new Error("ID do colaborador não informado");
      }

      const params = new URLSearchParams();
      params.set("periodo", periodo.toString());

      const response = await fetch(`/api/colaborador/${id}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao carregar dados do colaborador");
      }

      const json = await response.json();
      return json.data;
    },
    enabled: !!id && id > 0,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
  });
}

/**
 * Hook para buscar protocolos que o colaborador participou (com paginação)
 *
 * @param id - Código do colaborador
 * @param filtros - Filtros opcionais (período, dia, hora, paginação, ordenação)
 */
export function useColaboradorProtocolos(
  id: number | null,
  filtros: ColaboradorProtocolosFiltros = {}
) {
  const {
    periodo = 30,
    page = 1,
    limit = 20,
    dataInicio,
    dataFim,
    diaSemana,
    hora,
    status,
    assunto,
    projeto,
    orderBy = "dataMovimentacao",
    orderDir = "desc",
  } = filtros;

  return useQuery<ColaboradorProtocolosPaginados>({
    queryKey: [
      "colaborador",
      id,
      "protocolos",
      page,
      limit,
      periodo,
      dataInicio,
      dataFim,
      diaSemana,
      hora,
      status,
      assunto,
      projeto,
      orderBy,
      orderDir,
    ],
    queryFn: async () => {
      if (!id) {
        throw new Error("ID do colaborador não informado");
      }

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("periodo", periodo.toString());
      params.set("orderBy", orderBy);
      params.set("orderDir", orderDir);

      if (dataInicio) {
        params.set("dataInicio", dataInicio);
      }
      if (dataFim) {
        params.set("dataFim", dataFim);
      }
      if (diaSemana !== undefined) {
        params.set("diaSemana", diaSemana.toString());
      }
      if (hora !== undefined) {
        params.set("hora", hora.toString());
      }
      if (status) {
        params.set("status", status);
      }
      if (assunto) {
        params.set("assunto", assunto);
      }
      if (projeto) {
        params.set("projeto", projeto);
      }

      const response = await fetch(`/api/colaborador/${id}/protocolos?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao carregar protocolos do colaborador");
      }

      const json = await response.json();
      return {
        data: json.data,
        pagination: json.pagination,
      };
    },
    enabled: !!id && id > 0,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
  });
}

/**
 * Filtros para projetos do colaborador
 */
interface ColaboradorProjetosFiltros {
  periodo?: number;
  limit?: number;
  situacaoProjeto?: "Em Execução" | "Concluído" | "Todos" | "";
}

/**
 * Hook para buscar atuação do colaborador por projeto
 *
 * @param id - Código do colaborador
 * @param filtros - Filtros opcionais (período, limite, situação do projeto)
 */
export function useColaboradorProjetos(
  id: number | null,
  filtros: ColaboradorProjetosFiltros = {}
) {
  const { periodo = 180, limit = 15, situacaoProjeto } = filtros;

  return useQuery<ColaboradorProjetosResponse>({
    queryKey: ["colaborador", id, "projetos", periodo, limit, situacaoProjeto],
    queryFn: async () => {
      if (!id) {
        throw new Error("ID do colaborador não informado");
      }

      const params = new URLSearchParams();
      params.set("periodo", periodo.toString());
      params.set("limit", limit.toString());

      if (situacaoProjeto && situacaoProjeto !== "Todos") {
        params.set("situacaoProjeto", situacaoProjeto);
      }

      const response = await fetch(`/api/colaborador/${id}/projetos?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao carregar dados por projeto");
      }

      const json = await response.json();
      return json.data;
    },
    enabled: !!id && id > 0,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
  });
}

/**
 * Hook para buscar atividade temporal do colaborador (para gráfico)
 *
 * @param id - Código do colaborador
 * @param periodo - Período em dias (padrão: 30)
 */
export function useColaboradorAtividade(id: number | null, periodo: number = 30) {
  return useQuery<ColaboradorAtividade[]>({
    queryKey: ["colaborador", id, "atividade", periodo],
    queryFn: async () => {
      if (!id) {
        throw new Error("ID do colaborador não informado");
      }

      const params = new URLSearchParams();
      params.set("periodo", periodo.toString());

      const response = await fetch(`/api/colaborador/${id}/atividade?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao carregar atividade do colaborador");
      }

      const json = await response.json();
      return json.data;
    },
    enabled: !!id && id > 0,
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
  });
}
