"use client";

import { use } from "react";
import Link from "next/link";
import { Header } from "@/components/dashboard/Header";
import { useEquipeDetalhes } from "@/hooks/useEquipeDetalhes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Users,
  Activity,
  TrendingUp,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface HistoricoItem {
  periodo: string;
  movimentacoes: number;
}

interface HistoricoTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: HistoricoItem }>;
}

const HistoricoTooltip = ({ active, payload }: HistoricoTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{data.periodo}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        <span className="font-medium">Movimentações:</span> {data.movimentacoes}
      </p>
    </div>
  );
};

interface PageProps {
  params: Promise<{ codigo: string }>;
}

export default function SetorDetalhesPage({ params }: PageProps) {
  const { codigo: codigoStr } = use(params);
  const codigo = parseInt(codigoStr);
  const { data, isLoading, error } = useEquipeDetalhes(codigo);

  const setor = data?.data?.setor;
  const metricas = data?.data?.metricas;
  const historico = data?.data?.historico || [];
  const protocolos = data?.data?.protocolos || [];
  const membros = data?.data?.membros || [];

  const getStatusBadge = (status: string) => {
    const variants = {
      CRITICO: { variant: "destructive" as const, color: "text-red-600" },
      URGENTE: { variant: "default" as const, color: "text-orange-600" },
      ATENCAO: { variant: "secondary" as const, color: "text-yellow-600" },
      NORMAL: { variant: "outline" as const, color: "text-green-600" },
    };
    return variants[status as keyof typeof variants] || variants.NORMAL;
  };

  if (error) {
    return (
      <>
        <Header title="Erro" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar detalhes do setor.</AlertDescription>
          </Alert>
          <Link href="/equipes" className="mt-4 inline-block">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Equipes
            </Button>
          </Link>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header title="Carregando..." />
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={setor?.nomeSetor || "Setor"}
        subtitle="Analise detalhada de performance e carga de trabalho"
      />

      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Link href="/equipes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Equipes
          </Button>
        </Link>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Membros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{setor?.totalMembros || 0}</div>
              <p className="text-xs text-muted-foreground">Colaboradores ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Posse</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricas?.protocolosEmPosse?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Protocolos atualmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Movimentacoes (30d)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metricas?.movimentacoes30d || 0}</div>
              <p className="text-xs text-muted-foreground">
                {metricas?.movimentacoes7d || 0} nos ultimos 7 dias
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Medio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricas?.tempoMedioRespostaHoras?.toFixed(1) || 0}h
              </div>
              <p className="text-xs text-muted-foreground">Resposta media</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerta de Protocolos Parados */}
        {metricas?.protocolosParados && metricas.protocolosParados > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{metricas.protocolosParados} protocolos</strong> estao parados ha mais de 7
              dias neste setor.
            </AlertDescription>
          </Alert>
        )}

        {/* Grafico de Historico */}
        {historico.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Historico de Movimentacoes (6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historico}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis />
                  <Tooltip content={<HistoricoTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="movimentacoes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Movimentacoes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Grid: Protocolos + Membros */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Protocolos em Posse */}
          <Card>
            <CardHeader>
              <CardTitle>Protocolos em Posse (Top 20 Mais Antigos)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {protocolos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum protocolo em posse no momento
                  </p>
                ) : (
                  protocolos.map((p) => {
                    const statusConfig = getStatusBadge(p.statusUrgencia);
                    return (
                      <Link
                        key={p.codigo}
                        href={`/protocolos/${p.codigo}`}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-colors cursor-pointer group"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-primary group-hover:underline">
                            {p.numero}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.interessado || "Sem interessado"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            No setor ha {p.diasNoSetor} dias
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={statusConfig.variant}>{p.diasTramitacao}d</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{p.statusUrgencia}</p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Membros do Setor */}
          <Card>
            <CardHeader>
              <CardTitle>Membros do Setor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {membros.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum membro cadastrado
                  </p>
                ) : (
                  membros.map((m) => (
                    <div
                      key={m.codUsuario}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{m.nomeUsuario}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.movimentacoesEnviadas30d} movimentacoes/mes
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        {m.tempoMedioRespostaHoras !== null && (
                          <Badge variant="secondary">{m.tempoMedioRespostaHoras.toFixed(1)}h</Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
