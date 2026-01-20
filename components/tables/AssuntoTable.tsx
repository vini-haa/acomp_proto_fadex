"use client";

import { useState, useMemo } from "react";
import { useAnalyticsPorAssunto, type AssuntoFilters } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowUpDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AssuntoTableProps {
  onRowClick?: (assunto: string) => void;
}

type SortField =
  | "assunto"
  | "totalProtocolos"
  | "emAndamento"
  | "finalizados"
  | "mediaDiasFinalizado";
type SortOrder = "asc" | "desc";

type PeriodoPreset = "30d" | "60d" | "90d" | "6m" | "1y" | "all" | "custom";

const PERIODO_OPTIONS: { value: PeriodoPreset; label: string }[] = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "60d", label: "Últimos 60 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "1y", label: "Último ano" },
  { value: "all", label: "Todo o período" },
  { value: "custom", label: "Personalizado" },
];

export function AssuntoTable({ onRowClick }: AssuntoTableProps) {
  const [limit, setLimit] = useState<number | "all">("all");
  const [sortField, setSortField] = useState<SortField>("totalProtocolos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoPreset>("all");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [isCustomPopoverOpen, setIsCustomPopoverOpen] = useState(false);

  // Construir filtros baseados na seleção
  const filters: AssuntoFilters = useMemo(() => {
    if (periodoSelecionado === "custom") {
      return {
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      };
    }
    if (periodoSelecionado === "all") {
      return {};
    }
    return { periodo: periodoSelecionado };
  }, [periodoSelecionado, dataInicio, dataFim]);

  const { data, isLoading, error } = useAnalyticsPorAssunto(filters);

  const handlePeriodoChange = (value: PeriodoPreset) => {
    if (value === "custom") {
      setIsCustomPopoverOpen(true);
    } else {
      setPeriodoSelecionado(value);
      setDataInicio("");
      setDataFim("");
    }
  };

  const handleCustomDateApply = () => {
    if (dataInicio || dataFim) {
      setPeriodoSelecionado("custom");
    }
    setIsCustomPopoverOpen(false);
  };

  const handleCustomDateClear = () => {
    setDataInicio("");
    setDataFim("");
    setPeriodoSelecionado("all");
    setIsCustomPopoverOpen(false);
  };

  // Descrição do período selecionado
  const periodoLabel = useMemo(() => {
    if (periodoSelecionado === "custom" && (dataInicio || dataFim)) {
      const inicio = dataInicio
        ? new Date(dataInicio + "T00:00:00").toLocaleDateString("pt-BR")
        : "...";
      const fim = dataFim ? new Date(dataFim + "T00:00:00").toLocaleDateString("pt-BR") : "...";
      return `${inicio} a ${fim}`;
    }
    return PERIODO_OPTIONS.find((o) => o.value === periodoSelecionado)?.label || "Todo o período";
  }, [periodoSelecionado, dataInicio, dataFim]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protocolos por Assunto</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar análise por assunto.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protocolos por Assunto</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protocolos por Assunto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum dado disponível para o período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Ordenação local
  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField] ?? 0;
    const bVal = b[sortField] ?? 0;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortOrder === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const displayData = limit === "all" ? sortedData : sortedData.slice(0, limit);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort(field)}>
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  // Totais
  const totals = {
    total: data.reduce((sum, item) => sum + (item.totalProtocolos || 0), 0),
    emAndamento: data.reduce((sum, item) => sum + (item.emAndamento || 0), 0),
    finalizados: data.reduce((sum, item) => sum + (item.finalizados || 0), 0),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          {/* Título e botões de limite */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Protocolos por Assunto</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={limit === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setLimit("all")}
              >
                Todos
              </Button>
              <Button
                variant={limit === 20 ? "default" : "outline"}
                size="sm"
                onClick={() => setLimit(20)}
              >
                Top 20
              </Button>
              <Button
                variant={limit === 50 ? "default" : "outline"}
                size="sm"
                onClick={() => setLimit(50)}
              >
                Top 50
              </Button>
            </div>
          </div>

          {/* Filtro de período */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Período:</span>
            </div>

            <Select
              value={periodoSelecionado === "custom" ? "custom" : periodoSelecionado}
              onValueChange={(v) => handlePeriodoChange(v as PeriodoPreset)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {PERIODO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Popover para período personalizado */}
            <Popover open={isCustomPopoverOpen} onOpenChange={setIsCustomPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={periodoSelecionado === "custom" ? "border-primary" : ""}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {periodoSelecionado === "custom" ? periodoLabel : "Personalizar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">Período Personalizado</h4>
                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="dataInicio">Data Início</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="dataFim">Data Fim</Label>
                      <Input
                        id="dataFim"
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={handleCustomDateClear}>
                      Limpar
                    </Button>
                    <Button size="sm" onClick={handleCustomDateApply}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Indicador do período ativo */}
            {periodoSelecionado !== "all" && (
              <Badge variant="secondary" className="text-xs">
                {periodoLabel}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950">
            <p className="text-sm text-muted-foreground">Total de Protocolos</p>
            <p className="text-3xl font-bold text-blue-600">
              {totals.total.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950">
            <p className="text-sm text-muted-foreground">Em Andamento</p>
            <p className="text-3xl font-bold text-amber-600">
              {totals.emAndamento.toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950">
            <p className="text-sm text-muted-foreground">Finalizados</p>
            <p className="text-3xl font-bold text-green-600">
              {totals.finalizados.toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>
                  <SortButton field="assunto">Assunto</SortButton>
                </TableHead>
                <TableHead className="text-right w-[100px]">
                  <SortButton field="totalProtocolos">Total</SortButton>
                </TableHead>
                <TableHead className="text-right w-[120px]">
                  <SortButton field="emAndamento">Em Andamento</SortButton>
                </TableHead>
                <TableHead className="text-right w-[100px]">
                  <SortButton field="finalizados">Finalizados</SortButton>
                </TableHead>
                <TableHead className="text-right w-[120px]">
                  <SortButton field="mediaDiasFinalizado">Média Dias</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((item, index) => (
                <TableRow
                  key={item.assunto ?? `sem-assunto-${index}`}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(item.assunto ?? "(Sem Assunto)")}
                >
                  <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium">
                    <span title={item.assunto ?? "(Sem Assunto)"}>
                      {(item.assunto ?? "(Sem Assunto)").length > 60
                        ? (item.assunto ?? "(Sem Assunto)").substring(0, 60) + "..."
                        : (item.assunto ?? "(Sem Assunto)")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="font-mono">
                      {(item.totalProtocolos || 0).toLocaleString("pt-BR")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono text-amber-600 border-amber-300">
                      {(item.emAndamento || 0).toLocaleString("pt-BR")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono text-green-600 border-green-300">
                      {(item.finalizados || 0).toLocaleString("pt-BR")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-sm">
                      {(item.mediaDiasFinalizado || 0).toFixed(1)} dias
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Mostrando {displayData.length} de {data.length} assuntos
        </p>
      </CardContent>
    </Card>
  );
}
