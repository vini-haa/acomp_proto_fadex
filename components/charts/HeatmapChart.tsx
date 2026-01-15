"use client";

import { useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { useHeatmap } from "@/hooks/useAnalytics";
import { ChartContainer } from "./ChartContainer";
import type { HeatmapFilters } from "@/types/analytics";

const DIAS_SEMANA_MAP: Record<string, number> = {
  Domingo: 1,
  Segunda: 2,
  Terça: 3,
  Quarta: 4,
  Quinta: 5,
  Sexta: 6,
  Sábado: 7,
};

const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface HeatmapChartProps {
  filters?: HeatmapFilters;
}

export const HeatmapChart = memo(function HeatmapChart({ filters = {} }: HeatmapChartProps) {
  const router = useRouter();
  const { data, isLoading, error } = useHeatmap(filters);

  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const groupedByDay: Record<number, Record<number, number>> = {};

    data.forEach((item) => {
      const dayIndex = item.diaSemanaNum - 1;
      if (dayIndex >= 0 && dayIndex < 7) {
        if (!groupedByDay[dayIndex]) {
          groupedByDay[dayIndex] = {};
        }
        groupedByDay[dayIndex][item.hora] = item.quantidade;
      }
    });

    const result = diasSemana.map((dia, index) => {
      const horasData = [];
      for (let hora = 0; hora < 24; hora++) {
        const quantidade = groupedByDay[index]?.[hora] || 0;
        horasData.push({ x: `${hora}h`, y: quantidade });
      }
      return { id: dia, data: horasData };
    });

    const hasData = result.some((day) => day.data.some((item) => item.y > 0));
    return hasData ? result : [];
  }, [data]);

  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return { total: 0, max: 0, media: 0 };
    }
    const total = data.reduce((sum, item) => sum + item.quantidade, 0);
    const max = Math.max(...data.map((item) => item.quantidade));
    return {
      total,
      max,
      media: Math.round(total / data.length),
    };
  }, [data]);

  const handleCellClick = useCallback(
    (
      cell: { serieId: string; data: { x: string }; value: number | null },
      _event: React.MouseEvent
    ) => {
      if (!cell.value || cell.value <= 0) {
        return;
      }

      const diaSemana = DIAS_SEMANA_MAP[cell.serieId];
      const hora = parseInt(cell.data.x.replace("h", ""));

      if (diaSemana && !isNaN(hora)) {
        router.push(`/protocolos/movimentacoes?diaSemana=${diaSemana}&hora=${hora}`);
      }
    },
    [router]
  );

  const isEmpty = !data || data.length === 0 || heatmapData.length === 0;

  // Descrição dinâmica baseada nos filtros
  const descricao = useMemo(() => {
    const partes = ["Padrão de movimentações de protocolos ao longo da semana"];

    const filtrosAtivos = [];
    if (filters.instituicao) {
      filtrosAtivos.push("por instituição");
    }
    if (filters.uf) {
      filtrosAtivos.push(`estado ${filters.uf}`);
    }
    if (filters.situacao) {
      filtrosAtivos.push("por status do projeto");
    }
    if (filters.numconv) {
      filtrosAtivos.push(`projeto ${filters.numconv}`);
    }

    if (filtrosAtivos.length > 0) {
      partes.push(`(filtrado: ${filtrosAtivos.join(", ")})`);
    }

    partes.push("Clique em uma célula para ver os protocolos daquele período.");
    return partes.join(". ");
  }, [filters]);

  return (
    <ChartContainer
      title="Mapa de Calor - Atividade por Hora e Dia"
      description={descricao}
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage="Nenhum dado encontrado para os filtros selecionados."
      height="h-[550px]"
      footer={
        !isEmpty ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Total Movimentações</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString("pt-BR")}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Pico de Atividade</p>
                <p className="text-2xl font-bold">{stats.max.toLocaleString("pt-BR")}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground">Média por Célula</p>
                <p className="text-2xl font-bold">{stats.media}</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Insights</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Identifique os horários de pico para melhor alocação de recursos</li>
                <li>Padrões de dias úteis vs fins de semana podem indicar volumes de trabalho</li>
                <li>Áreas escuras indicam períodos com menos atividade</li>
              </ul>
            </div>
          </>
        ) : undefined
      }
    >
      <div style={{ height: 400, cursor: "pointer" }}>
        <ResponsiveHeatMap
          data={heatmapData}
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          valueFormat=">-.0f"
          forceSquare={false}
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: "",
            legendOffset: 46,
          }}
          axisRight={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Dia da Semana",
            legendPosition: "middle",
            legendOffset: 70,
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Dia da Semana",
            legendPosition: "middle",
            legendOffset: -72,
          }}
          colors={{
            type: "sequential",
            scheme: "blues",
          }}
          emptyColor="#e0e0e0"
          borderRadius={3}
          borderWidth={1}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.3]],
          }}
          enableLabels={true}
          labelTextColor={{
            from: "color",
            modifiers: [["darker", 1.8]],
          }}
          legends={[
            {
              anchor: "bottom",
              translateX: 0,
              translateY: 30,
              length: 400,
              thickness: 8,
              direction: "row",
              tickPosition: "after",
              tickSize: 3,
              tickSpacing: 4,
              tickOverlap: false,
              title: "Quantidade →",
              titleAlign: "start",
              titleOffset: 4,
            },
          ]}
          theme={{
            text: {
              fill: "hsl(var(--foreground))",
              fontSize: 11,
            },
            tooltip: {
              container: {
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                fontSize: 12,
                borderRadius: "var(--radius)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                padding: "8px 12px",
              },
            },
          }}
          hoverTarget="cell"
          animate={false}
          onClick={handleCellClick}
        />
      </div>
    </ChartContainer>
  );
});
