import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { AnaliseAssuntoItem } from "@/types";
import { withErrorHandling } from "@/lib/errors";
import { withBaseCTE } from "@/lib/queries/base-cte";

/**
 * Gera a query de análise por assunto com filtro de período opcional
 */
function buildAnaliseAssuntoQuery(dataInicio?: string, dataFim?: string): string {
  // Filtro de data para a view principal
  let filtroData = "";
  if (dataInicio && dataFim) {
    filtroData = `WHERE vp.dt_entrada >= '${dataInicio}' AND vp.dt_entrada <= '${dataFim}'`;
  } else if (dataInicio) {
    filtroData = `WHERE vp.dt_entrada >= '${dataInicio}'`;
  } else if (dataFim) {
    filtroData = `WHERE vp.dt_entrada <= '${dataFim}'`;
  }

  const queryInner = `
WITH DocumentoNormalizado AS (
    SELECT
        d.codigo,
        CASE
            -- NULL ou vazio PRIMEIRO (evita problemas com LIKE em NULL)
            WHEN d.assunto IS NULL OR LTRIM(RTRIM(ISNULL(d.assunto, ''))) = ''
                THEN '(Sem Assunto)'

            -- ═══════════════════════════════════════════════════════════════
            -- RUBRICAS ORÇAMENTÁRIAS - Normalizar pelo código
            -- ═══════════════════════════════════════════════════════════════

            -- 33.90.14 - DIÁRIAS (todas as variações)
            WHEN d.assunto LIKE '33.90.14%' OR d.assunto LIKE '33.00.14%'
              OR UPPER(d.assunto) LIKE '%DIARIA%' OR UPPER(d.assunto) LIKE '%DIÁRIA%'
                THEN '33.90.14 - DIÁRIAS'

            -- 33.90.18 - BOLSA (genérica, exceto pesquisador)
            WHEN d.assunto LIKE '33.90.18%'
              OR (UPPER(d.assunto) LIKE '%BOLSA%' AND UPPER(d.assunto) NOT LIKE '%PESQUISADOR%')
              OR UPPER(d.assunto) LIKE '%BOLSISTA%'
                THEN '33.90.18 - BOLSA'

            -- 33.90.20 - BOLSAS PESQUISADOR
            WHEN d.assunto LIKE '33.90.20%'
              OR UPPER(d.assunto) LIKE '%PESQUISADOR%'
                THEN '33.90.20 - BOLSAS PESQUISADOR'

            -- 33.90.30 - MATERIAL DE CONSUMO
            WHEN d.assunto LIKE '33.90.30%' OR d.assunto LIKE '33.00.30%'
              OR UPPER(d.assunto) LIKE '%CONSUMO%'
              OR UPPER(d.assunto) LIKE '%COMPRA%'
                THEN '33.90.30 - MATERIAL DE CONSUMO'

            -- 33.90.33 - PASSAGENS E LOCOMOÇÃO
            WHEN d.assunto LIKE '33.90.33%'
              OR UPPER(d.assunto) LIKE '%PASSAGEM%'
              OR UPPER(d.assunto) LIKE '%DESLOCAMENTO%'
              OR UPPER(d.assunto) LIKE '%LOCOMOÇÃO%'
                THEN '33.90.33 - PASSAGENS E LOCOMOÇÃO'

            -- 33.90.36 - SERVIÇOS PF (todas as variações)
            WHEN d.assunto LIKE '33.90.36%' OR d.assunto LIKE '33.00.36%'
              OR UPPER(d.assunto) LIKE '% PF%'
              OR UPPER(d.assunto) LIKE '%PF %'
              OR UPPER(d.assunto) LIKE '%-PF%'
              OR UPPER(d.assunto) LIKE '%PF-%'
              OR UPPER(d.assunto) LIKE '%PESSOA FISICA%'
              OR UPPER(d.assunto) LIKE '%PESSOA FÍSICA%'
              OR UPPER(d.assunto) LIKE '%TERCEIROS PESSOA FÍSICA%'
                THEN '33.90.36 - SERVIÇOS PF'

            -- 33.90.39 - SERVIÇOS PJ (todas as variações)
            WHEN d.assunto LIKE '33.90.39%' OR d.assunto LIKE '33.00.39%'
              OR UPPER(d.assunto) LIKE '% PJ%'
              OR UPPER(d.assunto) LIKE '%PJ %'
              OR UPPER(d.assunto) LIKE '%-PJ%'
              OR UPPER(d.assunto) LIKE '%PJ-%'
              OR UPPER(d.assunto) LIKE '%PESSOA JURIDICA%'
              OR UPPER(d.assunto) LIKE '%PESSOA JURÍDICA%'
              OR UPPER(d.assunto) LIKE '%TERCEIROS PESSOA JUR%'
                THEN '33.90.39 - SERVIÇOS PJ'

            -- 33.90.40 - SERVIÇOS DE TI
            WHEN d.assunto LIKE '33.90.40%'
                THEN '33.90.40 - SERVIÇOS DE TI'

            -- 33.90.47 - OBRIGAÇÕES TRIBUTÁRIAS
            WHEN d.assunto LIKE '33.90.47%'
                THEN '33.90.47 - OBRIGAÇÕES TRIBUTÁRIAS'

            -- 33.90.48 - AUXÍLIOS FINANCEIROS
            WHEN d.assunto LIKE '33.90.48%'
                THEN '33.90.48 - AUXÍLIOS FINANCEIROS'

            -- 33.90.49 - AUXÍLIO TRANSPORTE
            WHEN d.assunto LIKE '33.90.49%'
              OR UPPER(d.assunto) LIKE '%AUXILIO TRANSPORTE%'
              OR UPPER(d.assunto) LIKE '%AUXÍLIO TRANSPORTE%'
                THEN '33.90.49 - AUXÍLIO TRANSPORTE'

            -- 44.90.52 - MATERIAL PERMANENTE / EQUIPAMENTOS
            WHEN d.assunto LIKE '44.90.52%' OR d.assunto LIKE '44.00.52%' OR d.assunto LIKE '44.90.51%'
              OR UPPER(d.assunto) LIKE '%PERMANENTE%'
              OR UPPER(d.assunto) LIKE '%EQUIPAMENTO%'
                THEN '44.90.52 - MATERIAL PERMANENTE'

            -- Outras rubricas menos comuns (manter código original simplificado)
            WHEN d.assunto LIKE '33.90.10%' THEN '33.90.10 - RESERVA TÉCNICA'
            WHEN d.assunto LIKE '33.90.11%' THEN '33.90.11 - VENCIMENTOS'
            WHEN d.assunto LIKE '33.90.31%' THEN '33.90.31 - PREMIAÇÕES'
            WHEN d.assunto LIKE '33.90.46%' THEN '33.90.46 - AUXÍLIO-ALIMENTAÇÃO'

            -- ═══════════════════════════════════════════════════════════════
            -- CATEGORIAS ESPECIAIS (não são rubricas)
            -- ═══════════════════════════════════════════════════════════════

            WHEN UPPER(d.assunto) LIKE '%SUPRIMENTO%FUNDO%'
                THEN 'SUPRIMENTO DE FUNDOS'
            WHEN UPPER(d.assunto) LIKE '%PRESTA%CONTA%'
                THEN 'PRESTAÇÃO DE CONTAS'
            WHEN UPPER(d.assunto) LIKE '%REMANEJAMENTO%'
                THEN 'REMANEJAMENTO'
            WHEN UPPER(d.assunto) LIKE '%LOTE%PAGAMENTO%'
                THEN 'LOTE DE PAGAMENTOS'
            WHEN UPPER(d.assunto) LIKE '%RENDIMENTO%'
                THEN 'RENDIMENTO'
            WHEN UPPER(d.assunto) LIKE '%RELAT%VIAG%'
                THEN 'RELATÓRIO DE VIAGEM'
            WHEN UPPER(d.assunto) LIKE '%OFICIO%' OR UPPER(d.assunto) LIKE '%OFÍCIO%'
                THEN 'OFÍCIO'
            WHEN UPPER(d.assunto) LIKE '%ABERTURA%CONTA%'
                THEN 'ABERTURA DE CONTA'
            WHEN UPPER(d.assunto) LIKE '%ENCERRAMENTO%CONTA%'
                THEN 'ENCERRAMENTO DE CONTA'

            -- Outros não classificados
            ELSE 'OUTROS'
        END AS assunto
    FROM documento d
    WHERE d.deletado IS NULL OR d.deletado = 0
)
SELECT
    ISNULL(dn.assunto, '(Sem Assunto)') AS assunto,
    COUNT(*) AS totalProtocolos,
    SUM(CASE WHEN vp.status_protocolo = 'Em Andamento' THEN 1 ELSE 0 END) AS emAndamento,
    SUM(CASE WHEN vp.status_protocolo = 'Finalizado' THEN 1 ELSE 0 END) AS finalizados,
    AVG(CASE WHEN vp.status_protocolo = 'Finalizado' THEN vp.dias_no_financeiro END) AS mediaDiasFinalizado,
    MIN(CASE WHEN vp.status_protocolo = 'Finalizado' THEN vp.dias_no_financeiro END) AS minDias,
    MAX(CASE WHEN vp.status_protocolo = 'Finalizado' THEN vp.dias_no_financeiro END) AS maxDias,
    STDEV(CASE WHEN vp.status_protocolo = 'Finalizado' THEN vp.dias_no_financeiro END) AS desvioPadraoDias
FROM vw_ProtocolosFinanceiro vp
    LEFT JOIN DocumentoNormalizado dn ON dn.codigo = vp.codprot
${filtroData}
GROUP BY ISNULL(dn.assunto, '(Sem Assunto)')
ORDER BY totalProtocolos DESC;
`;

  return withBaseCTE(queryInner);
}

