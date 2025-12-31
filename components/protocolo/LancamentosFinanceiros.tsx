"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import type { LancamentoFinanceiro } from "@/types/protocolo";
import { formatCurrency, formatCPFCNPJ } from "@/lib/formatting";
import { getValue } from "@/lib/object-helpers";

// Tipo flexível que aceita tanto camelCase (API) quanto PascalCase (legado)
type LancamentoFlexivel =
  | LancamentoFinanceiro
  | {
      CodFinanceiro: number;
      DataLancamento: string;
      DataDocumento: string | null;
      NumeroProtocoloFinanc: string | null;
      NotaFiscal: string | null;
      ValorBruto: number;
      ValorLiquido: number;
      Descricao: string | null;
      Observacao: string | null;
      Fornecedor: string | null;
      CPFCNPJ: string | null;
      Projeto: string | null;
      Rubrica: string | null;
      DescricaoRubrica: string | null;
      TipoLancamento: string | null;
      Status: "CANCELADO" | "LIBERADO" | "PENDENTE";
    };

interface LancamentosFinanceirosProps {
  lancamentos: LancamentoFlexivel[];
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "LIBERADO":
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Liberado
        </Badge>
      );
    case "CANCELADO":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Cancelado
        </Badge>
      );
    case "PENDENTE":
    default:
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
  }
}

export function LancamentosFinanceiros({
  lancamentos,
  isLoading = false,
}: LancamentosFinanceirosProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lançamentos Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalLiberado = lancamentos
    .filter(
      (l) => getValue<string>(l as Record<string, unknown>, "status", "Status") === "LIBERADO"
    )
    .reduce(
      (acc, l) =>
        acc +
        Math.abs(
          getValue<number>(l as Record<string, unknown>, "valorLiquido", "ValorLiquido") || 0
        ),
      0
    );

  const totalPendente = lancamentos
    .filter(
      (l) => getValue<string>(l as Record<string, unknown>, "status", "Status") === "PENDENTE"
    )
    .reduce(
      (acc, l) =>
        acc +
        Math.abs(
          getValue<number>(l as Record<string, unknown>, "valorLiquido", "ValorLiquido") || 0
        ),
      0
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Lançamentos Financeiros
            {lancamentos.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {lancamentos.length} {lancamentos.length === 1 ? "lançamento" : "lançamentos"}
              </Badge>
            )}
          </CardTitle>
          {lancamentos.length > 0 && (
            <div className="flex gap-4 text-sm">
              {totalLiberado > 0 && (
                <div className="text-green-600 font-medium">
                  Liberado: {formatCurrency(totalLiberado)}
                </div>
              )}
              {totalPendente > 0 && (
                <div className="text-yellow-600 font-medium">
                  Pendente: {formatCurrency(totalPendente)}
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {lancamentos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum lançamento financeiro vinculado a este protocolo.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Beneficiário</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Rubrica</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((lancamento) => {
                  const l = lancamento as Record<string, unknown>;
                  const codFinanceiro = getValue<number>(l, "codFinanceiro", "CodFinanceiro");
                  const dataLancamento = getValue<string | Date>(
                    l,
                    "dataLancamento",
                    "DataLancamento"
                  );
                  const fornecedor = getValue<string | null>(l, "fornecedor", "Fornecedor");
                  const cpfCnpj = getValue<string | null>(l, "cpfCnpj", "CPFCNPJ");
                  const descricao = getValue<string | null>(l, "descricao", "Descricao");
                  const tipoLancamento = getValue<string | null>(
                    l,
                    "tipoLancamento",
                    "TipoLancamento"
                  );
                  const rubrica = getValue<string | null>(l, "rubrica", "Rubrica");
                  const descricaoRubrica = getValue<string | null>(
                    l,
                    "descricaoRubrica",
                    "DescricaoRubrica"
                  );
                  const valorLiquido = getValue<number>(l, "valorLiquido", "ValorLiquido");
                  const status = getValue<string>(l, "status", "Status");

                  return (
                    <TableRow key={codFinanceiro}>
                      <TableCell className="font-mono text-xs">{codFinanceiro}</TableCell>
                      <TableCell>
                        {dataLancamento
                          ? format(new Date(dataLancamento), "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{fornecedor || "—"}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCPFCNPJ(cpfCnpj)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{descricao || "—"}</span>
                          {tipoLancamento && (
                            <span className="text-xs text-muted-foreground">{tipoLancamento}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {rubrica ? (
                          <div className="flex flex-col">
                            <Badge variant="outline" className="w-fit">
                              {rubrica}
                            </Badge>
                            <span className="text-xs text-muted-foreground mt-1">
                              {descricaoRubrica}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(valorLiquido || 0)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
