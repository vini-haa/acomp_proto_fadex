"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ReactNode, memo, useMemo } from "react";

interface ChartContainerProps {
  /** Título do gráfico */
  title: string;
  /** Descrição opcional exibida abaixo do título */
  description?: string;
  /** Indica se os dados estão carregando */
  isLoading?: boolean;
  /** Erro ao carregar dados */
  error?: Error | null;
  /** Indica se não há dados para exibir */
  isEmpty?: boolean;
  /** Mensagem personalizada quando não há dados */
  emptyMessage?: string;
  /** Altura do skeleton de loading (ex: "h-96", "h-[500px]") */
  height?: string;
  /** Conteúdo do header adicional (botões, filtros) */
  headerContent?: ReactNode;
  /** Conteúdo do gráfico */
  children: ReactNode;
  /** Conteúdo adicional após o gráfico (estatísticas, legendas) */
  footer?: ReactNode;
  /** ID único para acessibilidade (gerado automaticamente se não fornecido) */
  id?: string;
}

/**
 * Container reutilizável para gráficos
 * Centraliza tratamento de loading, error e empty states
 * Memoizado para evitar re-renders desnecessários
 */
export const ChartContainer = memo(function ChartContainer({
  title,
  description,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = "Nenhum dado disponível.",
  height = "h-96",
  headerContent,
  children,
  footer,
  id,
}: ChartContainerProps) {
  // Memoizar ID para acessibilidade
  const chartId = useMemo(
    () => id || `chart-${title.toLowerCase().replace(/\s+/g, "-")}`,
    [id, title]
  );

  // Memoizar classe de altura
  const heightClass = useMemo(() => `${height} w-full`, [height]);
  // Estado de erro
  if (error) {
    return (
      <Card role="region" aria-labelledby={`${chartId}-title`}>
        <CardHeader>
          <CardTitle id={`${chartId}-title`}>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" role="alert">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>Erro ao carregar {title.toLowerCase()}.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Estado de carregamento
  if (isLoading) {
    return (
      <Card role="region" aria-labelledby={`${chartId}-title`} aria-busy="true">
        <CardHeader>
          <CardTitle id={`${chartId}-title`}>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <Skeleton className={heightClass} aria-label={`Carregando ${title.toLowerCase()}`} />
        </CardContent>
      </Card>
    );
  }

  // Estado vazio
  if (isEmpty) {
    return (
      <Card role="region" aria-labelledby={`${chartId}-title`}>
        <CardHeader>
          <CardTitle id={`${chartId}-title`}>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8" role="status">
            {emptyMessage}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Estado normal com dados
  return (
    <Card role="region" aria-labelledby={`${chartId}-title`}>
      <CardHeader>
        {headerContent ? (
          <div className="flex items-center justify-between">
            <div>
              <CardTitle id={`${chartId}-title`}>{title}</CardTitle>
              {description && (
                <p id={`${chartId}-desc`} className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            {headerContent}
          </div>
        ) : (
          <>
            <CardTitle id={`${chartId}-title`}>{title}</CardTitle>
            {description && (
              <p id={`${chartId}-desc`} className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </>
        )}
      </CardHeader>
      <CardContent>
        <div role="img" aria-label={`Gráfico: ${title}${description ? `. ${description}` : ""}`}>
          {children}
        </div>
        {footer}
      </CardContent>
    </Card>
  );
});