/**
 * GET /api/analytics/por-assunto
 * Retorna análise de protocolos por assunto
 *
 * Query params:
 * - dataInicio: Data inicial (YYYY-MM-DD)
 * - dataFim: Data final (YYYY-MM-DD)
 * - periodo: Período predefinido (30d, 60d, 90d, 6m, 1y)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  let dataInicio = searchParams.get("dataInicio") || undefined;
  let dataFim = searchParams.get("dataFim") || undefined;
  const periodo = searchParams.get("periodo");

  // Se período predefinido for especificado, calcular datas
  if (periodo && !dataInicio && !dataFim) {
    const hoje = new Date();
    dataFim = hoje.toISOString().split("T")[0];

    switch (periodo) {
      case "30d":
        hoje.setDate(hoje.getDate() - 30);
        break;
      case "60d":
        hoje.setDate(hoje.getDate() - 60);
        break;
      case "90d":
        hoje.setDate(hoje.getDate() - 90);
        break;
      case "6m":
        hoje.setMonth(hoje.getMonth() - 6);
        break;
      case "1y":
        hoje.setFullYear(hoje.getFullYear() - 1);
        break;
      case "all":
        // Sem filtro de data
        dataInicio = undefined;
        dataFim = undefined;
        break;
      default:
        // Período não reconhecido, não filtra
        dataInicio = undefined;
        dataFim = undefined;
    }

    if (periodo !== "all") {
      dataInicio = hoje.toISOString().split("T")[0];
    }
  }

  const query = buildAnaliseAssuntoQuery(dataInicio, dataFim);
  const result = await executeQuery<AnaliseAssuntoItem>(query);

  return NextResponse.json({
    data: result,
    success: true,
    meta: {
      dataInicio,
      dataFim,
      periodo,
      totalRegistros: result.length,
    },
  });
});

export const revalidate = 300; // 5 minutos
