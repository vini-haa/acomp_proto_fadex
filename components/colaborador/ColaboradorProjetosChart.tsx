"use client";

import { useState, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { useColaboradorProjetos } from "@/hooks/useColaborador";
import type { ColaboradorPorProjeto } from "@/types/colaborador";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  BarChart3,
  Table as TableIcon,
  FolderKanban,
  ArrowUpDown,
} from "lucide-react";

interface ColaboradorProjetosChartProps {
  colaboradorId: number;
}

const COLORS = {
  emAndamento: "#3b82f6", // blue-500
  finalizados: "#22c55e", // green-500
};

export const ColaboradorProjetosChart = memo(function ColaboradorProjetosChart({
  colaboradorId,
}: ColaboradorProjetosChartProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [situacaoProjeto, setSituacaoProjeto] = useState<string>("Todos");
  const [sorting, setSorting] = useState<SortingState>([{ id: "totalProtocolos", desc: true }]);

  const { data, isLoading, error } = useColaboradorProjetos(colaboradorId, {
    periodo: 180,
    limit: 15,
    situacaoProjeto: situacaoProjeto as "Em Execução" | "Concluído" | "Todos",
  });

  // Dados para o gráfico de barras empilhadas
  const chartData = useMemo(() => {
    if (!data?.projetos) {
      return [];
    }

    return data.projetos.map((projeto) => ({
      ...projeto,
      projetoTruncado:
        projeto.projeto.length > 40 ? projeto.projeto.substring(0, 40) + "..." : projeto.projeto,
    }));
  }, [data?.projetos]);

  // Altura do gráfico baseada na quantidade de projetos
  const chartHeight = useMemo(() => Math.max(400, chartData.length * 40), [chartData.length]);

  // Definição das colunas da tabela
  const columns: ColumnDef<ColaboradorPorProjeto>[] = useMemo(
    () => [
      {
        accessorKey: "numconv",
        header: "Projeto",
        cell: ({ row }) => {
          const projeto = row.original;
          const projetoTruncado =
            projeto.projeto.length > 35
              ? projeto.projeto.substring(0, 35) + "..."
              : projeto.projeto;
          return (
            <div className="max-w-[250px]">
              <span className="font-medium">{projeto.numconv}</span>
              <span
                className="block text-xs text-muted-foreground truncate"
                title={projeto.projeto}
              >
                {projetoTruncado}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "totalProtocolos",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold">
            {row.getValue<number>("totalProtocolos").toLocaleString("pt-BR")}
          </span>
        ),
      },
      {
        accessorKey: "emAndamento",
        header: "Andamento",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          >
            {row.getValue<number>("emAndamento")}
          </Badge>
        ),
      },
      {
        accessorKey: "finalizados",
        header: "Finalizados",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          >
            {row.getValue<number>("finalizados")}
          </Badge>
        ),
      },
      {
        accessorKey: "percentualFinalizacao",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            % Final.
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const percentual = row.getValue<number>("percentualFinalizacao");
          return (
            <div className="flex items-center gap-2 min-w-[100px]">
              <Progress value={percentual} className="h-2 w-16" />
              <span className="text-xs text-muted-foreground">{percentual}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: "tempoMedioDias",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tempo
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const dias = row.getValue<number | null>("tempoMedioDias");
          if (dias === null) {
            return "—";
          }

          const colorClass =
            dias > 60 ? "text-red-600" : dias > 30 ? "text-yellow-600" : "text-muted-foreground";

          return <span className={colorClass}>{dias}d</span>;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: data?.projetos || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  const handleBarClick = (
    clickData: {
      activePayload?: Array<{ payload: ColaboradorPorProjeto }>;
    } | null
  ) => {
    if (clickData?.activePayload?.[0]) {
      const projeto = clickData.activePayload[0].payload;
      router.push(`/protocolos?numconv=${projeto.numconv}`);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : "Erro ao carregar projetos"}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!data?.projetos || data.projetos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nenhum projeto encontrado no período.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Filtro de situação */}
        <Select value={situacaoProjeto} onValueChange={setSituacaoProjeto}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Situação do Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Em Execução">Em Execução</SelectItem>
            <SelectItem value="Concluído">Concluído</SelectItem>
          </SelectContent>
        </Select>

        {/* Toggle de visualização */}
        <div className="flex items-center space-x-2">
          <BarChart3
            className={`h-4 w-4 ${viewMode === "chart" ? "text-primary" : "text-muted-foreground"}`}
          />
          <Switch
            id="view-mode"
            checked={viewMode === "table"}
            onCheckedChange={(checked) => setViewMode(checked ? "table" : "chart")}
          />
          <TableIcon
            className={`h-4 w-4 ${viewMode === "table" ? "text-primary" : "text-muted-foreground"}`}
          />
          <Label htmlFor="view-mode" className="text-sm text-muted-foreground">
            {viewMode === "chart" ? "Gráfico" : "Tabela"}
          </Label>
        </div>
      </div>

      {/* Estatísticas resumidas */}
      {data.totais && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">{data.totais.totalProjetos}</p>
              <p className="text-xs text-muted-foreground">Projetos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold">
                {data.totais.totalProtocolos.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">Protocolos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-blue-600">
                {data.totais.totalEmAndamento.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-2xl font-bold text-green-600">
                {data.totais.totalFinalizados.toLocaleString("pt-BR")}
              </p>
              <p className="text-xs text-muted-foreground">Finalizados</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visualização */}
      {viewMode === "chart" ? (
        /* Gráfico de barras horizontais empilhadas */
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              onClick={handleBarClick}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="projetoTruncado"
                className="text-xs"
                tick={(props) => {
                  const { x, y, payload } = props;
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={4}
                      textAnchor="end"
                      fill="hsl(var(--muted-foreground))"
                      fontSize={11}
                    >
                      {payload.value}
                    </text>
                  );
                }}
                width={280}
                tickMargin={8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString("pt-BR"),
                  name === "emAndamento" ? "Em Andamento" : "Finalizados",
                ]}
                labelFormatter={(label: string) => label}
                isAnimationActive={false}
              />
              <Legend
                formatter={(value) => (value === "emAndamento" ? "Em Andamento" : "Finalizados")}
              />
              <Bar
                dataKey="emAndamento"
                name="emAndamento"
                stackId="a"
                fill={COLORS.emAndamento}
                style={{ cursor: "pointer" }}
                isAnimationActive={false}
              />
              <Bar
                dataKey="finalizados"
                name="finalizados"
                stackId="a"
                fill={COLORS.finalizados}
                radius={[0, 4, 4, 0]}
                style={{ cursor: "pointer" }}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Tabela */
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/protocolos?numconv=${row.original.numconv}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
});
