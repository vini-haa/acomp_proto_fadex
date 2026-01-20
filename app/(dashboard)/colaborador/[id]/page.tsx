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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const { colaborador, metricas } = detalhes;

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

          {/* Grid de KPIs - Placeholder para próximo prompt */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Movimentações Enviadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {metricas.totalMovimentacoesEnviadas.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Movimentações Recebidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {metricas.totalMovimentacoesRecebidas.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Protocolos Finalizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {metricas.totalProtocolosFinalizados.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">últimos 30 dias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Médio Resposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {metricas.tempoMedioRespostaHoras ? `${metricas.tempoMedioRespostaHoras}h` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">para receber protocolos</p>
              </CardContent>
            </Card>
          </div>

          {/* Métricas adicionais */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Média diária</p>
                    <p className="text-xl font-bold">
                      {metricas.mediaMovimentacoesPorDia.toFixed(1)} mov/dia
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
                  {/* Placeholder - será implementado no próximo prompt */}
                  <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">
                      Tabela de protocolos será implementada aqui
                    </p>
                  </div>
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
                  {/* Placeholder - será implementado no próximo prompt */}
                  <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">
                      Comparativo por projeto será implementado aqui
                    </p>
                  </div>
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
