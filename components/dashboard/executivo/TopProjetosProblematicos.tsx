"use client";

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, AlertTriangle } from "lucide-react";
import { ProjetoProblematico } from "@/types/dashboard";

interface TopProjetosProblematicosProps {
  data: ProjetoProblematico[];
}

function formatarMoeda(valor: number): string {
  if (valor >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)}Mi`;
  }
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(0)}k`;
  }
  if (valor > 0) {
    return `R$ ${valor.toFixed(0)}`;
  }
  return "-";
}

export const TopProjetosProblematicos = memo(function TopProjetosProblematicos({
  data,
}: TopProjetosProblematicosProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderKanban className="h-4 w-4" />
            Top Projetos Problematicos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <FolderKanban className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum projeto com pendencias no periodo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderKanban className="h-4 w-4" />
          Top Projetos Problematicos
        </CardTitle>
        <CardDescription>Projetos com mais protocolos pendentes</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {data.map((projeto, index) => (
            <div
              key={projeto.numconv}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate" title={projeto.projeto}>
                    {projeto.projeto}
                  </p>
                  <p className="text-xs text-muted-foreground">Conv. {projeto.numconv}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className="font-bold text-sm">{projeto.pendentes}</p>
                  <p className="text-xs text-muted-foreground">pend.</p>
                </div>
                {projeto.atrasados > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1 px-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    {projeto.atrasados}
                  </Badge>
                )}
                {projeto.valorPendente > 0 && (
                  <div className="text-right min-w-[60px]">
                    <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                      {formatarMoeda(projeto.valorPendente)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
