"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Mapeamento de número para nome do dia
const DIAS_SEMANA: Record<number, string> = {
  1: "Domingo",
  2: "Segunda-feira",
  3: "Terça-feira",
  4: "Quarta-feira",
  5: "Quinta-feira",
  6: "Sexta-feira",
  7: "Sábado",
};

interface ProtocoloMovimentacao {
  codprot: number;
  numeroDocumento: string;
  assunto: string | null;
  projeto: string | null;
  numconv: number | null;
  contaCorrente: string | null;
  setorOrigem: string | null;
  setorDestino: string | null;
  dataMovimentacao: string;
  dataFormatada: string;
  setorAtual: string | null;
  statusProtocolo: string;
}

interface ApiResponse {
  success: boolean;
  data: ProtocoloMovimentacao[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    diaSemana: number;
    hora: number;
  };
}

function MovimentacoesContent() {
  const searchParams = useSearchParams();
  const diaSemana = searchParams.get("diaSemana");
  const hora = searchParams.get("hora");

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["protocolos-movimentacao", diaSemana, hora],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (diaSemana) {
        params.set("diaSemana", diaSemana);
      }
      if (hora) {
        params.set("hora", hora);
      }
      params.set("pageSize", "100");

      const response = await fetch(`/api/protocolos/por-movimentacao?${params}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar dados");
      }
      return response.json();
    },
    enabled: !!diaSemana && !!hora,
  });

  const diaSemanaNum = diaSemana ? parseInt(diaSemana) : 0;
  const horaNum = hora ? parseInt(hora) : 0;
  const diaSemanaLabel = DIAS_SEMANA[diaSemanaNum] || "Desconhecido";

  if (!diaSemana || !hora) {
    return (
      <>
        <Header title="Movimentações" subtitle="Protocolos por dia e hora de movimentação" />
        <div className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Parâmetros de filtro não fornecidos. Acesse esta página através do mapa de calor no
              dashboard.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Movimentações"
        subtitle={`Protocolos movimentados às ${diaSemanaLabel}s, ${horaNum}h`}
      />
      <div className="p-6 space-y-4">
        {/* Botão voltar e resumo */}
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>

          {data && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{data.pagination.total}</span> movimentações encontradas
              nos últimos 6 meses
            </div>
          )}
        </div>

        {/* Card com filtros ativos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtros Aplicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Dia:</span>
                <Badge variant="secondary">{diaSemanaLabel}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Hora:</span>
                <Badge variant="secondary">
                  {horaNum}:00 - {horaNum}:59
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Período:</span>
                <Badge variant="outline">Últimos 6 meses</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Protocolos</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Erro ao carregar dados. Tente novamente.</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}

            {data && data.data.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum protocolo encontrado para este filtro.
              </div>
            )}

            {data && data.data.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocolo</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Data Movimentação</TableHead>
                      <TableHead>De</TableHead>
                      <TableHead>Para</TableHead>
                      <TableHead>Setor Atual</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((item, index) => (
                      <TableRow key={`${item.codprot}-${index}`}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/protocolos/${item.codprot}`}
                            className="text-primary hover:underline"
                          >
                            {item.numeroDocumento || item.codprot}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={item.projeto || "-"}>
                            {item.projeto || "-"}
                          </div>
                        </TableCell>
                        <TableCell>{item.dataFormatada}</TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate" title={item.setorOrigem || "-"}>
                            {item.setorOrigem || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate" title={item.setorDestino || "-"}>
                            {item.setorDestino || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[150px] truncate" title={item.setorAtual || "-"}>
                            {item.setorAtual || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.statusProtocolo === "Finalizado" ? "secondary" : "default"
                            }
                          >
                            {item.statusProtocolo}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <>
      <Header title="Movimentações" subtitle="Carregando..." />
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </>
  );
}

export default function MovimentacoesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MovimentacoesContent />
    </Suspense>
  );
}
