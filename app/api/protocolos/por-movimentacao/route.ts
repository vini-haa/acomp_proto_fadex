import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";

/**
 * Setores relevantes para análise
 */
const SETORES_PERMITIDOS = [43, 48, 45, 40, 56, 44];

interface ProtocoloMovimentacao {
  codprot: number;
  numeroDocumento: string;
  assunto: string | null;
  projeto: string | null;
  numconv: number | null;
  contaCorrente: string | null;
  setorOrigem: string | null;
  setorDestino: string | null;
  dataMovimentacao: Date;
  dataFormatada: string;
  setorAtual: string | null;
  statusProtocolo: string;
}

/**
 * GET /api/protocolos/por-movimentacao
 * Busca protocolos pelo histórico de movimentações (dia da semana e hora)
 *
 * Query params:
 * - diaSemana: 1-7 (1=Domingo, 2=Segunda, etc.)
 * - hora: 0-23
 * - page: número da página (default: 1)
 * - pageSize: tamanho da página (default: 20)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  const diaSemanaParam = searchParams.get("diaSemana");
  const horaParam = searchParams.get("hora");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  if (!diaSemanaParam || !horaParam) {
    return NextResponse.json(
      {
        success: false,
        error: "Parâmetros diaSemana e hora são obrigatórios",
      },
      { status: 400 }
    );
  }

  const diaSemana = parseInt(diaSemanaParam);
  const hora = parseInt(horaParam);

  if (isNaN(diaSemana) || diaSemana < 1 || diaSemana > 7) {
    return NextResponse.json(
      {
        success: false,
        error: "diaSemana deve ser um número entre 1 e 7",
      },
      { status: 400 }
    );
  }

  if (isNaN(hora) || hora < 0 || hora > 23) {
    return NextResponse.json(
      {
        success: false,
        error: "hora deve ser um número entre 0 e 23",
      },
      { status: 400 }
    );
  }

  const setoresIn = SETORES_PERMITIDOS.join(",");
  const offset = (page - 1) * pageSize;

  // Query para buscar protocolos pelo histórico de movimentações
  const query = `
    WITH MovimentacoesFiltradas AS (
        -- Movimentações que batem com o dia da semana e hora
        SELECT DISTINCT
            m.codprot,
            m.data AS dataMovimentacao,
            m.codsetororigem,
            m.codsetordestino
        FROM scd_movimentacao m
        WHERE DATEPART(WEEKDAY, m.data) = @diaSemana
          AND DATEPART(HOUR, m.data) = @hora
          AND m.codsetordestino IN (${setoresIn})
          AND m.data >= DATEADD(MONTH, -6, GETDATE())
          AND m.Deletado IS NULL
    ),
    SetorAtualProtocolo AS (
        -- Setor atual de cada protocolo (onde está agora)
        SELECT
            m.codprot,
            m.codsetordestino AS setor_atual_codigo,
            s.descr AS setor_atual
        FROM scd_movimentacao m
        LEFT JOIN setor s ON s.codigo = m.codsetordestino
        WHERE m.RegAtual = 1
          AND m.Deletado IS NULL
    ),
    TotalCount AS (
        SELECT COUNT(DISTINCT mf.codprot) AS total
        FROM MovimentacoesFiltradas mf
    )
    SELECT
        mf.codprot,
        d.numero AS numeroDocumento,
        d.assunto,
        c.titulo AS projeto,
        c.numconv,
        cc.cc AS contaCorrente,
        so.descr AS setorOrigem,
        sd.descr AS setorDestino,
        mf.dataMovimentacao,
        FORMAT(mf.dataMovimentacao, 'dd/MM/yyyy HH:mm') AS dataFormatada,
        sap.setor_atual AS setorAtual,
        CASE
            WHEN sap.setor_atual_codigo = 52 THEN 'Finalizado'
            ELSE 'Em Andamento'
        END AS statusProtocolo,
        tc.total
    FROM MovimentacoesFiltradas mf
    LEFT JOIN documento d ON d.codigo = mf.codprot AND d.deletado IS NULL
    LEFT JOIN convenio c ON d.numconv = c.numconv AND c.deletado IS NULL
    LEFT JOIN conv_cc ccc ON c.numconv = ccc.numconv AND ccc.deletado IS NULL AND ccc.principal = 1
    LEFT JOIN cc ON ccc.codcc = cc.codigo AND cc.deletado IS NULL
    LEFT JOIN setor so ON so.codigo = mf.codsetororigem
    LEFT JOIN setor sd ON sd.codigo = mf.codsetordestino
    LEFT JOIN SetorAtualProtocolo sap ON sap.codprot = mf.codprot
    CROSS JOIN TotalCount tc
    ORDER BY mf.dataMovimentacao DESC
    OFFSET @offset ROWS
    FETCH NEXT @pageSize ROWS ONLY;
  `;

  const result = await executeQuery<ProtocoloMovimentacao & { total: number }>(query, {
    diaSemana,
    hora,
    offset,
    pageSize,
  });

  const total = result.length > 0 ? result[0].total : 0;
  const totalPages = Math.ceil(total / pageSize);

  // Remove o campo 'total' dos resultados
  const data = result.map(({ total: _total, ...rest }) => rest);

  return NextResponse.json({
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
    filters: {
      diaSemana,
      hora,
    },
  });
});
