import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import { withBaseCTE } from "@/lib/queries/base-cte";

/**
 * Interface para protocolo estagnado
 */
interface ProtocoloEstagnado {
  codprot: number;
  numeroDocumento: string;
  assunto: string | null;
  projeto: string | null;
  numconv: number | null;
  setorAtual: string | null;
  setorAtualCodigo: number | null;
  dtEntrada: Date;
  dtUltimaMovimentacao: Date;
  diasSemMovimentacao: number;
  diasNoFinanceiro: number;
  statusProtocolo: string;
  faixaEstagnacao: string;
}

/**
 * Interface para resumo de estagnação
 */
interface ResumoEstagnacao {
  totalEstagnados: number;
  totalMais365Dias: number;
  totalMais180Dias: number;
  totalMais90Dias: number;
  mediaDiasSemMovimentacao: number;
  porSetor: Array<{
    setorCodigo: number;
    setorNome: string;
    quantidade: number;
    mediaDias: number;
  }>;
  porFaixa: Array<{
    faixa: string;
    quantidade: number;
  }>;
}

/**
 * GET /api/protocolos/estagnados
 * Retorna protocolos estagnados (sem movimentação há muito tempo)
 *
 * Query params:
 * - diasMinimo: Mínimo de dias sem movimentação (padrão: 365)
 * - setor: Filtrar por código do setor atual
 * - limit: Limite de registros (padrão: 100)
 * - resumo: Se true, retorna apenas o resumo estatístico
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const diasMinimo = parseInt(searchParams.get("diasMinimo") || "365", 10);
  const setor = searchParams.get("setor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 1000);
  const apenasResumo = searchParams.get("resumo") === "true";

  // Condição de setor opcional
  const setorCondition = setor ? `AND vp.setor_atual = ${parseInt(setor, 10)}` : "";

  // Query para lista de protocolos estagnados
  const queryListaInner = `
    SELECT
        vp.codprot,
        d.numero AS numeroDocumento,
        d.assunto,
        c.titulo AS projeto,
        c.numconv,
        sd.descr AS setorAtual,
        vp.setor_atual AS setorAtualCodigo,
        vp.dt_entrada AS dtEntrada,
        vp.dt_ultima_movimentacao AS dtUltimaMovimentacao,
        DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) AS diasSemMovimentacao,
        vp.dias_no_financeiro AS diasNoFinanceiro,
        vp.status_protocolo AS statusProtocolo,
        CASE
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 730 THEN '05. Mais de 2 anos'
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 365 THEN '04. 1-2 anos'
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 180 THEN '03. 6-12 meses'
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 90 THEN '02. 3-6 meses'
            ELSE '01. Menos de 3 meses'
        END AS faixaEstagnacao
    FROM vw_ProtocolosFinanceiro vp
        LEFT JOIN documento d ON d.codigo = vp.codprot AND d.deletado IS NULL
        LEFT JOIN convenio c ON d.numconv = c.numconv AND c.deletado IS NULL
        LEFT JOIN setor sd ON sd.codigo = vp.setor_atual
    WHERE vp.status_protocolo = 'Em Andamento'
      AND DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) >= @diasMinimo
      AND d.assunto <> 'LOTE DE PAGAMENTOS'
      AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
      ${setorCondition}
    ORDER BY diasSemMovimentacao DESC
    OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
  `;

  // Query para resumo estatístico
  const queryResumoInner = `
    SELECT
        COUNT(*) AS totalEstagnados,
        SUM(CASE WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 365 THEN 1 ELSE 0 END) AS totalMais365Dias,
        SUM(CASE WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 180 THEN 1 ELSE 0 END) AS totalMais180Dias,
        SUM(CASE WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 90 THEN 1 ELSE 0 END) AS totalMais90Dias,
        AVG(DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE())) AS mediaDiasSemMovimentacao
    FROM vw_ProtocolosFinanceiro vp
        LEFT JOIN documento d ON d.codigo = vp.codprot AND d.deletado IS NULL
    WHERE vp.status_protocolo = 'Em Andamento'
      AND DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) >= @diasMinimo
      AND d.assunto <> 'LOTE DE PAGAMENTOS'
      AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
      ${setorCondition}
  `;

  // Query para resumo por setor
  const queryPorSetorInner = `
    SELECT
        vp.setor_atual AS setorCodigo,
        sd.descr AS setorNome,
        COUNT(*) AS quantidade,
        AVG(DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE())) AS mediaDias
    FROM vw_ProtocolosFinanceiro vp
        LEFT JOIN documento d ON d.codigo = vp.codprot AND d.deletado IS NULL
        LEFT JOIN setor sd ON sd.codigo = vp.setor_atual
    WHERE vp.status_protocolo = 'Em Andamento'
      AND DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) >= @diasMinimo
      AND d.assunto <> 'LOTE DE PAGAMENTOS'
      AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
    GROUP BY vp.setor_atual, sd.descr
    ORDER BY quantidade DESC
  `;

  // Query para resumo por faixa
  const queryPorFaixaInner = `
    SELECT
        CASE
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 730 THEN '05. Mais de 2 anos'
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 365 THEN '04. 1-2 anos'
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 180 THEN '03. 6-12 meses'
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 90 THEN '02. 3-6 meses'
            ELSE '01. Menos de 3 meses'
        END AS faixa,
        COUNT(*) AS quantidade
    FROM vw_ProtocolosFinanceiro vp
        LEFT JOIN documento d ON d.codigo = vp.codprot AND d.deletado IS NULL
    WHERE vp.status_protocolo = 'Em Andamento'
      AND DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) >= @diasMinimo
      AND d.assunto <> 'LOTE DE PAGAMENTOS'
      AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
      ${setorCondition}
    GROUP BY
        CASE
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 730 THEN '05. Mais de 2 anos'
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 365 THEN '04. 1-2 anos'
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 180 THEN '03. 6-12 meses'
            WHEN DATEDIFF(DAY, vp.dt_ultima_movimentacao, GETDATE()) > 90 THEN '02. 3-6 meses'
            ELSE '01. Menos de 3 meses'
        END
    ORDER BY faixa
  `;

  const params = { diasMinimo, limit };

  if (apenasResumo) {
    // Executar queries de resumo em paralelo
    const [resumoGeral, porSetor, porFaixa] = await Promise.all([
      executeQuery<{
        totalEstagnados: number;
        totalMais365Dias: number;
        totalMais180Dias: number;
        totalMais90Dias: number;
        mediaDiasSemMovimentacao: number;
      }>(withBaseCTE(queryResumoInner), params),
      executeQuery<{
        setorCodigo: number;
        setorNome: string;
        quantidade: number;
        mediaDias: number;
      }>(withBaseCTE(queryPorSetorInner), params),
      executeQuery<{
        faixa: string;
        quantidade: number;
      }>(withBaseCTE(queryPorFaixaInner), params),
    ]);

    const resumo: ResumoEstagnacao = {
      ...(resumoGeral[0] || {
        totalEstagnados: 0,
        totalMais365Dias: 0,
        totalMais180Dias: 0,
        totalMais90Dias: 0,
        mediaDiasSemMovimentacao: 0,
      }),
      porSetor,
      porFaixa,
    };

    return NextResponse.json({
      data: resumo,
      success: true,
      filtros: { diasMinimo, setor: setor || "todos" },
    });
  }

  // Executar query de lista
  const protocolos = await executeQuery<ProtocoloEstagnado>(withBaseCTE(queryListaInner), params);

  return NextResponse.json({
    data: protocolos,
    success: true,
    total: protocolos.length,
    filtros: { diasMinimo, setor: setor || "todos", limit },
  });
});

export const revalidate = 300; // 5 minutos
