"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useColaborador } from "@/hooks/useColaborador";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  FolderKanban,
  Activity,
  User,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColaboradorProtocolosTable } from "@/components/colaborador/ColaboradorProtocolosTable";
import { ColaboradorProjetosChart } from "@/components/colaborador/ColaboradorProjetosChart";

export default function ColaboradorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const colaboradorId = parseInt(id);

  // Parâmetros opcionais vindos do heatmap
  const diaSemana = searchParams.get("diaSemana");
  const hora = searchParams.get("hora");
  const dataInicio = searchParams.get("dataInicio");
  const dataFim = searchParams.get("dataFim");
  const periodoHeatmap = searchParams.get("periodo");

  const { data: detalhes, isLoading, error } = useColaborador(colaboradorId);

  const handleVoltar = () => {
    // Verifica se há histórico, senão vai para análises
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/analises/por-projeto");
    }
  };

  if (error) {
    return (
      <>
        <Header title="Colaborador" subtitle="Detalhes do colaborador" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : "Erro ao carregar colaborador"}
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4" onClick={handleVoltar}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </>
    );
  }

  if (isLoading || !detalhes) {
    return (
      <>
        <Header title="Colaborador" subtitle="Carregando..." />
        <div className="p-6 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          {/* KPIs skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
          {/* Tabs skeleton */}
          <Skeleton className="h-96" />
        </div>
      </>
    );
  }

  const { colaborador, metricas, kpis } = detalhes;

  // Filtros vindos do heatmap para exibição
  const filtrosAtivos = [];
  if (diaSemana) {
    const dias = ["", "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    filtrosAtivos.push(`Dia: ${dias[parseInt(diaSemana)] || diaSemana}`);
  }
  if (hora) {
    filtrosAtivos.push(`Hora: ${hora}h`);
  }
  if (dataInicio || dataFim) {
    filtrosAtivos.push(`Período: ${dataInicio || "..."} a ${dataFim || "..."}`);
  }
  if (periodoHeatmap && !dataInicio && !dataFim) {
    filtrosAtivos.push(`Últimos ${periodoHeatmap} meses`);
  }

  return (
    <>
      <Header
        title={colaborador.nome}
        subtitle={`Código: ${colaborador.codigo} | Login: ${colaborador.login}`}
      />
      <div className="p-6">
        <div className="space-y-6">
          {/* Botão Voltar e badges */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button variant="outline" onClick={handleVoltar}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Badge Setor */}
              {colaborador.nomeSetor && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {colaborador.nomeSetor}
                </Badge>
              )}

              {/* Badge Status */}
              {colaborador.isAtivo ? (
                <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Inativo
                </Badge>
              )}
            </div>
          </div>

          {/* Filtros vindos do heatmap */}
          {filtrosAtivos.length > 0 && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>Filtros aplicados: {filtrosAtivos.join(" | ")}</AlertDescription>
            </Alert>
          )}

          {/* Grid de KPIs principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Total de Protocolos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total de Protocolos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{kpis.totalProtocolos.toLocaleString("pt-BR")}</p>
                <p className="text-xs text-muted-foreground">que participou (enviou ou recebeu)</p>
              </CardContent>
            </Card>

            {/* Em Andamento */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">
                  {kpis.protocolosEmAndamento.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">protocolos ativos</p>
              </CardContent>
            </Card>

            {/* Finalizados */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Finalizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">
                  {kpis.protocolosFinalizados.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">protocolos concluídos</p>
              </CardContent>
            </Card>

            {/* Tempo Médio de Envio */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo Médio de Envio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {kpis.tempoMedioEnvioHoras
                    ? kpis.tempoMedioEnvioHoras >= 24
                      ? `${Math.round(kpis.tempoMedioEnvioHoras / 24)}d`
                      : `${kpis.tempoMedioEnvioHoras}h`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {kpis.tempoMedioEnvioHoras
                    ? `(${kpis.tempoMedioEnvioHoras}h) para movimentar`
                    : "para movimentar protocolo"}
                </p>
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-4">
                  <div>
                    <p className="text-3xl font-bold">{kpis.protocolosHoje}</p>
                    <p className="text-xs text-muted-foreground">hoje</p>
                  </div>
                  <div className="border-l pl-4">
                    <p className="text-2xl font-semibold text-muted-foreground">
                      {kpis.protocolosSemana}
                    </p>
                    <p className="text-xs text-muted-foreground">na semana</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projetos Ativos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Projetos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">
                  {kpis.projetosAtivos.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">projetos diferentes que atua</p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas adicionais */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Média diária</p>
                    <p className="text-xl font-bold">
                      {kpis.mediaMovimentacoesDia.toFixed(1)} mov/dia
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Movimentações hoje</p>
                    <p className="text-xl font-bold">{kpis.movimentacoesHoje}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Protocolos em posse</p>
                    <p className="text-xl font-bold">{metricas.protocolosEmPosse}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="protocolos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="protocolos" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Protocolos
              </TabsTrigger>
              <TabsTrigger value="por-projeto" className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Por Projeto
              </TabsTrigger>
              <TabsTrigger value="atividade" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Atividade
              </TabsTrigger>
            </TabsList>

            <TabsContent value="protocolos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Protocolos que participou
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ColaboradorProtocolosTable
                    colaboradorId={colaboradorId}
                    filtrosHeatmap={{
                      diaSemana: diaSemana ? parseInt(diaSemana) : undefined,
                      hora: hora ? parseInt(hora) : undefined,
                      dataInicio: dataInicio || undefined,
                      dataFim: dataFim || undefined,
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="por-projeto" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5" />
                    Atuação por Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ColaboradorProjetosChart colaboradorId={colaboradorId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="atividade" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Atividade Temporal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Placeholder - será implementado no próximo prompt */}
                  <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">
                      Gráfico de atividade temporal será implementado aqui
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
