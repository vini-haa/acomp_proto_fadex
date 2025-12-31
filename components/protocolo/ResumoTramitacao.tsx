"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Clock, Building2, TrendingUp } from "lucide-react";
import type {
  ResumoTempoSetor as ResumoTempoSetorType,
  IdadeProtocolo as IdadeProtocoloType,
} from "@/types/protocolo";
import { getValue } from "@/lib/object-helpers";

// Tipo flexível que aceita tanto camelCase (API) quanto PascalCase (legado)
type ResumoTempoSetor =
  | ResumoTempoSetorType
  | {
      Setor: string;
      VezesNoSetor: number;
      DiasTotal: number;
      MediaDias: number;
    };

type IdadeProtocolo =
  | IdadeProtocoloType
  | {
      Protocolo: string;
      DataCriacao: string;
      IdadeEmDias: number;
      IdadeEmMeses: number;
      UltimaMovimentacao: string | null;
      DiasSemMovimentacao: number | null;
    };

interface ResumoTramitacaoProps {
  resumoTempo: ResumoTempoSetor[];
  idade: IdadeProtocolo | null;
  totalMovimentacoes: number;
  isLoading?: boolean;
}

export function ResumoTramitacao({
  resumoTempo,
  idade,
  totalMovimentacoes,
  isLoading = false,
}: ResumoTramitacaoProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resumo de Tramitação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxDias = Math.max(
    ...resumoTempo.map((r) => {
      const rt = r as Record<string, unknown>;
      return getValue<number>(rt, "diasTotal", "DiasTotal") || 0;
    }),
    1
  );

  // Obtém idade de forma flexível
  const idadeObj = idade as Record<string, unknown> | null;
  const idadeEmDias = idadeObj ? getValue<number>(idadeObj, "idadeEmDias", "IdadeEmDias") : 0;
  const diasSemMovimentacao = idadeObj
    ? getValue<number | null>(idadeObj, "diasSemMovimentacao", "DiasSemMovimentacao")
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Resumo de Tramitação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas gerais */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{idadeEmDias || 0}</div>
            <div className="text-sm text-muted-foreground">Dias desde criação</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{totalMovimentacoes}</div>
            <div className="text-sm text-muted-foreground">Movimentações</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{resumoTempo.length}</div>
            <div className="text-sm text-muted-foreground">Setores visitados</div>
          </div>
        </div>

        {/* Tempo por setor */}
        {resumoTempo.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Tempo por Setor
            </h4>
            <div className="space-y-3">
              {resumoTempo.map((setor, index) => {
                const s = setor as Record<string, unknown>;
                const setorNome = getValue<string>(s, "setor", "Setor");
                const vezesNoSetor = getValue<number>(s, "vezesNoSetor", "VezesNoSetor");
                const diasTotal = getValue<number>(s, "diasTotal", "DiasTotal");
                const percentual = (diasTotal / maxDias) * 100;
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate max-w-[60%]">
                        {setorNome?.replace(/^- /, "") || "Não identificado"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {vezesNoSetor}x
                        </Badge>
                        <span className="font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {diasTotal} dias
                        </span>
                      </div>
                    </div>
                    <Progress value={percentual} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dias sem movimentação */}
        {diasSemMovimentacao !== null && diasSemMovimentacao > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dias sem movimentação</span>
              <Badge
                variant={
                  diasSemMovimentacao > 30
                    ? "destructive"
                    : diasSemMovimentacao > 15
                      ? "secondary"
                      : "outline"
                }
              >
                {diasSemMovimentacao} dias
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
