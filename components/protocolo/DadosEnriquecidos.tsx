"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { User, Building, FileText, Calendar, Info, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  ProtocoloDadosBasicos,
  SituacaoAtual as SituacaoAtualType,
  OrigemProtocolo,
} from "@/types/protocolo";
import { getValue } from "@/lib/object-helpers";

// Tipo flexível que aceita tanto camelCase (API) quanto PascalCase (legado)
type DadosBasicos =
  | ProtocoloDadosBasicos
  | {
      CodProtocolo: number;
      NumeroProtocolo: string;
      NumeroDocumento: string | null;
      DataCadastro: string;
      Assunto: string | null;
      Descricao: string | null;
      Observacoes: string | null;
      Remetente: string | null;
      Interessado: string | null;
      TipoDocumento: string | null;
      Instituicao: string | null;
      Unidade: string | null;
      Departamento: string | null;
      NumConv: number | null;
      TituloProjeto: string | null;
      NomePessoa: string | null;
      CPFCNPJ: string | null;
      UsuarioCadastro: string | null;
    };

type SituacaoAtual =
  | SituacaoAtualType
  | {
      SetorAtual: string | null;
      UsuarioResponsavel: string | null;
      SituacaoAtual: string | null;
      DiasNoSetorAtual: number;
    };

type Origem =
  | OrigemProtocolo
  | {
      DataCriacao: string;
      SetorOrigem: string | null;
      UsuarioCriador: string | null;
    };

interface DadosEnriquecidosProps {
  dadosBasicos: DadosBasicos | null;
  situacaoAtual: SituacaoAtual | null;
  origem: Origem | null;
  isLoading?: boolean;
}

function InfoItem({
  icon: Icon,
  label,
  value,
  badge = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
  badge?: boolean;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        {badge ? (
          <Badge variant="outline" className="mt-1">
            {value}
          </Badge>
        ) : (
          <p className="text-sm font-medium">{value}</p>
        )}
      </div>
    </div>
  );
}

export function DadosEnriquecidos({
  dadosBasicos,
  situacaoAtual,
  origem,
  isLoading = false,
}: DadosEnriquecidosProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informações Detalhadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!dadosBasicos) {
    return null;
  }

  // Extrair valores de forma flexível
  const db = dadosBasicos as Record<string, unknown>;
  const descricao = getValue<string | null>(db, "descricao", "Descricao");
  const tipoDocumento = getValue<string | null>(db, "tipoDocumento", "TipoDocumento");
  const interessado = getValue<string | null>(db, "interessado", "Interessado");
  const instituicao = getValue<string | null>(db, "instituicao", "Instituicao");
  const unidade = getValue<string | null>(db, "unidade", "Unidade");
  const departamento = getValue<string | null>(db, "departamento", "Departamento");
  const tituloProjeto = getValue<string | null>(db, "tituloProjeto", "TituloProjeto");
  const numConv = getValue<number | null>(db, "numConv", "NumConv");
  const observacoes = getValue<string | null>(db, "observacoes", "Observacoes");

  // Situação atual flexível
  const sa = situacaoAtual as Record<string, unknown> | null;
  const setorAtual = sa ? getValue<string | null>(sa, "setorAtual", "SetorAtual") : null;
  const situacaoAtualDesc = sa
    ? getValue<string | null>(sa, "situacaoAtual", "SituacaoAtual")
    : null;
  const usuarioResponsavel = sa
    ? getValue<string | null>(sa, "usuarioResponsavel", "UsuarioResponsavel")
    : null;
  const diasNoSetorAtual = sa
    ? getValue<number>(sa, "diasNoSetorAtual", "DiasNoSetorAtual") || 0
    : 0;

  // Origem flexível
  const og = origem as Record<string, unknown> | null;
  const dataCriacao = og ? getValue<string | Date | null>(og, "dataCriacao", "DataCriacao") : null;
  const setorOrigem = og ? getValue<string | null>(og, "setorOrigem", "SetorOrigem") : null;
  const usuarioCriador = og
    ? getValue<string | null>(og, "usuarioCriador", "UsuarioCriador")
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Informações Detalhadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Descrição */}
        {descricao && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Descrição</p>
            <p className="text-sm bg-muted/50 p-3 rounded-md">{descricao}</p>
          </div>
        )}

        {/* Grid de informações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem icon={FileText} label="Tipo de Documento" value={tipoDocumento} badge />

          <InfoItem icon={User} label="Interessado" value={interessado} />

          <InfoItem icon={Building} label="Instituição" value={instituicao} />

          <InfoItem
            icon={Building}
            label="Unidade / Departamento"
            value={[unidade, departamento].filter(Boolean).join(" / ") || null}
          />
        </div>

        {/* Projeto associado */}
        {tituloProjeto && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Projeto Vinculado
              </p>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="font-medium">{tituloProjeto}</p>
                {numConv && (
                  <p className="text-xs text-muted-foreground mt-1">Convênio: {numConv}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Situação atual */}
        {situacaoAtual && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
                Situação Atual
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Setor</p>
                  <p className="text-sm font-medium">{setorAtual?.replace(/^- /, "") || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Situação</p>
                  <Badge variant="outline">{situacaoAtualDesc || "—"}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Responsável</p>
                  <p className="text-sm">{usuarioResponsavel || "Não atribuído"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dias no Setor</p>
                  <Badge
                    variant={
                      diasNoSetorAtual > 30
                        ? "destructive"
                        : diasNoSetorAtual > 15
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {diasNoSetorAtual} dias
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Origem */}
        {origem && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Origem do Protocolo
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Data de Criação</p>
                  <p className="text-sm font-medium">
                    {dataCriacao
                      ? format(new Date(dataCriacao), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Setor de Origem</p>
                  <p className="text-sm">{setorOrigem?.replace(/^- /, "") || "—"}</p>
                </div>
                {usuarioCriador && (
                  <div>
                    <p className="text-xs text-muted-foreground">Criado por</p>
                    <p className="text-sm">{usuarioCriador}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Observações */}
        {observacoes && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p className="text-sm bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-900">
                {observacoes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
