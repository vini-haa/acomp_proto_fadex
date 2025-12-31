import { z } from "zod";

/**
 * Schema de validação para filtros de protocolos
 */
export const ProtocoloFiltersSchema = z.object({
  // Paginação
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(20),

  // Filtros de texto
  numero: z.string().optional(),
  assunto: z.string().optional(),
  interessado: z.string().optional(),

  // Filtros numéricos
  setor: z.coerce.number().int().nonnegative().optional(),
  numconv: z.coerce.number().int().positive().optional(),

  // Filtros de situação
  situacao: z.enum(["Em Andamento", "Arquivado", "Todos"]).optional().default("Em Andamento"),

  // Filtros de data
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),

  // Ordenação
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ProtocoloFilters = z.infer<typeof ProtocoloFiltersSchema>;

/**
 * Schema de validação para ID de protocolo
 */
export const ProtocoloIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type ProtocoloId = z.infer<typeof ProtocoloIdSchema>;

/**
 * Schema de validação para filtros de KPIs
 */
export const KPIsFiltersSchema = z.object({
  periodo: z.enum(["mes_atual", "30d", "90d", "6m", "1y", "ytd", "all"]).optional().default("all"),
  setor: z.coerce.number().int().nonnegative().optional().default(48),
});

export type KPIsFilters = z.infer<typeof KPIsFiltersSchema>;

/**
 * Schema de validação para filtros de analytics
 */
export const AnalyticsFiltersSchema = z.object({
  setor: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().min(5).max(50).optional().default(15),
  periodo: z.enum(["7d", "30d", "90d", "12m", "ytd"]).optional(),
});

export type AnalyticsFilters = z.infer<typeof AnalyticsFiltersSchema>;

/**
 * Helper para validar e retornar erro formatado
 */
export function validateParams<T extends z.ZodSchema>(
  schema: T,
  params: Record<string, string | undefined>
): { success: true; data: z.infer<T> } | { success: false; error: string; details: z.ZodIssue[] } {
  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      error: "Parâmetros inválidos",
      details: result.error.issues,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
