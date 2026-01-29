"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { useSetoresMetricas } from "@/hooks/useSetores";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Calendar,
  Users,
  ArrowUpDown,
  Clock,
  BarChart3,
  TableIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
} from "lucide-react";
import type { PeriodoDashboard, SetorMetricas } from "@/types/dashboard";

// Opções de período
const PERIODO_OPTIONS: { value: PeriodoDashboard; label: string }[] = [
  { value: "30d", label: "Últimos 30 dias" },
  { value: "60d", label: "Últimos 60 dias" },
  { value: "90d", label: "Últimos 90 dias" },
  { value: "180d", label: "Últimos 6 meses" },
  { value: "365d", label: "Último ano" },
];

// Função para formatar nome do setor
function formatarNomeSetor(nome: string): string {
  return nome.replace(/^-\s*/, "").trim();
}

// Função para formatar tempo em dias
function formatarTempo(dias: number | null): string {
  if (dias === null || dias === undefined) {
    return "—";
  }
  if (dias < 1) {
    return `${(dias * 24).toFixed(1)}h`;
  }
  return `${dias.toFixed(1)} dias`;
}

// Função para cor baseada no tempo
function getCorTempo(dias: number): string {
  if (dias <= 2) {
    return "#22c55e";
  } // verde - rápido
  if (dias <= 5) {
    return "#f59e0b";
  } // amarelo - médio
  return "#ef4444"; // vermelho - lento
}

