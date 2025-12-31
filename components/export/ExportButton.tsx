"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  type: "protocolos" | "kpis" | "full-report";
  onExport?: (format: "csv" | "excel" | "pdf") => void | Promise<void>;
  isLoading?: boolean;
}

export function ExportButton({
  data,
  filename,
  type: _type,
  onExport,
  isLoading = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Combina o estado interno com o externo
  const showLoading = isExporting || isLoading;

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    setIsExporting(true);

    try {
      if (onExport) {
        await onExport(format);
      } else {
        // Garante que data é um array para exportação
        const exportData = Array.isArray(data) ? data : [data];

        // Importação dinâmica para evitar bundle grande
        if (format === "csv") {
          const { exportToCSV } = await import("@/lib/export/csv");
          exportToCSV(exportData, { filename });
        } else if (format === "excel") {
          const { exportToExcel } = await import("@/lib/export/excel");
          await exportToExcel(exportData, { filename });
        } else if (format === "pdf") {
          const { exportProtocolosToPDF } = await import("@/lib/export/pdf");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          exportProtocolosToPDF(exportData as any, { filename });
        }
      }

      toast({
        title: "Exportação concluída",
        description: `Arquivo ${format.toUpperCase()} baixado com sucesso.`,
      });
    } catch (error) {
      logger.error("Erro ao exportar:", error);
      toast({
        title: "Erro na exportação",
        description: `Não foi possível exportar para ${format.toUpperCase()}.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={showLoading}>
          {showLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar como CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar como Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar como PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
