"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { useEquipes, useGargalos } from "@/hooks/useEquipes";
import { EquipeCard, FiltrosEquipes, GargalosChart } from "@/components/equipes";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingDown, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EquipesFilters } from "@/types/equipes";

export default function EquipesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Inicializar estado a partir da URL
  const [filters, setFilters] = useState<EquipesFilters>(() => ({
    busca: searchParams.get("busca") || "",
    periodo: (searchParams.get("periodo") as "7d" | "30d" | "90d") || "30d",
  }));

  // Sincronizar URL quando filtros mudam
  const updateUrl = useCallback(
    (newFilters: EquipesFilters) => {
      const params = new URLSearchParams();

      if (newFilters.busca) {
        params.set("busca", newFilters.busca);
      }
      if (newFilters.periodo && newFilters.periodo !== "30d") {
        params.set("periodo", newFilters.periodo);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Handler para mudança de filtros
  const handleFilterChange = useCallback(
    (newFilters: EquipesFilters) => {
      setFilters(newFilters);
      updateUrl(newFilters);
    },
    [updateUrl]
  );

  const { data: equipes, isLoading: loadingEquipes, error: errorEquipes } = useEquipes(filters);
  const { data: gargalos, isLoading: loadingGargalos } = useGargalos();

  // Filtrar equipes por busca
  const equipesFiltradas = useMemo(() => {
    if (!filters.busca?.trim() || !equipes) {
      return equipes || [];
    }

    const termo = filters.busca.toLowerCase();
    return equipes.filter((e) => e.nomeSetor.toLowerCase().includes(termo));
  }, [equipes, filters.busca]);

  // Calcular estatísticas gerais
  const stats = {
    totalSetores: equipes?.length || 0,
    totalMembros: equipes?.reduce((sum, e) => sum + (e.totalMembros || 0), 0) || 0,
    totalProtocolos: equipes?.reduce((sum, e) => sum + (e.protocolosEmPosse || 0), 0) || 0,
    setoresCriticos: equipes?.filter((e) => e.cargaTrabalho === "CRÍTICA").length || 0,
    tempoMedioGeral:
      equipes && equipes.length > 0
        ? equipes.reduce((sum, e) => sum + (e.tempoMedioRespostaHoras || 0), 0) /
          equipes.filter((e) => e.tempoMedioRespostaHoras !== null).length
        : 0,
  };

  if (errorEquipes) {
    return (
      <>
        <Header title="Gestão de Equipes" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar equipes. Tente novamente.</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Gestão de Equipes"
        subtitle="Análise de performance, carga de trabalho e identificação de gargalos"
      />

      <div className="p-6 space-y-6">
        {/* KPIs Gerais */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Setores Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingEquipes ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalSetores}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalMembros} colaboradores
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Protocolos em Posse</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingEquipes ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalProtocolos.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Distribuídos entre setores</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gargalos Críticos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {loadingEquipes ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-600">{stats.setoresCriticos}</div>
                  <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa Média Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingEquipes ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {stats.tempoMedioGeral > 0 ? stats.tempoMedioGeral.toFixed(1) + "h" : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Tempo médio de processamento</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <FiltrosEquipes filters={filters} onFilterChange={handleFilterChange} />

        {/* Grid de Setores */}
        {loadingEquipes ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Setores</h2>
              <p className="text-sm text-muted-foreground">
                {equipesFiltradas.length} setores
                {filters.busca && ` (filtrado de ${equipes?.length || 0})`}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {equipesFiltradas.map((equipe) => (
                <EquipeCard key={equipe.codSetor} equipe={equipe} />
              ))}
            </div>
          </>
        )}

        {/* Gráfico de Gargalos */}
        {!loadingGargalos && gargalos && gargalos.length > 0 && (
          <GargalosChart gargalos={gargalos} />
        )}

        {equipesFiltradas.length === 0 && !loadingEquipes && (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Nenhum setor encontrado com os filtros aplicados
          </div>
        )}
      </div>
    </>
  );
}
