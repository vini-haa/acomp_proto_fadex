"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/dashboard/Header";
import { useUsuariosPerformance } from "@/hooks/useEquipes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, TrendingUp, Users, Award } from "lucide-react";
import type { UsuarioPerformance } from "@/types/equipes";

export default function UsuariosPerformancePage() {
  const [busca, setBusca] = useState("");
  const { data: usuarios = [], isLoading } = useUsuariosPerformance();

  const usuariosFiltrados = useMemo(() => {
    if (!busca.trim()) {
      return usuarios;
    }
    const termoBusca = busca.toLowerCase();
    return usuarios.filter(
      (u: UsuarioPerformance) =>
        u.nomeUsuario.toLowerCase().includes(termoBusca) ||
        u.nomeSetor.toLowerCase().includes(termoBusca)
    );
  }, [usuarios, busca]);

  // Top 3 performers
  const top3 = usuarios.slice(0, 3);

  // Stats gerais
  const stats = useMemo(() => {
    return {
      totalUsuarios: usuarios.length,
      mediaMovimentacoes:
        usuarios.length > 0
          ? usuarios.reduce(
              (sum: number, u: UsuarioPerformance) => sum + (u.movimentacoesEnviadas30d || 0),
              0
            ) / usuarios.length
          : 0,
      topPerformer: usuarios[0]?.nomeUsuario || "-",
    };
  }, [usuarios]);

  return (
    <>
      <Header
        title="Performance Individual"
        subtitle="Ranking e metricas detalhadas por colaborador"
      />

      <div className="p-6 space-y-6">
        {/* KPIs Gerais */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
                  <p className="text-xs text-muted-foreground">Colaboradores ativos</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media de Movimentacoes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.mediaMovimentacoes.toFixed(0)}</div>
                  <p className="text-xs text-muted-foreground">Por usuario/mes</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-lg font-bold truncate">{stats.topPerformer}</div>
                  <p className="text-xs text-muted-foreground">
                    {top3[0]?.movimentacoesEnviadas30d || 0} movimentacoes/mes
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top 3 Destaque */}
        {!isLoading && top3.length > 0 && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Top 3 Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {top3.map((user: UsuarioPerformance, index: number) => (
                  <div
                    key={user.codUsuario}
                    className="bg-white dark:bg-gray-900 p-4 rounded-lg border-2 border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                        ${index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"}
                      `}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.nomeUsuario}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.nomeSetor}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-muted-foreground">Movimentacoes:</span>
                      <Badge variant="default">{user.movimentacoesEnviadas30d}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">Tempo medio:</span>
                      <Badge variant="secondary">
                        {user.tempoMedioRespostaHoras?.toFixed(1) || "-"}h
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do usuario ou setor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabela de Usuarios */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking Completo ({usuariosFiltrados.length} usuarios)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {usuariosFiltrados.map((user: UsuarioPerformance, index: number) => (
                  <div
                    key={user.codUsuario}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.nomeUsuario}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.nomeSetor}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-xs text-muted-foreground mb-1">Enviadas</p>
                        <Badge variant="default">{user.movimentacoesEnviadas30d}</Badge>
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="text-xs text-muted-foreground mb-1">Recebidas</p>
                        <Badge variant="outline">{user.movimentacoesRecebidas30d}</Badge>
                      </div>
                      <div className="text-center hidden lg:block">
                        <p className="text-xs text-muted-foreground mb-1">Tempo Medio</p>
                        <Badge variant="secondary">
                          {user.tempoMedioRespostaHoras?.toFixed(1) || "-"}h
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Produtividade</p>
                        <Badge variant="outline">
                          {user.mediaMovimentacoesPorDia?.toFixed(1) || "-"}/dia
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {usuariosFiltrados.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum usuario encontrado com &quot;{busca}&quot;
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
