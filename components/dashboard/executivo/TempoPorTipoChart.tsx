"use client";

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TempoPorTipo } from "@/types/dashboard";
import { Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TempoPorTipoChartProps {
  data: TempoPorTipo[];
}

// Função para determinar a cor baseado no tempo
function getCorPorTempo(tempo: number): string {
  if (tempo <= 5) {
    return "#22c55e";
  } // green-500
  if (tempo <= 10) {
    return "#f59e0b";
  } // amber-500
  return "#ef4444"; // red-500
}

/**
 * Abrevia termos comuns em nomes de tipos de protocolo
 * e trunca se ainda estiver muito longo
 */
function abreviarTipoProtocolo(nome: string, maxLength: number = 25): string {
  const abreviacoes: Record<string, string> = {
    SOLICITAÇÃO: "SOLIC.",
    SOLICITACAO: "SOLIC.",
    COMPRAS: "COMP.",
    PAGAMENTO: "PGTO.",
    CONSUMO: "CONS.",
    SERVIÇOS: "SERV.",
    SERVICOS: "SERV.",
    TERCEIRO: "3º",
    PASSAGEM: "PASS.",
    REQUISIÇÃO: "REQ.",
    REQUISICAO: "REQ.",
    REMANEJAMENTO: "REMAN.",
    SUPRIMENTO: "SUPRIM.",
    FUNDOS: "FUND.",
    MATERIAL: "MAT.",
    RELATÓRIO: "REL.",
    RELATORIO: "REL.",
    VIAGEM: "VIAG.",
    AÉREA: "AÉREA",
    DIÁRIA: "DIÁRIA",
    DIARIA: "DIÁRIA",
    BOLSA: "BOLSA",
  };

  let resultado = nome.toUpperCase();

  // Aplicar abreviações (do mais longo para mais curto para evitar conflitos)
  const termos = Object.keys(abreviacoes).sort((a, b) => b.length - a.length);
  for (const termo of termos) {
    resultado = resultado.replace(new RegExp(termo, "g"), abreviacoes[termo]);
  }

  // Se ainda estiver muito longo, truncar
  if (resultado.length > maxLength) {
    resultado = resultado.substring(0, maxLength - 2) + "..";
  }

  return resultado;
}

export const TempoPorTipoChart = memo(function TempoPorTipoChart({ data }: TempoPorTipoChartProps) {
  // Prepara dados para o gráfico (ordena por tempo médio decrescente)
  const chartData = [...data]
    .sort((a, b) => b.tempoMedioDias - a.tempoMedioDias)
    .slice(0, 8)
    .map((item) => ({
      ...item,
      tipoAbreviado: abreviarTipoProtocolo(item.tipo),
    }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Tempo por Tipo de Protocolo
        </CardTitle>
        <CardDescription>Tempo medio de tramitacao por tipo de documento</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-muted-foreground">
            <p className="text-sm">Sem dados suficientes</p>
          </div>
        ) : (
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
                tickFormatter={(value) => `${value}d`}
              />
              <YAxis
                type="category"
                dataKey="tipoAbreviado"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
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
                  const data = payload[0].payload as TempoPorTipo & { tipoAbreviado: string };
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-popover-foreground">{data.tipo}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tempo Medio:{" "}
                        <span className="font-medium text-popover-foreground">
                          {data.tempoMedioDias.toFixed(1)} dias
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">{data.quantidade} protocolos</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="tempoMedioDias" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCorPorTempo(entry.tempoMedioDias)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center justify-center gap-4 mt-3 p-2 bg-muted/50 rounded-lg text-xs">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-foreground">Bom (ate 5d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="text-foreground">Atencao (5-10d)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="text-foreground">Critico (&gt;10d)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
