"use client";

import { Clock, CheckCircle, Plus, Calendar, AlertTriangle, AlertCircle } from "lucide-react";
import { KPICard } from "./KPICard";
import { useKPIs } from "@/hooks/useKPIs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TODOS_SETORES } from "@/lib/constants/setores";

interface KPICardsProps {
  periodo?: "mes_atual" | "7d" | "30d" | "60d" | "90d" | "6m" | "1y" | "ytd" | "all";
  codigoSetor?: number;
}

export function KPICards({ periodo = "all", codigoSetor = 48 }: KPICardsProps) {
  const { data: kpis, isLoading, error } = useKPIs({ periodo, codigoSetor });
  const isMacroView = codigoSetor === TODOS_SETORES;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar KPIs. Tente novamente mais tarde.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (!kpis) {
    return null;
  }

  // Formata min/max para exibição
  const minMaxInfo =
    kpis.minDiasFinanceiro !== null && kpis.maxDiasFinanceiro !== null
      ? `Min: ${kpis.minDiasFinanceiro} dias | Max: ${kpis.maxDiasFinanceiro} dias`
      : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Total em Andamento - ATUALMENTE no setor */}
      <KPICard
        title="Em Andamento"
        value={kpis.totalEmAndamento.toLocaleString("pt-BR")}
        icon={Clock}
        description={
          isMacroView
            ? "Total de protocolos em trâmite em todos os setores da fundação."
            : "Total de protocolos que estão no setor neste momento."
        }
        variant="default"
      />

      {/* Novos no Mês - Entraram este mês */}
      <KPICard
        title="Novos no Mês"
        value={kpis.novosMesAtual.toLocaleString("pt-BR")}
        icon={Plus}
        description={
          isMacroView
            ? "Novos protocolos que entraram na fundação neste mês."
            : "Representa o volume de novos protocolos recebidos entre o dia 1 do mês atual e hoje."
        }
        variant="default"
      />

      {/* Média de Permanência - Finalizados (com min/max) */}
      <KPICard
        title={isMacroView ? "Tempo Médio até Arquivamento" : "Média de Permanência"}
        value={kpis.mediaDiasFinanceiro ? `${kpis.mediaDiasFinanceiro.toFixed(1)} dias` : "0 dias"}
        icon={Calendar}
        extraInfo={minMaxInfo || undefined}
        description={
          isMacroView
            ? "Tempo médio da entrada do protocolo até sua finalização."
            : "Baseado nos protocolos finalizados nos últimos 90 dias."
        }
        variant="default"
      />

      {/* Em Dia - Menos de 15 dias - ATUALMENTE */}
      <KPICard
        title="Em Dia (< 15 dias)"
        value={kpis.emDiaMenos15Dias.toLocaleString("pt-BR")}
        icon={CheckCircle}
        description={
          isMacroView
            ? "Protocolos em todos os setores há menos de 15 dias."
            : "Protocolos no setor há menos de 15 dias."
        }
        variant="success"
      />

      {/* Urgentes 15-30 dias - ATUALMENTE */}
      <KPICard
        title="Urgentes (15-30 dias)"
        value={kpis.urgentes15a30Dias.toLocaleString("pt-BR")}
        icon={AlertCircle}
        description={
          isMacroView
            ? "Protocolos parados em setores entre 15 e 30 dias."
            : "Protocolos no setor entre 15 e 30 dias."
        }
        variant="warning"
      />

      {/* Críticos > 30 dias - ATUALMENTE */}
      <KPICard
        title="Críticos (> 30 dias)"
        value={kpis.criticosMais30Dias.toLocaleString("pt-BR")}
        icon={AlertTriangle}
        description={
          isMacroView
            ? "Protocolos parados em setores há mais de 30 dias."
            : "Protocolos no setor há mais de 30 dias."
        }
        variant="danger"
      />
    </div>
  );
}
