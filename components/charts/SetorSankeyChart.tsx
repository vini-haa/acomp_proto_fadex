"use client";

import { useMemo, useCallback, memo } from "react";
import { ResponsiveSankey } from "@nivo/sankey";
import { useFluxoSetores } from "@/hooks/useAnalytics";
import { ChartContainer } from "./ChartContainer";

interface SetorSankeyChartProps {
  onNodeClick?: (setor: string) => void;
}

function truncateName(name: string, maxLength: number = 25) {
  if (name.length <= maxLength) {
    return name;
  }
  return name.substring(0, maxLength) + "...";
}

export const SetorSankeyChart = memo(function SetorSankeyChart({
  onNodeClick,
}: SetorSankeyChartProps) {
  const { data, isLoading, error } = useFluxoSetores(20);

  const sankeyData = useMemo(() => {
    if (!data || data.length === 0) {
      return { nodes: [], links: [] };
    }

    const links = data
      .map((item) => ({
        source: item.setorOrigem || "Desconhecido",
        target: item.setorDestino || "Desconhecido",
        value: item.quantidade,
      }))
      .filter((link) => link.source !== link.target)
      .filter((link) => link.value > 0);

    if (links.length === 0) {
      return { nodes: [], links: [] };
    }

    const setoresSet = new Set<string>();
    links.forEach((link) => {
      setoresSet.add(link.source);
      setoresSet.add(link.target);
    });

    const nodes = Array.from(setoresSet).map((setor) => ({
      id: setor,
      label: truncateName(setor.replace(/^- /, "")),
    }));

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

  const stats = useMemo(
    () => ({
      totalSetores: sankeyData.nodes.length,
      totalFluxos: sankeyData.links.length,
      totalMovimentacoes: sankeyData.links.reduce((sum, link) => sum + link.value, 0),
    }),
    [sankeyData]
  );

  const handleNodeClick = useCallback(
    (node: { id: string }) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  const isEmpty = !data || data.length === 0 || sankeyData.nodes.length === 0;

  return (
    <ChartContainer
      title="Fluxo entre Setores (Sankey)"
      description="Visualização do fluxo de protocolos entre diferentes setores. A largura dos fluxos representa o volume de protocolos."
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      height="h-[750px]"
      footer={
        !isEmpty ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">Total de Setores</p>
              <p className="text-2xl font-bold">{stats.totalSetores}</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">Total de Fluxos</p>
              <p className="text-2xl font-bold">{stats.totalFluxos}</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-xs text-muted-foreground">Total Movimentações</p>
              <p className="text-2xl font-bold">
                {stats.totalMovimentacoes.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        ) : undefined
      }
    >
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
    </ChartContainer>
  );
});
