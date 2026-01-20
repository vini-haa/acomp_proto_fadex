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
import { useAnalyticsPorAssunto, type AssuntoFilters } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "./ChartContainer";
import { StatsGrid } from "./StatsGrid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface AssuntoBarChartProps {
  onBarClick?: (assunto: string) => void;
}

const COLORS = {
  total: "#3b82f6",
  emAndamento: "#f59e0b",
  finalizado: "#10b981",
  mediaHover: "#1d4ed8",
};

type PeriodoPreset = "30d" | "60d" | "90d" | "6m" | "1y" | "all";

const PERIODO_OPTIONS: { value: PeriodoPreset; label: string }[] = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "60d", label: "Últimos 60 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "1y", label: "Último ano" },
  { value: "all", label: "Todo o período" },
];

export const AssuntoBarChart = memo(function AssuntoBarChart({ onBarClick }: AssuntoBarChartProps) {
  const [limit, setLimit] = useState(15);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoPreset>("all");

  // Construir filtros
  const filters: AssuntoFilters = useMemo(() => {
    if (periodo === "all") {
      return {};
    }
    return { periodo };
  }, [periodo]);

  const { data, isLoading, error } = useAnalyticsPorAssunto(filters);

  // Memoizar handler de clique
  const handleBarClick = useCallback(
    (clickData: { activePayload?: Array<{ payload: { assunto: string } }> }) => {
      if (onBarClick && clickData?.activePayload?.[0]?.payload?.assunto) {
        onBarClick(clickData.activePayload[0].payload.assunto);
      }
    },
    [onBarClick]
  );

  // Aplicar limite aos dados
  const limitedData = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.slice(0, limit);
  }, [data, limit]);

  // Memoizar dados processados do gráfico
  const chartData = useMemo(() => {
    if (!limitedData || limitedData.length === 0) {
      return [];
    }
    return limitedData.map((item) => ({
      ...item,
      assuntoTruncado:
        item.assunto.length > 40 ? item.assunto.substring(0, 40) + "..." : item.assunto,
    }));
  }, [limitedData]);

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
    <div className="flex items-center gap-4 flex-wrap">
      {/* Filtro de período */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoPreset)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {PERIODO_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Limite de resultados */}
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
