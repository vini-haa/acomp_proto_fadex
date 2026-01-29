"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TendenciaFluxo } from "@/types/dashboard";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
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

interface TendenciaFluxoChartProps {
  data: TendenciaFluxo[];
}

export const TendenciaFluxoChart = memo(function TendenciaFluxoChart({
  data,
}: TendenciaFluxoChartProps) {
  // Calcula totais e tendência
  const { totais, tendencia } = useMemo(() => {
    const totalEntradas = data.reduce((sum, d) => sum + d.entradas, 0);
    const totalSaidas = data.reduce((sum, d) => sum + d.saidas, 0);
    const saldo = totalEntradas - totalSaidas;

    // Determina tendência baseado no saldo
    let tendenciaTipo: "acumulando" | "equilibrado" | "reduzindo";
    if (saldo > totalSaidas * 0.1) {
      tendenciaTipo = "acumulando"; // Mais de 10% de acúmulo
    } else if (saldo < -totalSaidas * 0.1) {
      tendenciaTipo = "reduzindo"; // Reduzindo backlog
    } else {
      tendenciaTipo = "equilibrado";
    }

    return {
      totais: { entradas: totalEntradas, saidas: totalSaidas, saldo },
      tendencia: tendenciaTipo,
    };
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Evolucao Mensal - Entrada vs Saida
            </CardTitle>
            <CardDescription>
              Ultimos 6 meses: entrada {">"} saida = acumulo de trabalho
            </CardDescription>
          </div>
          {/* Indicador de tendência */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              tendencia === "acumulando"
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                : tendencia === "reduzindo"
                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
            }`}
          >
            {tendencia === "acumulando" ? (
              <>
                <TrendingUp className="h-4 w-4" />
                Acumulando
              </>
            ) : tendencia === "reduzindo" ? (
              <>
                <TrendingDown className="h-4 w-4" />
                Reduzindo
              </>
            ) : (
              <>
                <Minus className="h-4 w-4" />
                Equilibrado
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            <p className="text-sm">Sem dados disponiveis</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="mesLabel"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value) => value.toLocaleString("pt-BR")}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }
                    const entradas = payload.find((p) => p.dataKey === "entradas")?.value as number;
                    const saidas = payload.find((p) => p.dataKey === "saidas")?.value as number;
                    const saldo = entradas - saidas;
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-popover-foreground mb-2">{label}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            Entradas:{" "}
                            <span className="font-medium text-blue-600">
                              {entradas?.toLocaleString("pt-BR")}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Saidas:{" "}
                            <span className="font-medium text-green-600">
                              {saidas?.toLocaleString("pt-BR")}
                            </span>
                          </p>
                          <p className="text-muted-foreground pt-1 border-t">
                            Saldo:{" "}
                            <span
                              className={`font-medium ${
                                saldo > 0 ? "text-red-600" : saldo < 0 ? "text-green-600" : ""
                              }`}
                            >
                              {saldo > 0 ? "+" : ""}
                              {saldo?.toLocaleString("pt-BR")}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "10px" }}
                  formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                />
                <Area
                  type="monotone"
                  dataKey="entradas"
                  name="Entradas"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorEntradas)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="saidas"
                  name="Saidas"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorSaidas)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Resumo do período */}
            <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Entradas</p>
                <p className="text-lg font-bold text-blue-600">
                  {totais.entradas.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Saidas</p>
                <p className="text-lg font-bold text-green-600">
                  {totais.saidas.toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Saldo (acumulo)</p>
                <p
                  className={`text-lg font-bold ${
                    totais.saldo > 0
                      ? "text-red-600"
                      : totais.saldo < 0
                        ? "text-green-600"
                        : "text-foreground"
                  }`}
                >
                  {totais.saldo > 0 ? "+" : ""}
                  {totais.saldo.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
