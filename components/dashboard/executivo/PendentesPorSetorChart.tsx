"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SaudeSetor } from "@/types/dashboard";
import { Building2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface PendentesPorSetorChartProps {
  data: SaudeSetor[];
}

// Cores baseadas no status do setor
function getCorPorStatus(status: SaudeSetor["status"]): string {
  switch (status) {
    case "bom":
      return "#22c55e"; // green-500
    case "atencao":
      return "#eab308"; // yellow-500
    case "critico":
      return "#ef4444"; // red-500
    default:
      return "#3b82f6"; // blue-500
  }
}

// Trunca texto longo
function truncarTexto(texto: string, maxLength: number = 20): string {
  // Remove prefixo "- " se existir
  const limpo = texto.replace(/^-\s*/, "").trim();
  if (limpo.length <= maxLength) {
    return limpo;
  }
  return limpo.substring(0, maxLength) + "...";
}

export const PendentesPorSetorChart = memo(function PendentesPorSetorChart({
  data,
}: PendentesPorSetorChartProps) {
  // Ordena por pendentes (maior primeiro) e pega top 10
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.pendentes - a.pendentes)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        nomeSetorTruncado: truncarTexto(item.nomeSetor),
        nomeSetorLimpo: item.nomeSetor.replace(/^-\s*/, "").trim(),
      }));
  }, [data]);

  // Total de pendentes para contexto
  const totalPendentes = useMemo(() => {
    return data.reduce((sum, s) => sum + s.pendentes, 0);
  }, [data]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Pendentes por Setor
        </CardTitle>
        <CardDescription>
          Onde esta acumulando trabalho ({totalPendentes.toLocaleString("pt-BR")} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground">
            <p className="text-sm">Sem dados disponiveis</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  tickFormatter={(value) => value.toLocaleString("pt-BR")}
                />
                <YAxis
                  type="category"
                  dataKey="nomeSetorTruncado"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  width={130}
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) {
                      return null;
                    }
                    const item = payload[0].payload as SaudeSetor & {
                      nomeSetorTruncado: string;
                      nomeSetorLimpo: string;
                    };
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-popover-foreground">
                          {item.nomeSetorLimpo}
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            Pendentes:{" "}
                            <span className="font-medium text-popover-foreground">
                              {item.pendentes.toLocaleString("pt-BR")}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Tempo medio:{" "}
                            <span className="font-medium text-popover-foreground">
                              {item.tempoMedioDias} dias
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Status:{" "}
                            <span
                              className={`font-medium ${
                                item.status === "bom"
                                  ? "text-green-600"
                                  : item.status === "atencao"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {item.status === "bom"
                                ? "Bom"
                                : item.status === "atencao"
                                  ? "Atencao"
                                  : "Critico"}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pendentes" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCorPorStatus(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-3 p-2 bg-muted/50 rounded-lg text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                <span className="text-foreground">Bom</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <span className="text-foreground">Atencao</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-foreground">Critico</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
