"use client";

import { Header } from "@/components/dashboard/Header";
import { useColaboracao, Colaboracao } from "@/hooks/useColaboracao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, ArrowLeftRight, Network } from "lucide-react";

export default function ColaboracaoPage() {
  const { data, isLoading } = useColaboracao();

  const colaboracoes = data?.data || [];

  // Top 5 duplas
  const top5 = colaboracoes.slice(0, 5);

  return (
    <>
      <Header
        title="Análise de Colaboração"
        subtitle="Identificação de duplas e grupos que trabalham juntos"
      />

      <div className="p-6 space-y-6">
        {/* Destaque Top 5 */}
        {!isLoading && top5.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Top 5 Duplas com Maior Colaboração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {top5.map((col: Colaboracao, index: number) => (
                  <div
                    key={`${col.codUsuario1}-${col.codUsuario2}`}
                    className="bg-white dark:bg-gray-900 p-4 rounded-lg border"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                          #{index + 1}
                        </div>
                        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{col.nomeUsuario1}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {col.setorUsuario1}
                            </p>
                          </div>
                          <ArrowLeftRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{col.nomeUsuario2}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {col.setorUsuario2}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-center">
                          <Badge variant="default" className="mb-1">
                            {col.vezesTrabalharamJuntos}
                          </Badge>
                          <p className="text-xs text-muted-foreground">interações</p>
                        </div>
                        <div className="text-center">
                          <Badge variant="secondary" className="mb-1">
                            {col.tempoMedioConjuntoHoras?.toFixed(1) || "-"}h
                          </Badge>
                          <p className="text-xs text-muted-foreground">tempo médio</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela Completa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Todas as Colaborações ({colaboracoes.length} duplas identificadas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {colaboracoes.map((col: Colaboracao) => (
                    <div
                      key={`${col.codUsuario1}-${col.codUsuario2}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors flex-wrap gap-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{col.nomeUsuario1}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {col.setorUsuario1}
                          </p>
                        </div>
                        <ArrowLeftRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{col.nomeUsuario2}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {col.setorUsuario2}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <Badge variant="outline">{col.vezesTrabalharamJuntos} vezes</Badge>
                        <Badge variant="secondary">
                          {col.tempoMedioConjuntoHoras?.toFixed(1) || "-"}h
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {colaboracoes.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma colaboração frequente identificada
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
