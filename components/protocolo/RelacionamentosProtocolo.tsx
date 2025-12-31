"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GitBranch,
  GitMerge,
  ArrowRight,
  FileText,
  Calendar,
  DollarSign,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import type {
  RelacionamentoProtocolo as RelacionamentoProtocoloType,
  ArvoreProtocolo as ArvoreProtocoloType,
} from "@/types/protocolo";
import { getValue } from "@/lib/object-helpers";

// Tipo flexível que aceita tanto camelCase (API) quanto PascalCase (legado)
type RelacionamentoProtocolo =
  | RelacionamentoProtocoloType
  | {
      TipoProtocolo: "MAE" | "FILHO";
      ProtocoloMae?: string;
      ProtocoloFilho?: string;
      CodProtocoloMae?: number;
      CodProtocoloFilho?: number;
      ObservacaoVinculo: string | null;
      ValorVinculo: number | null;
      DataVinculo: string | null;
    };

type ArvoreProtocolo =
  | ArvoreProtocoloType
  | {
      Codigo: number;
      Numero: string;
      Nivel: number;
      Caminho: string;
      Relacao: "CONSULTADO" | "FILHO";
    };

interface RelacionamentosProtocoloProps {
  filhos: RelacionamentoProtocolo[];
  maes: RelacionamentoProtocolo[];
  arvore: ArvoreProtocolo[];
  isLoading?: boolean;
}

function RelacionamentoCard({
  relacionamento,
  tipo,
}: {
  relacionamento: RelacionamentoProtocolo;
  tipo: "filho" | "mae";
}) {
  const r = relacionamento as Record<string, unknown>;
  const protocoloFilho = getValue<string | undefined>(r, "protocoloFilho", "ProtocoloFilho");
  const protocoloMae = getValue<string | undefined>(r, "protocoloMae", "ProtocoloMae");
  const codProtocoloFilho = getValue<number | undefined>(
    r,
    "codProtocoloFilho",
    "CodProtocoloFilho"
  );
  const codProtocoloMae = getValue<number | undefined>(r, "codProtocoloMae", "CodProtocoloMae");
  const dataVinculo = getValue<string | Date | null>(r, "dataVinculo", "DataVinculo");
  const valorVinculo = getValue<number | null>(r, "valorVinculo", "ValorVinculo");
  const observacaoVinculo = getValue<string | null>(r, "observacaoVinculo", "ObservacaoVinculo");

  const numero = tipo === "filho" ? protocoloFilho : protocoloMae;
  const codigo = tipo === "filho" ? codProtocoloFilho : codProtocoloMae;

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
          <p className="font-medium">{numero}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {dataVinculo && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(dataVinculo), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
            {valorVinculo && valorVinculo > 0 && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {valorVinculo.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </span>
            )}
          </div>
          {observacaoVinculo && (
            <p className="text-xs text-muted-foreground mt-1 italic">{observacaoVinculo}</p>
          )}
        </div>
      </div>
      {codigo && (
        <Link href={`/protocolos/${codigo}`}>
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function ArvoreVisual({ arvore }: { arvore: ArvoreProtocolo[] }) {
  if (!arvore || arvore.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {arvore.map((item) => {
        const a = item as Record<string, unknown>;
        const codigo = getValue<number>(a, "codigo", "Codigo");
        const numero = getValue<string>(a, "numero", "Numero");
        const nivel = getValue<number>(a, "nivel", "Nivel");
        const relacao = getValue<"CONSULTADO" | "FILHO">(a, "relacao", "Relacao");

        return (
          <div
            key={codigo}
            className="flex items-center gap-2"
            style={{ paddingLeft: `${nivel * 24}px` }}
          >
            {nivel > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <Link href={`/protocolos/${codigo}`}>
              <div
                className={`flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-muted ${
                  relacao === "CONSULTADO"
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted/50"
                }`}
              >
                <FileText
                  className={`h-4 w-4 ${
                    relacao === "CONSULTADO" ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className={`text-sm ${relacao === "CONSULTADO" ? "font-semibold" : ""}`}>
                  {numero}
                </span>
                {relacao === "CONSULTADO" && (
                  <Badge variant="outline" className="text-xs">
                    Atual
                  </Badge>
                )}
                {relacao === "FILHO" && (
                  <Badge variant="secondary" className="text-xs">
                    Filho
                  </Badge>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export function RelacionamentosProtocolo({
  filhos,
  maes,
  arvore,
  isLoading = false,
}: RelacionamentosProtocoloProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Relacionamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const temFilhos = filhos && filhos.length > 0;
  const temMaes = maes && maes.length > 0;
  const temArvore = arvore && arvore.length > 1; // > 1 porque inclui o próprio protocolo
  const temRelacionamentos = temFilhos || temMaes;

  if (!temRelacionamentos && !temArvore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Relacionamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Info className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Este protocolo não possui relacionamentos com outros protocolos.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Protocolos podem ser vinculados como Mãe (original) ou Filho (desmembramento).
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Relacionamentos
          {temRelacionamentos && (
            <Badge variant="secondary" className="ml-2">
              {(filhos?.length || 0) + (maes?.length || 0)} vínculo(s)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Protocolo Mãe */}
        {temMaes && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitMerge className="h-4 w-4 text-purple-500" />
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                Protocolo de Origem (Mãe)
              </p>
            </div>
            <div className="space-y-2">
              {maes.map((mae, index) => (
                <RelacionamentoCard key={`mae-${index}`} relacionamento={mae} tipo="mae" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Este protocolo foi originado/desmembrado do protocolo acima.
            </p>
          </div>
        )}

        {temMaes && temFilhos && <Separator />}

        {/* Protocolos Filhos */}
        {temFilhos && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="h-4 w-4 text-blue-500" />
              <p className="text-sm font-semibold text-muted-foreground uppercase">
                Protocolos Derivados (Filhos)
              </p>
            </div>
            <div className="space-y-2">
              {filhos.map((filho, index) => (
                <RelacionamentoCard key={`filho-${index}`} relacionamento={filho} tipo="filho" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {filhos.length === 1
                ? "Este protocolo originou 1 protocolo filho."
                : `Este protocolo originou ${filhos.length} protocolos filhos.`}
            </p>
          </div>
        )}

        {/* Árvore de Relacionamentos */}
        {temArvore && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="h-4 w-4 text-green-500" />
                <p className="text-sm font-semibold text-muted-foreground uppercase">
                  Árvore de Relacionamentos
                </p>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg">
                <ArvoreVisual arvore={arvore} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Visualização hierárquica dos protocolos relacionados. Clique para navegar.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
