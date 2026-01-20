import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import { z } from "zod";

/**
 * Interface para projeto do colaborador
 */
interface ColaboradorProjetoRow {
  numconv: number;
  projeto: string | null;
  situacaoProjeto: string | null;
  totalProtocolos: number;
  emAndamento: number;
  finalizados: number;
  tempoMedioDias: number | null;
  ultimaMovimentacao: Date | null;
}

/**
 * Schema de validação dos parâmetros
 */
const paramsSchema = z.object({
  periodo: z.coerce.number().min(1).max(730).optional().default(180),
  limit: z.coerce.number().min(1).max(50).optional().default(15),
  situacaoProjeto: z.enum(["Em Execução", "Concluído", "Todos", ""]).optional(),
});

/**
 * GET /api/colaborador/[id]/projetos
 * Retorna projetos que o colaborador mais atuou
 *
 * Parâmetros de query:
 * - periodo: Período em dias (padrão: 180 - 6 meses)
 * - limit: Quantidade de projetos a retornar (padrão: 15)
 * - situacaoProjeto: Filtrar por situação do projeto (Em Execução, Concluído, Todos)
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const codColaborador = parseInt(id, 10);

    if (isNaN(codColaborador) || codColaborador <= 0) {
      return NextResponse.json(
        { success: false, error: "ID do colaborador inválido" },
        { status: 400 }
      );
    }

    // Validar query params
    const { searchParams } = new URL(request.url);
    const validatedParams = paramsSchema.parse({
      periodo: searchParams.get("periodo") || undefined,
      limit: searchParams.get("limit") || undefined,
      situacaoProjeto: searchParams.get("situacaoProjeto") || undefined,
    });

    const { periodo, limit, situacaoProjeto } = validatedParams;

    // Construir cláusulas WHERE
    const whereClauses: string[] = [
      "(m.Deletado IS NULL OR m.Deletado = 0)",
      "(m.codUsuario = @codColaborador OR m.CodUsuRec = @codColaborador)",
      "m.data >= DATEADD(day, -@periodo, GETDATE())",
      "c.numconv IS NOT NULL",
    ];

    // Filtro de situação do projeto
    if (situacaoProjeto && situacaoProjeto !== "Todos") {
      if (situacaoProjeto === "Em Execução") {
        whereClauses.push(`(c.situacao = 'Em Execução' OR c.situacao = 'Em Execucao')`);
      } else if (situacaoProjeto === "Concluído") {
        whereClauses.push(`(c.situacao = 'Concluído' OR c.situacao = 'Concluido')`);
      }
    }

    const whereClause = whereClauses.join(" AND ");

    // Query para buscar projetos agrupados
    const projetosQuery = `
      SELECT TOP (@limit)
        c.numconv,
        c.titulo AS projeto,
        c.situacao AS situacaoProjeto,
        COUNT(DISTINCT d.codigo) AS totalProtocolos,
        COUNT(DISTINCT CASE
          WHEN sp.descricao IS NULL OR sp.descricao = 'Em Andamento' OR m.codSituacaoProt IS NULL
          THEN d.codigo
        END) AS emAndamento,
        COUNT(DISTINCT CASE
          WHEN sp.descricao = 'Finalizado' OR m.codSituacaoProt = 1
          THEN d.codigo
        END) AS finalizados,
        AVG(CAST(DATEDIFF(DAY, d.dataCad, GETDATE()) AS FLOAT)) AS tempoMedioDias,
        MAX(m.data) AS ultimaMovimentacao
      FROM scd_movimentacao m
      INNER JOIN documento d ON d.codigo = m.codprot AND (d.deletado IS NULL OR d.deletado = 0)
      INNER JOIN convenio c ON c.numconv = d.numconv
      LEFT JOIN situacaoProtocolo sp ON sp.codigo = m.codSituacaoProt
      WHERE ${whereClause}
      GROUP BY c.numconv, c.titulo, c.situacao
      ORDER BY totalProtocolos DESC
    `;

    // Query para totais gerais
    const totaisQuery = `
      SELECT
        COUNT(DISTINCT c.numconv) AS totalProjetos,
        COUNT(DISTINCT d.codigo) AS totalProtocolos,
        COUNT(DISTINCT CASE
          WHEN sp.descricao IS NULL OR sp.descricao = 'Em Andamento' OR m.codSituacaoProt IS NULL
          THEN d.codigo
        END) AS totalEmAndamento,
        COUNT(DISTINCT CASE
          WHEN sp.descricao = 'Finalizado' OR m.codSituacaoProt = 1
          THEN d.codigo
        END) AS totalFinalizados
      FROM scd_movimentacao m
      INNER JOIN documento d ON d.codigo = m.codprot AND (d.deletado IS NULL OR d.deletado = 0)
      INNER JOIN convenio c ON c.numconv = d.numconv
      LEFT JOIN situacaoProtocolo sp ON sp.codigo = m.codSituacaoProt
      WHERE ${whereClause}
    `;

    // Executar queries em paralelo
    const [projetosResult, totaisResult] = await Promise.all([
      executeQuery<ColaboradorProjetoRow>(projetosQuery, { codColaborador, periodo, limit }),
      executeQuery<{
        totalProjetos: number;
        totalProtocolos: number;
        totalEmAndamento: number;
        totalFinalizados: number;
      }>(totaisQuery, { codColaborador, periodo, limit }),
    ]);

    // Formatar dados para resposta
    const projetos = projetosResult.map((row) => ({
      numconv: row.numconv,
      projeto: row.projeto || `Projeto ${row.numconv}`,
      situacaoProjeto: row.situacaoProjeto || "Não definido",
      totalProtocolos: row.totalProtocolos,
      emAndamento: row.emAndamento,
      finalizados: row.finalizados,
      percentualFinalizacao:
        row.totalProtocolos > 0 ? Math.round((row.finalizados / row.totalProtocolos) * 100) : 0,
      tempoMedioDias: row.tempoMedioDias ? Math.round(row.tempoMedioDias) : null,
      ultimaMovimentacao: row.ultimaMovimentacao,
      ultimaMovimentacaoFormatada: row.ultimaMovimentacao
        ? new Date(row.ultimaMovimentacao).toLocaleDateString("pt-BR")
        : null,
    }));

    const totais = totaisResult[0] || {
      totalProjetos: 0,
      totalProtocolos: 0,
      totalEmAndamento: 0,
      totalFinalizados: 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        projetos,
        totais: {
          ...totais,
          percentualFinalizacao:
            totais.totalProtocolos > 0
              ? Math.round((totais.totalFinalizados / totais.totalProtocolos) * 100)
              : 0,
        },
      },
    });
  }
);

// Sem cache - dados em tempo real
export const dynamic = "force-dynamic";
