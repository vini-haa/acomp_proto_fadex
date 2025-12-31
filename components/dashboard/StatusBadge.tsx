import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StatusProtocolo, StatusVisual } from "@/types";

/**
 * Mapeamento de status para estilos visuais
 *
 * Cores baseadas na semântica:
 * - Cinza/Slate: Arquivado (finalizado)
 * - Verde: Concluído/Finalizado com sucesso
 * - Azul: Em tramitação/andamento
 * - Amarelo/Âmbar: Em análise (atenção)
 * - Roxo: Jurídico
 * - Vermelho: Crítico/Atrasado
 */
const STATUS_STYLES: Record<string, string> = {
  // Status principais
  "Em Andamento": "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200",
  Finalizado:
    "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200",
  Histórico: "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200",

  // Status inferidos (novos)
  Arquivado: "bg-slate-500 text-white hover:bg-slate-600 dark:bg-slate-600 dark:text-slate-100",
  "Em Tramitação": "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-blue-100",
  "Em Análise": "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:text-amber-100",
  "Encaminhado ao Jurídico":
    "bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:text-purple-100",
  Recebido: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:text-green-100",

  // Fallback
  default: "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200",
};

/**
 * Mapeamento de variantes visuais (baseado em urgência)
 */
const VARIANT_STYLES: Record<StatusVisual, string> = {
  danger: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200",
  warning:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200",
  info: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200",
  success: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200",
};

interface StatusBadgeProps {
  /** Status do protocolo (aceita string para flexibilidade) */
  status: StatusProtocolo | string;
  /** Variante visual opcional (sobrescreve o estilo baseado no status) */
  variant?: StatusVisual;
  /** Classes CSS adicionais */
  className?: string;
  /** Mostrar indicador de status inferido automaticamente */
  showAutoIndicator?: boolean;
}

/**
 * Componente de Badge para exibir status de protocolos
 *
 * Suporta os status tradicionais ("Em Andamento", "Finalizado", "Histórico")
 * e os novos status inferidos automaticamente ("Arquivado", "Em Análise", etc.)
 *
 * @example
 * // Status tradicional com variante de urgência
 * <StatusBadge status="Em Andamento" variant="warning" />
 *
 * // Status inferido (novo)
 * <StatusBadge status="Arquivado" />
 *
 * // Com indicador de auto-detecção
 * <StatusBadge status="Arquivado (Auto)" showAutoIndicator />
 */
export function StatusBadge({
  status,
  variant,
  className,
  showAutoIndicator = false,
}: StatusBadgeProps) {
  // Detecta se é um status inferido automaticamente (contém "(Auto)")
  const isAutoDetected = status.includes("(Auto)");
  const cleanStatus = status.replace(" (Auto)", "").replace("(Auto)", "").trim();

  // Determina o estilo a usar
  let styleClass: string;

  if (variant) {
    // Se variant foi passado, usa o estilo da variante
    styleClass = VARIANT_STYLES[variant];
  } else {
    // Busca pelo status exato ou por correspondência parcial
    styleClass =
      STATUS_STYLES[cleanStatus] ||
      Object.entries(STATUS_STYLES).find(([key]) =>
        cleanStatus.toLowerCase().includes(key.toLowerCase())
      )?.[1] ||
      STATUS_STYLES["default"];
  }

  return (
    <Badge variant="outline" className={cn(styleClass, "whitespace-nowrap font-medium", className)}>
      {cleanStatus}
      {(isAutoDetected || showAutoIndicator) && isAutoDetected && (
        <span
          className="ml-1 text-xs opacity-75"
          title="Situação detectada automaticamente pelo sistema"
        >
          *
        </span>
      )}
    </Badge>
  );
}
