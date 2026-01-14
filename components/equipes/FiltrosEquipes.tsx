"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Filter } from "lucide-react";
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

          <div className="flex items-center gap-2">
            <Label htmlFor="instituicao" className="text-sm whitespace-nowrap">
              Instituição:
            </Label>
            <Select
              value={filters.instituicao || "todas"}
              onValueChange={(value) =>
                onFilterChange({
                  ...filters,
                  instituicao: value === "todas" ? undefined : (value as "UFPI" | "IFPI"),
                })
              }
            >
              <SelectTrigger id="instituicao" className="w-[150px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="UFPI">UFPI</SelectItem>
                <SelectItem value="IFPI">IFPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="periodo" className="text-sm whitespace-nowrap">
              Período:
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
