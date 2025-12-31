"use client";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { TODOS_SETORES } from "@/lib/constants/setores";

// Lista ordenada de meses em português (Janeiro = 1, Dezembro = 12)
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

export function ComparativoChart({ setor }: ComparativoChartProps) {
  const { data, isLoading, error } = useComparativo(setor);
  const isMacroView = setor === TODOS_SETORES;

  // Título dinâmico
  const chartTitle = isMacroView
    ? "Comparativo Ano a Ano - Entradas na Fundação"
    : "Comparativo Ano a Ano";

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{chartTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar dados comparativos.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{chartTitle}</CardTitle>
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
          <CardTitle>{chartTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Nenhum dado disponível.</p>
        </CardContent>
      </Card>
    );
  }

  // Filtrar dados para ignorar o ano de 2022
  const dadosFiltrados = data.filter((item) => item.ano !== 2022);

  // Obter anos únicos (excluindo 2022)
  const anos = [...new Set(dadosFiltrados.map((item) => item.ano))].sort();

  // Criar estrutura com todos os 12 meses (Janeiro a Dezembro)
  // Se não houver dados para um mês/ano, o valor fica undefined (barra não aparece)
  const chartData = mesesOrdenados.map((mesInfo) => {
    const mesData: Record<string, string | number> = {
      mes: mesInfo.mes,
      mesNome: mesInfo.nome,
    };

    // Para cada ano, buscar a quantidade desse mês (ou deixar undefined)
    anos.forEach((ano) => {
      const dadoMesAno = dadosFiltrados.find((d) => d.mes === mesInfo.mes && d.ano === ano);
      if (dadoMesAno) {
        mesData[`ano_${ano}`] = dadoMesAno.quantidade;
      }
      // Se não encontrar, deixa undefined (não adiciona a propriedade)
    });

    return mesData;
  });

  // Cores para cada ano
  const coresAnos: Record<number, string> = {
    [anos[0]]: "#3b82f6", // azul
    [anos[1]]: "#10b981", // verde
    [anos[2]]: "#f59e0b", // laranja
    [anos[3]]: "#8b5cf6", // roxo
  };

  // Calcular variação percentual entre pares de anos consecutivos
  const calcularVariacoes = () => {
    if (anos.length < 2) {
      return [];
    }

    const variacoes = [];

    // Calcular variação para cada par de anos consecutivos
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

      variacoes.push({
        valor: variacao,
        anoAtual,
        anoAnterior,
        totalAtual,
        totalAnterior,
      });
    }

    return variacoes;
  };

  const variacoes = calcularVariacoes();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{chartTitle}</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          {isMacroView
            ? "Comparação mensal do volume de protocolos que entraram na fundação."
            : "Comparação mensal do volume de protocolos entre diferentes anos."}
        </p>
      </CardHeader>
      <CardContent>
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
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
              }}
            />
            {anos.map((ano) => (
              <Bar
                key={ano}
                dataKey={`ano_${ano}`}
                name={ano.toString()}
                fill={coresAnos[ano] || "#94a3b8"}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        {/* Estatísticas e variação */}
        <div className="mt-6 space-y-4">
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
                        <span className="text-xs font-normal text-muted-foreground">entradas</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{variacao.anoAtual}</p>
                      <p className="text-lg font-semibold">
                        {variacao.totalAtual.toLocaleString("pt-BR")}{" "}
                        <span className="text-xs font-normal text-muted-foreground">entradas</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totais por ano */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {anos.map((ano) => {
              const totalAno = dadosFiltrados
                .filter((item) => item.ano === ano)
                .reduce((sum, item) => sum + item.quantidade, 0);

              return (
                <div
                  key={ano}
                  className="p-3 rounded-lg border"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: coresAnos[ano] || "#94a3b8",
                  }}
                >
                  <p className="text-xs text-muted-foreground">{ano}</p>
                  <p className="text-2xl font-bold">{totalAno.toLocaleString("pt-BR")}</p>
                  <p className="text-xs text-muted-foreground">entradas</p>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
