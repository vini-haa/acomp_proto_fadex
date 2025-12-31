"use client";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DIAS_SEMANA_LABELS } from "./utils";

interface DateTimeIndicatorProps {
  diaSemana?: number;
  hora?: number;
  onClear: () => void;
}

export function DateTimeIndicator({ diaSemana, hora, onClear }: DateTimeIndicatorProps) {
  const hasFilters = diaSemana !== undefined || hora !== undefined;

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          Filtrado por período do Mapa de Calor
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          {diaSemana !== undefined && DIAS_SEMANA_LABELS[diaSemana]}
          {diaSemana !== undefined && hora !== undefined && " às "}
          {hora !== undefined && `${hora}h`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