// Componente de KPI Card
function KPICard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subtitle?: string;
  trend?: { value: number; label: string };
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && (
              <div
                className={`flex items-center gap-1 text-xs mt-1 ${
                  trend.value >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.value >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {trend.value >= 0 ? "+" : ""}
                  {trend.value}% {trend.label}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de linha da tabela de setores
function SetorRow({
  setor,
  ranking,
  mediasGerais,
  onClick,
}: {
  setor: SetorMetricas;
  ranking: number;
  mediasGerais: {
    movimentacoes: number;
    tempoMedio: number;
  };
  onClick: () => void;
}) {
  const acimaDaMediaMov = setor.movimentacoesPeriodo > mediasGerais.movimentacoes;
  const abaixoDaMediaTempo =
    setor.tempoMedioDias !== null && setor.tempoMedioDias < mediasGerais.tempoMedio;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
            ranking <= 3
              ? ranking === 1
                ? "bg-yellow-500 text-white"
                : ranking === 2
                  ? "bg-gray-400 text-white"
                  : "bg-orange-500 text-white"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {ranking}
        </div>
        <div>
          <p className="font-medium group-hover:text-primary transition-colors">
            {formatarNomeSetor(setor.nomeSetor)}
          </p>
          <p className="text-sm text-muted-foreground">{setor.totalColaboradores} colaboradores</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Movimentações */}
        <div className="text-center min-w-[100px]">
          <p className="text-xs text-muted-foreground mb-1">Movimentações</p>
          <div className="flex items-center justify-center gap-1">
            <Badge variant={acimaDaMediaMov ? "default" : "secondary"}>
              {setor.movimentacoesPeriodo}
            </Badge>
            {acimaDaMediaMov ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
          </div>
        </div>

        {/* Protocolos */}
        <div className="text-center min-w-[80px] hidden md:block">
          <p className="text-xs text-muted-foreground mb-1">Protocolos</p>
          <Badge variant="outline">{setor.totalProtocolos}</Badge>
        </div>

        {/* Em andamento / Finalizados */}
        <div className="text-center min-w-[120px] hidden lg:block">
          <p className="text-xs text-muted-foreground mb-1">Andamento / Fin.</p>
          <div className="flex items-center justify-center gap-1">
            <Badge variant="outline" className="text-amber-600">
              {setor.protocolosEmAndamento}
            </Badge>
            <span className="text-muted-foreground">/</span>
            <Badge variant="outline" className="text-green-600">
              {setor.protocolosFinalizados}
            </Badge>
          </div>
        </div>

        {/* Tempo Médio */}
        <div className="text-center min-w-[100px]">
          <p className="text-xs text-muted-foreground mb-1">Tempo Médio</p>
          <div className="flex items-center justify-center gap-1">
            <Badge variant={abaixoDaMediaTempo ? "default" : "secondary"}>
              {formatarTempo(setor.tempoMedioDias)}
            </Badge>
            {setor.tempoMedioDias !== null &&
              (abaixoDaMediaTempo ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ))}
          </div>
        </div>

        {/* Indicador de navegação */}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

export default function VisaoSetoresPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Inicializar estado a partir da URL
  const [periodo, setPeriodo] = useState<PeriodoDashboard>(() => {
    const urlPeriodo = searchParams.get("periodo");
    return (urlPeriodo as PeriodoDashboard) || "30d";
  });
  const [tipoGrafico, setTipoGrafico] = useState<"tempo" | "volume">(() => {
    const urlTipo = searchParams.get("tipoGrafico");
    return urlTipo === "volume" ? "volume" : "tempo";
  });

  // Sincronizar URL quando filtros mudam
  const updateUrl = useCallback(
    (newPeriodo: PeriodoDashboard, newTipoGrafico: "tempo" | "volume") => {
      const params = new URLSearchParams();

      if (newPeriodo !== "30d") {
        params.set("periodo", newPeriodo);
      }
      if (newTipoGrafico !== "tempo") {
        params.set("tipoGrafico", newTipoGrafico);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  // Atualizar URL quando filtros mudam
  useEffect(() => {
    updateUrl(periodo, tipoGrafico);
  }, [periodo, tipoGrafico, updateUrl]);

  // Handler para navegar para página de performance do setor
  const handleSetorClick = useCallback(
    (codSetor: number) => {
      router.push(`/equipes/usuarios?codSetor=${codSetor}`);
    },
    [router]
  );

  // Buscar métricas dos setores
  const { data: setores = [], isLoading } = useSetoresMetricas({ periodo });

  // Calcular KPIs gerais
  const kpis = useMemo(() => {
    if (setores.length === 0) {
      return {
        totalSetores: 0,
        totalColaboradores: 0,
        totalMovimentacoes: 0,
        tempoMedioGeral: 0,
        setorMaisAtivo: null as SetorMetricas | null,
        setorMaisRapido: null as SetorMetricas | null,
      };
    }

    const totalColaboradores = setores.reduce((sum, s) => sum + s.totalColaboradores, 0);
    const totalMovimentacoes = setores.reduce((sum, s) => sum + s.movimentacoesPeriodo, 0);

    const setoresComTempo = setores.filter((s) => s.tempoMedioDias !== null);
    const tempoMedioGeral =
      setoresComTempo.length > 0
        ? setoresComTempo.reduce((sum, s) => sum + (s.tempoMedioDias || 0), 0) /
          setoresComTempo.length
        : 0;

    const setorMaisAtivo = setores.reduce(
      (max, s) => (s.movimentacoesPeriodo > (max?.movimentacoesPeriodo || 0) ? s : max),
      null as SetorMetricas | null
    );

    const setorMaisRapido = setoresComTempo.reduce(
      (min, s) =>
        s.tempoMedioDias !== null &&
        (min === null || s.tempoMedioDias < (min.tempoMedioDias || Infinity))
          ? s
          : min,
      null as SetorMetricas | null
    );

    return {
      totalSetores: setores.length,
      totalColaboradores,
      totalMovimentacoes,
      tempoMedioGeral,
      setorMaisAtivo,
      setorMaisRapido,
    };
  }, [setores]);

  // Médias para comparação
  const mediasGerais = useMemo(() => {
    if (setores.length === 0) {
      return { movimentacoes: 0, tempoMedio: 0 };
    }

    const mediaMovimentacoes =
      setores.reduce((sum, s) => sum + s.movimentacoesPeriodo, 0) / setores.length;

    const setoresComTempo = setores.filter((s) => s.tempoMedioDias !== null);
    const mediaTempo =
      setoresComTempo.length > 0
        ? setoresComTempo.reduce((sum, s) => sum + (s.tempoMedioDias || 0), 0) /
          setoresComTempo.length
        : 0;

    return {
      movimentacoes: mediaMovimentacoes,
      tempoMedio: mediaTempo,
    };
  }, [setores]);

  // Label do período
  const periodoLabel = PERIODO_OPTIONS.find((p) => p.value === periodo)?.label || "Últimos 30 dias";

  // Dados para gráfico de tempo médio
  const dadosGraficoTempo = useMemo(() => {
    if (setores.length === 0) {
      return [];
    }
    return setores
      .filter((s) => s.tempoMedioDias !== null && s.tempoMedioDias > 0)
      .sort((a, b) => (b.tempoMedioDias || 0) - (a.tempoMedioDias || 0))
      .map((s) => ({
        setor:
          formatarNomeSetor(s.nomeSetor).length > 20
            ? formatarNomeSetor(s.nomeSetor).substring(0, 20) + "..."
            : formatarNomeSetor(s.nomeSetor),
        setorCompleto: formatarNomeSetor(s.nomeSetor),
        tempoMedio: Number((s.tempoMedioDias || 0).toFixed(2)),
        codSetor: s.codSetor,
      }));
  }, [setores]);

  // Dados para gráfico de volume de movimentações
  const dadosGraficoVolume = useMemo(() => {
    if (setores.length === 0) {
      return [];
    }
    return setores
      .sort((a, b) => b.movimentacoesPeriodo - a.movimentacoesPeriodo)
      .map((s) => ({
        setor:
          formatarNomeSetor(s.nomeSetor).length > 20
            ? formatarNomeSetor(s.nomeSetor).substring(0, 20) + "..."
            : formatarNomeSetor(s.nomeSetor),
        setorCompleto: formatarNomeSetor(s.nomeSetor),
        movimentacoes: s.movimentacoesPeriodo,
        protocolos: s.totalProtocolos,
        codSetor: s.codSetor,
      }));
  }, [setores]);

  return (
    <>
      <Header
        title="Visão por Setores"
        subtitle="Comparativo de desempenho entre setores da organização"
      />

      <div className="p-6 space-y-6">
        {/* Header com filtros */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Analisando {kpis.totalSetores} setores
            </span>
          </div>

          {/* Filtro de período */}
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoDashboard)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODO_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total de Colaboradores"
            value={kpis.totalColaboradores}
            icon={Users}
            subtitle={`Em ${kpis.totalSetores} setores`}
            isLoading={isLoading}
          />
          <KPICard
            title="Total de Movimentações"
            value={kpis.totalMovimentacoes}
            icon={ArrowUpDown}
            subtitle={periodoLabel}
            isLoading={isLoading}
          />
          <KPICard
            title="Setor Mais Ativo"
            value={kpis.setorMaisAtivo ? formatarNomeSetor(kpis.setorMaisAtivo.nomeSetor) : "—"}
            icon={TrendingUp}
            subtitle={
              kpis.setorMaisAtivo
                ? `${kpis.setorMaisAtivo.movimentacoesPeriodo} movimentações`
                : undefined
            }
            isLoading={isLoading}
          />
          <KPICard
            title="Tempo Médio Geral"
            value={formatarTempo(kpis.tempoMedioGeral)}
            icon={Clock}
            subtitle={
              kpis.setorMaisRapido
                ? `Mais rápido: ${formatarNomeSetor(kpis.setorMaisRapido.nomeSetor)}`
                : undefined
            }
            isLoading={isLoading}
          />
        </div>

        {/* Conteúdo principal com tabs */}
        <Tabs defaultValue="tabela" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tabela" className="flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Tabela
            </TabsTrigger>
            <TabsTrigger value="grafico" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Gráfico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tabela">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Desempenho por Setor</span>
                  <Badge variant="outline" className="font-normal">
                    Ordenado por movimentações
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Clique em um setor para ver os colaboradores e métricas detalhadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : setores.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum dado encontrado para o período selecionado
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Legenda */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2 border-b">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span>Acima da média</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span>Abaixo da média</span>
                      </div>
                      <span className="ml-auto">
                        Média mov.: {mediasGerais.movimentacoes.toFixed(0)} | Média tempo:{" "}
                        {formatarTempo(mediasGerais.tempoMedio)}
                      </span>
                    </div>

                    {/* Lista de setores */}
                    {setores.map((setor, index) => (
                      <SetorRow
                        key={setor.codSetor}
                        setor={setor}
                        ranking={index + 1}
                        mediasGerais={mediasGerais}
                        onClick={() => handleSetorClick(setor.codSetor)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grafico" className="space-y-4">
            {/* Toggle para escolher tipo de gráfico */}
            <div className="flex items-center gap-2">
              <Button
                variant={tipoGrafico === "tempo" ? "default" : "outline"}
                size="sm"
                onClick={() => setTipoGrafico("tempo")}
              >
                <Clock className="h-4 w-4 mr-2" />
                Tempo Médio
              </Button>
              <Button
                variant={tipoGrafico === "volume" ? "default" : "outline"}
                size="sm"
                onClick={() => setTipoGrafico("volume")}
              >
                <Activity className="h-4 w-4 mr-2" />
                Volume
              </Button>
            </div>

            {/* Gráfico de Tempo Médio */}
            {tipoGrafico === "tempo" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Tempo Médio de Tramitação por Setor
                  </CardTitle>
                  <CardDescription>
                    Tempo médio que os protocolos ficam em cada setor antes de serem movimentados.
                    Clique em uma barra para ver detalhes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : dadosGraficoTempo.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado de tempo disponível para o período
                    </p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                          data={dadosGraficoTempo}
                          layout="vertical"
                          margin={{ left: 10, right: 30, top: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" unit=" dias" tick={{ fontSize: 12 }} />
                          <YAxis
                            type="category"
                            dataKey="setor"
                            width={150}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) {
                                return null;
                              }
                              const data = payload[0].payload as {
                                setor: string;
                                setorCompleto: string;
                                tempoMedio: number;
                                codSetor: number;
                              };
                              return (
                                <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                                  <p className="font-semibold text-popover-foreground">
                                    {data.setorCompleto}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Tempo Medio:{" "}
                                    <span className="font-medium text-popover-foreground">
                                      {data.tempoMedio.toFixed(2)} dias
                                    </span>
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <ReferenceLine
                            x={mediasGerais.tempoMedio}
                            stroke="#888"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                            label={{
                              value: `Média: ${mediasGerais.tempoMedio.toFixed(1)}d`,
                              position: "top",
                              fill: "#888",
                              fontSize: 11,
                            }}
                          />
                          <Bar
                            dataKey="tempoMedio"
                            name="Tempo Médio"
                            radius={[0, 4, 4, 0]}
                            onClick={(data) => {
                              if (data && data.codSetor) {
                                handleSetorClick(data.codSetor);
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            {dadosGraficoTempo.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getCorTempo(entry.tempoMedio)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Legenda de cores */}
                      <div className="flex items-center justify-center gap-6 mt-4 p-2 bg-muted/50 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-foreground">≤ 2 dias (Rápido)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-foreground">2-5 dias (Médio)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-foreground">&gt; 5 dias (Lento)</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Volume de Movimentações */}
            {tipoGrafico === "volume" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Volume de Movimentações por Setor
                  </CardTitle>
                  <CardDescription>
                    Quantidade de movimentações realizadas por cada setor no período. Clique em uma
                    barra para ver detalhes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : dadosGraficoVolume.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum dado disponível para o período
                    </p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                          data={dadosGraficoVolume}
                          layout="vertical"
                          margin={{ left: 10, right: 30, top: 20, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis
                            type="category"
                            dataKey="setor"
                            width={150}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip
                            cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) {
                                return null;
                              }
                              const data = payload[0].payload as {
                                setor: string;
                                setorCompleto: string;
                                movimentacoes: number;
                                protocolos: number;
                                codSetor: number;
                              };
                              return (
                                <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
                                  <p className="font-semibold text-popover-foreground">
                                    {data.setorCompleto}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Movimentacoes:{" "}
                                    <span className="font-medium text-popover-foreground">
                                      {data.movimentacoes}
                                    </span>
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Protocolos:{" "}
                                    <span className="font-medium text-popover-foreground">
                                      {data.protocolos}
                                    </span>
                                  </p>
                                </div>
                              );
                            }}
                          />
                          <ReferenceLine
                            x={mediasGerais.movimentacoes}
                            stroke="#888"
                            strokeDasharray="3 3"
                            strokeWidth={2}
                            label={{
                              value: `Média: ${mediasGerais.movimentacoes.toFixed(0)}`,
                              position: "top",
                              fill: "#888",
                              fontSize: 11,
                            }}
                          />
                          <Bar
                            dataKey="movimentacoes"
                            name="Movimentações"
                            fill="#3b82f6"
                            radius={[0, 4, 4, 0]}
                            onClick={(data) => {
                              if (data && data.codSetor) {
                                handleSetorClick(data.codSetor);
                              }
                            }}
                            style={{ cursor: "pointer" }}
                          />
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Info adicional */}
                      <div className="flex items-center justify-center gap-2 mt-4 p-2 bg-muted/50 rounded-lg text-sm">
                        <div className="w-4 h-0 border-t-2 border-dashed border-muted-foreground" />
                        <span className="text-foreground">
                          Linha tracejada = Média geral ({mediasGerais.movimentacoes.toFixed(0)}{" "}
                          movimentações)
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
