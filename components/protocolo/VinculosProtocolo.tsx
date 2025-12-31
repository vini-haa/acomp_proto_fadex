"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  GitBranch,
  GitMerge,
  Wallet,
  Calendar,
  DollarSign,
  ExternalLink,
  Info,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface VinculoRelacionamento {
  tipoRelacionamento: string;
  codProtocoloOrigem?: number;
  numeroProtocoloOrigem?: string;
  codProtocoloRelacionado?: number;
  numeroProtocoloRelacionado?: string;
  assuntoRelacionado?: string;
  observacaoVinculo?: string;
  valorVinculo?: number;
  dataVinculo?: string;
  descricao?: string;
}

interface VinculoFinanceiro {
  tipoRelacionamento: string;
  codFinanceiro: number;
  codProtocolo: number;
  numeroProtocoloFinanceiro: string;
  titulo: string;
  valorBruto: number;
  valorLiquido: number;
  dataLancamento: string;
  dataDocumento?: string;
  observacao?: string;
  beneficiario?: string;
  cpfCnpj?: string;
  projeto?: string;
  numConv?: number;
  tipoLancamento?: string;
  status: string;
}

interface ResumoVinculos {
  qtdFilhos: number;
  qtdMaes: number;
  qtdFinanceiro: number;
  valorTotalFinanceiro: number;
  qtdProtocolosRelacionadosFinanceiro: number;
  totalRelacionamentos: number;
  totalFinanceiro: number;
  totalProtocolosRelacionados: number;
}

interface VinculosResponse {
  success: boolean;
  codProtocolo: number;
  temVinculos: boolean;
  resumo: ResumoVinculos;
  relacionamentos: {
    filhos: VinculoRelacionamento[];
    maes: VinculoRelacionamento[];
  };
  financeiro: {
    lancamentos: VinculoFinanceiro[];
    protocolosRelacionados: VinculoRelacionamento[];
  };
  tempoMs: number;
}

interface VinculosProtocoloProps {
  codProtocolo: number;
}

function RelacionamentoCard({
  relacionamento,
  tipo,
}: {
  relacionamento: VinculoRelacionamento;
  tipo: "filho" | "mae";
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${
            tipo === "filho"
              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          }`}
        >
          {tipo === "filho" ? <GitBranch className="h-4 w-4" /> : <GitMerge className="h-4 w-4" />}
        </div>
        <div>
          <p className="font-medium">{relacionamento.numeroProtocoloRelacionado}</p>
          {relacionamento.assuntoRelacionado && (
            <p className="text-sm text-muted-foreground">{relacionamento.assuntoRelacionado}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {relacionamento.dataVinculo && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(relacionamento.dataVinculo), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
            {relacionamento.valorVinculo && relacionamento.valorVinculo > 0 && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {relacionamento.valorVinculo.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            )}
          </div>
          {relacionamento.observacaoVinculo && (
            <p className="text-xs text-muted-foreground mt-1 italic">
              {relacionamento.observacaoVinculo}
            </p>
          )}
        </div>
      </div>
      {relacionamento.codProtocoloRelacionado && (
        <Link href={`/protocolos/${relacionamento.codProtocoloRelacionado}`}>
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

// FinanceiroCard removido - lançamentos financeiros são mostrados na aba "Financeiro"

export function VinculosProtocolo({ codProtocolo }: VinculosProtocoloProps) {
  const { data, isLoading, error } = useQuery<VinculosResponse>({
    queryKey: ["vinculos-protocolo", codProtocolo],
    queryFn: async () => {
      const response = await fetch(`/api/protocolos/${codProtocolo}/vinculos`);
      if (!response.ok) {
        throw new Error("Erro ao carregar vínculos");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,
    enabled: !!codProtocolo && codProtocolo > 0,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Vínculos e Relacionamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Vínculos e Relacionamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar vínculos do protocolo.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data?.temVinculos) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Vínculos e Relacionamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Este protocolo não possui vínculos registrados.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Protocolos podem ser vinculados a outros protocolos ou lançamentos financeiros.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { resumo, relacionamentos } = data;
  const temRelacionamentos = relacionamentos.filhos.length > 0 || relacionamentos.maes.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Relacionamentos entre Protocolos
          {resumo.totalRelacionamentos > 0 && (
            <Badge variant="secondary" className="ml-2">
              {resumo.totalRelacionamentos} relacionamento(s)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo - apenas relacionamentos entre protocolos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">Protocolos Filhos</p>
            <p className="text-xl font-bold">{resumo.qtdFilhos}</p>
            <p className="text-xs text-muted-foreground">Protocolos derivados deste</p>
          </div>
          <div className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs text-muted-foreground">Protocolos Mãe</p>
            <p className="text-xl font-bold">{resumo.qtdMaes}</p>
            <p className="text-xs text-muted-foreground">Protocolos que originaram este</p>
          </div>
        </div>

        {/* Relacionamentos Mãe/Filho */}
        {temRelacionamentos && (
          <>
            <Separator />

            {/* Protocolos Mãe */}
            {relacionamentos.maes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GitMerge className="h-4 w-4 text-purple-500" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase">
                    Protocolo de Origem (Mãe)
                  </p>
                </div>
                <div className="space-y-2">
                  {relacionamentos.maes.map((mae, index) => (
                    <RelacionamentoCard key={`mae-${index}`} relacionamento={mae} tipo="mae" />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Este protocolo foi originado/desmembrado do protocolo acima.
                </p>
              </div>
            )}

            {relacionamentos.maes.length > 0 && relacionamentos.filhos.length > 0 && <Separator />}

            {/* Protocolos Filhos */}
            {relacionamentos.filhos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GitBranch className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-semibold text-muted-foreground uppercase">
                    Protocolos Derivados (Filhos)
                  </p>
                </div>
                <div className="space-y-2">
                  {relacionamentos.filhos.map((filho, index) => (
                    <RelacionamentoCard
                      key={`filho-${index}`}
                      relacionamento={filho}
                      tipo="filho"
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {relacionamentos.filhos.length === 1
                    ? "Este protocolo originou 1 protocolo filho."
                    : `Este protocolo originou ${relacionamentos.filhos.length} protocolos filhos.`}
                </p>
              </div>
            )}
          </>
        )}

        {/* Nota sobre lançamentos financeiros */}
        {resumo.qtdFinanceiro > 0 && (
          <>
            <Separator />
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <Wallet className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700 dark:text-green-400">
                Este protocolo possui <strong>{resumo.qtdFinanceiro}</strong> lançamento(s)
                financeiro(s) totalizando{" "}
                <strong>
                  {resumo.valorTotalFinanceiro.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
                . Veja detalhes na aba <strong>Financeiro</strong>.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
