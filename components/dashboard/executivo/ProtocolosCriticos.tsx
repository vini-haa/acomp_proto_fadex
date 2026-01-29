"use client";

import { memo } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ProtocoloCritico } from "@/types/dashboard";
import { AlertTriangle, Clock, CheckCircle, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProtocolosCriticosProps {
  data: ProtocoloCritico[];
}

const statusConfig = {
  critico: {
    label: "Critico",
    variant: "destructive" as const,
    icon: AlertTriangle,
    bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
  },
  urgente: {
    label: "Urgente",
    variant: "default" as const,
    icon: Clock,
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
  },
  emDia: {
    label: "Em dia",
    variant: "secondary" as const,
    icon: CheckCircle,
    bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900",
  },
};

function ProtocoloItem({ protocolo }: { protocolo: ProtocoloCritico }) {
  const config = statusConfig[protocolo.status];
  const Icon = config.icon;

  return (
    <Link href={`/protocolos/${protocolo.codProtocolo}`}>
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-opacity-80 cursor-pointer group",
          config.bg
        )}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{protocolo.numeroProtocolo}</p>
            <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
              {protocolo.diasParado}d
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {protocolo.assunto || protocolo.tipoDocumento}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </Link>
  );
}

export const ProtocolosCriticos = memo(function ProtocolosCriticos({
  data,
}: ProtocolosCriticosProps) {
  const countCriticos = data.filter((p) => p.status === "critico").length;
  const countUrgentes = data.filter((p) => p.status === "urgente").length;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Protocolos Criticos
            </CardTitle>
            <CardDescription>Protocolos mais atrasados no setor</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {countCriticos > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">{countCriticos}</span>
              </div>
            )}
            {countUrgentes > 0 && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">{countUrgentes}</span>
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
                <CheckCircle className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum protocolo atrasado</p>
              </div>
            ) : (
              data.map((protocolo) => (
                <ProtocoloItem key={protocolo.codProtocolo} protocolo={protocolo} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
