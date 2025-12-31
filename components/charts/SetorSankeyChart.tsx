"use client";

import { useMemo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { useFluxoSetores } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface SetorSankeyChartProps {
  onNodeClick?: (setor: string) => void;
}

export function SetorSankeyChart({ onNodeClick }: SetorSankeyChartProps) {
  const { data, isLoading, error } = useFluxoSetores(20);

  const sankeyData = useMemo(() => {
    if (!data || data.length === 0) {
      return { nodes: [], links: [] };
    }

    // Criar links e filtrar auto-referências e circulares
    const links = data
      .map((item) => ({
        source: item.setorOrigem || "Desconhecido",
        target: item.setorDestino || "Desconhecido",
        value: item.quantidade,
      }))
      // Remover auto-referências (Setor A -> Setor A)
      .filter((link) => link.source !== link.target)
      // Remover links com valores inválidos
      .filter((link) => link.value > 0);

    // Se não há links válidos, retornar vazio
    if (links.length === 0) {
      return { nodes: [], links: [] };
    }

    // Extrair setores únicos apenas dos links válidos
    const setoresSet = new Set<string>();
    links.forEach((link) => {
      setoresSet.add(link.source);
      setoresSet.add(link.target);
    });

    // Função para truncar nomes longos
    const truncateName = (name: string, maxLength: number = 25) => {
      if (name.length <= maxLength) {
        return name;
      }
      return name.substring(0, maxLength) + "...";
    };

    // Criar nodes com nomes truncados
    const nodes = Array.from(setoresSet).map((setor) => ({
      id: setor,
      label: truncateName(setor.replace(/^- /, "")),
    }));

    // Detectar e remover ciclos simples (A->B e B->A)
    const linkMap = new Map<string, Set<string>>();
    const filteredLinks: typeof links = [];

    for (const link of links) {
      const reverseKey = `${link.target}->${link.source}`;

      if (!linkMap.has(reverseKey)) {
        filteredLinks.push(link);
        const forwardKey = `${link.source}->${link.target}`;
        linkMap.set(forwardKey, new Set([link.target]));
      }
    }

    return { nodes, links: filteredLinks };
  }, [data]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo entre Setores</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Erro ao carregar fluxo entre setores.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo entre Setores</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0 || sankeyData.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo entre Setores</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Nenhum dado disponível.</p>
        </CardContent>
      </Card>
    );
  }

  const handleNodeClick = (node: { id: string }) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo entre Setores (Sankey)</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Visualização do fluxo de protocolos entre diferentes setores. A largura dos fluxos
          representa o volume de protocolos.
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ height: 650 }}>
          <ResponsiveSankey
            data={sankeyData}
            margin={{ top: 20, right: 200, bottom: 20, left: 200 }}
            align="justify"
            colors={{ scheme: "category10" }}
            nodeOpacity={1}
            nodeHoverOthersOpacity={0.35}
            nodeThickness={18}
            nodeSpacing={30}
            nodeBorderWidth={0}
            nodeBorderColor={{
              from: "color",
              modifiers: [["darker", 0.8]],
            }}
            nodeBorderRadius={3}
            linkOpacity={0.5}
            linkHoverOthersOpacity={0.1}
            linkContract={3}
            enableLinkGradient={true}
            label={(node) => (node as { id: string; label?: string }).label || node.id}
            labelPosition="outside"
            labelOrientation="horizontal"
            labelPadding={12}
            labelTextColor={{
              from: "color",
              modifiers: [["darker", 1.2]],
            }}
            onClick={(nodeOrLink) => {
              // Verifica se é um nó (tem 'id') e não um link
              if ("id" in nodeOrLink) {
                handleNodeClick(nodeOrLink as { id: string });
              }
            }}
            theme={{
              text: {
                fill: "hsl(var(--foreground))",
                fontSize: 10,
              },
              tooltip: {
                container: {
                  background: "hsl(var(--card))",
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                  borderRadius: "var(--radius)",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  padding: "8px 12px",
                },
              },
            }}
          />
        </div>

        {/* Estatísticas */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">Total de Setores</p>
            <p className="text-2xl font-bold">{sankeyData.nodes.length}</p>
          </div>
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">Total de Fluxos</p>
            <p className="text-2xl font-bold">{sankeyData.links.length}</p>
          </div>
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">Total Movimentações</p>
            <p className="text-2xl font-bold">
              {sankeyData.links.reduce((sum, link) => sum + link.value, 0).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
