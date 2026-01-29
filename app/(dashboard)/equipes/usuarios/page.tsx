"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { useUsuariosPerformance } from "@/hooks/useEquipes";
import { useSetores } from "@/hooks/useSetores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Building2,
  Minus,
  Calendar,
  ChevronRight,
  BarChart3,
  X,
  Send,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import type { UsuarioPerformance, UsuariosFilters } from "@/types/equipes";

// Função para formatar nome do setor (remove prefixo e abrevia se necessário)
function formatarNomeSetor(nome: string, abreviar = false): string {
  // Remove prefixo "- " se existir
  const limpo = nome.replace(/^-\s*/, "").trim();

  if (!abreviar) {
    return limpo;
  }

  // Abreviações para nomes longos
  const abreviacoes: Record<string, string> = {
    "GERENCIA DE FINANÇAS E CONTABILIDADE": "Finanças e Contabilidade",
    "GERÊNCIA DE PROJETOS": "Projetos",
    "GERÊNCIA ADMINISTRATIVA": "Administrativa",
    "ASSESSORIA TÉCNICA / TI": "TI",
    "PORTAL DO COORDENADOR": "Portal Coordenador",
    SECRETARIA: "Secretaria",
  };

  return abreviacoes[limpo] || limpo;
}

// Opções de período
const PERIODO_OPTIONS: { value: UsuariosFilters["periodo"]; label: string; labelCurto: string }[] =
  [
    { value: "7d", label: "Últimos 7 dias", labelCurto: "7d" },
    { value: "30d", label: "Últimos 30 dias", labelCurto: "30d" },
    { value: "90d", label: "Últimos 90 dias", labelCurto: "90d" },
  ];

// Função para formatar tempo (horas ou dias)
function formatarTempo(horas: number | null | undefined): string {
  if (horas === null || horas === undefined || horas === 0) {
    return "—";
  }
  if (horas <= 24) {
    return `${horas.toFixed(1)}h`;
  }
  const dias = horas / 24;
  return `${dias.toFixed(1)} dias`;
}

// Máximo de colaboradores para comparativo
const MAX_SELECIONADOS = 3;

// Cores para o gráfico comparativo
const CORES_COMPARATIVO = ["#3b82f6", "#22c55e", "#f59e0b"];

