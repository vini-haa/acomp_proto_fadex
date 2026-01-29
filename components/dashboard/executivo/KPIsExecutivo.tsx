"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { KPIsExecutivo as KPIsExecutivoType } from "@/types/dashboard";
import {
  FileText,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIsExecutivoProps {
  data: KPIsExecutivoType;
}

interface KPICardProps {
  titulo: string;
  valor: number | string;
  variacao: number;
  icon: React.ReactNode;
  formato?: "numero" | "dias" | "percentual" | "moeda";
  inverterCor?: boolean; // Para métricas onde menos é melhor
}

/**
 * Formata valor monetário para exibição compacta
 */
function formatarMoeda(valor: number): string {
  if (valor >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)} Mi`;
  }
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(0)} mil`;
  }
  return `R$ ${valor.toFixed(0)}`;
}

function KPICard({
  titulo,
  valor,
  variacao,
  icon,
  formato = "numero",
  inverterCor = false,
}: KPICardProps) {
  const formatarValor = () => {
    if (formato === "dias") {
      return `${valor} dias`;
    }
    if (formato === "percentual") {
      return `${valor}%`;
    }
    if (formato === "moeda") {
      return formatarMoeda(Number(valor));
    }
    return Number(valor).toLocaleString("pt-BR");
  };

  // Determina se a variação é positiva (boa)
  const isPositivo = inverterCor ? variacao < 0 : variacao > 0;
  const isNegativo = inverterCor ? variacao > 0 : variacao < 0;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
            <p className="text-2xl font-bold">{formatarValor()}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1">
          {variacao !== 0 ? (
            <>
              {isPositivo ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : isNegativo ? (
                <TrendingDown className="h-3 w-3 text-red-600" />
              ) : (
                <Minus className="h-3 w-3 text-gray-500" />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isPositivo && "text-green-600",
                  isNegativo && "text-red-600",
                  !isPositivo && !isNegativo && "text-gray-500"
                )}
              >
                {variacao > 0 ? "+" : ""}
                {variacao}%
              </span>
              <span className="text-xs text-muted-foreground">vs periodo anterior</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Sem variacao</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const KPIsExecutivo = memo(function KPIsExecutivo({ data }: KPIsExecutivoProps) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <KPICard
        titulo="Protocolos Pendentes"
        valor={data.pendentes}
        variacao={data.pendentesVariacao}
        icon={<FileText className="h-5 w-5 text-primary" />}
        inverterCor={true} // Menos pendentes é melhor
      />
      <KPICard
        titulo="Finalizados no Periodo"
        valor={data.finalizados}
        variacao={data.finalizadosVariacao}
        icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
      />
      <KPICard
        titulo="Tempo Medio"
        valor={data.tempoMedioDias}
        variacao={data.tempoMedioVariacao}
        icon={<Clock className="h-5 w-5 text-blue-600" />}
        formato="dias"
        inverterCor={true} // Menos tempo é melhor
      />
      <KPICard
        titulo="No Prazo (SLA)"
        valor={data.percentualNoPrazo}
        variacao={data.percentualVariacao}
        icon={<Target className="h-5 w-5 text-amber-600" />}
        formato="percentual"
      />
      <KPICard
        titulo="Valor Pendente"
        valor={data.valorPendente}
        variacao={data.valorPendenteVariacao}
        icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
        formato="moeda"
        inverterCor={true} // Menos valor pendente é melhor
      />
    </div>
  );
});
