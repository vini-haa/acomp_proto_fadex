"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Protocolo } from "@/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpDown, ExternalLink, GitBranch, GitMerge } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const columns: ColumnDef<Protocolo>[] = [
  {
    accessorKey: "numeroDocumento",
    header: "Protocolo",
    cell: ({ row }) => {
      const protocolo = row.original;
      const temFilhos = (protocolo.qtdFilhos ?? 0) > 0;
      const ehFilho = (protocolo.ehFilhoDe ?? 0) > 0;
      const temRelacionamento = temFilhos || ehFilho;

      return (
        <div className="flex items-center gap-2">
          <Link
            href={`/protocolos/${protocolo.codprot}`}
            className="font-medium text-primary hover:underline flex items-center gap-1"
          >
            {protocolo.numeroDocumento}
            <ExternalLink className="h-3 w-3" />
          </Link>
          {temRelacionamento && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={`h-5 px-1.5 ${
                      temFilhos
                        ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-950 dark:text-purple-300"
                        : "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    }`}
                  >
                    {temFilhos ? (
                      <GitBranch className="h-3 w-3 mr-0.5" />
                    ) : (
                      <GitMerge className="h-3 w-3 mr-0.5" />
                    )}
                    {temFilhos ? protocolo.qtdFilhos : "F"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {temFilhos && <p>Protocolo Mãe: {protocolo.qtdFilhos} filho(s)</p>}
                  {ehFilho && <p>Protocolo Filho</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "assunto",
    header: "Assunto",
    cell: ({ row }) => {
      const assunto = row.getValue("assunto") as string | null;
      return (
        <div className="max-w-[300px]">
          <span className="truncate block" title={assunto || undefined}>
            {assunto || "—"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "projeto",
    header: "Projeto",
    cell: ({ row }) => {
      const projeto = row.getValue("projeto") as string | null;
      return (
        <div className="max-w-[250px]">
          <span className="truncate block text-sm" title={projeto || undefined}>
            {projeto || "—"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "diasNoFinanceiro",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Dias
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dias = row.getValue("diasNoFinanceiro") as number;
      const variant = row.original.statusVisual;

      const colorClass =
        variant === "danger"
          ? "text-red-600"
          : variant === "warning"
            ? "text-yellow-600"
            : "text-muted-foreground";

      return <span className={`font-medium ${colorClass}`}>{dias}</span>;
    },
  },
  {
    accessorKey: "statusProtocolo",
    header: "Status",
    cell: ({ row }) => {
      const protocolo = row.original;
      return <StatusBadge status={protocolo.statusProtocolo} variant={protocolo.statusVisual} />;
    },
  },
  {
    accessorKey: "dtEntrada",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data Entrada
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const data = row.getValue("dtEntrada") as Date;
      return (
        <span className="text-sm">{format(new Date(data), "dd/MM/yyyy", { locale: ptBR })}</span>
      );
    },
  },
  {
    accessorKey: "setorDestinoAtual",
    header: "Setor Atual",
    cell: ({ row }) => {
      const setor = row.getValue("setorDestinoAtual") as string | null;
      return (
        <div className="max-w-[200px]">
          <span className="truncate block text-xs text-muted-foreground" title={setor || undefined}>
            {setor || "—"}
          </span>
        </div>
      );
    },
  },
];
