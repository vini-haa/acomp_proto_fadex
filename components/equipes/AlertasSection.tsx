"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlertasResumo } from "@/types/equipes";

interface AlertasSectionProps {
  alertas: AlertasResumo | undefined;
  isLoading: boolean;
}

export function AlertasSection({ alertas, isLoading }: AlertasSectionProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  const totalCriticos = alertas?.totalCriticos || 0;
  const totalUrgentes = alertas?.totalUrgentes || 0;
  const totalAtencao = alertas?.totalAtencao || 0;

  // Se não há alertas, não mostrar nada
  if (totalCriticos === 0 && totalUrgentes === 0 && totalAtencao === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Alertas de Protocolos Atrasados</h2>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Críticos */}
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">
              Críticos
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {totalCriticos.toLocaleString()}
            </div>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              Mais de 30 dias de tramitação
            </p>
          </CardContent>
        </Card>

        {/* Urgentes */}
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
              Urgentes
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {totalUrgentes.toLocaleString()}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Entre 15 e 30 dias</p>
          </CardContent>
        </Card>

        {/* Atenção */}
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Atenção
            </CardTitle>
            <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {totalAtencao.toLocaleString()}
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Entre 7 e 15 dias</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
