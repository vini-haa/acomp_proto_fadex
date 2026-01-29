"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAnalyticsPorAssunto, type AssuntoFilters } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
type LimitOption = "all" | 20 | 50;

const PERIODO_OPTIONS: { value: PeriodoPreset; label: string }[] = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "60d", label: "Últimos 60 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "1y", label: "Último ano" },
  { value: "all", label: "Todo o período" },
  { value: "custom", label: "Personalizado" },
];

/**
 * Lê parâmetros da URL
 */
function parseUrlParams(searchParams: URLSearchParams) {
  const periodo = searchParams.get("periodo") as PeriodoPreset | null;
  const dataInicio = searchParams.get("dataInicio") || "";
  const dataFim = searchParams.get("dataFim") || "";
  const limite = searchParams.get("limite");
  const ordenacao = searchParams.get("ordenacao") as SortField | null;
  const direcao = searchParams.get("direcao") as SortOrder | null;

  return {
    periodo: periodo || (dataInicio || dataFim ? "custom" : "all"),
    dataInicio,
    dataFim,
    limite: limite === "20" ? 20 : limite === "50" ? 50 : ("all" as LimitOption),
    ordenacao: ordenacao || "totalProtocolos",
    direcao: direcao || "desc",
  };
}

/**
 * Retorna estilos de eficiência baseado no tempo médio em dias
 */
const getEfficiencyStyle = (dias: number) => {
  if (dias <= 30) {
    return {
      bg: "bg-green-100 dark:bg-green-950",
      text: "text-green-700 dark:text-green-400",
      label: "Eficiente",
    };
  }
  if (dias <= 60) {
    return {
      bg: "bg-yellow-100 dark:bg-yellow-950",
      text: "text-yellow-700 dark:text-yellow-400",
      label: "Atenção",
    };
  }
  return {
    bg: "bg-red-100 dark:bg-red-950",
    text: "text-red-700 dark:text-red-400",
    label: "Crítico",
  };
};

