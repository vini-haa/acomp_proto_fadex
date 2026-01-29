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
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { TODOS_SETORES } from "@/lib/constants/setores";
import { ChartContainer } from "./ChartContainer";
import { ComparativoData, YTDInfo } from "@/types/analytics";

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

/**
 * Filtra dados para comparação YTD (Year-to-Date)
 * Considera apenas dados até o mesmo dia/mês do ano atual para comparação justa
 */
function filtrarDadosYTD(
  dados: ComparativoData[],
  ano: number,
  ytdInfo: YTDInfo
): ComparativoData[] {
  return dados.filter((item) => {
    if (item.ano !== ano) {
      return false;
    }

    // Se o mês é menor que o mês atual, inclui todos os dados
    if (item.mes < ytdInfo.mesAtual) {
      return true;
    }

    // Se o mês é maior que o mês atual, exclui
    if (item.mes > ytdInfo.mesAtual) {
      return false;
    }

    // Se é o mesmo mês, verifica o dia
    // Se não tiver dia (dados agregados por mês), inclui o mês inteiro se for anterior ao atual
    if (!item.dia) {
      return true;
    }

    return item.dia <= ytdInfo.diaAtual;
  });
}

/**
 * Calcula o total de um conjunto de dados
 */
function calcularTotal(dados: ComparativoData[]): number {
  return dados.reduce((sum, item) => sum + item.quantidade, 0);
}

/**
 * Formata a data de referência YTD para exibição
 */
function formatarDataYTD(ytdInfo: YTDInfo): string {
  const meses = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  return `até ${ytdInfo.diaAtual}/${meses[ytdInfo.mesAtual - 1]}`;
}

export const ComparativoChart = memo(function ComparativoChart({ setor }: ComparativoChartProps) {
  const { data: queryData, isLoading, error } = useComparativo(setor);
  const data = queryData?.data;
  const ytdInfo = queryData?.ytdInfo;
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

  // Calcular variações com suporte a YTD
  const variacoes = useMemo(() => {
    if (anos.length < 2 || !ytdInfo) {
      return [];
    }

    const anoAtualCalendario = ytdInfo.anoAtual;
    const result = [];

    for (let i = 1; i < anos.length; i++) {
      const anoAtual = anos[i];
      const anoAnterior = anos[i - 1];

      // Verifica se estamos comparando com o ano atual (parcial)
      const isComparacaoComAnoAtual = anoAtual === anoAtualCalendario;

      let totalAtual: number;
      let totalAnterior: number;
      let isYTD = false;
      let labelPeriodo = "";

      if (isComparacaoComAnoAtual) {
        // Ano atual é parcial - usar YTD para comparação justa
        isYTD = true;
        labelPeriodo = formatarDataYTD(ytdInfo);

        // Dados do ano atual (já são parciais naturalmente)
        totalAtual = calcularTotal(dadosFiltrados.filter((item) => item.ano === anoAtual));

        // Dados do ano anterior filtrados pelo mesmo período YTD
        totalAnterior = calcularTotal(filtrarDadosYTD(dadosFiltrados, anoAnterior, ytdInfo));
      } else {
        // Comparação entre anos completos
        totalAtual = calcularTotal(dadosFiltrados.filter((item) => item.ano === anoAtual));
        totalAnterior = calcularTotal(dadosFiltrados.filter((item) => item.ano === anoAnterior));
      }

      const variacao = totalAnterior > 0 ? ((totalAtual - totalAnterior) / totalAnterior) * 100 : 0;

      result.push({
        valor: variacao,
        anoAtual,
        anoAnterior,
        totalAtual,
        totalAnterior,
        isYTD,
        labelPeriodo,
      });
    }

    return result;
  }, [anos, dadosFiltrados, ytdInfo]);

  // Calcular totais por ano com indicador de ano parcial
  const totaisPorAno = useMemo(() => {
    if (!ytdInfo) {
      return anos.map((ano) => ({
        ano,
        total: calcularTotal(dadosFiltrados.filter((item) => item.ano === ano)),
        isParcial: false,
        labelPeriodo: "",
      }));
    }

    return anos.map((ano) => {
      const isParcial = ano === ytdInfo.anoAtual;
      return {
        ano,
        total: calcularTotal(dadosFiltrados.filter((item) => item.ano === ano)),
        isParcial,
        labelPeriodo: isParcial ? formatarDataYTD(ytdInfo) : "",
      };
    });
  }, [anos, dadosFiltrados, ytdInfo]);

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
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">Entrada de Protocolos</p>
                          {variacao.isYTD && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              <Calendar className="h-3 w-3" />
                              YTD
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {variacao.anoAnterior} → {variacao.anoAtual}
                          {variacao.isYTD && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">
                              ({variacao.labelPeriodo})
                            </span>
                          )}
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
                        <p className="text-xs text-muted-foreground">
                          {variacao.anoAnterior}
                          {variacao.isYTD && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">
                              ({variacao.labelPeriodo})
                            </span>
                          )}
                        </p>
                        <p className="text-lg font-semibold">
                          {variacao.totalAnterior.toLocaleString("pt-BR")}{" "}
                          <span className="text-xs font-normal text-muted-foreground">
                            entradas
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {variacao.anoAtual}
                          {variacao.isYTD && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">
                              ({variacao.labelPeriodo})
                            </span>
                          )}
                        </p>
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
              {totaisPorAno.map(({ ano, total, isParcial, labelPeriodo }) => (
                <div
                  key={ano}
                  className="p-3 rounded-lg border"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: coresAnos[ano] || "#94a3b8",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{ano}</p>
                    {isParcial && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        <Calendar className="h-2.5 w-2.5" />
                        parcial
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{total.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">
                    entradas
                    {isParcial && labelPeriodo && (
                      <span className="ml-1 text-amber-600 dark:text-amber-400">
                        ({labelPeriodo})
                      </span>
                    )}
                  </p>
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
