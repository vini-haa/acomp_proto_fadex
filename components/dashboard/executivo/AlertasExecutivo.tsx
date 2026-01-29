"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertaExecutivo } from "@/types/dashboard";
import { AlertTriangle, TrendingUp, ChevronRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertasExecutivoProps {
  data: AlertaExecutivo[];
}

function AlertaIcon({ tipo }: { tipo: AlertaExecutivo["tipo"] }) {
  switch (tipo) {
    case "atraso":
      return <AlertTriangle className="h-4 w-4" />;
    case "tendencia":
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function AlertaItem({ alerta }: { alerta: AlertaExecutivo }) {
  const severidadeStyles = {
    critical: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
  };

  const iconStyles = {
    critical: "text-red-600 dark:text-red-400",
    warning: "text-amber-600 dark:text-amber-400",
    info: "text-blue-600 dark:text-blue-400",
  };

  const Content = (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        severidadeStyles[alerta.severidade],
        alerta.link && "hover:bg-opacity-80 cursor-pointer group"
      )}
    >
      <div className={cn("mt-0.5", iconStyles[alerta.severidade])}>
        <AlertaIcon tipo={alerta.tipo} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{alerta.titulo}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{alerta.descricao}</p>
      </div>
      {alerta.link && (
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
      )}
    </div>
  );

  if (alerta.link) {
    return <Link href={alerta.link}>{Content}</Link>;
  }

  return Content;
}

export const AlertasExecutivo = memo(function AlertasExecutivo({ data }: AlertasExecutivoProps) {
  const countBySeveridade = {
    critical: data.filter((a) => a.severidade === "critical").length,
    warning: data.filter((a) => a.severidade === "warning").length,
    info: data.filter((a) => a.severidade === "info").length,
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              Alertas
            </CardTitle>
            <CardDescription className="mt-1">Situacoes que requerem atencao</CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {countBySeveridade.critical > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">{countBySeveridade.critical}</span>
              </div>
            )}
            {countBySeveridade.warning > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">{countBySeveridade.warning}</span>
              </div>
            )}
            {countBySeveridade.info > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">{countBySeveridade.info}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px]">
          <div className="space-y-2 px-4 pb-4">
            {data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum alerta no momento</p>
              </div>
            ) : (
              data.map((alerta, index) => <AlertaItem key={index} alerta={alerta} />)
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
