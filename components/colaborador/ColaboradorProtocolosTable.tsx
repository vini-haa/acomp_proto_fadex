"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import { useColaboradorProtocolos } from "@/hooks/useColaborador";
import type { ColaboradorProtocolo, ColaboradorProtocolosFiltros } from "@/types/colaborador";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ExternalLink,
  AlertTriangle,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";

interface ColaboradorProtocolosTableProps {
  colaboradorId: number;
  filtrosHeatmap?: {
    diaSemana?: number;
    hora?: number;
    dataInicio?: string;
    dataFim?: string;
  };
}

export function ColaboradorProtocolosTable({
  colaboradorId,
  filtrosHeatmap,
}: ColaboradorProtocolosTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [sorting, setSorting] = useState<SortingState>([{ id: "dataMovimentacao", desc: true }]);

  // Filtros locais
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assuntoFilter, setAssuntoFilter] = useState<string>("");
  const [projetoFilter, setProjetoFilter] = useState<string>("");

  // Debounce para filtros de texto
  const [debouncedAssunto, setDebouncedAssunto] = useState(assuntoFilter);
  const [debouncedProjeto, setDebouncedProjeto] = useState(projetoFilter);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAssunto(assuntoFilter);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [assuntoFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProjeto(projetoFilter);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [projetoFilter]);

  // Reset página quando filtros mudam
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const sortBy = sorting[0]?.id as ColaboradorProtocolosFiltros["orderBy"];
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const filtros: ColaboradorProtocolosFiltros = {
    page,
    limit: pageSize,
    periodo: 90, // 3 meses por padrão
    orderBy: sortBy,
    orderDir: sortOrder,
    status: statusFilter || undefined,
    assunto: debouncedAssunto || undefined,
    projeto: debouncedProjeto || undefined,
    ...filtrosHeatmap,
  };

  const { data, isLoading, error } = useColaboradorProtocolos(colaboradorId, filtros);

  // Definição das colunas
  const columns: ColumnDef<ColaboradorProtocolo>[] = useMemo(
    () => [
      {
        accessorKey: "numeroDocumento",
        header: "Protocolo",
        cell: ({ row }) => {
          const protocolo = row.original;
          return (
            <Link
              href={`/protocolos/${protocolo.codprot}`}
              className="font-medium text-primary hover:underline flex items-center gap-1"
            >
              {protocolo.numeroDocumento || `#${protocolo.codprot}`}
              <ExternalLink className="h-3 w-3" />
            </Link>
          );
        },
      },
      {
        accessorKey: "assunto",
        header: "Assunto",
        cell: ({ row }) => {
          const assunto = row.getValue("assunto") as string | null;
          return (
            <div className="max-w-[200px]">
              <span className="truncate block text-sm" title={assunto || undefined}>
                {assunto || "—"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "projeto",
        header: "Projeto",
        cell: ({ row }) => {
          const protocolo = row.original;
          const projetoText = protocolo.numconv
            ? `${protocolo.numconv} - ${protocolo.projeto || "Sem título"}`
            : "—";
          return (
            <div className="max-w-[180px]">
              <span className="truncate block text-xs" title={projetoText}>
                {projetoText}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "statusProtocolo",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("statusProtocolo") as string;
          const variant =
            status === "Finalizado"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : status === "Arquivado"
                ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
          return (
            <Badge variant="outline" className={variant}>
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: "dataMovimentacao",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Data
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const data = row.original.dataFormatada;
          return <span className="text-sm">{data || "—"}</span>;
        },
      },
      {
        accessorKey: "acao",
        header: "Ação",
        cell: ({ row }) => {
          const acao = row.getValue("acao") as string;
          const variant =
            acao === "Enviou"
              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
              : "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300";
          return (
            <Badge variant="outline" className={variant}>
              {acao}
            </Badge>
          );
        },
      },
      {
        accessorKey: "diasNoSetor",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Dias
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const dias = row.getValue("diasNoSetor") as number | null;
          if (dias === null) {
            return "—";
          }

          const colorClass =
            dias > 30
              ? "text-red-600 font-semibold"
              : dias > 15
                ? "text-yellow-600"
                : "text-muted-foreground";

          return <span className={colorClass}>{dias}</span>;
        },
      },
    ],
    []
  );

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

  const handleRowClick = (codprot: number) => {
    router.push(`/protocolos/${codprot}`);
  };

  const clearFilters = () => {
    setStatusFilter("");
    setAssuntoFilter("");
    setProjetoFilter("");
    setPage(1);
  };

  const hasActiveFilters = statusFilter || assuntoFilter || projetoFilter;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : "Erro ao carregar protocolos"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        {/* Status */}
        <Select
          value={statusFilter || "all"}
          onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Em Andamento">Em Andamento</SelectItem>
            <SelectItem value="Finalizado">Finalizado</SelectItem>
            <SelectItem value="Arquivado">Arquivado</SelectItem>
          </SelectContent>
        </Select>

        {/* Assunto */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar assunto..."
            value={assuntoFilter}
            onChange={(e) => setAssuntoFilter(e.target.value)}
            className="pl-8 w-[180px]"
          />
        </div>

        {/* Projeto */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar projeto..."
            value={projetoFilter}
            onChange={(e) => setProjetoFilter(e.target.value)}
            className="pl-8 w-[180px]"
          />
        </div>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

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
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              // Dados
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(row.original.codprot)}
                >
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
          <div className="text-sm text-muted-foreground">
            Mostrando {data.data.length > 0 ? (page - 1) * pageSize + 1 : 0} a{" "}
            {Math.min(page * pageSize, data.pagination.total)} de{" "}
            {data.pagination.total.toLocaleString("pt-BR")} protocolos
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
              Página {page} de {data.pagination.totalPages || 1}
            </div>

            {/* Próxima página */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages || data.pagination.totalPages === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Última página */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(data.pagination.totalPages)}
              disabled={page === data.pagination.totalPages || data.pagination.totalPages === 0}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
