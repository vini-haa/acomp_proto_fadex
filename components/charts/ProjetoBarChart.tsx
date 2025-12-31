"use client";

import { useState, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useAnalyticsPorProjeto } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "./ChartContainer";
import { StatsGrid } from "./StatsGrid";

interface ProjetoBarChartProps {
  onBarClick?: (numconv: number, projeto: string) => void;
}

const COLORS = {
  total: "#8b5cf6",
  emAndamento: "#f59e0b",
  finalizado: "#10b981",
  mediaHover: "#6d28d9",
};

export const ProjetoBarChart = memo(function ProjetoBarChart({ onBarClick }: ProjetoBarChartProps) {
  const router = useRouter();
  const [limit, setLimit] = useState(15);
  const { data, isLoading, error } = useAnalyticsPorProjeto(limit);

  // Memoizar handler de clique
  const handleBarClick = useCallback(
    (
      clickData: { activePayload?: Array<{ payload: { numconv: number; projeto: string } }> } | null
    ) => {
      if (clickData?.activePayload?.[0]) {
        const item = clickData.activePayload[0].payload;
        if (onBarClick) {
          onBarClick(item.numconv, item.projeto);
        }
        router.push(`/protocolos?numconv=${item.numconv}`);
      }
    },
    [onBarClick, router]
  );

  // Memoizar dados processados do gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    return [...data]
      .sort((a, b) => b.totalProtocolos - a.totalProtocolos)
      .map((item) => ({
        ...item,
        total: item.totalProtocolos,
        finalizado: item.finalizados,
        projetoTruncado:
          item.projeto.length > 50 ? item.projeto.substring(0, 50) + "..." : item.projeto,
      }));
  }, [data]);

  // Memoizar altura do gráfico
  const chartHeight = useMemo(() => Math.max(400, chartData.length * 35), [chartData.length]);

  // Memoizar estatísticas
  const statsItems = useMemo(() => {
    if (!data) {
      return [];
    }
    return [
      { label: "Total de Projetos", value: data.length, color: "purple" },
      {
        label: "Total Protocolos",
        value: data.reduce((sum, item) => sum + item.totalProtocolos, 0),
        color: "purple",
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

  // Memoizar conteúdo do header
  const headerContent = useMemo(
    () => (
      <div className="flex gap-2">
        <Button
          variant={limit === 10 ? "default" : "outline"}
          size="sm"
          onClick={() => setLimit(10)}
        >
          Top 10
        </Button>
        <Button
          variant={limit === 15 ? "default" : "outline"}
          size="sm"
          onClick={() => setLimit(15)}
        >
          Top 15
        </Button>
        <Button
          variant={limit === 20 ? "default" : "outline"}
          size="sm"
          onClick={() => setLimit(20)}
        >
          Top 20
        </Button>
      </div>
    ),
    [limit]
  );

  return (
    <ChartContainer
      title="Análise por Projeto"
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.length === 0}
      height="h-[500px]"
      headerContent={headerContent}
      footer={data && data.length > 0 ? <StatsGrid items={statsItems} /> : undefined}
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
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
            dataKey="projetoTruncado"
            className="text-xs"
            tick={(props) => {
              const { x, y, payload } = props;
              return (
                <text
                  x={x}
                  y={y}
                  dy={4}
                  textAnchor="end"
                  fill="hsl(var(--muted-foreground))"
                  fontSize={11}
                  style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {payload.value}
                </text>
              );
            }}
            width={380}
            tickMargin={10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            formatter={(value: number) => [value.toLocaleString("pt-BR"), "Total de Protocolos"]}
            labelFormatter={(label: string) => label}
            isAnimationActive={false}
          />
          <Bar
            dataKey="total"
            name="Total de Protocolos"
            fill={COLORS.total}
            radius={[0, 4, 4, 0]}
            style={{ cursor: "pointer" }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="total"
              position="right"
              fill="hsl(var(--muted-foreground))"
              fontSize={11}
              fontWeight={600}
              formatter={(value: number) => value.toLocaleString("pt-BR")}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});
