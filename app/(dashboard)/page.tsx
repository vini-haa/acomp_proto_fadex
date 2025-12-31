"use client";

import dynamic from "next/dynamic";
import { Header } from "@/components/dashboard/Header";
import { KPICards } from "@/components/dashboard/KPICards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
import { FileDown, Loader2, Calendar, Building2 } from "lucide-react";
import { exportProtocolosToPDF, exportProtocolosToExcel } from "@/lib/export";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSetores } from "@/hooks/useSetores";
import { logger } from "@/lib/logger";
import { TODOS_SETORES, SETORES } from "@/lib/constants/setores";

// Setor financeiro como padrão
const SETOR_FINANCEIRO = SETORES.FINANCEIRO;

export default function DashboardPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [periodo, setPeriodo] = useState<"mes_atual" | "30d" | "90d" | "6m" | "1y" | "ytd" | "all">(
    "all"
  );
  const [codigoSetor, setCodigoSetor] = useState<number>(SETOR_FINANCEIRO);
  const { toast } = useToast();
  const { data: setores, isLoading: isLoadingSetores } = useSetores();

  // Função para formatar nome do setor (remove prefixo "- ")
  const formatarNomeSetor = (descr: string) => descr.replace(/^- /, "");

  // Encontra o nome do setor selecionado para exibir no subtítulo
  const setorSelecionado = setores?.find((s) => s.codigo === codigoSetor);
  const nomeSetor =
    codigoSetor === TODOS_SETORES
      ? "Visão Geral da Fundação"
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
      <Header title="Dashboard" subtitle={`Visão geral dos protocolos - ${nomeSetor}`} />
      <div className="p-6">
        {/* Filtros e Ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
                  <SelectTrigger id="setor" className="w-[320px]">
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS_SETORES.toString()}>
                      Todos os Setores (Visão Geral)
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

            {/* Filtro de Período */}
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-1">
                <Label htmlFor="periodo" className="text-sm font-medium">
                  Período de Análise
                </Label>
                <Select
                  value={periodo}
                  onValueChange={(value: string) => setPeriodo(value as typeof periodo)}
                >
                  <SelectTrigger id="periodo" className="w-[200px]">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Períodos</SelectItem>
                    <SelectItem value="mes_atual">Mês Atual</SelectItem>
                    <SelectItem value="30d">Últimos 30 Dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 Dias</SelectItem>
                    <SelectItem value="6m">Últimos 6 Meses</SelectItem>
                    <SelectItem value="ytd">Ano Atual</SelectItem>
                    <SelectItem value="1y">Último Ano</SelectItem>
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

        <div className="space-y-6">
          {/* KPIs Principais */}
          <KPICards periodo={periodo} codigoSetor={codigoSetor} />

          {/* Gráfico de Fluxo Temporal */}
          <FluxoTemporalChart setor={codigoSetor} />

          {/* Gráfico Comparativo */}
          <ComparativoChart setor={codigoSetor} />
        </div>
      </div>
    </>
  );
}
