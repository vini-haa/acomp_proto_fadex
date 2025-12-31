import { LucideIcon, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  tooltip?: string;
  extraInfo?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "danger" | "warning" | "success";
}

const variantStyles = {
  default: "text-primary",
  danger: "text-red-600",
  warning: "text-yellow-600",
  success: "text-green-600",
};

export function KPICard({
  title,
  value,
  icon: Icon,
  description,
  tooltip,
  extraInfo,
  trend,
  variant = "default",
}: KPICardProps) {
  const cardId = `kpi-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <Card role="region" aria-labelledby={`${cardId}-title`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle id={`${cardId}-title`} className="text-sm font-medium">
            {title}
          </CardTitle>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Informações sobre ${title}`}
                    className="inline-flex"
                  >
                    <Info
                      className="h-3.5 w-3.5 text-muted-foreground cursor-help"
                      aria-hidden="true"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px]">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <Icon className={cn("h-4 w-4", variantStyles[variant])} aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div
          className={cn("text-2xl font-bold", variantStyles[variant])}
          aria-label={`${title}: ${value}`}
        >
          {value}
        </div>
        {extraInfo && <p className="text-xs text-muted-foreground mt-1 font-medium">{extraInfo}</p>}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div
            className={cn(
              "text-xs mt-2 flex items-center gap-1",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}
            aria-label={`Tendência: ${trend.isPositive ? "aumento" : "queda"} de ${Math.abs(trend.value)}% em relação ao mês anterior`}
          >
            <span aria-hidden="true">{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
