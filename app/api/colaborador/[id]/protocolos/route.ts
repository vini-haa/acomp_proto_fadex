import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import { z } from "zod";

/**
 * Interface para protocolo do colaborador
 */
interface ColaboradorProtocoloRow {
  codprot: number;
  numeroDocumento: string | null;
  assunto: string | null;
  numconv: number | null;
  projeto: string | null;
  dataMovimentacao: Date;
  acao: "Enviou" | "Recebeu";
  statusProtocolo: string | null;
  diasNoSetor: number | null;
  setorOrigem: string | null;
  setorDestino: string | null;
}

/**
 * Schema de validação dos parâmetros
 */
const paramsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  periodo: z.coerce.number().min(1).max(365).optional().default(30),
  status: z.enum(["Em Andamento", "Finalizado", "Arquivado", ""]).optional(),
  assunto: z.string().optional(),
  projeto: z.string().optional(),
  orderBy: z
    .enum(["dataMovimentacao", "numeroDocumento", "assunto", "diasNoSetor", "statusProtocolo"])
    .optional()
    .default("dataMovimentacao"),
  orderDir: z.enum(["asc", "desc"]).optional().default("desc"),
  // Filtros vindos do heatmap
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  diaSemana: z.coerce.number().min(1).max(7).optional(),
  hora: z.coerce.number().min(0).max(23).optional(),
});

