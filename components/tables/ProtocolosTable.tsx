"use client";

import { flexRender, getCoreRowModel, useReactTable, SortingState } from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { useCachedProtocolos } from "@/hooks/useCachedProtocolos";
import { columns } from "./columns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProtocolosTableProps {
  filters?: {
    status?: string;
    numeroDocumento?: string;
    numconv?: string;
    dataInicio?: string;
    dataFim?: string;
    faixaTempo?: string;
    contaCorrente?: string;
    setorAtual?: string;
    assunto?: string;
    diaSemana?: number;
    hora?: number;
  };
}

export function ProtocolosTable({ filters }: ProtocolosTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 20; // Tamanho fixo de página
  const [sorting, setSorting] = useState<SortingState>([{ id: "dtEntrada", desc: true }]);

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Reset para página 1 quando os filtros mudam
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Usa o cache para resposta instantânea
  const { data, isLoading, error, refetch } = useCachedProtocolos({
    page,
    pageSize,
    sortBy,
    sortOrder,
    ...filters,
  });

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data?.pagination.totalPages || 0,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar protocolos. Tente novamente mais tarde.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabela */}
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
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              // Dados
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // Vazio
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum protocolo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {data && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {(page - 1) * pageSize + 1} a{" "}
              {Math.min(page * pageSize, data.pagination.total)} de{" "}
              {data.pagination.total.toLocaleString("pt-BR")} protocolos
            </div>
            {/* Indicador de cache */}
            {data.cacheInfo && (
              <div className="flex items-center gap-2">
                <Badge
                  variant={data.cacheInfo.isStale ? "secondary" : "outline"}
                  className="text-xs"
                >
                  Cache:{" "}
                  {data.cacheInfo.lastUpdated
                    ? format(new Date(data.cacheInfo.lastUpdated), "HH:mm", { locale: ptBR })
                    : "carregando..."}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => refetch()}
                  title="Atualizar dados"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Primeira página */}
            <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={page === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Página anterior */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Indicador de página */}
            <div className="text-sm">
              Página {page} de {data.pagination.totalPages}
            </div>

            {/* Próxima página */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Última página */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(data.pagination.totalPages)}
              disabled={page === data.pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
