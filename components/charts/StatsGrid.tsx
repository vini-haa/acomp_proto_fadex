"use client";

import { formatNumber, formatCurrency } from "@/lib/formatting";

interface StatItem {
  /** Rótulo da estatística */
  label: string;
  /** Valor numérico ou string */
  value: number | string;
  /** Cor da borda esquerda (ex: "blue-500", "green-500") */
  color?: string;
  /** Texto adicional abaixo do valor */
  subtext?: string;
  /** Tipo de formatação do valor */
  format?: "number" | "currency" | "percent" | "none";
}

interface StatsGridProps {
  /** Lista de estatísticas para exibir */
  items: StatItem[];
  /** Número de colunas no grid (2, 3 ou 4) */
  columns?: 2 | 3 | 4;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Grid de estatísticas reutilizável
 * Exibe métricas com formatação automática e cores personalizáveis
 */
export function StatsGrid({ items, columns = 4, className = "" }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  const formatValue = (value: number | string, format?: string): string => {
    if (typeof value === "string") {
      return value;
    }

    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "percent":
        return `${value.toFixed(1)}%`;
      case "none":
        return String(value);
      case "number":
      default:
        return formatNumber(value);
    }
  };

  const getColorClass = (color?: string): string => {
    if (!color) {
      return "border-l-muted-foreground";
    }

    // Mapeia cores comuns para classes Tailwind
    const colorMap: Record<string, string> = {
      blue: "border-l-blue-500",
      green: "border-l-green-500",
      orange: "border-l-orange-500",
      red: "border-l-red-500",
      purple: "border-l-purple-500",
      yellow: "border-l-yellow-500",
      gray: "border-l-gray-500",
      // Cores com intensidade específica
      "blue-500": "border-l-blue-500",
      "green-500": "border-l-green-500",
      "orange-500": "border-l-orange-500",
      "red-500": "border-l-red-500",
      "purple-500": "border-l-purple-500",
      "yellow-500": "border-l-yellow-500",
    };

    return colorMap[color] || `border-l-${color}`;
  };

  return (
    <div className={`mt-6 grid ${gridCols[columns]} gap-4 ${className}`}>
      {items.map((item, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border border-l-4 ${getColorClass(item.color)}`}
        >
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-2xl font-bold">{formatValue(item.value, item.format)}</p>
          {item.subtext && <p className="text-xs text-muted-foreground mt-1">{item.subtext}</p>}
        </div>
      ))}
    </div>
  );
}
