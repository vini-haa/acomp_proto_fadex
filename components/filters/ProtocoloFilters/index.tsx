"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtocoloFiltersProps } from "./types";
import { useFilterState } from "./useFilterState";
import { DateTimeIndicator } from "./DateTimeIndicator";
import { FilterRow } from "./FilterRow";

export function ProtocoloFilters({
  onFilterChange,
  filterOptions,
  initialFilters,
}: ProtocoloFiltersProps) {
  const {
    status,
    numeroDocumento,
    numconv,
    faixaTempo,
    contaCorrente,
    setorAtual,
    assunto,
    diaSemana,
    hora,
    effectiveOptions,
    hasFilters,
    hasDateTimeFilters,
    setStatus,
    setNumeroDocumento,
    setNumconv,
    setFaixaTempo,
    setContaCorrente,
    setSetorAtual,
    setAssunto,
    handleApplyFilters,
    handleClearFilters,
    handleClearDateTimeFilters,
  } = useFilterState({
    initialFilters,
    filterOptions,
    onFilterChange,
  });

  return (
    <Card className="flex-1">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Indicador de filtro por dia/hora (do mapa de calor) */}
        {hasDateTimeFilters && (
          <DateTimeIndicator
            diaSemana={diaSemana}
            hora={hora}
            onClear={handleClearDateTimeFilters}
          />
        )}

        <FilterRow
          status={status}
          numeroDocumento={numeroDocumento}
          numconv={numconv}
          faixaTempo={faixaTempo}
          contaCorrente={contaCorrente}
          setorAtual={setorAtual}
          assunto={assunto}
          effectiveOptions={effectiveOptions}
          hasFilters={hasFilters}
          setStatus={setStatus}
          setNumeroDocumento={setNumeroDocumento}
          setNumconv={setNumconv}
          setFaixaTempo={setFaixaTempo}
          setContaCorrente={setContaCorrente}
          setSetorAtual={setSetorAtual}
          setAssunto={setAssunto}
          handleApplyFilters={handleApplyFilters}
          handleClearFilters={handleClearFilters}
        />
      </CardContent>
    </Card>
  );
}

// Re-export types for convenience
export type { ProtocoloFiltersProps, FilterValues, FilterOptions } from "./types";
