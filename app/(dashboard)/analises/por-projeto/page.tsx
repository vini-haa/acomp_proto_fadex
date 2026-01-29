"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Header } from "@/components/dashboard/Header";
import { Skeleton } from "@/components/ui/skeleton";
import type { HeatmapFilters } from "@/types/analytics";

// Carregamento lazy dos gráficos para melhor performance
const ProjetoBarChart = dynamic(
  () =>
    import("@/components/charts/ProjetoBarChart").then((mod) => ({
      default: mod.ProjetoBarChart,
    })),
  {
    loading: () => <Skeleton className="h-[500px] w-full" />,
    ssr: false,
  }
);

const HeatmapChart = dynamic(
  () =>
    import("@/components/charts/HeatmapChart").then((mod) => ({
      default: mod.HeatmapChart,
    })),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false,
  }
);

const HeatmapFiltros = dynamic(
  () =>
    import("@/components/charts/HeatmapFiltros").then((mod) => ({
      default: mod.HeatmapFiltros,
    })),
  {
    loading: () => <Skeleton className="h-[80px] w-full" />,
    ssr: false,
  }
);

/**
 * Parseia os filtros da URL
 */
function parseUrlFilters(searchParams: URLSearchParams): HeatmapFilters {
  const periodo = searchParams.get("periodo");
  const codSetor = searchParams.get("codSetor");
  const codColaborador = searchParams.get("codColaborador");
  const situacao = searchParams.get("situacao");
  const numconv = searchParams.get("numconv");
  const uf = searchParams.get("uf");

  return {
    periodo: periodo ? parseInt(periodo, 10) : 6,
    codSetor: codSetor ? parseInt(codSetor, 10) : null,
    codColaborador: codColaborador ? parseInt(codColaborador, 10) : null,
    situacao: situacao ? parseInt(situacao, 10) : null,
    numconv: numconv ? parseInt(numconv, 10) : null,
    uf: uf || null,
    instituicao: null,
  };
}

export default function AnalisePorProjetoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Inicializar filtros a partir da URL
  const [heatmapFilters, setHeatmapFilters] = useState<HeatmapFilters>(() =>
    parseUrlFilters(searchParams)
  );

  // Estado para período do gráfico de projetos (também persiste na URL)
  const [periodoGrafico, setPeriodoGrafico] = useState<number>(() => {
    const param = searchParams.get("periodoGrafico");
    return param ? parseInt(param, 10) : 12;
  });

  // Estado para limite do gráfico de projetos
  const [limitGrafico, setLimitGrafico] = useState<number>(() => {
    const param = searchParams.get("limit");
    return param ? parseInt(param, 10) : 15;
  });

  // Atualizar URL quando filtros mudam
  const updateUrl = useCallback(
    (filters: HeatmapFilters, periodoGraf: number, limitGraf: number) => {
      const params = new URLSearchParams();

      // Filtros do Heatmap
      if (filters.periodo && filters.periodo !== 6) {
        params.set("periodo", filters.periodo.toString());
      }
      if (filters.codSetor) {
        params.set("codSetor", filters.codSetor.toString());
      }
      if (filters.codColaborador) {
        params.set("codColaborador", filters.codColaborador.toString());
      }
      if (filters.situacao) {
        params.set("situacao", filters.situacao.toString());
      }
      if (filters.numconv) {
        params.set("numconv", filters.numconv.toString());
      }
      if (filters.uf) {
        params.set("uf", filters.uf);
      }

      // Filtros do gráfico de projetos
      if (periodoGraf !== 12) {
        params.set("periodoGrafico", periodoGraf.toString());
      }
      if (limitGraf !== 15) {
        params.set("limit", limitGraf.toString());
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Handler para mudança de filtros do Heatmap
  const handleHeatmapFilterChange = useCallback(
    (newFilters: HeatmapFilters) => {
      setHeatmapFilters(newFilters);
      updateUrl(newFilters, periodoGrafico, limitGrafico);
    },
    [updateUrl, periodoGrafico, limitGrafico]
  );

  // Handler para mudança de período do gráfico
  const handlePeriodoGraficoChange = useCallback(
    (newPeriodo: number) => {
      setPeriodoGrafico(newPeriodo);
      updateUrl(heatmapFilters, newPeriodo, limitGrafico);
    },
    [updateUrl, heatmapFilters, limitGrafico]
  );

  // Handler para mudança de limite do gráfico
  const handleLimitGraficoChange = useCallback(
    (newLimit: number) => {
      setLimitGrafico(newLimit);
      updateUrl(heatmapFilters, periodoGrafico, newLimit);
    },
    [updateUrl, heatmapFilters, periodoGrafico]
  );

  // Sincronizar com URL ao navegar
  useEffect(() => {
    const urlFilters = parseUrlFilters(searchParams);
    const urlPeriodoGrafico = searchParams.get("periodoGrafico");
    const urlLimit = searchParams.get("limit");

    setHeatmapFilters(urlFilters);
    if (urlPeriodoGrafico) {
      setPeriodoGrafico(parseInt(urlPeriodoGrafico, 10));
    }
    if (urlLimit) {
      setLimitGrafico(parseInt(urlLimit, 10));
    }
  }, [searchParams]);

  return (
    <>
      <Header
        title="Análise por Projeto"
        subtitle="Clique em um projeto para ver seus protocolos"
      />
      <div className="p-6">
        <div className="space-y-6">
          <ProjetoBarChart
            periodo={periodoGrafico}
            onPeriodoChange={handlePeriodoGraficoChange}
            limit={limitGrafico}
            onLimitChange={handleLimitGraficoChange}
          />
          <HeatmapFiltros filters={heatmapFilters} onFilterChange={handleHeatmapFilterChange} />
          <HeatmapChart filters={heatmapFilters} />
        </div>
      </div>
    </>
  );
}
