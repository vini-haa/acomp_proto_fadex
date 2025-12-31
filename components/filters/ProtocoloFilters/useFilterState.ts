"use client";

import { useState, useEffect, useMemo } from "react";
import { FilterOptions, FilterValues, InitialFilters } from "./types";
import { FILTER_OPTIONS_STORAGE_KEY } from "./utils";

interface UseFilterStateProps {
  initialFilters?: InitialFilters;
  filterOptions?: FilterOptions;
  onFilterChange: (filters: FilterValues) => void;
}

export function useFilterState({
  initialFilters,
  filterOptions,
  onFilterChange,
}: UseFilterStateProps) {
  const [status, setStatus] = useState<string>("todos");
  const [numeroDocumento, setNumeroDocumento] = useState<string>("");
  const [numconv, setNumconv] = useState<string>(initialFilters?.numconv || "");
  const [faixaTempo, setFaixaTempo] = useState<string>("todos");
  const [contaCorrente, setContaCorrente] = useState<string>("");
  const [setorAtual, setSetorAtual] = useState<string>("todos");
  const [assunto, setAssunto] = useState<string>(initialFilters?.assunto || "todos");
  const [diaSemana, setDiaSemana] = useState<number | undefined>(initialFilters?.diaSemana);
  const [hora, setHora] = useState<number | undefined>(initialFilters?.hora);
  const [cachedOptions, setCachedOptions] = useState<FilterOptions | null>(null);

  // Aplica filtros iniciais quando mudam via URL
  useEffect(() => {
    const newFilters: FilterValues = {};
    let hasChanges = false;

    if (initialFilters?.numconv) {
      setNumconv(initialFilters.numconv);
      newFilters.numconv = initialFilters.numconv;
      hasChanges = true;
    }

    if (initialFilters?.diaSemana !== undefined) {
      setDiaSemana(initialFilters.diaSemana);
      newFilters.diaSemana = initialFilters.diaSemana;
      hasChanges = true;
    }

    if (initialFilters?.hora !== undefined) {
      setHora(initialFilters.hora);
      newFilters.hora = initialFilters.hora;
      hasChanges = true;
    }

    if (hasChanges) {
      onFilterChange(newFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters?.numconv, initialFilters?.diaSemana, initialFilters?.hora]);

  // Carrega opções do localStorage na montagem do componente
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FILTER_OPTIONS_STORAGE_KEY);
      if (stored) {
        setCachedOptions(JSON.parse(stored));
      }
    } catch {
      // Ignora erros de localStorage
    }
  }, []);

  // Atualiza localStorage quando novas opções chegam do servidor
  useEffect(() => {
    if (filterOptions?.setores?.length) {
      try {
        localStorage.setItem(FILTER_OPTIONS_STORAGE_KEY, JSON.stringify(filterOptions));
        setCachedOptions(filterOptions);
      } catch {
        // Ignora erros de localStorage
      }
    }
  }, [filterOptions]);

  // Usa filterOptions do servidor se disponível, senão usa do cache local
  const effectiveOptions = useMemo(() => {
    if (filterOptions?.setores?.length) {
      return filterOptions;
    }
    return cachedOptions;
  }, [filterOptions, cachedOptions]);

  const handleApplyFilters = () => {
    // Remove o dígito verificador da CC (ex: "11797-8" -> "11797")
    const ccSemDigito = contaCorrente ? contaCorrente.split("-")[0] : undefined;

    onFilterChange({
      status: status !== "todos" ? status : undefined,
      numeroDocumento: numeroDocumento || undefined,
      numconv: numconv || undefined,
      faixaTempo: faixaTempo !== "todos" ? faixaTempo : undefined,
      contaCorrente: ccSemDigito || undefined,
      setorAtual: setorAtual !== "todos" ? setorAtual : undefined,
      assunto: assunto !== "todos" ? assunto : undefined,
      diaSemana: diaSemana,
      hora: hora,
    });
  };

  const handleClearFilters = () => {
    setStatus("todos");
    setNumeroDocumento("");
    setNumconv("");
    setFaixaTempo("todos");
    setContaCorrente("");
    setSetorAtual("todos");
    setAssunto("todos");
    setDiaSemana(undefined);
    setHora(undefined);
    onFilterChange({});
  };

  const handleClearDateTimeFilters = () => {
    setDiaSemana(undefined);
    setHora(undefined);
    // Re-aplica os outros filtros sem dia/hora
    const ccSemDigito = contaCorrente ? contaCorrente.split("-")[0] : undefined;
    onFilterChange({
      status: status !== "todos" ? status : undefined,
      numeroDocumento: numeroDocumento || undefined,
      numconv: numconv || undefined,
      faixaTempo: faixaTempo !== "todos" ? faixaTempo : undefined,
      contaCorrente: ccSemDigito || undefined,
      setorAtual: setorAtual !== "todos" ? setorAtual : undefined,
      assunto: assunto !== "todos" ? assunto : undefined,
    });
  };

  const hasFilters =
    status !== "todos" ||
    !!numeroDocumento ||
    !!numconv ||
    faixaTempo !== "todos" ||
    !!contaCorrente ||
    setorAtual !== "todos" ||
    assunto !== "todos" ||
    diaSemana !== undefined ||
    hora !== undefined;

  const hasDateTimeFilters = diaSemana !== undefined || hora !== undefined;

  return {
    // State values
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
    // Setters
    setStatus,
    setNumeroDocumento,
    setNumconv,
    setFaixaTempo,
    setContaCorrente,
    setSetorAtual,
    setAssunto,
    // Actions
    handleApplyFilters,
    handleClearFilters,
    handleClearDateTimeFilters,
  };
}
