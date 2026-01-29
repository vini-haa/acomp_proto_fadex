import { useQuery } from "@tanstack/react-query";
import {
  VisaoExecutivaResponse,
  VisaoSetorResponse,
  PeriodoExecutivo,
  AnoExecutivo,
} from "@/types/dashboard";
import { TODOS_SETORES } from "@/lib/constants/setores";

interface UseVisaoExecutivaParams {
  periodo?: PeriodoExecutivo;
  ano?: AnoExecutivo;
  codigoSetor?: number;
}

/**
 * Hook para buscar dados da Visão Executiva do Dashboard
 *
 * @param params.periodo - Período de análise ('7d', '30d', '60d', '90d')
 * @param params.ano - Ano de análise ('2023', '2024', '2025', '2026', 'todos')
 *                     'todos' significa 2023 em diante
 * @param params.codigoSetor - Código do setor para filtrar (opcional, 0 = todos)
 */
export function useVisaoExecutiva(params: UseVisaoExecutivaParams = {}) {
  const { periodo = "30d", ano = "todos", codigoSetor = TODOS_SETORES } = params;

  return useQuery({
    queryKey: ["visao-executiva", periodo, ano, codigoSetor],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        periodo,
        ano,
        setor: codigoSetor.toString(),
      });
      const response = await fetch(`/api/dashboard/executivo?${searchParams}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar dados da visão executiva");
      }
      return response.json() as Promise<VisaoExecutivaResponse>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

interface UseVisaoSetorParams {
  codigoSetor: number;
  periodo?: PeriodoExecutivo;
  ano?: AnoExecutivo;
}

/**
 * Hook para buscar dados especificos de um setor no Dashboard Executivo
 *
 * @param params.codigoSetor - Codigo do setor (obrigatorio, > 0)
 * @param params.periodo - Periodo de analise ('7d', '30d', '60d', '90d')
 * @param params.ano - Ano de analise ('2023', '2024', '2025', '2026', 'todos')
 */
export function useVisaoSetor(params: UseVisaoSetorParams) {
  const { codigoSetor, periodo = "30d", ano = "todos" } = params;

  return useQuery({
    queryKey: ["visao-setor", codigoSetor, periodo, ano],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        setor: codigoSetor.toString(),
        periodo,
        ano,
      });
      const response = await fetch(`/api/dashboard/executivo/setor?${searchParams}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar dados do setor");
      }
      return response.json() as Promise<VisaoSetorResponse>;
    },
    enabled: codigoSetor > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
