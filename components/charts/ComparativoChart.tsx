"use client";

import { memo, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useComparativo } from "@/hooks/useAnalytics";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TODOS_SETORES } from "@/lib/constants/setores";
import { ChartContainer } from "./ChartContainer";

const mesesOrdenados = [
  { mes: 1, nome: "Janeiro" },
  { mes: 2, nome: "Fevereiro" },
  { mes: 3, nome: "Março" },
  { mes: 4, nome: "Abril" },
  { mes: 5, nome: "Maio" },
  { mes: 6, nome: "Junho" },
  { mes: 7, nome: "Julho" },
  { mes: 8, nome: "Agosto" },
  { mes: 9, nome: "Setembro" },
  { mes: 10, nome: "Outubro" },
  { mes: 11, nome: "Novembro" },
  { mes: 12, nome: "Dezembro" },
];

interface ComparativoChartProps {
  setor?: number;
}

export const ComparativoChart = memo(function ComparativoChart({ setor }: ComparativoChartProps) {
  const { data, isLoading, error } = useComparativo(setor);
  const isMacroView = setor === TODOS_SETORES;

  const chartTitle = useMemo(
    () => (isMacroView ? "Comparativo Ano a Ano - Entradas na Fundação" : "Comparativo Ano a Ano"),
    [isMacroView]
  );

  const description = useMemo(
    () =>
      isMacroView
        ? "Comparação mensal do volume de protocolos que entraram na fundação."
        : "Comparação mensal do volume de protocolos entre diferentes anos.",
    [isMacroView]
  );

  // Processar dados do gráfico
  const { chartData, anos, coresAnos, dadosFiltrados } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], anos: [], coresAnos: {}, dadosFiltrados: [] };
    }

    const filtrados = data.filter((item) => item.ano !== 2022);
    const anosUnicos = [...new Set(filtrados.map((item) => item.ano))].sort();

    const cores: Record<number, string> = {
      [anosUnicos[0]]: "#3b82f6",
      [anosUnicos[1]]: "#10b981",
      [anosUnicos[2]]: "#f59e0b",
      [anosUnicos[3]]: "#8b5cf6",
    };

    const processedData = mesesOrdenados.map((mesInfo) => {
      const mesData: Record<string, string | number> = {
        mes: mesInfo.mes,
        mesNome: mesInfo.nome,
      };

      anosUnicos.forEach((ano) => {
        const dadoMesAno = filtrados.find((d) => d.mes === mesInfo.mes && d.ano === ano);
        if (dadoMesAno) {
          mesData[`ano_${ano}`] = dadoMesAno.quantidade;
        }
      });

      return mesData;
    });

    return {
      chartData: processedData,
      anos: anosUnicos,
      coresAnos: cores,
      dadosFiltrados: filtrados,
    };
  }, [data]);

  // Calcular variações
  const variacoes = useMemo(() => {
    if (anos.length < 2) {
      return [];
    }

    const result = [];
    for (let i = 1; i < anos.length; i++) {
      const anoAtual = anos[i];
      const anoAnterior = anos[i - 1];

      const totalAtual = dadosFiltrados
        .filter((item) => item.ano === anoAtual)
        .reduce((sum, item) => sum + item.quantidade, 0);

      const totalAnterior = dadosFiltrados
        .filter((item) => item.ano === anoAnterior)
        .reduce((sum, item) => sum + item.quantidade, 0);

      const variacao = totalAnterior > 0 ? ((totalAtual - totalAnterior) / totalAnterior) * 100 : 0;

      result.push({
        valor: variacao,
        anoAtual,
        anoAnterior,
        totalAtual,
        totalAnterior,
      });
    }

    return result;
  }, [anos, dadosFiltrados]);

  // Calcular totais por ano
  const totaisPorAno = useMemo(() => {
    return anos.map((ano) => ({
      ano,
      total: dadosFiltrados
        .filter((item) => item.ano === ano)
        .reduce((sum, item) => sum + item.quantidade, 0),
    }));
  }, [anos, dadosFiltrados]);

  return (
    <ChartContainer
      title={chartTitle}
      description={description}
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.length === 0}
      height="h-[500px]"
      footer={
        anos.length > 0 ? (
          <div className="space-y-4">
            {variacoes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {variacoes.map((variacao) => (
                  <div
                    key={`${variacao.anoAnterior}-${variacao.anoAtual}`}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Entrada de Protocolos</p>
                        <p className="text-xs text-muted-foreground">
                          {variacao.anoAnterior} → {variacao.anoAtual}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-3xl font-bold">
                            {variacao.valor > 0 ? "+" : ""}
                            {variacao.valor.toFixed(1)}%
                          </p>
                          {variacao.valor > 0 ? (
                            <TrendingUp className="h-6 w-6 text-green-600" />
                          ) : variacao.valor < 0 ? (
                            <TrendingDown className="h-6 w-6 text-red-600" />
                          ) : (
                            <Minus className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{variacao.anoAnterior}</p>
                        <p className="text-lg font-semibold">
                          {variacao.totalAnterior.toLocaleString("pt-BR")}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            entradas
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">{variacao.anoAtual}</p>
                        <p className="text-lg font-semibold">
                          {variacao.totalAtual.toLocaleString("pt-BR")}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            entradas
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {totaisPorAno.map(({ ano, total }) => (
                <div
                  key={ano}
                  className="p-3 rounded-lg border"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: coresAnos[ano] || "#94a3b8",
                  }}
                >
                  <p className="text-xs text-muted-foreground">{ano}</p>
                  <p className="text-2xl font-bold">{total.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">entradas</p>
                </div>
              ))}
            </div>
          </div>
        ) : undefined
      }
    >
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="mesNome"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            formatter={(value: number) => value.toLocaleString("pt-BR")}
            isAnimationActive={false}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          {anos.map((ano) => (
            <Bar
              key={ano}
              dataKey={`ano_${ano}`}
              name={ano.toString()}
              fill={coresAnos[ano] || "#94a3b8"}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
});
