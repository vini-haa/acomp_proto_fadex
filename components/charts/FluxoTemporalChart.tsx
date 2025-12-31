"use client";

import { useState, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TODOS_SETORES } from "@/lib/constants/setores";

type Periodo = "7d" | "30d" | "90d" | "12m" | "ytd";

// Função para formatar datas no formato brasileiro
function formatarData(data: string, periodo: Periodo): string {
  if (!data) {
    return data;
  }

  // Para 7d e 30d: yyyy-MM-dd → dd/MM
  if (periodo === "7d" || periodo === "30d") {
    const partes = data.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}`;
    }
  }

  // Para 90d: 2025-S47 → Sem. 47
  if (periodo === "90d") {
    const match = data.match(/\d{4}-S(\d{2})/);
    if (match) {
      return `Sem. ${match[1]}`;
    }
  }

  // Para 12m e ytd: yyyy-MM → Mês (Jan, Fev, etc)
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
      // Para ytd, mostrar só o mês; para 12m, mostrar mês/ano
      return periodo === "ytd" ? meses[mesIndex] : `${meses[mesIndex]}/${partes[0].slice(2)}`;
    }
  }

  return data;
}

interface FluxoTemporalChartProps {
  onDataClick?: (data: { data: string; periodo: Periodo }) => void;
  setor?: number;
}

export function FluxoTemporalChart({ onDataClick, setor }: FluxoTemporalChartProps) {
  const [periodo, setPeriodo] = useState<Periodo>("ytd");
  const { data, isLoading, error } = useFluxoTemporal(periodo, setor);
  const isMacroView = setor === TODOS_SETORES;

  // Labels dinâmicos baseados na visão
  const labels = {
    entradas: isMacroView ? "Entradas na Fundação" : "Entradas",
    saidas: isMacroView ? "Finalizados (Arquivados)" : "Saídas",
    title: isMacroView ? "Fluxo de Protocolos da Fundação" : "Fluxo Temporal de Protocolos",
  };

  // Formatar os dados com datas no formato brasileiro
  const dadosFormatados = useMemo(() => {
    if (!data) {
      return [];
    }
    return data.map((item) => ({
      ...item,
      dataFormatada: formatarData(item.data ?? item.periodo, periodo),
    }));
  }, [data, periodo]);

  const periodos: { value: Periodo; label: string }[] = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" },
    { value: "ytd", label: "Ano Atual" },
    { value: "12m", label: "12 meses" },
  ];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{labels.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar dados de fluxo temporal.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{labels.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{labels.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível para o período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAreaClick = (
    data: { activePayload?: Array<{ payload: { data: string } }> } | null
  ) => {
    if (onDataClick && data?.activePayload?.[0]) {
      const clickedData = data.activePayload[0].payload;
      onDataClick({ data: clickedData.data, periodo });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{labels.title}</CardTitle>
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
        </div>
      </CardHeader>
      <CardContent>
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
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
            />
            <Area
              type="monotone"
              dataKey="entradas"
              name={labels.entradas}
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorEntradas)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="saidas"
              name={labels.saidas}
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorSaidas)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total {labels.entradas}</p>
            <p className="text-2xl font-bold text-blue-600">
              {dadosFormatados
                .reduce((sum, item) => sum + (item.entradas ?? item.qtdEntradas ?? 0), 0)
                .toLocaleString("pt-BR")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total {labels.saidas}</p>
            <p className="text-2xl font-bold text-green-600">
              {dadosFormatados
                .reduce((sum, item) => sum + (item.saidas ?? item.qtdSaidas ?? 0), 0)
                .toLocaleString("pt-BR")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {isMacroView ? "Saldo em Trâmite" : "Saldo Líquido"}
            </p>
            <p className="text-2xl font-bold">
              {dadosFormatados
                .reduce(
                  (sum, item) =>
                    sum +
                    ((item.entradas ?? item.qtdEntradas ?? 0) -
                      (item.saidas ?? item.qtdSaidas ?? 0)),
                  0
                )
                .toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
