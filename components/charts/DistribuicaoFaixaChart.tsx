"use client";

import { memo, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useDistribuicaoFaixa } from "@/hooks/useAnalytics";
import { ChartContainer } from "./ChartContainer";

interface DistribuicaoFaixaChartProps {
  onSliceClick?: (faixa: string) => void;
}

const COLORS = [
  "#10b981", // verde - rápido
  "#3b82f6", // azul - moderado
  "#f59e0b", // laranja - atenção
  "#ef4444", // vermelho - crítico
  "#8b5cf6", // roxo - muito crítico
];

export const DistribuicaoFaixaChart = memo(function DistribuicaoFaixaChart({
  onSliceClick,
}: DistribuicaoFaixaChartProps) {
  const { data, isLoading, error } = useDistribuicaoFaixa();

  // Processar dados do gráfico
  const { chartData, totalProtocolos } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], totalProtocolos: 0 };
    }

    const aggregatedData = data.reduce((acc: Record<string, number>, item) => {
      const faixa = item.faixaTempo || "Não classificado";
      acc[faixa] = (acc[faixa] || 0) + item.quantidade;
      return acc;
    }, {});

    const total = Object.values(aggregatedData).reduce((sum, qtd) => sum + qtd, 0);

    const processed = Object.entries(aggregatedData).map(([faixa, quantidade]) => ({
      name: faixa.replace(/^\d+\.\s*/, ""),
      value: quantidade,
      percentage: ((quantidade / total) * 100).toFixed(1),
    }));

    return { chartData: processed, totalProtocolos: total };
  }, [data]);

  const handlePieClick = useCallback(
    (entry: { name: string }) => {
      if (onSliceClick) {
        onSliceClick(entry.name);
      }
    },
    [onSliceClick]
  );

  const renderCustomLabel = useCallback(
    ({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
    }: {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      percent: number;
    }) => {
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      if (percent < 0.05) {
        return null;
      }

      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          className="text-xs font-bold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    },
    []
  );

  return (
    <ChartContainer
      title="Distribuição por Faixa de Tempo"
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.length === 0}
      height="h-[500px]"
      footer={
        chartData.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {chartData.map((item, index) => (
                <div
                  key={item.name}
                  className="p-3 rounded-lg border"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: COLORS[index],
                  }}
                >
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                  <p className="text-lg font-bold">{item.value.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Total de Protocolos</p>
              <p className="text-3xl font-bold">{totalProtocolos.toLocaleString("pt-BR")}</p>
            </div>
          </>
        ) : undefined
      }
    >
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            onClick={handlePieClick}
            style={{ cursor: onSliceClick ? "pointer" : "default" }}
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            formatter={(value: number, name: string, props) => [
              `${value.toLocaleString("pt-BR")} protocolos (${(props?.payload as { percentage?: string })?.percentage ?? ""}%)`,
              name,
            ]}
            isAnimationActive={false}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: string, entry: any) =>
              `${value}: ${entry.payload?.value?.toLocaleString("pt-BR") ?? 0} (${entry.payload?.percentage ?? 0}%)`
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});
