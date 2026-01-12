# Codigos Importantes - Protocolos Dashboard FADEX

Este documento apresenta os 5 componentes/paginas mais importantes da aplicacao, com codigo completo e comentarios explicativos.

---

## 1. Dashboard Principal (page.tsx)

**Arquivo:** `app/(dashboard)/page.tsx`

**Funcao:** Pagina principal com KPIs, filtros de setor/periodo e graficos.

```tsx
"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/dashboard/Header";
import { KPICards } from "@/components/dashboard/KPICards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Carregamento lazy dos graficos para melhor performance
const FluxoTemporalChart = dynamic(
  () =>
    import("@/components/charts/FluxoTemporalChart").then((mod) => ({
      default: mod.FluxoTemporalChart,
    })),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false, // Nao renderizar no servidor
  }
);

const ComparativoChart = dynamic(
  () =>
    import("@/components/charts/ComparativoChart").then((mod) => ({
      default: mod.ComparativoChart,
    })),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false,
  }
);

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileDown, Loader2, Calendar, Building2 } from "lucide-react";
import { exportProtocolosToPDF, exportProtocolosToExcel } from "@/lib/export";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSetores } from "@/hooks/useSetores";
import { logger } from "@/lib/logger";
import { TODOS_SETORES, SETORES } from "@/lib/constants/setores";

// Setor financeiro como padrao
const SETOR_FINANCEIRO = SETORES.FINANCEIRO;

export default function DashboardPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [periodo, setPeriodo] = useState<"mes_atual" | "30d" | "90d" | "6m" | "1y" | "ytd" | "all">(
    "all"
  );
  const [codigoSetor, setCodigoSetor] = useState<number>(SETOR_FINANCEIRO);
  const { toast } = useToast();
  const { data: setores, isLoading: isLoadingSetores } = useSetores();

  // Funcao para formatar nome do setor (remove prefixo "- ")
  const formatarNomeSetor = (descr: string) => descr.replace(/^- /, "");

  // Encontra o nome do setor selecionado para exibir no subtitulo
  const setorSelecionado = setores?.find((s) => s.codigo === codigoSetor);
  const nomeSetor =
    codigoSetor === TODOS_SETORES
      ? "Visao Geral da Fundacao"
      : setorSelecionado
        ? formatarNomeSetor(setorSelecionado.descr)
        : "Financeiro";

  const handleExportFullReport = async (format: "excel" | "pdf") => {
    setIsExporting(true);

    try {
      toast({
        title: "Carregando dados...",
        description: "Preparando relatorio para exportacao.",
      });

      // Carregar dados sob demanda apenas quando exportar
      const protocolosRes = await fetch("/api/protocolos/cached?page=1&pageSize=5000");

      if (!protocolosRes.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const protocolosData = await protocolosRes.json();

      if (format === "excel") {
        await exportProtocolosToExcel(protocolosData.data);
      } else {
        exportProtocolosToPDF(protocolosData.data);
      }

      toast({
        title: "Relatorio exportado",
        description: `Protocolos exportados em ${format.toUpperCase()}.`,
      });
    } catch (error) {
      logger.error("Erro ao exportar relatorio:", error);
      toast({
        title: "Erro na exportacao",
        description: "Nao foi possivel exportar o relatorio.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Header title="Dashboard" subtitle={`Visao geral dos protocolos - ${nomeSetor}`} />
      <div className="p-6">
        {/* Filtros e Acoes */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtro de Setor */}
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="setor" className="text-sm font-medium">
                  Setor
                </Label>
                <Select
                  value={codigoSetor.toString()}
                  onValueChange={(value) => setCodigoSetor(parseInt(value, 10))}
                  disabled={isLoadingSetores}
                >
                  <SelectTrigger id="setor" className="w-[320px]">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS_SETORES.toString()}>
                      Todos os Setores (Visao Geral)
                    </SelectItem>
                    {setores?.map((setor) => (
                      <SelectItem key={setor.codigo} value={setor.codigo.toString()}>
                        {formatarNomeSetor(setor.descr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro de Periodo */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="periodo" className="text-sm font-medium">
                  Periodo de Analise
                </Label>
                <Select
                  value={periodo}
                  onValueChange={(value: string) => setPeriodo(value as typeof periodo)}
                >
                  <SelectTrigger id="periodo" className="w-[200px]">
                    <SelectValue placeholder="Selecione o periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Periodos</SelectItem>
                    <SelectItem value="mes_atual">Mes Atual</SelectItem>
                    <SelectItem value="30d">Ultimos 30 Dias</SelectItem>
                    <SelectItem value="90d">Ultimos 90 Dias</SelectItem>
                    <SelectItem value="6m">Ultimos 6 Meses</SelectItem>
                    <SelectItem value="ytd">Ano Atual</SelectItem>
                    <SelectItem value="1y">Ultimo Ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Botoes de Exportacao */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportFullReport("excel")}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportFullReport("pdf")}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* KPIs Principais */}
          <KPICards periodo={periodo} codigoSetor={codigoSetor} />

          {/* Grafico de Fluxo Temporal */}
          <FluxoTemporalChart setor={codigoSetor} />

          {/* Grafico Comparativo */}
          <ComparativoChart setor={codigoSetor} />
        </div>
      </div>
    </>
  );
}
```

