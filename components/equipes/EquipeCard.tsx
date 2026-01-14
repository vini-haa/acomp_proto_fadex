"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, AlertCircle, Users, Activity } from "lucide-react";
import type { Equipe, CargaTrabalho, StatusGargalo } from "@/types/equipes";

interface EquipeCardProps {
  equipe: Equipe;
}

export function EquipeCard({ equipe }: EquipeCardProps) {
  const getCargaBadge = (carga: CargaTrabalho) => {
    const variants = {
      CRÍTICA: {
        variant: "destructive" as const,
        label: "Crítica",
      },
      "MUITO ALTA": {
        variant: "destructive" as const,
        label: "Muito Alta",
      },
      ALTA: {
        variant: "default" as const,
        label: "Alta",
      },
      MODERADA: {
        variant: "secondary" as const,
        label: "Moderada",
      },
      NORMAL: {
        variant: "outline" as const,
        label: "Normal",
      },
    };
    return variants[carga] || variants.NORMAL;
  };

  const getGargaloIcon = (status: StatusGargalo) => {
    if (status === "GARGALO CRÍTICO") {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (status === "GARGALO") {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    if (status === "ATENÇÃO") {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const cargaConfig = getCargaBadge(equipe.cargaTrabalho);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">{equipe.nomeSetor}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getGargaloIcon(equipe.statusGargalo)}
              <span className="text-xs text-muted-foreground">{equipe.statusGargalo}</span>
            </div>
          </div>
          <Badge variant={cargaConfig.variant}>{cargaConfig.label}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Métricas Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-3 w-3" />
              <span>Membros</span>
            </div>
            <p className="text-2xl font-bold">{equipe.totalMembros}</p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Activity className="h-3 w-3" />
              <span>Em posse</span>
            </div>
            <p className="text-2xl font-bold">{equipe.protocolosEmPosse.toLocaleString()}</p>
          </div>
        </div>

        {/* Movimentações */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Movimentações (30d):</span>
            <Badge variant="outline">{equipe.movimentacoes30d.toLocaleString()}</Badge>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Movimentações (7d):</span>
            <Badge variant="outline">{equipe.movimentacoes7d.toLocaleString()}</Badge>
          </div>

          {equipe.protocolosParados > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Protocolos parados:</span>
              <Badge variant="destructive">{equipe.protocolosParados.toLocaleString()}</Badge>
            </div>
          )}

          {equipe.tempoMedioRespostaHoras !== null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tempo médio:</span>
              <Badge variant="secondary">{equipe.tempoMedioRespostaHoras.toFixed(1)}h</Badge>
            </div>
          )}
        </div>

        {/* Lista de Membros */}
        {equipe.membros && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {equipe.membros}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
