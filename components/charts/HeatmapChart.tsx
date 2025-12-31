"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { useHeatmap } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Mapeamento de dias da semana para número (SQL DATEPART WEEKDAY)
const DIAS_SEMANA_MAP: Record<string, number> = {
  Domingo: 1,
  Segunda: 2,
  Terça: 3,
  Quarta: 4,
  Quinta: 5,
  Sexta: 6,
  Sábado: 7,
};

export function HeatmapChart() {
  const router = useRouter();
  const { data, isLoading, error } = useHeatmap();

  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    // Mapear dias da semana em português
    const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    // Agrupar dados por dia da semana (usando diaSemanaNum como índice)
    const groupedByDay: Record<number, Record<number, number>> = {};

    data.forEach((item) => {
      // Ajustar índice: SQL DATEPART(WEEKDAY) retorna 1=Domingo, 2=Segunda, etc.
      // Mas queremos 0=Domingo, 1=Segunda para bater com o array diasSemana
      const dayIndex = item.diaSemanaNum - 1;

      if (dayIndex >= 0 && dayIndex < 7) {
        if (!groupedByDay[dayIndex]) {
          groupedByDay[dayIndex] = {};
        }
        groupedByDay[dayIndex][item.hora] = item.quantidade;
      }
    });

    // Criar estrutura de dados para o Nivo HeatMap (formato completo com array data)
    const result = diasSemana.map((dia, index) => {
      const horasData = [];

      // Adicionar dados para cada hora (0-23)
      for (let hora = 0; hora < 24; hora++) {
        const quantidade = groupedByDay[index]?.[hora] || 0;
        horasData.push({
          x: `${hora}h`,
          y: quantidade,
        });
      }

      return {
        id: dia,
        data: horasData,
      };
    });

    // Validar que temos pelo menos alguns dados não-zero
    const hasData = result.some((day) => {
      return day.data.some((item) => item.y > 0);
    });

    return hasData ? result : [];
  }, [data]);

  // Handler de clique na célula - navega para página de movimentações
  const handleCellClick = useCallback(
    (
      cell: { serieId: string; data: { x: string }; value: number | null },
      _event: React.MouseEvent
    ) => {
      // Só navega se tiver protocolos
      if (!cell.value || cell.value <= 0) {
        return;
      }

      const diaSemana = DIAS_SEMANA_MAP[cell.serieId];
      const hora = parseInt(cell.data.x.replace("h", ""));

      if (diaSemana && !isNaN(hora)) {
        // Navega para página de movimentações (busca no histórico)
        router.push(`/protocolos/movimentacoes?diaSemana=${diaSemana}&hora=${hora}`);
      }
    },
    [router]
  );

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Calor - Atividade por Hora e Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar dados do heatmap.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Calor - Atividade por Hora e Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Validações antes de renderizar
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Calor - Atividade por Hora e Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível para o mapa de calor.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (heatmapData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Calor - Atividade por Hora e Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Dados insuficientes para gerar o mapa de calor.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calcular valor máximo para a escala de cores
  const allValues = data.map((item) => item.quantidade);
  const maxValue = Math.max(...allValues);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa de Calor - Atividade por Hora e Dia</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Padrão de movimentações de protocolos ao longo da semana. Clique em uma célula para ver os
          protocolos daquele período.
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ height: 400, cursor: "pointer" }}>
          <ResponsiveHeatMap
            data={heatmapData}
            margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
            valueFormat=">-.0f"
            forceSquare={false}
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: "",
              legendOffset: 46,
            }}
            axisRight={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Dia da Semana",
              legendPosition: "middle",
              legendOffset: 70,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: "Dia da Semana",
              legendPosition: "middle",
              legendOffset: -72,
            }}
            colors={{
              type: "sequential",
              scheme: "blues",
            }}
            emptyColor="#e0e0e0"
            borderRadius={3}
            borderWidth={1}
            borderColor={{
              from: "color",
              modifiers: [["darker", 0.3]],
            }}
            enableLabels={true}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 1.8]],
            }}
            legends={[
              {
                anchor: "bottom",
                translateX: 0,
                translateY: 30,
                length: 400,
                thickness: 8,
                direction: "row",
                tickPosition: "after",
                tickSize: 3,
                tickSpacing: 4,
                tickOverlap: false,
                title: "Quantidade →",
                titleAlign: "start",
                titleOffset: 4,
              },
            ]}
            theme={{
              text: {
                fill: "hsl(var(--foreground))",
                fontSize: 11,
              },
              tooltip: {
                container: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                  borderRadius: "var(--radius)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  padding: "8px 12px",
                },
              },
            }}
            hoverTarget="cell"
            animate={true}
            onClick={handleCellClick}
          />
        </div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">Total Movimentações</p>
            <p className="text-2xl font-bold">
              {data.reduce((sum, item) => sum + item.quantidade, 0).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">Pico de Atividade</p>
            <p className="text-2xl font-bold">{maxValue.toLocaleString("pt-BR")}</p>
          </div>
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">Média por Célula</p>
            <p className="text-2xl font-bold">
              {(data.reduce((sum, item) => sum + item.quantidade, 0) / data.length).toFixed(0)}
            </p>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">💡 Insights</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Identifique os horários de pico para melhor alocação de recursos</li>
            <li>• Padrões de dias úteis vs fins de semana podem indicar volumes de trabalho</li>
            <li>• Áreas escuras indicam períodos com menos atividade</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
