"use client";

import { useState, useMemo, useCallback, memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useFluxoTemporal } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { TODOS_SETORES } from "@/lib/constants/setores";
import { ChartContainer } from "./ChartContainer";

type Periodo = "7d" | "30d" | "90d" | "12m" | "ytd";

function formatarData(data: string, periodo: Periodo): string {
  if (!data) {
    return data;
  }

  if (periodo === "7d" || periodo === "30d") {
    const partes = data.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}`;
    }
  }

  if (periodo === "90d") {
    const match = data.match(/\d{4}-S(\d{2})/);
    if (match) {
      return `Sem. ${match[1]}`;
    }
  }

  if (periodo === "12m" || periodo === "ytd") {
    const partes = data.split("-");
    if (partes.length === 2) {
      const meses = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      const mesIndex = parseInt(partes[1], 10) - 1;
      return periodo === "ytd" ? meses[mesIndex] : `${meses[mesIndex]}/${partes[0].slice(2)}`;
    }
  }

  return data;
}

const periodos: { value: Periodo; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "ytd", label: "Ano Atual" },
  { value: "12m", label: "12 meses" },
];

interface FluxoTemporalChartProps {
  onDataClick?: (data: { data: string; periodo: Periodo }) => void;
  setor?: number;
}

export const FluxoTemporalChart = memo(function FluxoTemporalChart({
  onDataClick,
  setor,
}: FluxoTemporalChartProps) {
  const [periodo, setPeriodo] = useState<Periodo>("ytd");
  const { data, isLoading, error } = useFluxoTemporal(periodo, setor);
  const isMacroView = setor === TODOS_SETORES;

  const labels = useMemo(
    () => ({
      entradas: isMacroView ? "Entradas na Fundação" : "Entradas",
      saidas: isMacroView ? "Finalizados (Arquivados)" : "Saídas",
      title: isMacroView ? "Fluxo de Protocolos da Fundação" : "Fluxo Temporal de Protocolos",
    }),
    [isMacroView]
  );

  const dadosFormatados = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.map((item) => ({
      ...item,
      dataFormatada: formatarData(item.data ?? item.periodo, periodo),
    }));
  }, [data, periodo]);

  const totais = useMemo(() => {
    const totalEntradas = dadosFormatados.reduce(
      (sum, item) => sum + (item.entradas ?? item.qtdEntradas ?? 0),
      0
    );
    const totalSaidas = dadosFormatados.reduce(
      (sum, item) => sum + (item.saidas ?? item.qtdSaidas ?? 0),
      0
    );
    return {
      entradas: totalEntradas,
      saidas: totalSaidas,
      saldo: totalEntradas - totalSaidas,
    };
  }, [dadosFormatados]);

  const handleAreaClick = useCallback(
    (data: { activePayload?: Array<{ payload: { data: string } }> } | null) => {
      if (onDataClick && data?.activePayload?.[0]) {
        const clickedData = data.activePayload[0].payload;
        onDataClick({ data: clickedData.data, periodo });
      }
    },
    [onDataClick, periodo]
  );

  const headerContent = useMemo(
    () => (
      <div className="flex gap-2">
        {periodos.map((p) => (
          <Button
            key={p.value}
            variant={periodo === p.value ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriodo(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>
    ),
    [periodo]
  );

  return (
    <ChartContainer
      title={labels.title}
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.length === 0}
      emptyMessage="Nenhum dado disponível para o período selecionado."
      height="h-[500px]"
      headerContent={headerContent}
      footer={
        dadosFormatados.length > 0 ? (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total {labels.entradas}</p>
              <p className="text-2xl font-bold text-blue-600">
                {totais.entradas.toLocaleString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total {labels.saidas}</p>
              <p className="text-2xl font-bold text-green-600">
                {totais.saidas.toLocaleString("pt-BR")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {isMacroView ? "Saldo em Trâmite" : "Saldo Líquido"}
              </p>
              <p className="text-2xl font-bold">{totais.saldo.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        ) : undefined
      }
    >
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={dadosFormatados}
          onClick={handleAreaClick}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="dataFormatada"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => value.toLocaleString("pt-BR")}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number) => value.toLocaleString("pt-BR")}
            isAnimationActive={false}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          <Area
            type="monotone"
            dataKey="entradas"
            name={labels.entradas}
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorEntradas)"
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="saidas"
            name={labels.saidas}
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorSaidas)"
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});