**Pontos Importantes:**

- Usa `dynamic()` para lazy loading dos graficos (melhora performance)
- Estado local para filtros de periodo e setor
- Exportacao sob demanda (so carrega dados ao clicar)
- Componentes `KPICards`, `FluxoTemporalChart`, `ComparativoChart` recebem filtros como props

---

## 2. Pagina de Listagem de Protocolos (protocolos/page.tsx)

**Arquivo:** `app/(dashboard)/protocolos/page.tsx`

**Funcao:** Listagem com filtros avancados, paginacao e exportacao.

```tsx
"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { ProtocolosTable } from "@/components/tables/ProtocolosTable";
import { ProtocoloFilters } from "@/components/filters/ProtocoloFilters";
import { ExportButton } from "@/components/export/ExportButton";
import {
  exportProtocolosToCSV,
  exportProtocolosToExcel,
  exportProtocolosToPDF,
} from "@/lib/export";
import { Protocolo } from "@/types";
import { useCachedProtocolos } from "@/hooks/useCachedProtocolos";
import { Skeleton } from "@/components/ui/skeleton";
import { logger } from "@/lib/logger";

function ProtocolosContent() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<{
    status?: string;
    numeroDocumento?: string;
    numconv?: string;
    faixaTempo?: string;
    contaCorrente?: string;
    setorAtual?: string;
    assunto?: string;
    diaSemana?: number;
    hora?: number;
    excluirLotePagamento?: boolean;
  }>({ excluirLotePagamento: true });

  // Le filtros da URL ao carregar a pagina
  useEffect(() => {
    const newFilters: typeof filters = {};

    const numconvFromUrl = searchParams.get("numconv");
    if (numconvFromUrl) {
      newFilters.numconv = numconvFromUrl;
    }

    const diaSemanaFromUrl = searchParams.get("diaSemana");
    if (diaSemanaFromUrl) {
      newFilters.diaSemana = parseInt(diaSemanaFromUrl);
    }

    const horaFromUrl = searchParams.get("hora");
    if (horaFromUrl) {
      newFilters.hora = parseInt(horaFromUrl);
    }

    if (Object.keys(newFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }
  }, [searchParams]);

  // Busca apenas para obter as opcoes de filtro
  const { data: cacheData } = useCachedProtocolos({ page: 1, pageSize: 1 });
  const [isExporting, setIsExporting] = useState(false);

  // Funcao para buscar dados para exportacao apenas quando necessario
  const fetchExportData = useCallback(async (): Promise<Protocolo[]> => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", "50000");
    if (filters.status) params.set("status", filters.status);
    if (filters.numeroDocumento) params.set("numeroDocumento", filters.numeroDocumento);
    if (filters.numconv) params.set("numconv", filters.numconv);
    if (filters.faixaTempo) params.set("faixaTempo", filters.faixaTempo);
    if (filters.contaCorrente) params.set("contaCorrente", filters.contaCorrente);
    if (filters.setorAtual) params.set("setorAtual", filters.setorAtual);
    if (filters.assunto) params.set("assunto", filters.assunto);
    if (filters.diaSemana !== undefined) params.set("diaSemana", filters.diaSemana.toString());
    if (filters.hora !== undefined) params.set("hora", filters.hora.toString());

    const response = await fetch(`/api/protocolos/cached?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Erro ao buscar dados para exportacao");
    }
    const json = await response.json();
    return json.data || [];
  }, [filters]);

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    setIsExporting(true);
    try {
      const data = await fetchExportData();
      if (data.length === 0) return;

      if (format === "csv") {
        exportProtocolosToCSV(data);
      } else if (format === "excel") {
        await exportProtocolosToExcel(data);
      } else if (format === "pdf") {
        exportProtocolosToPDF(data);
      }
    } catch (error) {
      logger.error("Erro ao exportar:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Header title="Protocolos" subtitle="Listagem completa de protocolos" />
      <div className="p-6">
        <div className="space-y-4">
          {/* Filtros e Exportacao */}
          <div className="flex items-center justify-between gap-4">
            <ProtocoloFilters
              onFilterChange={setFilters}
              filterOptions={cacheData?.filterOptions}
              initialFilters={{
                numconv: searchParams.get("numconv") || undefined,
                diaSemana: searchParams.get("diaSemana")
                  ? parseInt(searchParams.get("diaSemana")!)
                  : undefined,
                hora: searchParams.get("hora") ? parseInt(searchParams.get("hora")!) : undefined,
              }}
            />
            <ExportButton
              data={[]}
              filename="protocolos"
              type="protocolos"
              onExport={handleExport}
              isLoading={isExporting}
            />
          </div>

          {/* Tabela */}
          <ProtocolosTable filters={filters} />
        </div>
      </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <>
      <Header title="Protocolos" subtitle="Carregando..." />
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </>
  );
}

