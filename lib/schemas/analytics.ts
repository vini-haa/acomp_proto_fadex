import { z } from "zod";

/**
 * Schema para query params de analytics
 */
export const analyticsQueryParamsSchema = z.object({
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  agrupamento: z.string().optional(),
});

/**
 * Schema para query params de KPIs
 */
export const kpisQueryParamsSchema = z.object({
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
});

/**
 * Schema para filtros de analytics
 */
export const analyticsFiltersSchema = z.object({
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  agrupamento: z.enum(["dia", "semana", "mes", "ano"]).optional(),
});

export type AnalyticsQueryParams = z.infer<typeof analyticsQueryParamsSchema>;
export type KPIsQueryParams = z.infer<typeof kpisQueryParamsSchema>;
export type AnalyticsFilters = z.infer<typeof analyticsFiltersSchema>;
