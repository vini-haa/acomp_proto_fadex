"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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

/**
 * Lê filtros da URL
 */
function parseFiltersFromUrl(searchParams: URLSearchParams) {
  return {
    status: searchParams.get("status") || undefined,
    numeroDocumento: searchParams.get("numero") || undefined,
    numconv: searchParams.get("numconv") || undefined,
    faixaTempo: searchParams.get("faixa") || undefined,
    contaCorrente: searchParams.get("cc") || undefined,
    setorAtual: searchParams.get("setor") || undefined,
    assunto: searchParams.get("assunto") || undefined,
    diaSemana: searchParams.get("diaSemana") ? parseInt(searchParams.get("diaSemana")!) : undefined,
    hora: searchParams.get("hora") ? parseInt(searchParams.get("hora")!) : undefined,
    excluirLotePagamento: searchParams.get("lotes") !== "mostrar",
  };
}

/**
 * Lê paginação da URL
 */
function parsePaginationFromUrl(searchParams: URLSearchParams) {
  return {
    page: parseInt(searchParams.get("page") || "1", 10),
    pageSize: parseInt(searchParams.get("limit") || "25", 10),
  };
}

function ProtocolosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Lê filtros e paginação da URL
  const initialFilters = parseFiltersFromUrl(searchParams);
  const initialPagination = parsePaginationFromUrl(searchParams);

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
  }>(initialFilters);

  const [pagination, setPagination] = useState(initialPagination);

  // Busca apenas para obter as opções de filtro
  const { data: cacheData } = useCachedProtocolos({ page: 1, pageSize: 1 });
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Atualiza a URL com os filtros e paginação atuais
   */
  const updateUrl = useCallback(
    (newFilters: typeof filters, newPagination: typeof pagination) => {
      const params = new URLSearchParams();

      // Filtros
      if (newFilters.status) {
        params.set("status", newFilters.status);
      }
      if (newFilters.numeroDocumento) {
        params.set("numero", newFilters.numeroDocumento);
      }
      if (newFilters.numconv) {
        params.set("numconv", newFilters.numconv);
      }
      if (newFilters.faixaTempo) {
        params.set("faixa", newFilters.faixaTempo);
      }
      if (newFilters.contaCorrente) {
        params.set("cc", newFilters.contaCorrente);
      }
      if (newFilters.setorAtual) {
        params.set("setor", newFilters.setorAtual);
      }
      if (newFilters.assunto) {
        params.set("assunto", newFilters.assunto);
      }
      if (newFilters.diaSemana !== undefined) {
        params.set("diaSemana", newFilters.diaSemana.toString());
      }
      if (newFilters.hora !== undefined) {
        params.set("hora", newFilters.hora.toString());
      }
      if (newFilters.excluirLotePagamento === false) {
        params.set("lotes", "mostrar");
      }

      // Paginação (só inclui se diferente do padrão)
      if (newPagination.page > 1) {
        params.set("page", newPagination.page.toString());
      }
      if (newPagination.pageSize !== 25) {
        params.set("limit", newPagination.pageSize.toString());
      }

      const queryString = params.toString();
      router.replace(`${pathname}${queryString ? "?" + queryString : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  /**
   * Handler para mudança de filtros (vindo do componente ProtocoloFilters)
   */
  const handleFilterChange = useCallback(
    (newFilters: typeof filters) => {
      setFilters(newFilters);
      const newPagination = { ...pagination, page: 1 }; // Reset página ao filtrar
      setPagination(newPagination);
      updateUrl(newFilters, newPagination);
    },
    [pagination, updateUrl]
  );

  /**
   * Handler para mudança de paginação (vindo da ProtocolosTable)
   */
  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      const newPagination = { page, pageSize };
      setPagination(newPagination);
      updateUrl(filters, newPagination);
    },
    [filters, updateUrl]
  );

  // Função para buscar dados para exportação apenas quando necessário
  const fetchExportData = useCallback(async (): Promise<Protocolo[]> => {
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", "50000");
    if (filters.status) {
      params.set("status", filters.status);
    }
    if (filters.numeroDocumento) {
      params.set("numeroDocumento", filters.numeroDocumento);
    }
    if (filters.numconv) {
      params.set("numconv", filters.numconv);
    }
    if (filters.faixaTempo) {
      params.set("faixaTempo", filters.faixaTempo);
    }
    if (filters.contaCorrente) {
      params.set("contaCorrente", filters.contaCorrente);
    }
    if (filters.setorAtual) {
      params.set("setorAtual", filters.setorAtual);
    }
    if (filters.assunto) {
      params.set("assunto", filters.assunto);
    }
    if (filters.diaSemana !== undefined) {
      params.set("diaSemana", filters.diaSemana.toString());
    }
    if (filters.hora !== undefined) {
      params.set("hora", filters.hora.toString());
    }

    const response = await fetch(`/api/protocolos/cached?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Erro ao buscar dados para exportação");
    }
    const json = await response.json();
    return json.data || [];
  }, [filters]);

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    setIsExporting(true);
    try {
      const data = await fetchExportData();
      if (data.length === 0) {
        return;
      }

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
          {/* Filtros e Exportação */}
          <div className="flex items-center justify-between gap-4">
            <ProtocoloFilters
              onFilterChange={handleFilterChange}
              filterOptions={cacheData?.filterOptions}
              initialFilters={{
                ...initialFilters,
                excluirLotePagamento: initialFilters.excluirLotePagamento ?? true,
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
          <ProtocolosTable
            filters={filters}
            initialPage={pagination.page}
            initialPageSize={pagination.pageSize}
            onPaginationChange={handlePaginationChange}
          />
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