// Componente de indicador de comparação com média
function ComparativoIndicador({
  valor,
  media,
  inverter = false, // true para métricas onde menor é melhor (ex: tempo)
  mostrarPercentual = true,
}: {
  valor: number;
  media: number | undefined;
  inverter?: boolean;
  mostrarPercentual?: boolean;
}) {
  if (!media || media === 0) {
    return null;
  }

  const percentual = ((valor - media) / media) * 100;

  // Só mostra se diferença > 5% para evitar ruído visual
  if (Math.abs(percentual) < 5) {
    return null;
  }

  const melhor = inverter ? percentual < 0 : percentual > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        melhor ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
      )}
    >
      {melhor ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {mostrarPercentual && (
        <span>
          {percentual > 0 ? "+" : ""}
          {percentual.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

// Componente de métrica individual
function MetricaItem({
  label,
  value,
  icon,
  media,
  inverter = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  media?: number;
  inverter?: boolean;
}) {
  // Extrai valor numérico para comparação
  const valorNumerico =
    typeof value === "number"
      ? value
      : parseFloat(
          String(value)
            .replace(/[^\d.,]/g, "")
            .replace(",", ".")
        ) || 0;

  return (
    <div className="text-center p-2 bg-muted/50 rounded-md">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="flex items-center justify-center gap-1">
        <p className="font-bold text-sm">{value}</p>
        {media !== undefined && (
          <ComparativoIndicador valor={valorNumerico} media={media} inverter={inverter} />
        )}
      </div>
    </div>
  );
}

// Interface para médias do setor
interface MediasSetor {
  movimentacoesEnviadas: number;
  protocolosFinalizados: number;
  tempoMedioTramitacao: number;
  mediaMovimentacoesPorDia: number;
}

// Componente de card do colaborador no comparativo
function ColaboradorCardComparativo({
  colaborador,
  cor,
  onVerDetalhes,
  mediasSetor,
}: {
  colaborador: UsuarioPerformance;
  cor: string;
  onVerDetalhes: (codUsuario: number) => void;
  mediasSetor: MediasSetor | null;
}) {
  const iniciais = colaborador.nomeUsuario
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="relative overflow-hidden">
      {/* Barra de cor no topo */}
      <div className="h-1 w-full" style={{ backgroundColor: cor }} />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center font-semibold text-white"
            style={{ backgroundColor: cor }}
          >
            {iniciais}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{colaborador.nomeUsuario}</CardTitle>
            <p className="text-xs text-muted-foreground truncate">{colaborador.nomeSetor}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Métricas */}
        <div className="grid grid-cols-3 gap-2">
          <MetricaItem
            label="Enviadas"
            value={colaborador.movimentacoesEnviadas30d}
            icon={<Send className="h-3 w-3" />}
            media={mediasSetor?.movimentacoesEnviadas}
          />
          <MetricaItem
            label="Finalizados"
            value={colaborador.protocolosFinalizados30d}
            icon={<CheckCircle2 className="h-3 w-3" />}
            media={mediasSetor?.protocolosFinalizados}
          />
          <MetricaItem
            label="Tempo Médio"
            value={formatarTempo(colaborador.tempoMedioTramitacaoHoras)}
            icon={<Clock className="h-3 w-3" />}
            media={mediasSetor?.tempoMedioTramitacao}
            inverter={true} // Menor tempo é melhor
          />
        </div>

        {/* Média diária */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Média diária</p>
            {mediasSetor && (
              <ComparativoIndicador
                valor={colaborador.mediaMovimentacoesPorDia || 0}
                media={mediasSetor.mediaMovimentacoesPorDia}
              />
            )}
          </div>
          <p className="text-lg font-bold">
            {colaborador.mediaMovimentacoesPorDia?.toFixed(1) || "0"} mov/dia
          </p>
        </div>

        {/* Botão ver detalhes */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onVerDetalhes(colaborador.codUsuario)}
        >
          <ExternalLink className="h-3 w-3 mr-2" />
          Ver detalhes
        </Button>
      </CardContent>
    </Card>
  );
}

// Card de média do setor para referência no comparativo
function MediaSetorCard({
  mediasSetor,
  totalColaboradores,
}: {
  mediasSetor: MediasSetor;
  totalColaboradores: number;
}) {
  return (
    <Card className="border-dashed border-2 bg-muted/30">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">Média do Setor</CardTitle>
            <p className="text-xs text-muted-foreground">
              Baseado em {totalColaboradores} colaboradores
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <MetricaItem
            label="Enviadas"
            value={mediasSetor.movimentacoesEnviadas.toFixed(0)}
            icon={<Send className="h-3 w-3" />}
          />
          <MetricaItem
            label="Finalizados"
            value={mediasSetor.protocolosFinalizados.toFixed(0)}
            icon={<CheckCircle2 className="h-3 w-3" />}
          />
          <MetricaItem
            label="Tempo Médio"
            value={formatarTempo(mediasSetor.tempoMedioTramitacao)}
            icon={<Clock className="h-3 w-3" />}
          />
        </div>

        {/* Média diária */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">Média diária</p>
          <p className="text-lg font-bold text-muted-foreground">
            {mediasSetor.mediaMovimentacoesPorDia.toFixed(1)} mov/dia
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsuariosPerformancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState("");
  const [codSetor, setCodSetor] = useState<number | undefined>(undefined);

  // Ler parâmetro codSetor da URL (para navegação drill-down)
  useEffect(() => {
    const codSetorParam = searchParams.get("codSetor");
    if (codSetorParam) {
      setCodSetor(Number(codSetorParam));
    }
  }, [searchParams]);

  // Estados para seleção múltipla e comparativo
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [mostrarComparativo, setMostrarComparativo] = useState(false);

  // Navegar para detalhes do colaborador
  const navegarParaColaborador = useCallback(
    (codUsuario: number) => {
      router.push(`/colaborador/${codUsuario}`);
    },
    [router]
  );

  // Handler para teclado (acessibilidade)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, codUsuario: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navegarParaColaborador(codUsuario);
      }
    },
    [navegarParaColaborador]
  );
  const [periodo, setPeriodo] = useState<UsuariosFilters["periodo"]>("30d");

  // Buscar setores para o filtro
  const { data: setores = [], isLoading: loadingSetores } = useSetores();

  // Buscar usuários com filtros de setor e período
  const { data: usuarios = [], isLoading } = useUsuariosPerformance({ codSetor, periodo });

  // Buscar todos os usuários para calcular média geral (comparativo) - só quando há filtro de setor
  const { data: todosUsuariosFetch = [] } = useUsuariosPerformance({
    periodo,
    enabled: !!codSetor,
  });
  // Quando não há filtro de setor, "usuarios" já contém todos
  const todosUsuarios = codSetor ? todosUsuariosFetch : usuarios;

  // Label do período selecionado
  const periodoLabel = PERIODO_OPTIONS.find((p) => p.value === periodo)?.label || "30 dias";
  const periodoLabelCurto = PERIODO_OPTIONS.find((p) => p.value === periodo)?.labelCurto || "30d";

  const usuariosFiltrados = useMemo(() => {
    if (!busca.trim()) {
      return usuarios;
    }
    const termoBusca = busca.toLowerCase();
    return usuarios.filter(
      (u: UsuarioPerformance) =>
        u.nomeUsuario.toLowerCase().includes(termoBusca) ||
        u.nomeSetor.toLowerCase().includes(termoBusca)
    );
  }, [usuarios, busca]);

  // Top 3 performers
  const top3 = usuarios.slice(0, 3);

  // Stats gerais
  const stats = useMemo(() => {
    return {
      totalUsuarios: usuarios.length,
      mediaMovimentacoes:
        usuarios.length > 0
          ? usuarios.reduce(
              (sum: number, u: UsuarioPerformance) => sum + (u.movimentacoesEnviadas30d || 0),
              0
            ) / usuarios.length
          : 0,
      topPerformer: usuarios[0]?.nomeUsuario || "-",
    };
  }, [usuarios]);

  // Média geral de todos os setores (para comparativo)
  const mediaGeral = useMemo(() => {
    if (todosUsuarios.length === 0) {
      return 0;
    }
    return (
      todosUsuarios.reduce(
        (sum: number, u: UsuarioPerformance) => sum + (u.movimentacoesEnviadas30d || 0),
        0
      ) / todosUsuarios.length
    );
  }, [todosUsuarios]);

  // Médias do setor para comparativo individual
  const mediasSetor = useMemo(() => {
    if (!usuarios || usuarios.length === 0) {
      return null;
    }

    const total = usuarios.length;
    return {
      movimentacoesEnviadas:
        usuarios.reduce(
          (sum: number, u: UsuarioPerformance) => sum + (u.movimentacoesEnviadas30d || 0),
          0
        ) / total,
      protocolosFinalizados:
        usuarios.reduce(
          (sum: number, u: UsuarioPerformance) => sum + (u.protocolosFinalizados30d || 0),
          0
        ) / total,
      tempoMedioTramitacao:
        usuarios.reduce(
          (sum: number, u: UsuarioPerformance) => sum + (u.tempoMedioTramitacaoHoras || 0),
          0
        ) / total,
      mediaMovimentacoesPorDia:
        usuarios.reduce(
          (sum: number, u: UsuarioPerformance) => sum + (u.mediaMovimentacoesPorDia || 0),
          0
        ) / total,
    };
  }, [usuarios]);

  // Info do setor selecionado
  const setorSelecionado = useMemo(() => {
    if (!codSetor) {
      return null;
    }
    return setores.find((s) => s.codigo === codSetor);
  }, [codSetor, setores]);

  // Comparativo do setor vs média geral
  const comparativoSetor = useMemo(() => {
    if (!codSetor || mediaGeral === 0 || stats.mediaMovimentacoes === 0) {
      return null;
    }

    const diff = stats.mediaMovimentacoes - mediaGeral;
    const percentDiff = (diff / mediaGeral) * 100;

    if (Math.abs(percentDiff) < 5) {
      return { icon: Minus, color: "text-muted-foreground", label: "Na média", percent: 0 };
    }
    if (diff > 0) {
      return {
        icon: TrendingUp,
        color: "text-green-500",
        label: "Acima da média",
        percent: percentDiff,
      };
    }
    return {
      icon: TrendingDown,
      color: "text-red-500",
      label: "Abaixo da média",
      percent: percentDiff,
    };
  }, [codSetor, mediaGeral, stats.mediaMovimentacoes]);

  // Colaboradores selecionados para comparativo
  const colaboradoresSelecionados = useMemo(() => {
    return usuarios.filter((u) => selecionados.includes(u.codUsuario));
  }, [usuarios, selecionados]);

  // Dados para o gráfico comparativo
  const dadosGrafico = useMemo(() => {
    if (colaboradoresSelecionados.length === 0) {
      return [];
    }

    return [
      {
        metrica: "Mov. Enviadas",
        ...colaboradoresSelecionados.reduce(
          (acc, c) => ({
            ...acc,
            [c.nomeUsuario.split(" ")[0]]: c.movimentacoesEnviadas30d,
          }),
          {}
        ),
      },
      {
        metrica: "Finalizados",
        ...colaboradoresSelecionados.reduce(
          (acc, c) => ({
            ...acc,
            [c.nomeUsuario.split(" ")[0]]: c.protocolosFinalizados30d,
          }),
          {}
        ),
      },
    ];
  }, [colaboradoresSelecionados]);

  // Handler para toggle de seleção
  const toggleSelecao = useCallback((codUsuario: number, e?: React.MouseEvent) => {
    // Prevenir propagação para não disparar navegação
    e?.stopPropagation();

    setSelecionados((prev) => {
      if (prev.includes(codUsuario)) {
        return prev.filter((id) => id !== codUsuario);
      }
      if (prev.length >= MAX_SELECIONADOS) {
        return prev; // Não adiciona se já atingiu o limite
      }
      return [...prev, codUsuario];
    });
  }, []);

  // Limpar seleção
  const limparSelecao = useCallback(() => {
    setSelecionados([]);
    setMostrarComparativo(false);
  }, []);

  return (
    <>
      <Header
        title="Performance Individual"
        subtitle="Ranking e métricas detalhadas por colaborador"
      />

      <div className="p-6 space-y-6">
        {/* KPIs Gerais */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
                  <p className="text-xs text-muted-foreground">Colaboradores ativos</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Média de Movimentações
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  {periodoLabelCurto}
                </Badge>
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.mediaMovimentacoes.toFixed(0)}</div>
                  <p className="text-xs text-muted-foreground">Por usuário no período</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Top Performer
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  {periodoLabelCurto}
                </Badge>
              </CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-lg font-bold truncate">{stats.topPerformer}</div>
                  <p className="text-xs text-muted-foreground">
                    {top3[0]?.movimentacoesEnviadas30d || 0} movimentações
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Linha de filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Filtro de Setor */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Setor</label>
                  <Select
                    value={codSetor?.toString() || "all"}
                    onValueChange={(v) => setCodSetor(v === "all" ? undefined : Number(v))}
                  >
                    <SelectTrigger className="w-full min-w-0">
                      <Building2 className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-left flex-1 min-w-0">
                        {codSetor
                          ? formatarNomeSetor(
                              setores.find((s) => s.codigo === codSetor)?.descr || "",
                              true
                            )
                          : "Todos"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os setores</SelectItem>
                      {loadingSetores ? (
                        <SelectItem value="loading" disabled>
                          Carregando...
                        </SelectItem>
                      ) : (
                        setores.map((setor) => (
                          <SelectItem
                            key={setor.codigo}
                            value={setor.codigo.toString()}
                            title={formatarNomeSetor(setor.descr)}
                          >
                            {formatarNomeSetor(setor.descr)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Período */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Select
                    value={periodo}
                    onValueChange={(v) => setPeriodo(v as UsuariosFilters["periodo"])}
                  >
                    <SelectTrigger className="w-full">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value!}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Campo de busca */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome ou setor..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Card de métricas do setor selecionado */}
              {codSetor && setorSelecionado && !isLoading && (
                <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {formatarNomeSetor(setorSelecionado.descr)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.totalUsuarios} usuários • Média:{" "}
                        {stats.mediaMovimentacoes.toFixed(0)} mov ({periodoLabelCurto})
                      </p>
                    </div>
                    {comparativoSetor && (
                      <div className={`flex items-center gap-1 ${comparativoSetor.color}`}>
                        <comparativoSetor.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {comparativoSetor.percent > 0 ? "+" : ""}
                          {comparativoSetor.percent.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {comparativoSetor && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {comparativoSetor.label} (geral: {mediaGeral.toFixed(0)} mov)
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Destaque */}
        {!isLoading && top3.length > 0 && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Top 3 Performers{" "}
                {codSetor && setorSelecionado && `- ${formatarNomeSetor(setorSelecionado.descr)}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {top3.map((user: UsuarioPerformance, index: number) => (
                  <div
                    key={user.codUsuario}
                    role="button"
                    tabIndex={0}
                    onClick={() => navegarParaColaborador(user.codUsuario)}
                    onKeyDown={(e) => handleKeyDown(e, user.codUsuario)}
                    className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-yellow-200 dark:border-yellow-800 cursor-pointer hover:border-yellow-400 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0
                        ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"}
                      `}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate group-hover:text-primary transition-colors">
                          {user.nomeUsuario}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.nomeSetor}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">Movimentações:</span>
                      <Badge variant="default">{user.movimentacoesEnviadas30d}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Tempo tramitação:</span>
                      <Badge
                        variant="secondary"
                        title="Tempo médio que o protocolo ficou no setor antes de ser enviado"
                      >
                        {formatarTempo(user.tempoMedioTramitacaoHoras)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Barra de Seleção (sticky) */}
        {selecionados.length > 0 && (
          <div className="sticky top-0 z-10 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between gap-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {selecionados.length} colaborador{selecionados.length > 1 ? "es" : ""} selecionado
                  {selecionados.length > 1 ? "s" : ""}
                </span>
              </div>
              {selecionados.length < MAX_SELECIONADOS && (
                <span className="text-xs text-muted-foreground">(máx. {MAX_SELECIONADOS})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={limparSelecao}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
              {selecionados.length >= 2 && (
                <Button size="sm" onClick={() => setMostrarComparativo(true)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Comparar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tabela de Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Ranking{" "}
                {codSetor && setorSelecionado
                  ? formatarNomeSetor(setorSelecionado.descr)
                  : "Completo"}{" "}
                ({usuariosFiltrados.length} usuários)
              </span>
              {!selecionados.length && (
                <span className="text-xs font-normal text-muted-foreground">
                  Selecione colaboradores para comparar
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 pr-4">
                  {usuariosFiltrados.map((user: UsuarioPerformance, index: number) => {
                    const isSelected = selecionados.includes(user.codUsuario);
                    return (
                      <div
                        key={user.codUsuario}
                        role="button"
                        tabIndex={0}
                        onClick={() => navegarParaColaborador(user.codUsuario)}
                        onKeyDown={(e) => handleKeyDown(e, user.codUsuario)}
                        className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all cursor-pointer group ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Checkbox para seleção */}
                          <div
                            onClick={(e) => toggleSelecao(user.codUsuario, e)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSelecao(user.codUsuario);
                              }
                            }}
                            className="flex-shrink-0"
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={!isSelected && selecionados.length >= MAX_SELECIONADOS}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                          </div>
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm flex-shrink-0">
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">
                              {user.nomeUsuario}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {user.nomeSetor}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-center hidden sm:block">
                            <p className="text-xs text-muted-foreground mb-1">Enviadas</p>
                            <div className="flex items-center justify-center gap-1">
                              <Badge variant="default">{user.movimentacoesEnviadas30d}</Badge>
                              <ComparativoIndicador
                                valor={user.movimentacoesEnviadas30d}
                                media={mediasSetor?.movimentacoesEnviadas}
                              />
                            </div>
                          </div>
                          <div className="text-center hidden md:block">
                            <p
                              className="text-xs text-muted-foreground mb-1"
                              title="Tempo médio que o protocolo ficou no setor antes de ser enviado"
                            >
                              Tempo Tramitação
                            </p>
                            <div className="flex items-center justify-center gap-1">
                              <Badge variant="secondary">
                                {formatarTempo(user.tempoMedioTramitacaoHoras)}
                              </Badge>
                              <ComparativoIndicador
                                valor={user.tempoMedioTramitacaoHoras || 0}
                                media={mediasSetor?.tempoMedioTramitacao}
                                inverter={true}
                              />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Produtividade</p>
                            <div className="flex items-center justify-center gap-1">
                              <Badge variant="outline">
                                {user.mediaMovimentacoesPorDia?.toFixed(1) || "-"}/dia
                              </Badge>
                              <ComparativoIndicador
                                valor={user.mediaMovimentacoesPorDia || 0}
                                media={mediasSetor?.mediaMovimentacoesPorDia}
                              />
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    );
                  })}

                  {usuariosFiltrados.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado com &quot;{busca}&quot;
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Comparativo */}
      <Dialog open={mostrarComparativo} onOpenChange={setMostrarComparativo}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparativo de Colaboradores
            </DialogTitle>
            <DialogDescription>
              Comparando {colaboradoresSelecionados.length} colaboradores no período de{" "}
              {periodoLabel.toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          {/* Cards dos colaboradores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {colaboradoresSelecionados.map((colab, index) => (
              <ColaboradorCardComparativo
                key={colab.codUsuario}
                colaborador={colab}
                cor={CORES_COMPARATIVO[index]}
                onVerDetalhes={(id) => {
                  setMostrarComparativo(false);
                  navegarParaColaborador(id);
                }}
                mediasSetor={mediasSetor}
              />
            ))}
          </div>

          {/* Card de média do setor para referência */}
          {mediasSetor && (
            <div className="mt-4">
              <MediaSetorCard mediasSetor={mediasSetor} totalColaboradores={usuarios.length} />
            </div>
          )}

          {/* Gráfico comparativo */}
          {colaboradoresSelecionados.length >= 2 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold">Comparativo Visual</h4>
                {mediasSetor && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-4 h-0 border-t-2 border-dashed border-gray-500" />
                    <span>Média do setor</span>
                  </div>
                )}
              </div>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosGrafico} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="metrica" width={100} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    {/* Linhas de referência das médias por métrica */}
                    {mediasSetor && (
                      <>
                        <ReferenceLine
                          x={mediasSetor.movimentacoesEnviadas}
                          stroke="#888"
                          strokeDasharray="3 3"
                          strokeWidth={2}
                          ifOverflow="extendDomain"
                        />
                      </>
                    )}
                    {colaboradoresSelecionados.map((colab, index) => (
                      <Bar
                        key={colab.codUsuario}
                        dataKey={colab.nomeUsuario.split(" ")[0]}
                        fill={CORES_COMPARATIVO[index]}
                        radius={[0, 4, 4, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={limparSelecao}>
              Limpar seleção
            </Button>
            <Button onClick={() => setMostrarComparativo(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
