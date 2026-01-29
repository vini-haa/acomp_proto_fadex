"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getNomeSetor, getNomeSituacao } from "@/lib/constants/setores";

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

// Opções de tamanho de página
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

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
    codSetor?: number | null;
    codColaborador?: number | null;
    numconv?: number | null;
    uf?: string | null;
    situacao?: number | null;
    periodo?: number;
  };
}

// Hook para buscar nome do colaborador
function useColaboradorNome(codColaborador: string | null) {
  const { data } = useQuery({
    queryKey: ["colaborador-nome", codColaborador],
    queryFn: async () => {
      if (!codColaborador) {
        return null;
      }
      const response = await fetch(`/api/colaborador/${codColaborador}`);
      if (!response.ok) {
        return null;
      }
      const json = await response.json();
      return json.data?.nome || null;
    },
    enabled: !!codColaborador,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
  return data;
}

function MovimentacoesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parâmetros de filtro
  const diaSemana = searchParams.get("diaSemana");
  const hora = searchParams.get("hora");
  const codSetor = searchParams.get("codSetor");
  const codColaborador = searchParams.get("codColaborador");
  const numconv = searchParams.get("numconv");
  const uf = searchParams.get("uf");
  const situacao = searchParams.get("situacao");
  const periodo = searchParams.get("periodo");

  // Parâmetros de paginação da URL
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");

  // Estado local de paginação (sincronizado com URL)
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);
  const [pageSize, setPageSize] = useState(pageSizeParam ? parseInt(pageSizeParam) : 50);

  // Buscar nome do colaborador se necessário
  const colaboradorNome = useColaboradorNome(codColaborador);

  // Atualiza URL com nova paginação
  const updateUrl = useCallback(
    (newPage: number, newPageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) {
        params.set("page", newPage.toString());
      } else {
        params.delete("page");
      }
      if (newPageSize !== 50) {
        params.set("pageSize", newPageSize.toString());
      } else {
        params.delete("pageSize");
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: [
      "protocolos-movimentacao",
      diaSemana,
      hora,
      codSetor,
      codColaborador,
      numconv,
      uf,
      situacao,
      periodo,
      page,
      pageSize,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (diaSemana) {
        params.set("diaSemana", diaSemana);
      }
      if (hora) {
        params.set("hora", hora);
      }
      if (codSetor) {
        params.set("codSetor", codSetor);
      }
      if (codColaborador) {
        params.set("codColaborador", codColaborador);
      }
      if (numconv) {
        params.set("numconv", numconv);
      }
      if (uf) {
        params.set("uf", uf);
      }
      if (situacao) {
        params.set("situacao", situacao);
      }
      if (periodo) {
        params.set("periodo", periodo);
      }
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());

      const response = await fetch(`/api/protocolos/por-movimentacao?${params}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar dados");
      }
      return response.json();
    },
    enabled: !!diaSemana && !!hora,
  });

  // Handlers de paginação
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Volta para página 1 ao mudar tamanho
    updateUrl(1, newSize);
  };

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

  // Dados de paginação
  const pagination = data?.pagination || { page: 1, pageSize: 50, total: 0, totalPages: 1 };
  const periodoLabel = periodo || "6";

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
              <span className="font-medium">{pagination.total.toLocaleString("pt-BR")}</span>{" "}
              movimentações nos últimos {periodoLabel} meses
            </div>
          )}
        </div>

        {/* Card com filtros ativos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtros Aplicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
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
                <Badge variant="outline">
                  Últimos {periodoLabel} {periodoLabel === "1" ? "mês" : "meses"}
                </Badge>
              </div>
              {codSetor && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Setor:</span>
                  <Badge variant="default">{getNomeSetor(parseInt(codSetor))}</Badge>
                </div>
              )}
              {codColaborador && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Colaborador:</span>
                  <Badge variant="default">
                    {colaboradorNome || `Colaborador #${codColaborador}`}
                  </Badge>
                </div>
              )}
              {uf && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Estado:</span>
                  <Badge variant="default">{uf}</Badge>
                </div>
              )}
              {situacao && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Situação:</span>
                  <Badge variant="default">{getNomeSituacao(parseInt(situacao))}</Badge>
                </div>
              )}
              {numconv && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Projeto:</span>
                  <Badge variant="default">{numconv}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Protocolos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <>
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
                            <div
                              className="max-w-[150px] truncate"
                              title={item.setorDestino || "-"}
                            >
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

                {/* Paginação */}
                <div className="flex items-center justify-between px-2">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((page - 1) * pageSize + 1).toLocaleString("pt-BR")} a{" "}
                    {Math.min(page * pageSize, pagination.total).toLocaleString("pt-BR")} de{" "}
                    {pagination.total.toLocaleString("pt-BR")} registros
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Seletor de itens por página */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Itens:</span>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(v) => handlePageSizeChange(parseInt(v, 10))}
                      >
                        <SelectTrigger className="w-[70px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAGE_SIZE_OPTIONS.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Controles de navegação */}
                    <div className="flex items-center space-x-2">
                      {/* Primeira página */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(1)}
                        disabled={page === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      {/* Página anterior */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Indicador de página */}
                      <div className="text-sm min-w-[100px] text-center">
                        Página {page} de {pagination.totalPages}
                      </div>

                      {/* Próxima página */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
                        disabled={page === pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      {/* Última página */}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={page === pagination.totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
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
