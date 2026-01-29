"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EvolucaoSetorMes } from "@/types/dashboard";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface EvolucaoSetorChartProps {
  data: EvolucaoSetorMes[];
}

export const EvolucaoSetorChart = memo(function EvolucaoSetorChart({
  data,
}: EvolucaoSetorChartProps) {
  const { totais, tendencia } = useMemo(() => {
    const totalEntradas = data.reduce((sum, d) => sum + d.entradas, 0);
    const totalSaidas = data.reduce((sum, d) => sum + d.saidas, 0);
    const saldoAcumulado = totalEntradas - totalSaidas;

    let tipo: "acumulando" | "estavel" | "reduzindo";
    if (totalSaidas === 0 && totalEntradas === 0) {
      tipo = "estavel";
    } else if (saldoAcumulado > totalSaidas * 0.1) {
      tipo = "acumulando";
    } else if (saldoAcumulado < -totalSaidas * 0.1) {
      tipo = "reduzindo";
    } else {
      tipo = "estavel";
    }

    return {
      totais: { entradas: totalEntradas, saidas: totalSaidas, saldo: saldoAcumulado },
      tendencia: tipo,
    };
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Evolucao do Setor
            </CardTitle>
            <CardDescription>Entradas vs saidas nos ultimos 6 meses</CardDescription>
          </div>
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
                Estavel
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
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }
                    const entradas = payload.find((p) => p.dataKey === "entradas")?.value as number;
                    const saidas = payload.find((p) => p.dataKey === "saidas")?.value as number;
                    const saldo = payload.find((p) => p.dataKey === "saldo")?.value as number;
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
                              className={`font-medium ${saldo > 0 ? "text-red-600" : saldo < 0 ? "text-green-600" : ""}`}
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
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Line
                  type="monotone"
                  dataKey="entradas"
                  name="Entradas"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="saidas"
                  name="Saidas"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="saldo"
                  name="Saldo"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Resumo */}
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
                <p className="text-xs text-muted-foreground">Saldo Acumulado</p>
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
