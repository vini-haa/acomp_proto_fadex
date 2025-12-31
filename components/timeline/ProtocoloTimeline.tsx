"use client";

import { useTimeline } from "@/hooks/useTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowRight, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProtocoloTimelineProps {
  protocoloId: number;
}

function formatTempo(horas: number | null, dias: number | null): string {
  if (horas === null && dias === null) {
    return "";
  }
  if (dias !== null && dias > 0) {
    if (dias === 1) {
      return "1 dia";
    }
    return `${dias} dias`;
  }
  if (horas !== null && horas > 0) {
    if (horas < 24) {
      return `${horas}h`;
    }
    const d = Math.floor(horas / 24);
    const h = horas % 24;
    if (h === 0) {
      return d === 1 ? "1 dia" : `${d} dias`;
    }
    return `${d}d ${h}h`;
  }
  return "< 1h";
}

export function ProtocoloTimeline({ protocoloId }: ProtocoloTimelineProps) {
  const { data: timeline, isLoading, error } = useTimeline(protocoloId);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar timeline do protocolo.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhuma movimentação encontrada para este protocolo.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {timeline.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === timeline.length - 1;
        const isAtual = item.isAtual === 1 || item.isAtual === true;

        // Determina a cor baseado na posição e se é atual
        const getBgColor = () => {
          if (isAtual) {
            return "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300";
          }
          if (isFirst) {
            return "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300";
          }
          return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
        };

        const tempoNoSetor = formatTempo(
          item.horasNoSetorDestino ?? null,
          item.diasNoSetorDestino ?? null
        );

        return (
          <div key={item.idMovimentacao} className="relative">
            {/* Linha conectora */}
            {!isLast && <div className="absolute left-5 top-12 h-full w-0.5 bg-border" />}

            {/* Card da movimentação */}
            <Card
              className={isAtual ? "border-green-500 border-2" : isFirst ? "border-blue-500" : ""}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Ícone/Indicador */}
                  <div className="flex-shrink-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${getBgColor()}`}
                    >
                      {isAtual ? (
                        <MapPin className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">
                          {item.ordemMovimentacao || index + 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 space-y-2">
                    {/* Data e Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {isAtual && (
                            <Badge variant="default" className="bg-green-600">
                              Localização Atual
                            </Badge>
                          )}
                          {isFirst && !isAtual && <Badge variant="secondary">Início</Badge>}
                        </div>
                        <p className="text-sm font-medium">{item.dataFormatada}</p>
                      </div>
                      {tempoNoSetor && (
                        <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">
                            {isAtual ? `${tempoNoSetor} (atual)` : tempoNoSetor}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Setores */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">{item.setorOrigem || "—"}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{item.setorDestino || "—"}</span>
                    </div>

                    {/* Tempo no setor destino */}
                    {tempoNoSetor && (
                      <p className="text-xs text-muted-foreground">
                        Permaneceu em <span className="font-medium">{item.setorDestino}</span> por{" "}
                        {tempoNoSetor}
                      </p>
                    )}

                    {/* Documento */}
                    {item.numDocumento && (
                      <p className="text-xs text-muted-foreground">Doc: {item.numDocumento}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
