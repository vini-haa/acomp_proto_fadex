"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SaudeSetor } from "@/types/dashboard";
import { Building2, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaudeSetoresProps {
  data: SaudeSetor[];
}

function StatusIndicator({ status }: { status: SaudeSetor["status"] }) {
  const colors = {
    bom: "bg-green-500",
    atencao: "bg-amber-500",
    critico: "bg-red-500",
  };

  return <div className={cn("h-3 w-3 rounded-full", colors[status])} />;
}

function TendenciaIcon({ tendencia }: { tendencia: SaudeSetor["tendencia"] }) {
  if (tendencia === "melhorando") {
    return <TrendingDown className="h-4 w-4 text-green-600" />;
  }
  if (tendencia === "piorando") {
    return <TrendingUp className="h-4 w-4 text-red-600" />;
  }
  return <Minus className="h-4 w-4 text-gray-400" />;
}

export const SaudeSetores = memo(function SaudeSetores({ data }: SaudeSetoresProps) {
  // Ordena por status (crítico primeiro) e depois por pendentes
  const sortedData = [...data].sort((a, b) => {
    const statusOrder = { critico: 0, atencao: 1, bom: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.pendentes - a.pendentes;
  });

  const countByStatus = {
    critico: data.filter((s) => s.status === "critico").length,
    atencao: data.filter((s) => s.status === "atencao").length,
    bom: data.filter((s) => s.status === "bom").length,
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Saude dos Setores
            </CardTitle>
            <CardDescription className="mt-1">
              Tempo medio de permanencia dos protocolos
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs px-2 py-1 bg-muted/50 rounded-md">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-foreground font-medium">{countByStatus.critico}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-foreground font-medium">{countByStatus.atencao}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-foreground font-medium">{countByStatus.bom}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <div className="space-y-1 px-4 pb-4">
            {sortedData.map((setor) => (
              <Link
                key={setor.codSetor}
                href={`/analises/setores?setor=${setor.codSetor}`}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusIndicator status={setor.status} />
                  <span className="text-sm font-medium truncate">{setor.nomeSetor}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">{setor.tempoMedioDias} dias</p>
                    <p className="text-xs text-muted-foreground">{setor.pendentes} pendentes</p>
                  </div>
                  <TendenciaIcon tendencia={setor.tendencia} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
