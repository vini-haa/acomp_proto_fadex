"use client";

import { use } from "react";
import { useProtocolo, useProtocoloCompleto } from "@/hooks/useProtocolos";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  DollarSign,
  Clock,
  Info,
  User,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProtocoloTimeline } from "@/components/timeline/ProtocoloTimeline";
import { Separator } from "@/components/ui/separator";
import {
  LancamentosFinanceiros,
  ResumoTramitacao,
  DadosEnriquecidos,
  VinculosProtocolo,
} from "@/components/protocolo";
import { GitBranch } from "lucide-react";

export default function ProtocoloDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const protocoloId = parseInt(id);

  const { data: protocolo, isLoading, error } = useProtocolo(protocoloId);
  const { data: dadosCompletos, isLoading: isLoadingCompleto } = useProtocoloCompleto(protocoloId);

  if (error) {
    return (
      <>
        <Header title="Protocolo" subtitle="Detalhes do protocolo" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : "Erro ao carregar protocolo"}
            </AlertDescription>
          </Alert>
          <Link href="/protocolos">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </>
    );
  }

  if (isLoading || !protocolo) {
    return (
      <>
        <Header title="Protocolo" subtitle="Carregando..." />
        <div className="p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </>
    );
  }

  const enriquecido = dadosCompletos?.data;
  const temFinanceiro = (enriquecido?.lancamentosFinanceiros?.length ?? 0) > 0;

  return (
    <>
      <Header
        title={`Protocolo ${protocolo.numeroDocumento}`}
        subtitle={`Código interno: ${protocolo.codprot}`}
      />
      <div className="p-6">
        <div className="space-y-6">
          {/* Botão Voltar e badges resumo */}
          <div className="flex items-center justify-between">
            <Link href="/protocolos">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Listagem
              </Button>
            </Link>

            {/* Badges de resumo */}
            <div className="flex items-center gap-2">
              {temFinanceiro && (
                <Badge variant="default" className="bg-green-600">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {enriquecido?.metricas?.totalLancamentosFinanceiros} pagamento(s)
                </Badge>
              )}
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {enriquecido?.metricas?.diasTramitacao || protocolo.diasTramitacao || 0} dias
              </Badge>
            </div>
          </div>

          {/* Resumo de Tramitação - Card em destaque */}
          <ResumoTramitacao
            resumoTempo={enriquecido?.tempoTramitacao?.resumo || []}
            idade={enriquecido?.idade || null}
            totalMovimentacoes={enriquecido?.metricas?.totalMovimentacoes || 0}
            isLoading={isLoadingCompleto}
          />

          {/* Informações Principais */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Card de Informações do Protocolo */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Protocolo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Número do Protocolo</p>
                  <p className="mt-1 text-lg font-bold">{protocolo.numeroDocumento || "—"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    <StatusBadge
                      status={protocolo.statusProtocolo}
                      variant={protocolo.statusVisual}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Assunto</p>
                  <p className="mt-1 font-medium">{protocolo.assunto || "—"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Remetente</p>
                  <p className="mt-1">{protocolo.remetente || "—"}</p>
                </div>

                {protocolo.interessado && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <UserCircle className="h-3 w-3" />
                      Interessado / Beneficiário
                    </p>
                    <p className="mt-1">{protocolo.interessado}</p>
                  </div>
                )}

                {protocolo.usuarioCadastro && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Cadastrado por
                    </p>
                    <p className="mt-1 text-sm">{protocolo.usuarioCadastro}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="mt-1 text-sm bg-muted/50 p-3 rounded-md">
                    {enriquecido?.dadosBasicos?.observacoes || "Sem observações"}
                  </p>
                </div>

                <Separator />

                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Projeto Associado
                </p>

                <div>
                  <p className="text-sm text-muted-foreground">Projeto</p>
                  <p className="mt-1 text-sm">{protocolo.projeto || "—"}</p>
                </div>

                {protocolo.contaCorrente && (
                  <div>
                    <p className="text-sm text-muted-foreground">Conta Corrente</p>
                    <Badge variant="outline" className="mt-1">
                      {protocolo.contaCorrente}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card de Tempos e Fluxo */}
            <Card>
              <CardHeader>
                <CardTitle>Informações de Tramitação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Primeira Movimentação</p>
                  <p className="mt-1 font-medium">
                    {protocolo.dtEntrada
                      ? format(new Date(protocolo.dtEntrada), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Última Movimentação</p>
                  <p className="mt-1 font-medium">
                    {protocolo.dtUltimaMovimentacao
                      ? format(new Date(protocolo.dtUltimaMovimentacao), "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })
                      : "—"}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Tempo Total de Tramitação</p>
                  <p className="mt-1 text-2xl font-bold">
                    {protocolo.diasTramitacao ?? protocolo.diasNoFinanceiro ?? 0} dias
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Faixa de Tempo</p>
                    <Badge variant="outline" className="mt-1">
                      {protocolo.faixaTempo?.replace(/^\d+\.\s*/, "") || "—"}
                    </Badge>
                  </div>
                  {protocolo.qtdSetoresVisitados && (
                    <div>
                      <p className="text-sm text-muted-foreground">Setores Visitados</p>
                      <Badge variant="secondary" className="mt-1">
                        {protocolo.qtdSetoresVisitados} setores
                      </Badge>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Setor de Origem (última mov.)</p>
                  <p className="mt-1 text-sm">{protocolo.setorOrigem || "—"}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Setor Atual</p>
                  <p className="mt-1 text-sm font-medium">{protocolo.setorDestinoAtual || "—"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs com dados enriquecidos */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financeiro
                {temFinanceiro && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                    {enriquecido?.metricas?.totalLancamentosFinanceiros}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="vinculos" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Vínculos
              </TabsTrigger>
              <TabsTrigger value="detalhes" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProtocoloTimeline protocoloId={protocoloId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financeiro" className="mt-6">
              <LancamentosFinanceiros
                lancamentos={enriquecido?.lancamentosFinanceiros || []}
                isLoading={isLoadingCompleto}
              />
            </TabsContent>

            <TabsContent value="vinculos" className="mt-6">
              <VinculosProtocolo codProtocolo={protocoloId} />
            </TabsContent>

            <TabsContent value="detalhes" className="mt-6">
              <DadosEnriquecidos
                dadosBasicos={enriquecido?.dadosBasicos || null}
                situacaoAtual={enriquecido?.situacaoAtual || null}
                origem={enriquecido?.origem || null}
                isLoading={isLoadingCompleto}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
