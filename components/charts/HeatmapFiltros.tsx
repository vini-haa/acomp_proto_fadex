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
import { Filter, X, Search, User } from "lucide-react";
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
  const [colaboradorBusca, setColaboradorBusca] = useState("");

  const handleClearFilters = () => {
    onFilterChange({
      numconv: null,
      instituicao: null,
      uf: null,
      situacao: null,
      codSetor: null,
      codColaborador: null,
      periodo: 6,
    });
    setProjetoBusca("");
    setColaboradorBusca("");
  };

  const hasActiveFilters =
    filters.numconv || filters.uf || filters.situacao || filters.codSetor || filters.codColaborador;

  // Filtra projetos baseado na situação selecionada e na busca (filtro em cascata)
  const projetosFiltrados = useMemo(() => {
    if (!opcoes?.projetos) {
      return [];
    }

    // Primeiro filtra por situação (se selecionada)
    let projetosFiltradosPorSituacao = opcoes.projetos;
    if (filters.situacao) {
      projetosFiltradosPorSituacao = opcoes.projetos.filter(
        (proj) => proj.codSituacaoProjeto === filters.situacao
      );
    }

    // Depois filtra pela busca de texto
    if (!projetoBusca.trim()) {
      return projetosFiltradosPorSituacao;
    }

    const termoBusca = projetoBusca.toLowerCase().trim();
    return projetosFiltradosPorSituacao.filter((proj) =>
      proj.titulo?.toLowerCase().includes(termoBusca)
    );
  }, [opcoes?.projetos, projetoBusca, filters.situacao]);

  // Encontra o projeto selecionado para exibir o nome
  const projetoSelecionado = useMemo(() => {
    if (!filters.numconv || !opcoes?.projetos) {
      return null;
    }
    return opcoes.projetos.find((p) => p.numconv === filters.numconv);
  }, [filters.numconv, opcoes?.projetos]);

  // Filtra colaboradores baseado na busca de texto
  // Nota: Não há cascata com Setor porque o filtro de setor é pelo DESTINO da movimentação,
  // enquanto o colaborador é quem ENVIOU. Um colaborador pode enviar para qualquer setor.
  const colaboradoresFiltrados = useMemo(() => {
    if (!opcoes?.colaboradores) {
      return [];
    }

    // Filtra pela busca de texto
    if (!colaboradorBusca.trim()) {
      return opcoes.colaboradores;
    }

    const termoBusca = colaboradorBusca.toLowerCase().trim();
    return opcoes.colaboradores.filter(
      (colab) =>
        colab.nome?.toLowerCase().includes(termoBusca) ||
        colab.login?.toLowerCase().includes(termoBusca)
    );
  }, [opcoes?.colaboradores, colaboradorBusca]);

  // Encontra o colaborador selecionado para exibir o nome
  const colaboradorSelecionado = useMemo(() => {
    if (!filters.codColaborador || !opcoes?.colaboradores) {
      return null;
    }
    return opcoes.colaboradores.find((c) => c.codigo === filters.codColaborador);
  }, [filters.codColaborador, opcoes?.colaboradores]);

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
              onValueChange={(value) => {
                // Ao mudar status, reseta o projeto selecionado (filtro em cascata)
                onFilterChange({
                  ...filters,
                  situacao: value === "todas" ? null : parseInt(value, 10),
                  numconv: null, // Reset projeto ao mudar status
                });
                setProjetoBusca(""); // Limpa busca também
              }}
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

          {/* Setor */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="setor" className="text-xs">
              Setor
            </Label>
            <Select
              value={filters.codSetor?.toString() || "todos"}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  codSetor: value === "todos" ? null : parseInt(value, 10),
                })
              }
            >
              <SelectTrigger id="setor" className="w-[200px]">
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os setores</SelectItem>
                {opcoes?.setores?.map((setor) => (
                  <SelectItem key={setor.codigo} value={setor.codigo.toString()}>
                    {setor.descr.replace(/^-\s*/, "")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Colaborador com busca */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="colaborador" className="text-xs">
              Colaborador
            </Label>
            <Select
              value={filters.codColaborador?.toString() || "todos"}
              onValueChange={(value) => {
                onFilterChange({
                  ...filters,
                  codColaborador: value === "todos" ? null : parseInt(value, 10),
                });
                if (value === "todos") {
                  setColaboradorBusca("");
                }
              }}
            >
              <SelectTrigger id="colaborador" className="w-[220px]">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">
                    {colaboradorSelecionado
                      ? colaboradorSelecionado.nome.length > 20
                        ? `${colaboradorSelecionado.nome.slice(0, 20)}...`
                        : colaboradorSelecionado.nome
                      : "Todos"}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent className="w-[280px]">
                {/* Campo de busca */}
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar colaborador..."
                      value={colaboradorBusca}
                      onChange={(e) => setColaboradorBusca(e.target.value)}
                      className="pl-8 h-9"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="todos">Todos os colaboradores</SelectItem>
                  {colaboradoresFiltrados.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Nenhum colaborador encontrado
                    </div>
                  ) : (
                    colaboradoresFiltrados.map((colab) => (
                      <SelectItem key={colab.codigo} value={colab.codigo.toString()}>
                        <div className="flex flex-col">
                          <span className="truncate" title={colab.nome}>
                            {colab.nome}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {colab.qtdMovimentacoes} mov.
                          </span>
                        </div>
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
              filters.codSetor &&
                `Setor: ${opcoes?.setores?.find((s) => s.codigo === filters.codSetor)?.descr?.replace(/^-\s*/, "") || filters.codSetor}`,
              filters.codColaborador &&
                `Colaborador: ${colaboradorSelecionado?.nome?.slice(0, 25) || filters.codColaborador}${colaboradorSelecionado?.nome && colaboradorSelecionado.nome.length > 25 ? "..." : ""}`,
            ]
              .filter(Boolean)
              .join(" | ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
