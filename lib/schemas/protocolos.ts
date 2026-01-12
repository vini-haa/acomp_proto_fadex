import { z } from "zod";
import { inferirSituacao } from "@/lib/constants";

/**
 * Schema para filtros de protocolos
 *
 * ATUALIZADO: Inclui novos filtros baseados na análise do trace SQL:
 * - setorAtual: Código do setor onde o protocolo está atualmente
 * - setorOrigem: Código do setor de origem/criação
 * - diasEstagnado: Mínimo de dias sem movimentação
 * - apenasEstagnados: Filtrar apenas protocolos estagnados (>365 dias)
 * - excluirLotePagamento: Excluir LOTE DE PAGAMENTOS (padrão: true)
 * - assuntoNormalizado: Filtrar por categoria/rubrica orçamentária
 */
export const protocoloFiltersSchema = z.object({
  status: z.enum(["Em Andamento", "Finalizado", "Histórico"]).optional(),
  numeroDocumento: z.string().optional(),
  numconv: z.coerce.number().positive().optional(),
  dataInicio: z.coerce.date().optional(),
  dataFim: z.coerce.date().optional(),
  faixaTempo: z.string().optional(),
  // Novos filtros
  setorAtual: z.coerce.number().positive().optional(),
  setorOrigem: z.coerce.number().positive().optional(),
  diasEstagnado: z.coerce.number().nonnegative().optional(),
  apenasEstagnados: z.coerce.boolean().optional(),
  excluirLotePagamento: z.coerce.boolean().default(true),
  assuntoNormalizado: z.string().optional(),
  // Paginação
  page: z.coerce.number().positive().default(1),
  pageSize: z.coerce.number().positive().max(50000).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Schema para query params de protocolos (strings da URL)
 */
export const protocoloQueryParamsSchema = z.object({
  status: z.string().optional(),
  numeroDocumento: z.string().optional(),
  numconv: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  faixaTempo: z.string().optional(),
  // Novos filtros
  setorAtual: z.string().optional(),
  setorOrigem: z.string().optional(),
  diasEstagnado: z.string().optional(),
  apenasEstagnados: z.string().optional(),
  excluirLotePagamento: z.string().optional(),
  assuntoNormalizado: z.string().optional(),
  // Paginação
  page: z.string().optional(),
  pageSize: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
});

/**
 * Schema para ID de protocolo
 */
export const protocoloIdSchema = z.object({
  id: z.coerce.number().positive(),
});

export type ProtocoloFilters = z.infer<typeof protocoloFiltersSchema>;
export type ProtocoloQueryParams = z.infer<typeof protocoloQueryParamsSchema>;
export type ProtocoloId = z.infer<typeof protocoloIdSchema>;

// ============================================================================
// SCHEMAS DE MOVIMENTAÇÃO
// ============================================================================

/**
 * Schema para criação de nova movimentação de protocolo
 *
 * IMPORTANTE: Este schema inclui transformação automática da situação
 * para resolver o bug histórico de registros com codSituacaoProt = NULL.
 *
 * A situação é inferida automaticamente baseada no setor de destino:
 * - Setor de Arquivo (52, 53, etc) → ARQUIVADO (60)
 * - Setor Jurídico (5) → ENCAMINHADO_JURIDICO (65)
 * - Gerência de Projetos (40) → EM_ANALISE (66)
 * - Demais setores → RECEBIDO (62)
 */
export const movimentacaoSchema = z
  .object({
    /** Código do documento/protocolo sendo movimentado */
    codDocumento: z.coerce.number().positive({
      message: "Código do documento é obrigatório",
    }),

    /** Código do setor de origem */
    codSetorOrigem: z.coerce.number().positive({
      message: "Setor de origem é obrigatório",
    }),

    /** Código do setor de destino */
    codSetorDestino: z.coerce.number().positive({
      message: "Selecione o setor de destino",
    }),

    /** Observação da movimentação (opcional) */
    observacao: z.string().max(500).optional(),

    /** Data da movimentação (default: agora) */
    dataMovimentacao: z.coerce.date().default(() => new Date()),

    /**
     * Código da situação do protocolo
     * Campo opcional no formulário - será calculado automaticamente
     */
    codSituacaoProt: z.coerce.number().nullable().optional(),
  })
  .transform((data) => {
    // Calcula a situação correta baseada no setor de destino
    // Isso garante que NUNCA será salvo NULL no banco
    const situacaoCalculada = inferirSituacao(data.codSetorDestino, data.codSituacaoProt);

    return {
      ...data,
      codSituacaoProt: situacaoCalculada,
    };
  });

/**
 * Schema de entrada (antes da transformação)
 */
export const movimentacaoInputSchema = z.object({
  codDocumento: z.coerce.number().positive(),
  codSetorOrigem: z.coerce.number().positive(),
  codSetorDestino: z.coerce.number().positive(),
  observacao: z.string().max(500).optional(),
  dataMovimentacao: z.coerce.date().optional(),
  codSituacaoProt: z.coerce.number().nullable().optional(),
});

/**
 * Schema para validação de setor
 */
export const setorSchema = z.object({
  codigo: z.coerce.number().positive(),
  descr: z.string(),
});

/**
 * Schema para validação de situação
 */
export const situacaoSchema = z.object({
  codigo: z.coerce.number().positive(),
  descricao: z.string(),
});

// Tipos inferidos
export type MovimentacaoInput = z.input<typeof movimentacaoSchema>;
export type MovimentacaoOutput = z.output<typeof movimentacaoSchema>;
export type Setor = z.infer<typeof setorSchema>;
export type Situacao = z.infer<typeof situacaoSchema>;
