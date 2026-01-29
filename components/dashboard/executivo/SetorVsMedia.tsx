"use client";

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SetorVsMediaData } from "@/types/dashboard";
import { BarChart3, ArrowUp, ArrowDown, Minus, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface SetorVsMediaProps {
  data: SetorVsMediaData;
}

function MetricaComparativa({
  label,
  valorSetor,
  valorMedia,
  unidade,
  inverso = false,
}: {
  label: string;
  valorSetor: number;
  valorMedia: number;
  unidade: string;
  inverso?: boolean;
}) {
  const diff = valorSetor - valorMedia;
  // inverso = true: menor é melhor (tempo médio)
  const melhor = inverso ? diff < 0 : diff > 0;
  const neutro = Math.abs(diff) < 0.5;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">
          {valorSetor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
          <span className="text-xs font-normal text-muted-foreground ml-1">{unidade}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Media</p>
          <p className="text-sm font-medium text-muted-foreground">
            {valorMedia.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
            <span className="text-xs ml-0.5">{unidade}</span>
          </p>
        </div>
        {neutro ? (
          <Badge variant="secondary" className="gap-1">
            <Minus className="h-3 w-3" />=
          </Badge>
        ) : melhor ? (
          <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400">
            {inverso ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
            {Math.abs(diff).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
          </Badge>
        ) : (
          <Badge className="gap-1 bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400">
            {inverso ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(diff).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
          </Badge>
        )}
      </div>
    </div>
  );
}

export const SetorVsMedia = memo(function SetorVsMedia({ data }: SetorVsMediaProps) {
  const { setor, media, ranking } = data;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Setor vs Media Geral
            </CardTitle>
            <CardDescription>{setor.nomeSetor}</CardDescription>
          </div>
          {ranking.totalSetores > 0 && (
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                ranking.posicao <= 3
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Trophy className="h-3.5 w-3.5" />
              {ranking.posicao}o de {ranking.totalSetores}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <MetricaComparativa
          label="Tempo Medio"
          valorSetor={setor.tempoMedio}
          valorMedia={media.tempoMedio}
          unidade="dias"
          inverso
        />
        <MetricaComparativa
          label="SLA (no prazo)"
          valorSetor={setor.slaPercent}
          valorMedia={media.slaPercent}
          unidade="%"
        />
        <MetricaComparativa
          label="Pendentes"
          valorSetor={setor.pendentes}
          valorMedia={media.pendentes}
          unidade=""
        />
      </CardContent>
    </Card>
  );
});
