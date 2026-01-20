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
  Legend,
} from "recharts";
import { useAnalyticsPorProjeto } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "./ChartContainer";
import { StatsGrid } from "./StatsGrid";

interface ProjetoBarChartProps {
  onBarClick?: (numconv: number, projeto: string) => void;
}

const COLORS = {
  emAndamento: "#3b82f6", // blue-500
  finalizados: "#22c55e", // green-500
};

// Configuração de thresholds SLA
const SLA_CONFIG = {
  bom: { max: 30, color: "#22c55e", label: "Bom" },
  atencao: { max: 60, color: "#f59e0b", label: "Atenção" },
  critico: { max: Infinity, color: "#ef4444", label: "Crítico" },
};

/**
 * Retorna a cor do SLA baseado no tempo médio em dias
 */
const getSLAColor = (dias: number | null): string => {
  if (dias === null || dias === undefined) {
    return SLA_CONFIG.bom.color;
  }
  if (dias <= SLA_CONFIG.bom.max) {
    return SLA_CONFIG.bom.color;
  }
  if (dias <= SLA_CONFIG.atencao.max) {
    return SLA_CONFIG.atencao.color;
  }
  return SLA_CONFIG.critico.color;
};

/**
 * Retorna o label do SLA baseado no tempo médio em dias
 */
const getSLALabel = (dias: number | null): string => {
  if (dias === null || dias === undefined) {
    return SLA_CONFIG.bom.label;
  }
  if (dias <= SLA_CONFIG.bom.max) {
    return SLA_CONFIG.bom.label;
  }
  if (dias <= SLA_CONFIG.atencao.max) {
    return SLA_CONFIG.atencao.label;
  }
  return SLA_CONFIG.critico.label;
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
        color: "blue",
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
      footer={
        data && data.length > 0 ? (
          <>
            <StatsGrid items={statsItems} />
            {/* Legenda de SLA */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="font-medium">Tempo Médio (SLA):</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SLA_CONFIG.bom.color }}
                />
                ≤30d (Bom)
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SLA_CONFIG.atencao.color }}
                />
                31-60d (Atenção)
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: SLA_CONFIG.critico.color }}
                />
                &gt;60d (Crítico)
              </span>
            </div>
          </>
        ) : undefined
      }
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
              // Busca o projeto correspondente para obter mediaDias
              const projeto = chartData.find((d) => d.projetoTruncado === payload.value);
              const mediaDias = projeto?.mediaDias ?? null;
              const slaColor = getSLAColor(mediaDias);

              return (
                <g transform={`translate(${x},${y})`}>
                  {/* Círculo indicador de SLA */}
                  <circle cx={-8} cy={0} r={4} fill={slaColor} />
                  {/* Nome do projeto */}
                  <text
                    x={-18}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill="hsl(var(--muted-foreground))"
                    fontSize={11}
                  >
                    {payload.value}
                  </text>
                </g>
              );
            }}
            width={400}
            tickMargin={10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }
              const projeto = chartData.find((d) => d.projetoTruncado === label);
              const mediaDias = projeto?.mediaDias ?? 0;
              const slaColor = getSLAColor(mediaDias);
              const slaLabel = getSLALabel(mediaDias);

              return (
                <div
                  style={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    padding: "10px 14px",
                  }}
                >
                  <p
                    style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {projeto?.projeto || label}
                  </p>
                  <div style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
                    <p style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: COLORS.emAndamento,
                          display: "inline-block",
                        }}
                      />
                      Em Andamento:{" "}
                      <strong style={{ color: "hsl(var(--foreground))" }}>
                        {projeto?.emAndamento.toLocaleString("pt-BR")}
                      </strong>
                    </p>
                    <p style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: COLORS.finalizados,
                          display: "inline-block",
                        }}
                      />
                      Finalizados:{" "}
                      <strong style={{ color: "hsl(var(--foreground))" }}>
                        {projeto?.finalizados.toLocaleString("pt-BR")}
                      </strong>
                    </p>
                    <hr style={{ margin: "8px 0", borderColor: "hsl(var(--border))" }} />
                    <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: slaColor,
                          display: "inline-block",
                        }}
                      />
                      Tempo Médio:{" "}
                      <strong style={{ color: slaColor }}>{Math.round(mediaDias)} dias</strong>
                      <span style={{ color: slaColor, fontWeight: 500 }}>({slaLabel})</span>
                    </p>
                  </div>
                </div>
              );
            }}
            isAnimationActive={false}
          />
          <Legend
            formatter={(value) => (value === "emAndamento" ? "Em Andamento" : "Finalizados")}
          />
          <Bar
            dataKey="emAndamento"
            name="emAndamento"
            stackId="a"
            fill={COLORS.emAndamento}
            style={{ cursor: "pointer" }}
            isAnimationActive={false}
          />
          <Bar
            dataKey="finalizados"
            name="finalizados"
            stackId="a"
            fill={COLORS.finalizados}
            radius={[0, 4, 4, 0]}
            style={{ cursor: "pointer" }}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});
