import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { executeQuery } from "@/lib/db";
import { withErrorHandling } from "@/lib/errors";
import { SETORES, TODOS_SETORES } from "@/lib/constants/setores";
import {
  VisaoExecutivaResponse,
  KPIsExecutivo,
  SaudeSetor,
  AlertaExecutivo,
  TempoPorTipo,
  ProjetoProblematico,
  TendenciaFluxo,
  TendenciaSetor,
  StatusSetor,
} from "@/types/dashboard";

// Schema de validação dos parâmetros
const querySchema = z.object({
  periodo: z.enum(["7d", "30d", "60d", "90d"]).default("30d"),
  ano: z.enum(["2023", "2024", "2025", "2026", "todos"]).default("todos"),
  setor: z.string().optional().default(TODOS_SETORES.toString()),
});

// Setores de arquivo (protocolos finalizados)
const SETORES_ARQUIVO = SETORES.ARQUIVOS.join(",");

// Setores a excluir (arquivo, portal coordenador, desabilitados)
const SETORES_EXCLUIR = [...SETORES.ARQUIVOS, 56].join(","); // 56 = Portal Coordenador/Presidência

// SLA padrão em dias
const SLA_DIAS = 15;

// Thresholds para status de setor
const THRESHOLD_BOM = 5;
const THRESHOLD_ATENCAO = 10;

/**
 * Gera as datas limite para filtro de ano e período
 *
 * LÓGICA (2026-01-28):
 * O período (30d, 60d, 90d) é uma janela deslizante:
 * - ano=todos ou ano atual: últimos X dias até HOJE
 * - ano passado (ex: 2024): últimos X dias até 31/12/XXXX
 *
 * Isso garante que ao selecionar um ano passado, você vê os dados
 * do final daquele ano (quando normalmente há mais atividade)
 */
function getDataLimitesAno(
  ano: string,
  diasPeriodo: number
): {
  dataInicioPeriodo: string;
  dataFimPeriodo: string;
  dataInicioAnterior: string;
  dataFimAnterior: string;
} {
  const anoAtual = new Date().getFullYear();

  // Para "todos" ou ano atual/futuro: usa data atual
  if (ano === "todos") {
    return {
      dataInicioPeriodo: `DATEADD(DAY, -${diasPeriodo}, GETDATE())`,
      dataFimPeriodo: "GETDATE()",
      dataInicioAnterior: `DATEADD(DAY, -${diasPeriodo * 2}, GETDATE())`,
      dataFimAnterior: `DATEADD(DAY, -${diasPeriodo}, GETDATE())`,
    };
  }

  const anoNum = parseInt(ano, 10);

  // Se é o ano atual ou futuro, usa GETDATE() como referência
  // mas FILTRA apenas dados daquele ano específico
  if (anoNum >= anoAtual) {
    return {
      // Período atual: início do ano até HOJE (limitado pelo período)
      dataInicioPeriodo: `CASE
        WHEN DATEADD(DAY, -${diasPeriodo}, GETDATE()) < '${ano}-01-01'
        THEN '${ano}-01-01'
        ELSE DATEADD(DAY, -${diasPeriodo}, GETDATE())
      END`,
      dataFimPeriodo: "GETDATE()",
      dataInicioAnterior: `DATEADD(DAY, -${diasPeriodo * 2}, GETDATE())`,
      dataFimAnterior: `DATEADD(DAY, -${diasPeriodo}, GETDATE())`,
    };
  }

  // Para anos passados: período relativo ao FIM do ano
  // Ex: ano=2024, periodo=30d → 01/12/2024 a 31/12/2024
  return {
    dataInicioPeriodo: `DATEADD(DAY, -${diasPeriodo}, '${ano}-12-31 23:59:59')`,
    dataFimPeriodo: `'${ano}-12-31 23:59:59'`,
    dataInicioAnterior: `DATEADD(DAY, -${diasPeriodo * 2}, '${ano}-12-31 23:59:59')`,
    dataFimAnterior: `DATEADD(DAY, -${diasPeriodo}, '${ano}-12-31 23:59:59')`,
  };
}

