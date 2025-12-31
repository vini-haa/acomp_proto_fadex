"use client";

import { useState, useMemo, useCallback, memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAnalyticsPorAssunto } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "./ChartContainer";
import { StatsGrid } from "./StatsGrid";

interface AssuntoBarChartProps {
  onBarClick?: (assunto: string) => void;
}

const COLORS = {
  total: "#3b82f6",
  emAndamento: "#f59e0b",
  finalizado: "#10b981",
  mediaHover: "#1d4ed8",
};

export const AssuntoBarChart = memo(function AssuntoBarChart({ onBarClick }: AssuntoBarChartProps) {
  const [limit, setLimit] = useState(15);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { data, isLoading, error } = useAnalyticsPorAssunto(limit);

  // Memoizar handler de clique
  const handleBarClick = useCallback(
    (data: { activePayload?: Array<{ payload: { assunto: string } }> }) => {
      if (onBarClick && data?.activePayload?.[0]?.payload?.assunto) {
        onBarClick(data.activePayload[0].payload.assunto);
      }
    },
    [onBarClick]
  );

  // Memoizar dados processados do gráfico
  const chartData = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.map((item) => ({
      ...item,
      assuntoTruncado:
        item.assunto.length > 40 ? item.assunto.substring(0, 40) + "..." : item.assunto,
    }));
  }, [data]);

  // Memoizar itens de estatísticas
  const statsItems = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      { label: "Total de Assuntos", value: data.length, color: "blue" },
      {
        label: "Total Protocolos",
        value: data.reduce((sum, item) => sum + item.totalProtocolos, 0),
        color: "blue",
      },
      {
        label: "Em Andamento",
        value: data.reduce((sum, item) => sum + item.emAndamento, 0),
        color: "orange",
      },
      {
        label: "Finalizados",
        value: data.reduce((sum, item) => sum + item.finalizados, 0),
        color: "green",
      },
    ];
  }, [data]);

  const headerContent = (
    <div className="flex gap-2">
      <Button variant={limit === 10 ? "default" : "outline"} size="sm" onClick={() => setLimit(10)}>
        Top 10
      </Button>
      <Button variant={limit === 15 ? "default" : "outline"} size="sm" onClick={() => setLimit(15)}>
        Top 15
      </Button>
      <Button variant={limit === 20 ? "default" : "outline"} size="sm" onClick={() => setLimit(20)}>
        Top 20
      </Button>
    </div>
  );

  return (
    <ChartContainer
      title="Análise por Assunto"
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.length === 0}
      height="h-[500px]"
      headerContent={headerContent}
      footer={data && data.length > 0 ? <StatsGrid items={statsItems} /> : undefined}
    >
      <ResponsiveContainer width="100%" height={500}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
          onClick={handleBarClick}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            type="category"
            dataKey="assuntoTruncado"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            width={140}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                total: "Total",
                emAndamento: "Em Andamento",
                finalizado: "Finalizado",
                mediaDias: "Média de Dias",
              };
              return [
                name === "mediaDias" ? `${value.toFixed(1)} dias` : value.toLocaleString("pt-BR"),
                labels[name] || name,
              ];
            }}
            labelFormatter={(label: string) => {
              const item = chartData.find((d) => d.assuntoTruncado === label);
              return item ? item.assunto : label;
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
          />
          <Bar
            dataKey="total"
            name="Total"
            fill={COLORS.total}
            radius={[0, 4, 4, 0]}
            onMouseEnter={(_, index) => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{ cursor: onBarClick ? "pointer" : "default" }}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={hoveredIndex === index ? COLORS.mediaHover : COLORS.total}
              />
            ))}
          </Bar>
          <Bar
            dataKey="emAndamento"
            name="Em Andamento"
            fill={COLORS.emAndamento}
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="finalizado"
            name="Finalizado"
            fill={COLORS.finalizado}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});
