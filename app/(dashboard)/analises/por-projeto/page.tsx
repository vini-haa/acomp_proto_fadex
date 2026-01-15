"use client";

import { useState } from "react";
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

export default function AnalisePorProjetoPage() {
  const [heatmapFilters, setHeatmapFilters] = useState<HeatmapFilters>({
    numconv: null,
    instituicao: null,
    uf: null,
    situacao: null,
    periodo: 6,
  });

  return (
    <>
      <Header
        title="Análise por Projeto"
        subtitle="Clique em um projeto para ver seus protocolos"
      />
      <div className="p-6">
        <div className="space-y-6">
          <ProjetoBarChart />
          <HeatmapFiltros filters={heatmapFilters} onFilterChange={setHeatmapFilters} />
          <HeatmapChart filters={heatmapFilters} />
        </div>
      </div>
    </>
  );
}