/**
 * Calcula o status do setor baseado no tempo médio
 */
function calcularStatusSetor(tempoMedio: number): StatusSetor {
  if (tempoMedio <= THRESHOLD_BOM) {
    return "bom";
  }
  if (tempoMedio <= THRESHOLD_ATENCAO) {
    return "atencao";
  }
  return "critico";
}

/**
 * Calcula a tendência comparando período atual com anterior
 */
function calcularTendencia(atual: number, anterior: number): TendenciaSetor {
  if (anterior === 0) {
    return "estavel";
  }
  const variacao = ((atual - anterior) / anterior) * 100;
  if (variacao < -10) {
    return "melhorando";
  }
  if (variacao > 10) {
    return "piorando";
  }
  return "estavel";
}

/**
 * Calcula variação percentual
 */
function calcularVariacao(atual: number, anterior: number): number {
  if (anterior === 0) {
    return atual > 0 ? 100 : 0;
  }
  return Math.round(((atual - anterior) / anterior) * 100);
}

/**
 * GET /api/dashboard/executivo
 * Retorna dados consolidados para a visão executiva do dashboard
 *
 * Parâmetros:
 * - periodo: '7d' | '30d' | '60d' | '90d' (default: '30d')
 * - ano: '2023' | '2024' | '2025' | '2026' | 'todos' (default: 'todos' = 2023 em diante)
 *
 * IMPORTANTE: O filtro de ano é aplicado na ÚLTIMA MOVIMENTAÇÃO do protocolo,
 * não na data de criação. Isso garante que só contamos protocolos ativos/relevantes.
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;

  // Valida parâmetros
  const params = querySchema.parse({
    periodo: searchParams.get("periodo") || "30d",
    ano: searchParams.get("ano") || "todos",
    setor: searchParams.get("setor") || TODOS_SETORES.toString(),
  });

  const { periodo, ano, setor } = params;
  const codigoSetor = parseInt(setor, 10);
  const filtrarPorSetor = codigoSetor !== TODOS_SETORES;

  // Condição SQL para filtro de setor (aplicada na última movimentação)
  const condSetor = filtrarPorSetor ? `AND um.codSetorDestino = ${codigoSetor}` : "";

  // Converte período para dias
  const diasPeriodo = parseInt(periodo.replace("d", ""), 10);

  // Calcula as datas limite considerando o filtro de ano
  const { dataInicioPeriodo, dataFimPeriodo, dataInicioAnterior, dataFimAnterior } =
    getDataLimitesAno(ano, diasPeriodo);

  // Query principal: Métricas por setor (período atual)
  // IMPORTANTE: Conta apenas protocolos que tiveram movimentação RECENTE (dentro do período)
  // para evitar acumular todo o histórico desde 2023
  const queryMetricasSetorAtual = `
    WITH UltimaMovimentacao AS (
      SELECT
        m.CodProt,
        m.codSetorDestino,
        m.data AS dataUltimaMovimentacao,
        m.codUsuario,
        ROW_NUMBER() OVER (PARTITION BY m.CodProt ORDER BY m.data DESC, m.codigo DESC) AS rn
      FROM scd_movimentacao m
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
    ),
    ProtocolosPendentes AS (
      SELECT
        um.CodProt,
        um.codSetorDestino,
        um.dataUltimaMovimentacao,
        um.codUsuario,
        DATEDIFF(DAY, um.dataUltimaMovimentacao, GETDATE()) AS diasParado,
        d.codTipoDocumento
      FROM UltimaMovimentacao um
      INNER JOIN documento d ON um.CodProt = d.Codigo
      WHERE um.rn = 1
        AND um.codSetorDestino NOT IN (${SETORES_ARQUIVO})
        AND (d.deletado IS NULL OR d.deletado = 0)
        AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
        -- Filtra protocolos com movimentação dentro do período selecionado
        AND um.dataUltimaMovimentacao >= ${dataInicioPeriodo}
        AND um.dataUltimaMovimentacao <= ${dataFimPeriodo}
        ${condSetor}
    )
    SELECT
      s.CODIGO AS codSetor,
      s.DESCR AS nomeSetor,
      COUNT(*) AS pendentes,
      AVG(CAST(pp.diasParado AS FLOAT)) AS tempoMedioDias,
      SUM(CASE WHEN pp.diasParado > ${SLA_DIAS} THEN 1 ELSE 0 END) AS atrasados,
      SUM(CASE WHEN pp.diasParado <= ${SLA_DIAS} THEN 1 ELSE 0 END) AS noPrazo
    FROM ProtocolosPendentes pp
    INNER JOIN SETOR s ON pp.codSetorDestino = s.CODIGO
    WHERE s.DESCR NOT LIKE '%DESABILITADO%'
      AND s.DESCR NOT LIKE '%DESATIVADO%'
      AND s.DESCR NOT LIKE '%ARQUIVO%'
      AND s.CODIGO NOT IN (${SETORES_EXCLUIR})
    GROUP BY s.CODIGO, s.DESCR
    ORDER BY pendentes DESC;
  `;

  // Query: Métricas por setor (período anterior para comparação)
  const queryMetricasSetorAnterior = `
    WITH UltimaMovimentacaoAnterior AS (
      SELECT
        m.CodProt,
        m.codSetorDestino,
        m.data AS dataUltimaMovimentacao,
        DATEDIFF(DAY, m.data, ${dataFimAnterior}) AS diasParado,
        ROW_NUMBER() OVER (PARTITION BY m.CodProt ORDER BY m.data DESC, m.codigo DESC) AS rn
      FROM scd_movimentacao m
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND m.data >= ${dataInicioAnterior}
        AND m.data < ${dataFimAnterior}
    ),
    ProtocolosPendentesAnterior AS (
      SELECT
        um.CodProt,
        um.codSetorDestino,
        um.diasParado,
        um.dataUltimaMovimentacao
      FROM UltimaMovimentacaoAnterior um
      INNER JOIN documento d ON um.CodProt = d.Codigo
      WHERE um.rn = 1
        AND um.codSetorDestino NOT IN (${SETORES_ARQUIVO})
        AND (d.deletado IS NULL OR d.deletado = 0)
        AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
        ${condSetor}
    )
    SELECT
      s.CODIGO AS codSetor,
      COUNT(*) AS pendentes,
      AVG(CAST(pp.diasParado AS FLOAT)) AS tempoMedioDias
    FROM ProtocolosPendentesAnterior pp
    INNER JOIN SETOR s ON pp.codSetorDestino = s.CODIGO
    WHERE s.DESCR NOT LIKE '%DESABILITADO%'
      AND s.DESCR NOT LIKE '%DESATIVADO%'
      AND s.DESCR NOT LIKE '%ARQUIVO%'
      AND s.CODIGO NOT IN (${SETORES_EXCLUIR})
    GROUP BY s.CODIGO;
  `;

  // Query: Protocolos finalizados no período (movidos para arquivo)
  // Quando filtrado por setor, conta apenas protocolos que passaram pelo setor antes de serem finalizados
  const condSetorFinalizados = filtrarPorSetor
    ? `AND EXISTS (
        SELECT 1 FROM scd_movimentacao m2
        WHERE m2.CodProt = m.CodProt
          AND m2.codSetorDestino = ${codigoSetor}
          AND (m2.Deletado IS NULL OR m2.Deletado = 0)
      )`
    : "";
  const queryFinalizados = `
    SELECT
      COUNT(DISTINCT m.CodProt) AS finalizados
    FROM scd_movimentacao m
    INNER JOIN documento d ON m.CodProt = d.Codigo
    WHERE m.codSetorDestino IN (${SETORES_ARQUIVO})
      AND m.data >= ${dataInicioPeriodo}
      AND m.data <= ${dataFimPeriodo}
      AND (m.Deletado IS NULL OR m.Deletado = 0)
      AND (d.deletado IS NULL OR d.deletado = 0)
      AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
      ${condSetorFinalizados};
  `;

  // Query: Protocolos finalizados no período anterior
  const queryFinalizadosAnterior = `
    SELECT
      COUNT(DISTINCT m.CodProt) AS finalizados
    FROM scd_movimentacao m
    INNER JOIN documento d ON m.CodProt = d.Codigo
    WHERE m.codSetorDestino IN (${SETORES_ARQUIVO})
      AND m.data >= ${dataInicioAnterior}
      AND m.data < ${dataFimAnterior}
      AND (m.Deletado IS NULL OR m.Deletado = 0)
      AND (d.deletado IS NULL OR d.deletado = 0)
      AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
      ${condSetorFinalizados};
  `;

  // Query: Tempo médio por tipo de protocolo
  // Usa o mesmo filtro de período para consistência
  const queryTempoPorTipo = `
    WITH UltimaMovimentacao AS (
      SELECT
        m.CodProt,
        m.codSetorDestino,
        m.data AS dataUltimaMovimentacao,
        DATEDIFF(DAY, m.data, GETDATE()) AS diasParado,
        ROW_NUMBER() OVER (PARTITION BY m.CodProt ORDER BY m.data DESC, m.codigo DESC) AS rn
      FROM scd_movimentacao m
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
    )
    SELECT
      td.CODIGO AS codTipo,
      td.DESCRICAO AS tipo,
      AVG(CAST(um.diasParado AS FLOAT)) AS tempoMedioDias,
      COUNT(*) AS quantidade
    FROM UltimaMovimentacao um
    INNER JOIN documento d ON um.CodProt = d.Codigo
    INNER JOIN TIPODOCUMENTO td ON d.codTipoDocumento = td.CODIGO
    WHERE um.rn = 1
      AND um.codSetorDestino NOT IN (${SETORES_ARQUIVO})
      AND (d.deletado IS NULL OR d.deletado = 0)
      AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
      AND um.dataUltimaMovimentacao >= ${dataInicioPeriodo}
      AND um.dataUltimaMovimentacao <= ${dataFimPeriodo}
      ${condSetor}
    GROUP BY td.CODIGO, td.DESCRICAO
    HAVING COUNT(*) >= 5
    ORDER BY quantidade DESC;
  `;

  // Query: Valor financeiro dos protocolos pendentes (período atual)
  // Usa ABS para converter valores negativos em positivos (débitos)
  const queryValorPendente = `
    WITH UltimaMovimentacao AS (
      SELECT
        m.CodProt,
        m.codSetorDestino,
        m.data AS dataUltimaMovimentacao,
        ROW_NUMBER() OVER (PARTITION BY m.CodProt ORDER BY m.data DESC, m.codigo DESC) AS rn
      FROM scd_movimentacao m
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
    ),
    ProtocolosPendentes AS (
      SELECT um.CodProt
      FROM UltimaMovimentacao um
      INNER JOIN documento d ON um.CodProt = d.Codigo
      WHERE um.rn = 1
        AND um.codSetorDestino NOT IN (${SETORES_ARQUIVO})
        AND (d.deletado IS NULL OR d.deletado = 0)
        AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
        AND um.dataUltimaMovimentacao >= ${dataInicioPeriodo}
        AND um.dataUltimaMovimentacao <= ${dataFimPeriodo}
        ${condSetor}
    )
    SELECT COALESCE(SUM(ABS(f.VALORLIQUIDO)), 0) AS valorTotal
    FROM ProtocolosPendentes pp
    LEFT JOIN FINANCEIRO f ON pp.CodProt = f.CodProt
      AND (f.DELETADO IS NULL OR f.DELETADO = 0)
      AND (f.CANCELADO IS NULL OR f.CANCELADO = 0);
  `;

  // Query: Valor financeiro dos protocolos pendentes (período anterior)
  // Usa ABS para converter valores negativos em positivos (débitos)
  const queryValorPendenteAnterior = `
    WITH UltimaMovimentacao AS (
      SELECT
        m.CodProt,
        m.codSetorDestino,
        m.data AS dataUltimaMovimentacao,
        ROW_NUMBER() OVER (PARTITION BY m.CodProt ORDER BY m.data DESC, m.codigo DESC) AS rn
      FROM scd_movimentacao m
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND m.data >= ${dataInicioAnterior}
        AND m.data < ${dataFimAnterior}
    ),
    ProtocolosPendentes AS (
      SELECT um.CodProt
      FROM UltimaMovimentacao um
      INNER JOIN documento d ON um.CodProt = d.Codigo
      WHERE um.rn = 1
        AND um.codSetorDestino NOT IN (${SETORES_ARQUIVO})
        AND (d.deletado IS NULL OR d.deletado = 0)
        AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
        ${condSetor}
    )
    SELECT COALESCE(SUM(ABS(f.VALORLIQUIDO)), 0) AS valorTotal
    FROM ProtocolosPendentes pp
    LEFT JOIN FINANCEIRO f ON pp.CodProt = f.CodProt
      AND (f.DELETADO IS NULL OR f.DELETADO = 0)
      AND (f.CANCELADO IS NULL OR f.CANCELADO = 0);
  `;

  // Query: Top 5 projetos problemáticos
  const queryProjetosProblematicos = `
    WITH UltimaMovimentacao AS (
      SELECT
        m.CodProt,
        m.codSetorDestino,
        m.data AS dataUltimaMovimentacao,
        DATEDIFF(DAY, m.data, GETDATE()) AS diasParado,
        ROW_NUMBER() OVER (PARTITION BY m.CodProt ORDER BY m.data DESC, m.codigo DESC) AS rn
      FROM scd_movimentacao m
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
    ),
    ProtocolosPendentes AS (
      SELECT
        um.CodProt,
        um.codSetorDestino,
        um.diasParado,
        d.numconv
      FROM UltimaMovimentacao um
      INNER JOIN documento d ON um.CodProt = d.Codigo
      WHERE um.rn = 1
        AND um.codSetorDestino NOT IN (${SETORES_ARQUIVO})
        AND (d.deletado IS NULL OR d.deletado = 0)
        AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
        AND um.dataUltimaMovimentacao >= ${dataInicioPeriodo}
        AND um.dataUltimaMovimentacao <= ${dataFimPeriodo}
        AND d.numconv IS NOT NULL
        ${condSetor}
    )
    SELECT TOP 5
      pp.numconv,
      COALESCE(c.titulo, 'Projeto ' + CAST(pp.numconv AS VARCHAR)) AS projeto,
      COUNT(*) AS pendentes,
      SUM(CASE WHEN pp.diasParado > ${SLA_DIAS} THEN 1 ELSE 0 END) AS atrasados,
      COALESCE(SUM(ABS(f.VALORLIQUIDO)), 0) AS valorPendente,
      AVG(CAST(pp.diasParado AS FLOAT)) AS tempoMedioDias
    FROM ProtocolosPendentes pp
    LEFT JOIN convenio c ON pp.numconv = c.numconv AND (c.deletado IS NULL OR c.deletado = 0)
    LEFT JOIN FINANCEIRO f ON pp.CodProt = f.CodProt
      AND (f.DELETADO IS NULL OR f.DELETADO = 0)
      AND (f.CANCELADO IS NULL OR f.CANCELADO = 0)
    GROUP BY pp.numconv, c.titulo
    ORDER BY COUNT(*) DESC;
  `;

  // Data de referência para gráfico de tendência (considera filtro de ano)
  const anoAtual = new Date().getFullYear();
  const anoNum = ano !== "todos" ? parseInt(ano, 10) : anoAtual;
  const dataRefTendencia = ano === "todos" || anoNum >= anoAtual ? "GETDATE()" : `'${ano}-12-31'`;

  // Query: Tendência de fluxo (entrada vs saída nos últimos 6 meses do período)
  const queryTendenciaFluxo = `
    WITH MesesUltimos6 AS (
      SELECT
        FORMAT(DATEADD(MONTH, -n, ${dataRefTendencia}), 'yyyy-MM') AS mes,
        DATEADD(MONTH, -n, ${dataRefTendencia}) AS dataRef
      FROM (VALUES (0),(1),(2),(3),(4),(5)) AS nums(n)
    ),
    Entradas AS (
      -- Protocolos criados (primeira movimentação)
      -- Quando filtrado por setor, conta apenas protocolos que passaram pelo setor
      SELECT
        FORMAT(MIN(m.data), 'yyyy-MM') AS mes,
        COUNT(DISTINCT m.CodProt) AS quantidade
      FROM scd_movimentacao m
      INNER JOIN documento d ON m.CodProt = d.Codigo
      WHERE (m.Deletado IS NULL OR m.Deletado = 0)
        AND (d.deletado IS NULL OR d.deletado = 0)
        AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
        AND m.data >= DATEADD(MONTH, -6, ${dataRefTendencia})
        AND m.data <= ${dataRefTendencia}
        ${
          filtrarPorSetor
            ? `AND EXISTS (
          SELECT 1 FROM scd_movimentacao m2
          WHERE m2.CodProt = m.CodProt
            AND m2.codSetorDestino = ${codigoSetor}
            AND (m2.Deletado IS NULL OR m2.Deletado = 0)
        )`
            : ""
        }
      GROUP BY m.CodProt
      HAVING MIN(m.data) >= DATEADD(MONTH, -6, ${dataRefTendencia})
    ),
    Saidas AS (
      -- Protocolos que foram para arquivo (finalizados)
      SELECT
        FORMAT(m.data, 'yyyy-MM') AS mes,
        COUNT(DISTINCT m.CodProt) AS quantidade
      FROM scd_movimentacao m
      INNER JOIN documento d ON m.CodProt = d.Codigo
      WHERE m.codSetorDestino IN (${SETORES_ARQUIVO})
        AND (m.Deletado IS NULL OR m.Deletado = 0)
        AND (d.deletado IS NULL OR d.deletado = 0)
        AND d.assunto NOT LIKE '%LOTE%PAGAMENTO%'
        AND m.data >= DATEADD(MONTH, -6, ${dataRefTendencia})
        AND m.data <= ${dataRefTendencia}
        ${condSetorFinalizados}
      GROUP BY FORMAT(m.data, 'yyyy-MM')
    ),
    EntradasAgrupadas AS (
      SELECT mes, SUM(quantidade) AS entradas
      FROM Entradas
      GROUP BY mes
    )
    SELECT
      m.mes,
      CONCAT(
        CASE MONTH(m.dataRef)
          WHEN 1 THEN 'Jan'
          WHEN 2 THEN 'Fev'
          WHEN 3 THEN 'Mar'
          WHEN 4 THEN 'Abr'
          WHEN 5 THEN 'Mai'
          WHEN 6 THEN 'Jun'
          WHEN 7 THEN 'Jul'
          WHEN 8 THEN 'Ago'
          WHEN 9 THEN 'Set'
          WHEN 10 THEN 'Out'
          WHEN 11 THEN 'Nov'
          WHEN 12 THEN 'Dez'
        END,
        '/',
        RIGHT(YEAR(m.dataRef), 2)
      ) AS mesLabel,
      ISNULL(e.entradas, 0) AS entradas,
      ISNULL(s.quantidade, 0) AS saidas
    FROM MesesUltimos6 m
    LEFT JOIN EntradasAgrupadas e ON m.mes = e.mes
    LEFT JOIN Saidas s ON m.mes = s.mes
    ORDER BY m.mes;
  `;

  // Executa todas as queries em paralelo
  const [
    metricasSetorAtual,
    metricasSetorAnterior,
    finalizadosResult,
    finalizadosAnteriorResult,
    tempoPorTipoResult,
    valorPendenteResult,
    valorPendenteAnteriorResult,
    projetosProblematicosResult,
    tendenciaFluxoResult,
  ] = await Promise.all([
    executeQuery<{
      codSetor: number;
      nomeSetor: string;
      pendentes: number;
      tempoMedioDias: number;
      atrasados: number;
      noPrazo: number;
    }>(queryMetricasSetorAtual),
    executeQuery<{
      codSetor: number;
      pendentes: number;
      tempoMedioDias: number;
    }>(queryMetricasSetorAnterior),
    executeQuery<{ finalizados: number }>(queryFinalizados),
    executeQuery<{ finalizados: number }>(queryFinalizadosAnterior),
    executeQuery<{
      codTipo: number;
      tipo: string;
      tempoMedioDias: number;
      quantidade: number;
    }>(queryTempoPorTipo),
    executeQuery<{ valorTotal: number }>(queryValorPendente),
    executeQuery<{ valorTotal: number }>(queryValorPendenteAnterior),
    executeQuery<{
      numconv: number;
      projeto: string;
      pendentes: number;
      atrasados: number;
      valorPendente: number;
      tempoMedioDias: number;
    }>(queryProjetosProblematicos),
    executeQuery<{
      mes: string;
      mesLabel: string;
      entradas: number;
      saidas: number;
    }>(queryTendenciaFluxo),
  ]);

  // Mapeia dados anteriores para comparação
  const metricasAnteriorMap = new Map(metricasSetorAnterior.map((m) => [m.codSetor, m]));

  // Calcula KPIs
  const totalPendentes = metricasSetorAtual.reduce((sum, s) => sum + s.pendentes, 0);
  const totalPendentesAnterior = metricasSetorAnterior.reduce((sum, s) => sum + s.pendentes, 0);
  const totalAtrasados = metricasSetorAtual.reduce((sum, s) => sum + s.atrasados, 0);
  const totalNoPrazo = metricasSetorAtual.reduce((sum, s) => sum + s.noPrazo, 0);
  const tempoMedioGeral =
    metricasSetorAtual.length > 0 && totalPendentes > 0
      ? metricasSetorAtual.reduce((sum, s) => sum + s.tempoMedioDias * s.pendentes, 0) /
        totalPendentes
      : 0;
  const tempoMedioAnterior =
    metricasSetorAnterior.length > 0 && totalPendentesAnterior > 0
      ? metricasSetorAnterior.reduce((sum, s) => sum + s.tempoMedioDias * s.pendentes, 0) /
        totalPendentesAnterior
      : 0;

  const finalizados = finalizadosResult[0]?.finalizados || 0;
  const finalizadosAnterior = finalizadosAnteriorResult[0]?.finalizados || 0;
  const percentualNoPrazo =
    totalPendentes > 0 ? Math.round((totalNoPrazo / totalPendentes) * 100) : 100;
  const percentualNoPrazoAnterior =
    totalPendentesAnterior > 0
      ? Math.round(((totalPendentesAnterior - totalAtrasados) / totalPendentesAnterior) * 100)
      : 100;

  // Valor financeiro pendente
  const valorPendente = valorPendenteResult[0]?.valorTotal || 0;
  const valorPendenteAnterior = valorPendenteAnteriorResult[0]?.valorTotal || 0;

  const kpis: KPIsExecutivo = {
    pendentes: totalPendentes,
    pendentesVariacao: calcularVariacao(totalPendentes, totalPendentesAnterior),
    finalizados,
    finalizadosVariacao: calcularVariacao(finalizados, finalizadosAnterior),
    tempoMedioDias: Math.round(tempoMedioGeral * 10) / 10,
    tempoMedioVariacao: calcularVariacao(tempoMedioGeral, tempoMedioAnterior),
    percentualNoPrazo,
    percentualVariacao: calcularVariacao(percentualNoPrazo, percentualNoPrazoAnterior),
    valorPendente,
    valorPendenteVariacao: calcularVariacao(valorPendente, valorPendenteAnterior),
  };

  // Processa saúde dos setores
  const saudeSetores: SaudeSetor[] = metricasSetorAtual.map((s) => {
    const anterior = metricasAnteriorMap.get(s.codSetor);
    return {
      codSetor: s.codSetor,
      nomeSetor: s.nomeSetor.replace(/^- /, ""),
      pendentes: s.pendentes,
      tempoMedioDias: Math.round(s.tempoMedioDias * 10) / 10,
      tendencia: calcularTendencia(s.tempoMedioDias, anterior?.tempoMedioDias || s.tempoMedioDias),
      status: calcularStatusSetor(s.tempoMedioDias),
    };
  });

  // Gera alertas
  const alertas: AlertaExecutivo[] = [];

  // Alerta de protocolos atrasados
  if (totalAtrasados > 0) {
    alertas.push({
      tipo: "atraso",
      severidade: totalAtrasados > 50 ? "critical" : totalAtrasados > 20 ? "warning" : "info",
      titulo: `${totalAtrasados} protocolos atrasados`,
      descricao: `Protocolos parados ha mais de ${SLA_DIAS} dias`,
      link: "/protocolos?status=atrasado",
    });
  }

  // Alertas de tendência por setor
  saudeSetores
    .filter((s) => s.tendencia === "piorando" && s.pendentes > 10)
    .forEach((s) => {
      alertas.push({
        tipo: "tendencia",
        severidade: s.status === "critico" ? "critical" : "warning",
        titulo: `${s.nomeSetor}: tempo aumentando`,
        descricao: `Tempo medio piorou comparado ao periodo anterior`,
        link: `/analises/setores?setor=${s.codSetor}`,
      });
    });

  // Ordena alertas por severidade
  const severidadeOrder = { critical: 0, warning: 1, info: 2 };
  alertas.sort((a, b) => severidadeOrder[a.severidade] - severidadeOrder[b.severidade]);

  // Processa tempo por tipo
  const tempoPorTipo: TempoPorTipo[] = tempoPorTipoResult.slice(0, 10).map((t) => ({
    codTipo: t.codTipo,
    tipo: t.tipo,
    tempoMedioDias: Math.round(t.tempoMedioDias * 10) / 10,
    quantidade: t.quantidade,
  }));

  // Processa projetos problemáticos
  const projetosProblematicos: ProjetoProblematico[] = projetosProblematicosResult.map((p) => ({
    numconv: p.numconv,
    projeto: p.projeto,
    pendentes: p.pendentes,
    atrasados: p.atrasados,
    valorPendente: p.valorPendente || 0,
    tempoMedioDias: Math.round((p.tempoMedioDias || 0) * 10) / 10,
  }));

  // Processa tendência de fluxo
  const tendenciaFluxo: TendenciaFluxo[] = tendenciaFluxoResult.map((t) => ({
    mes: t.mes,
    mesLabel: t.mesLabel,
    entradas: t.entradas,
    saidas: t.saidas,
  }));

  const response: VisaoExecutivaResponse = {
    periodo,
    ano,
    setor: codigoSetor,
    dataAtualizacao: new Date().toISOString(),
    kpis,
    saudeSetores,
    alertas,
    tempoPorTipo,
    projetosProblematicos,
    tendenciaFluxo,
  };

  return NextResponse.json(response);
});

export const revalidate = 300; // 5 minutos
