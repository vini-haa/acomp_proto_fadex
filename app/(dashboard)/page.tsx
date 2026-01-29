"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/dashboard/Header";
import { KPICards } from "@/components/dashboard/KPICards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoExecutivaContent } from "@/components/dashboard/executivo";

// Carregamento lazy dos gráficos para melhor performance
const FluxoTemporalChart = dynamic(
  () =>
    import("@/components/charts/FluxoTemporalChart").then((mod) => ({
      default: mod.FluxoTemporalChart,
    })),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false, // Não renderizar no servidor
  }
);

const ComparativoChart = dynamic(
  () =>
    import("@/components/charts/ComparativoChart").then((mod) => ({
      default: mod.ComparativoChart,
    })),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false,
  }
);
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  FileDown,
  Loader2,
  Calendar,
  Building2,
  LayoutDashboard,
  LineChart,
  CalendarDays,
} from "lucide-react";
import { exportProtocolosToPDF, exportProtocolosToExcel } from "@/lib/export";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSetores } from "@/hooks/useSetores";
import { logger } from "@/lib/logger";
import { TODOS_SETORES } from "@/lib/constants/setores";
import { PeriodoExecutivo, AnoExecutivo } from "@/types/dashboard";

export default function DashboardPage() {
  const [isExporting, setIsExporting] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTROS UNIFICADOS (compartilhados entre Visão Geral e Visão Executiva)
  // ═══════════════════════════════════════════════════════════════════════════
  const [codigoSetor, setCodigoSetor] = useState<number>(TODOS_SETORES);
  const [periodo, setPeriodo] = useState<PeriodoExecutivo>("30d");
  const [ano, setAno] = useState<AnoExecutivo>("todos");

  const { toast } = useToast();
  const { data: setores, isLoading: isLoadingSetores } = useSetores();

  // Função para formatar nome do setor (remove prefixo "- ")
  const formatarNomeSetor = (descr: string) => descr.replace(/^- /, "");

  // Encontra o nome do setor selecionado para exibir no subtítulo
  const setorSelecionado = setores?.find((s) => s.codigo === codigoSetor);
  const nomeSetor =
    codigoSetor === TODOS_SETORES
      ? "Visao Geral da Fundacao"
      : setorSelecionado
        ? formatarNomeSetor(setorSelecionado.descr)
        : "Financeiro";

  const handleExportFullReport = async (format: "excel" | "pdf") => {
    setIsExporting(true);

    try {
      toast({
        title: "Carregando dados...",
        description: "Preparando relatório para exportação.",
      });

      // Carregar dados sob demanda apenas quando exportar
      const protocolosRes = await fetch("/api/protocolos/cached?page=1&pageSize=5000");

      if (!protocolosRes.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const protocolosData = await protocolosRes.json();

      if (format === "excel") {
        await exportProtocolosToExcel(protocolosData.data);
      } else {
        exportProtocolosToPDF(protocolosData.data);
      }

      toast({
        title: "Relatório exportado",
        description: `Protocolos exportados em ${format.toUpperCase()}.`,
      });
    } catch (error) {
      logger.error("Erro ao exportar relatório:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Header title="Dashboard" subtitle={`Visao geral dos protocolos - ${nomeSetor}`} />
      <div className="p-6 space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════════
            FILTROS UNIFICADOS - FORA DAS TABS
            Aplicados tanto na Visão Geral quanto na Visão Executiva
        ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtro de Setor */}
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="setor" className="text-sm font-medium">
                  Setor
                </Label>
                <Select
                  value={codigoSetor.toString()}
                  onValueChange={(value) => setCodigoSetor(parseInt(value, 10))}
                  disabled={isLoadingSetores}
                >
                  <SelectTrigger id="setor" className="w-[280px]">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS_SETORES.toString()}>
                      Todos os Setores (Visao Geral)
                    </SelectItem>
                    {setores?.map((setor) => (
                      <SelectItem key={setor.codigo} value={setor.codigo.toString()}>
                        {formatarNomeSetor(setor.descr)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro de Ano */}
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="ano" className="text-sm font-medium">
                  Ano
                </Label>
                <Select value={ano} onValueChange={(v) => setAno(v as AnoExecutivo)}>
                  <SelectTrigger id="ano" className="w-[160px]">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">2023 em diante</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro de Período */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="periodo" className="text-sm font-medium">
                  Periodo de Analise
                </Label>
                <Select
                  value={periodo}
                  onValueChange={(value: string) => setPeriodo(value as PeriodoExecutivo)}
                >
                  <SelectTrigger id="periodo" className="w-[180px]">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                    <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                    <SelectItem value="60d">Ultimos 60 dias</SelectItem>
                    <SelectItem value="90d">Ultimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Botões de Exportação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportFullReport("excel")}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportFullReport("pdf")}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            TABS - Recebem os filtros compartilhados via props
        ═══════════════════════════════════════════════════════════════════════ */}
        <Tabs defaultValue="geral" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="geral" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Visao Geral
            </TabsTrigger>
            <TabsTrigger value="executivo" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Visao Executiva
            </TabsTrigger>
          </TabsList>

          {/* Aba Visão Geral */}
          <TabsContent value="geral" className="space-y-6">
            {/* KPIs Principais */}
            <KPICards periodo={periodo} codigoSetor={codigoSetor} />

            {/* Gráfico de Fluxo Temporal */}
            <FluxoTemporalChart setor={codigoSetor} />

            {/* Gráfico Comparativo */}
            <ComparativoChart setor={codigoSetor} />
          </TabsContent>

          {/* Aba Visão Executiva */}
          <TabsContent value="executivo" className="space-y-6">
            <VisaoExecutivaContent codigoSetor={codigoSetor} periodo={periodo} ano={ano} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
