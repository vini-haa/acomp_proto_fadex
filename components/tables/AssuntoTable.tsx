"use client";

import { useState } from "react";
import { useAnalyticsPorAssunto } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowUpDown } from "lucide-react";
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

export function AssuntoTable({ onRowClick }: AssuntoTableProps) {
  const [limit, setLimit] = useState<number | "all">("all");
  const [sortField, setSortField] = useState<SortField>("totalProtocolos");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const { data, isLoading, error } = useAnalyticsPorAssunto(9999); // Busca todos os assuntos

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
          <p className="text-center text-muted-foreground py-8">Nenhum dado disponível.</p>
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
        <div className="flex items-center justify-between">
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
