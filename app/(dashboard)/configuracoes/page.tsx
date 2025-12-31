"use client";

import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/usePreferences";
import { useToast } from "@/hooks/use-toast";
import { Settings2, RotateCcw } from "lucide-react";

export default function ConfiguracoesPage() {
  const { preferences, updatePreference, resetPreferences, isLoaded } = usePreferences();
  const { toast } = useToast();

  const handleReset = () => {
    resetPreferences();
    toast({
      title: "Configurações resetadas",
      description: "Todas as configurações foram restauradas para os valores padrão.",
    });
  };

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram salvas automaticamente.",
    });
  };

  if (!isLoaded) {
    return (
      <>
        <Header title="Configurações" subtitle="Carregando..." />
        <div className="p-6">
          <p>Carregando configurações...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Configurações" subtitle="Personalize sua experiência no dashboard" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Dashboard
              </CardTitle>
              <CardDescription>Configurações de exibição do dashboard principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultPeriod">Período Padrão para Gráficos</Label>
                <Select
                  value={preferences.defaultPeriod}
                  onValueChange={(value) =>
                    updatePreference("defaultPeriod", value as "7d" | "30d" | "90d" | "12m")
                  }
                >
                  <SelectTrigger id="defaultPeriod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    <SelectItem value="12m">Últimos 12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoRefresh">Atualização Automática</Label>
                  <p className="text-sm text-muted-foreground">Recarregar dados automaticamente</p>
                </div>
                <Switch
                  id="autoRefresh"
                  checked={preferences.autoRefresh}
                  onCheckedChange={(checked) => updatePreference("autoRefresh", checked)}
                />
              </div>

              {preferences.autoRefresh && (
                <div className="space-y-2">
                  <Label htmlFor="refreshInterval">Intervalo de Atualização</Label>
                  <Select
                    value={preferences.refreshInterval.toString()}
                    onValueChange={(value) => updatePreference("refreshInterval", parseInt(value))}
                  >
                    <SelectTrigger id="refreshInterval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 minuto</SelectItem>
                      <SelectItem value="300">5 minutos</SelectItem>
                      <SelectItem value="600">10 minutos</SelectItem>
                      <SelectItem value="900">15 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabelas */}
          <Card>
            <CardHeader>
              <CardTitle>Tabelas</CardTitle>
              <CardDescription>Preferências de exibição de tabelas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultPageSize">Registros por Página</Label>
                <Select
                  value={preferences.defaultPageSize.toString()}
                  onValueChange={(value) => updatePreference("defaultPageSize", parseInt(value))}
                >
                  <SelectTrigger id="defaultPageSize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 registros</SelectItem>
                    <SelectItem value="20">20 registros</SelectItem>
                    <SelectItem value="50">50 registros</SelectItem>
                    <SelectItem value="100">100 registros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultSortOrder">Ordenação Padrão</Label>
                <Select
                  value={preferences.defaultSortOrder}
                  onValueChange={(value) =>
                    updatePreference("defaultSortOrder", value as "asc" | "desc")
                  }
                >
                  <SelectTrigger id="defaultSortOrder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente (A-Z, 0-9)</SelectItem>
                    <SelectItem value="desc">Decrescente (Z-A, 9-0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos */}
          <Card>
            <CardHeader>
              <CardTitle>Gráficos</CardTitle>
              <CardDescription>Preferências de visualização de gráficos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="chartAnimations">Animações</Label>
                  <p className="text-sm text-muted-foreground">Habilitar animações nos gráficos</p>
                </div>
                <Switch
                  id="chartAnimations"
                  checked={preferences.chartAnimations}
                  onCheckedChange={(checked) => updatePreference("chartAnimations", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showLegends">Legendas</Label>
                  <p className="text-sm text-muted-foreground">Exibir legendas nos gráficos</p>
                </div>
                <Switch
                  id="showLegends"
                  checked={preferences.showLegends}
                  onCheckedChange={(checked) => updatePreference("showLegends", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Exportação */}
          <Card>
            <CardHeader>
              <CardTitle>Exportação</CardTitle>
              <CardDescription>Preferências de exportação de dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultExportFormat">Formato Padrão</Label>
                <Select
                  value={preferences.defaultExportFormat}
                  onValueChange={(value) =>
                    updatePreference("defaultExportFormat", value as "csv" | "excel" | "pdf")
                  }
                >
                  <SelectTrigger id="defaultExportFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="includeTimestamp">Timestamp no Nome</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir data/hora no nome do arquivo
                  </p>
                </div>
                <Switch
                  id="includeTimestamp"
                  checked={preferences.includeTimestamp}
                  onCheckedChange={(checked) => updatePreference("includeTimestamp", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>Gerenciar configurações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={handleSave} className="flex-1">
                  Salvar Configurações
                </Button>
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restaurar Padrões
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                As configurações são salvas automaticamente no navegador
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
