"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useDistribuicaoFaixa } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface DistribuicaoFaixaChartProps {
  onSliceClick?: (faixa: string) => void;
}

// Cores para cada faixa de tempo (mais distintas)
const COLORS = [
  "#10b981", // verde - rápido
  "#3b82f6", // azul - moderado
  "#f59e0b", // laranja - atenção
  "#ef4444", // vermelho - crítico
  "#8b5cf6", // roxo - muito crítico
];

export function DistribuicaoFaixaChart({ onSliceClick }: DistribuicaoFaixaChartProps) {
  const { data, isLoading, error } = useDistribuicaoFaixa();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Faixa de Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar distribuição por faixa.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Faixa de Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Faixa de Tempo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Nenhum dado disponível.</p>
        </CardContent>
      </Card>
    );
  }

  // Agregar dados por faixa (somar quantidades de diferentes status)
  const aggregatedData = data.reduce((acc: Record<string, number>, item) => {
    const faixa = item.faixaTempo || "Não classificado";
    acc[faixa] = (acc[faixa] || 0) + item.quantidade;
    return acc;
  }, {});

  const totalProtocolos = Object.values(aggregatedData).reduce((sum, qtd) => sum + qtd, 0);

  const chartData = Object.entries(aggregatedData).map(([faixa, quantidade]) => ({
    name: faixa.replace(/^\d+\.\s*/, ""), // Remove o número inicial
    value: quantidade,
    percentage: ((quantidade / totalProtocolos) * 100).toFixed(1),
  }));

  const handlePieClick = (entry: { name: string }) => {
    if (onSliceClick) {
      onSliceClick(entry.name);
    }
  };

  const renderCustomLabel = ({
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
    } // Não mostrar labels muito pequenos

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
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Faixa de Tempo</CardTitle>
      </CardHeader>
      <CardContent>
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
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

        {/* Estatísticas adicionais */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {chartData.map((item, index) => (
            <div
              key={item.name}
              className="p-3 rounded-lg border"
              style={{ borderLeftWidth: "4px", borderLeftColor: COLORS[index] }}
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
      </CardContent>
    </Card>
  );
}
