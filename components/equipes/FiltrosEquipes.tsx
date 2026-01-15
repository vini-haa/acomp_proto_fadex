"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Filter, Info } from "lucide-react";
import type { EquipesFilters } from "@/types/equipes";

interface FiltrosEquipesProps {
  filters: EquipesFilters;
  onFilterChange: (filters: EquipesFilters) => void;
}

export function FiltrosEquipes({ filters, onFilterChange }: FiltrosEquipesProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>

          {/* Busca por nome do setor */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Label htmlFor="busca" className="text-sm whitespace-nowrap">
              Setor:
            </Label>
            <Input
              id="busca"
              placeholder="Ex: ARQUIVO, FINANCEIRO..."
              value={filters.busca || ""}
              onChange={(e) => onFilterChange({ ...filters, busca: e.target.value })}
              className="flex-1 max-w-[250px]"
            />
          </div>

          {/* Período com tooltip */}
          <div className="flex items-center gap-2">
            <Label htmlFor="periodo" className="text-sm whitespace-nowrap flex items-center gap-1">
              Período:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-[200px]">
                      Filtra as movimentações e tempo médio por período. Protocolos em posse sempre
                      mostram o total atual.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select
              value={filters.periodo || "30d"}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  periodo: value as "7d" | "30d" | "90d",
                })
              }
            >
              <SelectTrigger id="periodo" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