export default function ProtocolosPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProtocolosContent />
    </Suspense>
  );
}
```

**Pontos Importantes:**

- Usa `Suspense` para loading state
- Le filtros da URL (permite compartilhar links filtrados)
- Exportacao sob demanda com filtros aplicados
- Componente `ProtocoloFilters` gerencia estado dos filtros
- Componente `ProtocolosTable` recebe filtros e faz a busca

---

## 3. Hook useKPIs (hooks/useKPIs.ts)

**Arquivo:** `hooks/useKPIs.ts`

**Funcao:** Hook customizado para buscar KPIs com cache inteligente.

````tsx
import { useQuery } from "@tanstack/react-query";
import { KPIs } from "@/types";
import { CACHE_REAL_TIME, DEFAULT_QUERY_OPTIONS } from "@/lib/constants/cache";

// Codigo do setor financeiro (padrao)
const SETOR_FINANCEIRO = 48;

type Periodo = "mes_atual" | "7d" | "30d" | "90d" | "6m" | "1y" | "ytd" | "all";

interface UseKPIsOptions {
  periodo?: Periodo;
  codigoSetor?: number;
  enableAutoRefresh?: boolean;
}

/**
 * Hook para buscar KPIs principais do dashboard - VERSAO REFATORADA
 *
 * Cache: REAL_TIME (5min stale, 10min gc)
 *
 * @param options - Opcoes de configuracao
 * @param options.periodo - Periodo de analise: 'mes_atual', '7d', '30d', '90d', '6m', '1y', 'ytd', 'all' (padrao)
 * @param options.codigoSetor - Codigo do setor (padrao: 48 - Financeiro)
 * @param options.enableAutoRefresh - Se true, atualiza automaticamente a cada 5 minutos
 *
 * @example
 * ```tsx
 * // Buscar KPIs de todos os periodos do setor financeiro
 * const { data: kpis } = useKPIs({ periodo: 'all' });
 *
 * // Buscar KPIs de outro setor
 * const { data: kpis } = useKPIs({ periodo: 'mes_atual', codigoSetor: 50 });
 *
 * // Com auto-refresh
 * const { data: kpis } = useKPIs({ periodo: 'all', enableAutoRefresh: true });
 * ```
 */
export function useKPIs(options: UseKPIsOptions = {}) {
  const { periodo = "all", codigoSetor = SETOR_FINANCEIRO, enableAutoRefresh = false } = options;

  return useQuery<KPIs>({
    queryKey: ["kpis", periodo, codigoSetor],
    queryFn: async () => {
      const params = new URLSearchParams({
        periodo,
        setor: codigoSetor.toString(),
      });
      const response = await fetch(`/api/kpis?${params}`);

      if (!response.ok) {
        throw new Error("Erro ao carregar KPIs");
      }

      const json = await response.json();
      return json.data;
    },
    staleTime: CACHE_REAL_TIME.staleTime,
    gcTime: CACHE_REAL_TIME.gcTime,
    refetchInterval: enableAutoRefresh ? CACHE_REAL_TIME.refetchInterval : false,
    ...DEFAULT_QUERY_OPTIONS,
  });
}
````

**Pontos Importantes:**

- Usa React Query (TanStack Query) para gerenciamento de cache
- `queryKey` inclui periodo e setor para cache granular
- Configuracoes de cache centralizadas em `CACHE_REAL_TIME`
- Suporte a auto-refresh opcional
- TypeScript com tipagem completa

---

## 4. API Route de KPIs (api/kpis/route.ts)

**Arquivo:** `app/api/kpis/route.ts`

**Funcao:** Endpoint que retorna KPIs do dashboard.

```tsx
import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { buildKPIsQueryOptimized, buildKPIsMacroQuery } from "@/lib/queries/kpis-optimized";
import { KPIs } from "@/types";
import { withErrorHandling, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { TODOS_SETORES } from "@/lib/constants/setores";
import { KPIsFiltersSchema } from "@/lib/validation/protocolo";

/**
 * GET /api/kpis?periodo=mes_atual|30d|90d|6m|1y|ytd|all&setor=48
 * Retorna os KPIs principais do dashboard com filtro de periodo e setor
 *
 * OTIMIZADO: Usa query simplificada para melhor performance
 *
 * Query params:
 * - periodo: 'mes_atual' (padrao), '30d', '90d', '6m', '1y', 'ytd', 'all'
 * - setor: codigo do setor (padrao: 48 - Financeiro)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const startTime = Date.now();

  // Obter e validar parametros da URL com Zod
  const searchParams = request.nextUrl.searchParams;
  const rawParams = {
    periodo: searchParams.get("periodo") || undefined,
    setor: searchParams.get("setor") || undefined,
  };

  const parseResult = KPIsFiltersSchema.safeParse(rawParams);

  if (!parseResult.success) {
    throw new ValidationError("Parametros invalidos", parseResult.error.issues);
  }

  const { periodo: periodoFinal, setor: codigoSetor } = parseResult.data;

  // Executar query - usa query MACRO se setor = 0 (todos os setores)
  let query: string;
  if (codigoSetor === TODOS_SETORES) {
    query = buildKPIsMacroQuery();
  } else {
    query = buildKPIsQueryOptimized(periodoFinal, codigoSetor);
  }
  const result = await executeQuery<KPIs>(query);

  const queryTime = Date.now() - startTime;
  const setorLabel = codigoSetor === TODOS_SETORES ? "TODOS" : codigoSetor;
  logger.perf(`⚡ KPIs (periodo: ${periodoFinal}, setor: ${setorLabel}): ${queryTime}ms`);

  // Se nao houver resultados, retorna KPIs zerados
  const kpis: KPIs = result[0] || {
    totalEmAndamento: 0,
    novosMesAtual: 0,
    mediaDiasFinanceiro: 0,
    minDiasFinanceiro: null,
    maxDiasFinanceiro: null,
    emDiaMenos15Dias: 0,
    urgentes15a30Dias: 0,
    criticosMais30Dias: 0,
  };

  return NextResponse.json({
    data: kpis,
    success: true,
    periodo: periodoFinal,
    setor: codigoSetor,
  });
});

// Configuracao de revalidacao (ISR)
export const revalidate = 300; // 5 minutos
```

**Pontos Importantes:**

- Usa `withErrorHandling` para tratamento centralizado de erros
- Validacao de entrada com Zod (`KPIsFiltersSchema`)
- Query diferente para visao macro (todos os setores)
- Logging de performance com tempo de execucao
- ISR (Incremental Static Regeneration) de 5 minutos

---

## 5. Tabela de Protocolos (components/tables/ProtocolosTable.tsx)

**Arquivo:** `components/tables/ProtocolosTable.tsx`

**Funcao:** Componente de tabela com paginacao, ordenacao e cache.

```tsx
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
    excluirLotePagamento?: boolean;
  };
}

export function ProtocolosTable({ filters }: ProtocolosTableProps) {
  const [page, setPage] = useState(1);
  const pageSize = 20; // Tamanho fixo de pagina
  const [sorting, setSorting] = useState<SortingState>([{ id: "dtEntrada", desc: true }]);

  const sortBy = sorting[0]?.id;
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  // Reset para pagina 1 quando os filtros mudam
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // Usa o cache para resposta instantanea
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

      {/* Paginacao */}
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
            {/* Primeira pagina */}
            <Button variant="outline" size="icon" onClick={() => setPage(1)} disabled={page === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Pagina anterior */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Indicador de pagina */}
            <div className="text-sm">
              Pagina {page} de {data.pagination.totalPages}
            </div>

            {/* Proxima pagina */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Ultima pagina */}
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
```

**Pontos Importantes:**

- Usa TanStack Table (headless) para flexibilidade
- Paginacao manual (controlada pelo servidor)
- Ordenacao manual (controlada pelo servidor)
- Reset automatico para pagina 1 quando filtros mudam
- Indicador de cache com horario da ultima atualizacao
- Botao de refresh manual
- Loading skeleton durante carregamento
- Tratamento de erro com Alert

---

## Resumo da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         PAGINAS                                  │
│  Dashboard (page.tsx) ← KPICards, FluxoTemporalChart            │
│  Protocolos (page.tsx) ← ProtocoloFilters, ProtocolosTable      │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         HOOKS                                    │
│  useKPIs() → /api/kpis                                          │
│  useCachedProtocolos() → /api/protocolos/cached                 │
│  useFluxoTemporal() → /api/analytics/temporal                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API ROUTES                                 │
│  /api/kpis → buildKPIsQueryOptimized()                          │
│  /api/protocolos → buildProtocolosListQuery()                   │
│  Validacao Zod + executeQuery()                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SQL SERVER                                  │
│  vw_ProtocolosFinanceiro, scd_movimentacao, documento           │
└─────────────────────────────────────────────────────────────────┘
```

---

_Documentacao gerada em: 12/01/2026_
