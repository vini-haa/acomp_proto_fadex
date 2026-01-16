"use client";

import { memo, useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, X, Search } from "lucide-react";
import { useHeatmapFiltros } from "@/hooks/useAnalytics";
import type { HeatmapFilters } from "@/types/analytics";

interface HeatmapFiltrosProps {
  filters: HeatmapFilters;
  onFilterChange: (filters: HeatmapFilters) => void;
}

export const HeatmapFiltros = memo(function HeatmapFiltros({
  filters,
  onFilterChange,
}: HeatmapFiltrosProps) {
  const { data: opcoes, isLoading } = useHeatmapFiltros();
  const [projetoBusca, setProjetoBusca] = useState("");

  const handleClearFilters = () => {
    onFilterChange({
      numconv: null,
      instituicao: null,
      uf: null,
      situacao: null,
      periodo: 6,
    });
    setProjetoBusca("");
  };

  const hasActiveFilters = filters.numconv || filters.uf || filters.situacao;

  // Filtra projetos baseado na busca
  const projetosFiltrados = useMemo(() => {
    if (!opcoes?.projetos) {
      return [];
    }
    if (!projetoBusca.trim()) {
      return opcoes.projetos;
    }

    const termoBusca = projetoBusca.toLowerCase().trim();
    return opcoes.projetos.filter((proj) => proj.titulo?.toLowerCase().includes(termoBusca));
  }, [opcoes?.projetos, projetoBusca]);

  // Encontra o projeto selecionado para exibir o nome
  const projetoSelecionado = useMemo(() => {
    if (!filters.numconv || !opcoes?.projetos) {
      return null;
    }
    return opcoes.projetos.find((p) => p.numconv === filters.numconv);
  }, [filters.numconv, opcoes?.projetos]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse flex gap-4">
            <div className="h-10 bg-muted rounded w-40" />
            <div className="h-10 bg-muted rounded w-40" />
            <div className="h-10 bg-muted rounded w-40" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          {/* Estado */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="uf" className="text-xs">
              Estado
            </Label>
            <Select
              value={filters.uf || "todos"}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  uf: value === "todos" ? null : value,
                })
              }
            >
              <SelectTrigger id="uf" className="w-[120px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {opcoes?.estados.map((estado) => (
                  <SelectItem key={estado.uf} value={estado.uf}>
                    {estado.uf} ({estado.qtdConvenios})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Situação do Projeto */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="situacao" className="text-xs">
              Status Projeto
            </Label>
            <Select
              value={filters.situacao?.toString() || "todas"}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  situacao: value === "todas" ? null : parseInt(value, 10),
                })
              }
            >
              <SelectTrigger id="situacao" className="w-[160px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {opcoes?.situacoes.map((sit) => (
                  <SelectItem key={sit.codigo} value={sit.codigo.toString()}>
                    {sit.descricao} ({sit.qtdConvenios})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projeto com busca */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="projeto" className="text-xs">
              Projeto
            </Label>
            <Select
              value={filters.numconv?.toString() || "todos"}
              onValueChange={(value) => {
                onFilterChange({
                  ...filters,
                  numconv: value === "todos" ? null : parseInt(value, 10),
                });
                if (value === "todos") {
                  setProjetoBusca("");
                }
              }}
            >
              <SelectTrigger id="projeto" className="w-[300px]">
                <SelectValue>
                  {projetoSelecionado
                    ? projetoSelecionado.titulo && projetoSelecionado.titulo.length > 35
                      ? `${projetoSelecionado.titulo.slice(0, 35)}...`
                      : projetoSelecionado.titulo
                    : "Todos os projetos"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-[350px]">
                {/* Campo de busca */}
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar projeto..."
                      value={projetoBusca}
                      onChange={(e) => setProjetoBusca(e.target.value)}
                      className="pl-8 h-9"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="todos">Todos os projetos</SelectItem>
                  {projetosFiltrados.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum projeto encontrado
                    </div>
                  ) : (
                    projetosFiltrados.map((proj) => (
                      <SelectItem key={proj.numconv} value={proj.numconv.toString()}>
                        <span className="block truncate" title={proj.titulo || ""}>
                          {proj.titulo || "Sem título"}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="periodo" className="text-xs">
              Período
            </Label>
            <Select
              value={filters.periodo?.toString() || "6"}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  periodo: parseInt(value, 10),
                })
              }
            >
              <SelectTrigger id="periodo" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Último mês</SelectItem>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botão Limpar */}
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="h-10">
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Resumo dos filtros ativos */}
        {hasActiveFilters && (
          <div className="mt-3 text-xs text-muted-foreground">
            Filtros ativos:{" "}
            {[
              filters.uf && `Estado: ${filters.uf}`,
              filters.situacao &&
                `Status: ${opcoes?.situacoes.find((s) => s.codigo === filters.situacao)?.descricao || filters.situacao}`,
              filters.numconv &&
                `Projeto: ${projetoSelecionado?.titulo?.slice(0, 30) || filters.numconv}${projetoSelecionado?.titulo && projetoSelecionado.titulo.length > 30 ? "..." : ""}`,
            ]
              .filter(Boolean)
              .join(" | ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