export function AssuntoTable({ onRowClick }: AssuntoTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Ler estado inicial da URL
  const initialParams = parseUrlParams(searchParams);

  const [limit, setLimit] = useState<LimitOption>(initialParams.limite);
  const [sortField, setSortField] = useState<SortField>(initialParams.ordenacao);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialParams.direcao);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<PeriodoPreset>(
    initialParams.periodo
  );
  const [dataInicio, setDataInicio] = useState<string>(initialParams.dataInicio);
  const [dataFim, setDataFim] = useState<string>(initialParams.dataFim);
  const [isCustomPopoverOpen, setIsCustomPopoverOpen] = useState(false);

  /**
   * Atualiza URL com os filtros atuais
   */
  const updateUrl = useCallback(
    (updates: {
      periodo?: PeriodoPreset;
      dataInicio?: string;
      dataFim?: string;
      limite?: LimitOption;
      ordenacao?: SortField;
      direcao?: SortOrder;
    }) => {
      const params = new URLSearchParams();

      const newPeriodo = updates.periodo ?? periodoSelecionado;
      const newDataInicio = updates.dataInicio ?? dataInicio;
      const newDataFim = updates.dataFim ?? dataFim;
      const newLimite = updates.limite ?? limit;
      const newOrdenacao = updates.ordenacao ?? sortField;
      const newDirecao = updates.direcao ?? sortOrder;

      // Período
      if (newPeriodo === "custom") {
        if (newDataInicio) {
          params.set("dataInicio", newDataInicio);
        }
        if (newDataFim) {
          params.set("dataFim", newDataFim);
        }
      } else if (newPeriodo !== "all") {
        params.set("periodo", newPeriodo);
      }

      // Limite (apenas se não for "all")
      if (newLimite !== "all") {
        params.set("limite", newLimite.toString());
      }

      // Ordenação (apenas se diferente do padrão)
      if (newOrdenacao !== "totalProtocolos") {
        params.set("ordenacao", newOrdenacao);
      }
      if (newDirecao !== "desc") {
        params.set("direcao", newDirecao);
      }

      const queryString = params.toString();
      router.replace(`${pathname}${queryString ? "?" + queryString : ""}`, { scroll: false });
    },
    [router, pathname, periodoSelecionado, dataInicio, dataFim, limit, sortField, sortOrder]
  );

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

  // Handlers com atualização de URL
  const handlePeriodoChange = (value: PeriodoPreset) => {
    if (value === "custom") {
      setIsCustomPopoverOpen(true);
    } else {
      setPeriodoSelecionado(value);
      setDataInicio("");
      setDataFim("");
      updateUrl({ periodo: value, dataInicio: "", dataFim: "" });
    }
  };

  const handleCustomDateApply = () => {
    if (dataInicio || dataFim) {
      setPeriodoSelecionado("custom");
      updateUrl({ periodo: "custom", dataInicio, dataFim });
    }
    setIsCustomPopoverOpen(false);
  };

  const handleCustomDateClear = () => {
    setDataInicio("");
    setDataFim("");
    setPeriodoSelecionado("all");
    setIsCustomPopoverOpen(false);
    updateUrl({ periodo: "all", dataInicio: "", dataFim: "" });
  };

  const handleLimitChange = (newLimit: LimitOption) => {
    setLimit(newLimit);
    updateUrl({ limite: newLimit });
  };

  const handleSort = (field: SortField) => {
    const newOrder = sortField === field ? (sortOrder === "asc" ? "desc" : "asc") : "desc";
    const newField = field;
    setSortField(newField);
    setSortOrder(newOrder);
    updateUrl({ ordenacao: newField, direcao: newOrder });
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

  // Média geral de dias (precisa estar antes dos early returns para manter ordem dos hooks)
  const mediaGeral = useMemo(() => {
    if (!data || data.length === 0) {
      return 0;
    }
    const assuntosComMedia = data.filter(
      (item) => item.mediaDiasFinalizado && item.mediaDiasFinalizado > 0
    );
    if (assuntosComMedia.length === 0) {
      return 0;
    }
    const soma = assuntosComMedia.reduce((sum, item) => sum + (item.mediaDiasFinalizado || 0), 0);
    return soma / assuntosComMedia.length;
  }, [data]);

  // Função para obter estilo e ícone do comparativo
  const getComparativoInfo = (dias: number) => {
    if (!dias || dias === 0 || mediaGeral === 0) {
      return { icon: Minus, color: "text-muted-foreground", label: "N/A" };
    }
    const diff = dias - mediaGeral;
    const percentDiff = (diff / mediaGeral) * 100;

    if (Math.abs(percentDiff) < 5) {
      return { icon: Minus, color: "text-muted-foreground", label: "Na média" };
    }
    if (diff > 0) {
      return {
        icon: TrendingUp,
        color: "text-red-500 dark:text-red-400",
        label: `+${percentDiff.toFixed(0)}%`,
      };
    }
    return {
      icon: TrendingDown,
      color: "text-green-500 dark:text-green-400",
      label: `${percentDiff.toFixed(0)}%`,
    };
  };

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

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort(field)}>
      {children}
      <ArrowUpDown className={cn("ml-1 h-3 w-3", sortField === field && "text-primary")} />
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
                onClick={() => handleLimitChange("all")}
              >
                Todos
              </Button>
              <Button
                variant={limit === 20 ? "default" : "outline"}
                size="sm"
                onClick={() => handleLimitChange(20)}
              >
                Top 20
              </Button>
              <Button
                variant={limit === 50 ? "default" : "outline"}
                size="sm"
                onClick={() => handleLimitChange(50)}
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
                <TableHead className="text-right w-[140px]">
                  <SortButton field="mediaDiasFinalizado">Média Dias</SortButton>
                </TableHead>
                <TableHead className="text-center w-[100px]">vs Média</TableHead>
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
                    {(() => {
                      const dias = item.mediaDiasFinalizado || 0;
                      const style = getEfficiencyStyle(dias);
                      return (
                        <div
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-md font-mono text-sm",
                            style.bg,
                            style.text
                          )}
                          title={style.label}
                        >
                          <span>{dias.toFixed(1)} dias</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const dias = item.mediaDiasFinalizado || 0;
                      const info = getComparativoInfo(dias);
                      const Icon = info.icon;
                      return (
                        <div className={cn("inline-flex items-center gap-1 text-sm", info.color)}>
                          <Icon className="h-4 w-4" />
                          <span className="font-mono text-xs">{info.label}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Legenda de eficiência */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-muted-foreground font-medium">Tempo médio:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700" />
              <span className="text-muted-foreground">≤30 dias (Eficiente)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-950 border border-yellow-300 dark:border-yellow-700" />
              <span className="text-muted-foreground">31-60 dias (Atenção)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700" />
              <span className="text-muted-foreground">&gt;60 dias (Crítico)</span>
            </div>
          </div>
          {mediaGeral > 0 && (
            <div className="text-xs text-muted-foreground">
              Média geral:{" "}
              <span className="font-mono font-medium">{mediaGeral.toFixed(1)} dias</span>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Mostrando {displayData.length} de {data.length} assuntos
        </p>
      </CardContent>
    </Card>
  );
}
