"use client";

import { memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FluxoSetorData } from "@/types/dashboard";
import { ArrowRightLeft, ArrowRight, RotateCcw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FluxoSetorChartProps {
  data: FluxoSetorData;
}

function BarraPercentual({ percentual, cor }: { percentual: number; cor: string }) {
  return (
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", cor)}
        style={{ width: `${Math.min(percentual, 100)}%` }}
      />
    </div>
  );
}

export const FluxoSetorChart = memo(function FluxoSetorChart({ data }: FluxoSetorChartProps) {
  const { destinos, retornos, totalSaidas, totalRetornos, percentualRetorno } = data;
  const retornoAlto = percentualRetorno > 20;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="h-4 w-4" />
              Fluxo do Setor
            </CardTitle>
            <CardDescription>Destinos e retornos de protocolos</CardDescription>
          </div>
          {totalSaidas > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total saidas</p>
              <p className="text-sm font-bold">{totalSaidas.toLocaleString("pt-BR")}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Destinos */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-sm font-medium">Destinos</h4>
          </div>
          {destinos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sem dados de destino no periodo
            </p>
          ) : (
            <div className="space-y-3">
              {destinos.slice(0, 5).map((d) => (
                <div key={d.codSetorDestino} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{d.nomeSetorDestino}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-medium">{d.quantidade}</span>
                      <Badge
                        variant={d.tipoFluxo === "arquivo" ? "secondary" : "outline"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {d.percentual}%
                      </Badge>
                    </div>
                  </div>
                  <BarraPercentual
                    percentual={d.percentual}
                    cor={d.tipoFluxo === "arquivo" ? "bg-green-500" : "bg-blue-500"}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retornos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-sm font-medium">Retornos</h4>
            </div>
            {totalRetornos > 0 && (
              <Badge
                className={cn(
                  "gap-1",
                  retornoAlto
                    ? "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
                    : "bg-muted text-muted-foreground hover:bg-muted"
                )}
              >
                {retornoAlto && <AlertTriangle className="h-3 w-3" />}
                {percentualRetorno}% retorno
              </Badge>
            )}
          </div>
          {retornos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sem retornos no periodo
            </p>
          ) : (
            <div className="space-y-3">
              {retornos.map((r) => (
                <div key={r.codSetorOrigem} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{r.nomeSetorOrigem}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-medium">{r.quantidade}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {r.percentual}%
                      </Badge>
                    </div>
                  </div>
                  <BarraPercentual percentual={r.percentual} cor="bg-amber-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumo */}
        {totalSaidas > 0 && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Saidas</p>
              <p className="text-sm font-bold">{totalSaidas.toLocaleString("pt-BR")}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Retornos</p>
              <p className={cn("text-sm font-bold", retornoAlto && "text-red-600")}>
                {totalRetornos.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
