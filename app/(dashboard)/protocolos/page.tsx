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

  // Lê filtros da URL ao carregar a página
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

  // Busca apenas para obter as opções de filtro
  const { data: cacheData } = useCachedProtocolos({ page: 1, pageSize: 1 });
  const [isExporting, setIsExporting] = useState(false);

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
