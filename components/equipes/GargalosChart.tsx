"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Gargalo, SeveridadeGargalo } from "@/types/equipes";

interface GargalosChartProps {
  gargalos: Gargalo[];
}

interface ChartDataItem {
  nome: string;
  nomeCompleto: string;
  carga: number;
  severidade: SeveridadeGargalo;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDataItem }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{data.nomeCompleto}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-medium">Carga:</span> {data.carga.toLocaleString()} protocolos
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-medium">Severidade:</span>{" "}
        {data.severidade === 3
          ? "Crítica"
          : data.severidade === 2
            ? "Alta"
            : data.severidade === 1
              ? "Moderada"
              : "Normal"}
      </p>
    </div>
  );
};

export function GargalosChart({ gargalos }: GargalosChartProps) {
  // Pegar top 10 setores com mais carga
  const data = useMemo(() => {
    return gargalos
      .sort((a, b) => (b.cargaAtual || 0) - (a.cargaAtual || 0))
      .slice(0, 10)
      .map((g) => ({
        nome: g.nomeSetor.length > 25 ? g.nomeSetor.slice(0, 25) + "..." : g.nomeSetor,
        nomeCompleto: g.nomeSetor,
        carga: g.cargaAtual,
        severidade: g.severidade,
      }));
  }, [gargalos]);

  const getColor = (severidade: SeveridadeGargalo) => {
    if (severidade === 3) {
      return "#ef4444";
    } // Crítico - vermelho
    if (severidade === 2) {
      return "#f97316";
    } // Alto - laranja
    if (severidade === 1) {
      return "#eab308";
    } // Moderado - amarelo
    return "#3b82f6"; // Normal - azul
  };

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Setores - Carga de Trabalho</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => value.toLocaleString()} />
            <YAxis type="category" dataKey="nome" width={180} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="carga" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.severidade)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs text-muted-foreground">Crítico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span className="text-xs text-muted-foreground">Alto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-xs text-muted-foreground">Moderado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-xs text-muted-foreground">Normal</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
