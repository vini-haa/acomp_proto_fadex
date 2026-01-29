"use client";

import { useVisaoExecutiva, useVisaoSetor } from "@/hooks/useDashboard";
import { PeriodoExecutivo, AnoExecutivo } from "@/types/dashboard";
import { TODOS_SETORES } from "@/lib/constants/setores";
import { KPIsExecutivo } from "./KPIsExecutivo";
import { SaudeSetores } from "./SaudeSetores";
import { AlertasExecutivo } from "./AlertasExecutivo";
import { TempoPorTipoChart } from "./TempoPorTipoChart";
import { PendentesPorSetorChart } from "./PendentesPorSetorChart";
import { TendenciaFluxoChart } from "./TendenciaFluxoChart";
import { TopProjetosProblematicos } from "./TopProjetosProblematicos";
import { SetorVsMedia } from "./SetorVsMedia";
import { ProtocolosCriticos } from "./ProtocolosCriticos";
import { EvolucaoSetorChart } from "./EvolucaoSetorChart";
import { FluxoSetorChart } from "./FluxoSetorChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VisaoExecutivaContentProps {
  codigoSetor: number;
  periodo: PeriodoExecutivo;
  ano: AnoExecutivo;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPIs - 5 cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px]" />
        <Skeleton className="h-[350px]" />
      </div>

      {/* Full width */}
      <Skeleton className="h-[380px]" />

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[350px]" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Nao foi possivel carregar os dados da visao executiva.
        </p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Retorna o label descritivo do periodo de dados
 */
function getLabelPeriodoDados(ano: AnoExecutivo): string {
  if (ano === "todos") {
    return "Dados de janeiro/2023 ate hoje";
  }
  return `Dados de ${ano}`;
}

/**
 * Layout para "Todos os Setores" (visao macro)
 */
function LayoutTodosSetores({ codigoSetor, periodo, ano }: VisaoExecutivaContentProps) {
  const { data, isLoading, error, refetch } = useVisaoExecutiva({
    periodo,
    ano,
    codigoSetor,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }
  if (error || !data) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{getLabelPeriodoDados(ano)}</p>
          <p className="text-xs text-muted-foreground">
            Atualizado em: {new Date(data.dataAtualizacao).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      <KPIsExecutivo data={data.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SaudeSetores data={data.saudeSetores} />
        <AlertasExecutivo data={data.alertas} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendentesPorSetorChart data={data.saudeSetores} />
        <TopProjetosProblematicos data={data.projetosProblematicos} />
      </div>

      <TendenciaFluxoChart data={data.tendenciaFluxo} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TempoPorTipoChart data={data.tempoPorTipo} />
      </div>
    </div>
  );
}

/**
 * Layout para setor especifico (visao focada)
 */
function LayoutSetorEspecifico({ codigoSetor, periodo, ano }: VisaoExecutivaContentProps) {
  const executiva = useVisaoExecutiva({ periodo, ano, codigoSetor });
  const setorData = useVisaoSetor({ codigoSetor, periodo, ano });

  const isLoading = executiva.isLoading || setorData.isLoading;
  const error = executiva.error || setorData.error;

  if (isLoading) {
    return <LoadingSkeleton />;
  }
  if (error || !executiva.data || !setorData.data) {
    return (
      <ErrorState
        onRetry={() => {
          executiva.refetch();
          setorData.refetch();
        }}
      />
    );
  }

  const dataExec = executiva.data;
  const dataSetor = setorData.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium">{dataSetor.setor.nome}</p>
          <p className="text-xs text-muted-foreground">
            {getLabelPeriodoDados(ano)} - Atualizado em:{" "}
            {new Date(dataSetor.dataAtualizacao).toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      {/* KPIs do setor (endpoint existente ja filtra) */}
      <KPIsExecutivo data={dataExec.kpis} />

      {/* Setor vs Media + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SetorVsMedia data={dataSetor.setorVsMedia} />
        <AlertasExecutivo data={dataExec.alertas} />
      </div>

      {/* Protocolos Criticos + Top Projetos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProtocolosCriticos data={dataSetor.protocolosCriticos} />
        <TopProjetosProblematicos data={dataExec.projetosProblematicos} />
      </div>

      {/* Evolucao do Setor (full width) */}
      <EvolucaoSetorChart data={dataSetor.evolucaoSetor} />

      {/* Tempo por Tipo + Fluxo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TempoPorTipoChart data={dataExec.tempoPorTipo} />
        <FluxoSetorChart data={dataSetor.fluxoSetor} />
      </div>
    </div>
  );
}

export function VisaoExecutivaContent({ codigoSetor, periodo, ano }: VisaoExecutivaContentProps) {
  const isSetorEspecifico = codigoSetor !== TODOS_SETORES && codigoSetor > 0;

  if (isSetorEspecifico) {
    return <LayoutSetorEspecifico codigoSetor={codigoSetor} periodo={periodo} ano={ano} />;
  }

  return <LayoutTodosSetores codigoSetor={codigoSetor} periodo={periodo} ano={ano} />;
}