/**
 * GET /api/colaborador/[id]/protocolos
 * Retorna protocolos que o colaborador participou (enviou ou recebeu)
 *
 * Parâmetros de query:
 * - page: Página atual (padrão: 1)
 * - limit: Itens por página (padrão: 20, max: 100)
 * - periodo: Período em dias (padrão: 30)
 * - status: Filtrar por status (Em Andamento, Finalizado, Arquivado)
 * - assunto: Filtrar por assunto (busca parcial)
 * - projeto: Filtrar por projeto (busca parcial)
 * - orderBy: Coluna para ordenação
 * - orderDir: Direção da ordenação (asc, desc)
 * - dataInicio, dataFim: Período específico
 * - diaSemana: Filtrar por dia da semana (1-7)
 * - hora: Filtrar por hora (0-23)
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
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      periodo: searchParams.get("periodo") || undefined,
      status: searchParams.get("status") || undefined,
      assunto: searchParams.get("assunto") || undefined,
      projeto: searchParams.get("projeto") || undefined,
      orderBy: searchParams.get("orderBy") || undefined,
      orderDir: searchParams.get("orderDir") || undefined,
      dataInicio: searchParams.get("dataInicio") || undefined,
      dataFim: searchParams.get("dataFim") || undefined,
      diaSemana: searchParams.get("diaSemana") || undefined,
      hora: searchParams.get("hora") || undefined,
    });

    const {
      page,
      limit,
      periodo,
      status,
      assunto,
      projeto,
      orderBy,
      orderDir,
      dataInicio,
      dataFim,
      diaSemana,
      hora,
    } = validatedParams;

    // Construir cláusulas WHERE dinamicamente
    const whereClauses: string[] = [
      "(m.Deletado IS NULL OR m.Deletado = 0)",
      "(m.codUsuario = @codColaborador OR m.CodUsuRec = @codColaborador)",
    ];

    // Filtro de período
    if (dataInicio && dataFim) {
      whereClauses.push(`m.data >= '${dataInicio}' AND m.data <= '${dataFim} 23:59:59'`);
    } else {
      whereClauses.push(`m.data >= DATEADD(day, -@periodo, GETDATE())`);
    }

    // Filtro de status (NULL = Em Andamento)
    if (status) {
      if (status === "Em Andamento") {
        whereClauses.push(
          `(sp.descricao = 'Em Andamento' OR sp.descricao IS NULL OR m.codSituacaoProt IS NULL)`
        );
      } else {
        whereClauses.push(`sp.descricao = '${status}'`);
      }
    }

    // Filtro de assunto (busca parcial)
    if (assunto) {
      whereClauses.push(`d.assunto LIKE '%${assunto.replace(/'/g, "''")}%'`);
    }

    // Filtro de projeto (busca parcial no título ou numconv)
    if (projeto) {
      const projetoEscaped = projeto.replace(/'/g, "''");
      whereClauses.push(
        `(c.titulo LIKE '%${projetoEscaped}%' OR CAST(c.numconv AS VARCHAR) LIKE '%${projetoEscaped}%')`
      );
    }

    // Filtro de dia da semana
    if (diaSemana !== undefined) {
      whereClauses.push(`DATEPART(WEEKDAY, m.data) = ${diaSemana}`);
    }

    // Filtro de hora
    if (hora !== undefined) {
      whereClauses.push(`DATEPART(HOUR, m.data) = ${hora}`);
    }

    const whereClause = whereClauses.join(" AND ");

    // Mapeamento de colunas para ordenação (usando nomes da CTE)
    const orderColumnMap: Record<string, string> = {
      dataMovimentacao: "dataMovimentacao",
      numeroDocumento: "numeroDocumento",
      assunto: "assunto",
      diasNoSetor: "diasNoSetor",
      statusProtocolo: "statusProtocolo",
    };

    const orderColumn = orderColumnMap[orderBy] || "dataMovimentacao";
    const orderDirection = orderDir.toUpperCase();

    // Query para contagem total
    const countQuery = `
      SELECT COUNT(DISTINCT m.codigo) AS total
      FROM scd_movimentacao m
      INNER JOIN documento d ON d.codigo = m.codprot AND (d.deletado IS NULL OR d.deletado = 0)
      LEFT JOIN convenio c ON c.numconv = d.numconv
      LEFT JOIN situacaoProtocolo sp ON sp.codigo = m.codSituacaoProt
      WHERE ${whereClause}
    `;

    // Query principal com paginação
    const dataQuery = `
      WITH ProtocolosColaborador AS (
        SELECT DISTINCT
          m.codigo AS movCodigo,
          d.codigo AS codprot,
          d.Numero AS numeroDocumento,
          d.assunto,
          c.numconv,
          c.titulo AS projeto,
          m.data AS dataMovimentacao,
          CASE
            WHEN m.codUsuario = @codColaborador THEN 'Enviou'
            ELSE 'Recebeu'
          END AS acao,
          sp.descricao AS statusProtocolo,
          DATEDIFF(DAY, m.data, GETDATE()) AS diasNoSetor,
          sOrigem.descr AS setorOrigem,
          sDestino.descr AS setorDestino,
          ROW_NUMBER() OVER (
            PARTITION BY d.codigo,
              CASE WHEN m.codUsuario = @codColaborador THEN 'Enviou' ELSE 'Recebeu' END
            ORDER BY m.data DESC
          ) AS rn
        FROM scd_movimentacao m
        INNER JOIN documento d ON d.codigo = m.codprot AND (d.deletado IS NULL OR d.deletado = 0)
        LEFT JOIN convenio c ON c.numconv = d.numconv
        LEFT JOIN situacaoProtocolo sp ON sp.codigo = m.codSituacaoProt
        LEFT JOIN setor sOrigem ON sOrigem.codigo = m.codsetororigem
        LEFT JOIN setor sDestino ON sDestino.codigo = m.codsetordestino
        WHERE ${whereClause}
      )
      SELECT
        codprot,
        numeroDocumento,
        assunto,
        numconv,
        projeto,
        dataMovimentacao,
        acao,
        statusProtocolo,
        diasNoSetor,
        setorOrigem,
        setorDestino
      FROM ProtocolosColaborador
      WHERE rn = 1
      ORDER BY ${orderColumn} ${orderDirection}
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    const offset = (page - 1) * limit;

    // Executar queries em paralelo
    const [countResult, dataResult] = await Promise.all([
      executeQuery<{ total: number }>(countQuery, { codColaborador, periodo }),
      executeQuery<ColaboradorProtocoloRow>(dataQuery, { codColaborador, periodo, offset, limit }),
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Formatar dados para resposta
    const protocolos = dataResult.map((row) => ({
      codprot: row.codprot,
      numeroDocumento: row.numeroDocumento,
      assunto: row.assunto,
      numconv: row.numconv,
      projeto: row.projeto,
      dataMovimentacao: row.dataMovimentacao,
      dataFormatada: row.dataMovimentacao
        ? new Date(row.dataMovimentacao).toLocaleDateString("pt-BR")
        : null,
      acao: row.acao,
      statusProtocolo: row.statusProtocolo || "Em Andamento",
      diasNoSetor: row.diasNoSetor,
      setorOrigem: row.setorOrigem,
      setorDestino: row.setorDestino,
    }));

    return NextResponse.json({
      success: true,
      data: protocolos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  }
);

// Sem cache - dados em tempo real
export const dynamic = "force-dynamic";
